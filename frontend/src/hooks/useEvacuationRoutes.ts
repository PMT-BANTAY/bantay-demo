import { useState } from 'react';
import mapboxgl from 'mapbox-gl'; // Add this import
import type { EvacuationRoute } from '../context/EvacuationContext';
import { RouteCalculator } from '../utils/routeCalculator';
import type { Map as MapboxMap } from 'mapbox-gl';
import evacuationCentersData from '../data/evacuation-centers.json';

// Helper function to calculate distance between two points (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

// PMT Basin (Pasig, Marikina, Tullahan) bounding box
const PMT_BASIN_BOUNDS = {
    west: 121.0000,  // Western boundary
    east: 121.1600,  // Eastern boundary  
    south: 14.5400,  // Southern boundary
    north: 14.7400   // Northern boundary
};

// Function to check if coordinates are within PMT basin
const isWithinPMTBasin = (lat: number, lng: number): boolean => {
    return lng >= PMT_BASIN_BOUNDS.west && 
           lng <= PMT_BASIN_BOUNDS.east &&
           lat >= PMT_BASIN_BOUNDS.south && 
           lat <= PMT_BASIN_BOUNDS.north;
};

// Function to get evacuation centers within PMT basin and near user's location
const getEvacuationCentersNearLocation = (
    userLat: number, 
    userLng: number, 
    maxDistanceKm: number = 8 // Increased default for PMT basin coverage
) => {
    // First check if user is within PMT basin
    if (!isWithinPMTBasin(userLat, userLng)) {
        console.warn('User location is outside PMT basin area');
        // Still proceed but with a warning
    }

    return evacuationCentersData.features
        .filter(center => {
            const [lng, lat] = center.geometry.coordinates;
            // Filter by PMT basin bounds first
            return isWithinPMTBasin(lat, lng);
        })
        .map(center => {
            const [lng, lat] = center.geometry.coordinates;
            const distance = calculateDistance(userLat, userLng, lat, lng);
            
            return {
                ...center,
                distanceFromUser: distance
            };
        })
        .filter(center => center.distanceFromUser <= maxDistanceKm)
        .sort((a, b) => a.distanceFromUser - b.distanceFromUser) // Sort by distance
        .slice(0, 10) // Limit to 10 closest centers
        .map(center => ({
            id: `evac_${center.properties.name.toLowerCase().replace(/\s+/g, '_')}`,
            name: center.properties.name,
            coordinates: center.geometry.coordinates as [number, number],
            facilities: center.properties.facilities,
            capacity: center.properties.facilities.length * 100, // Rough estimate
            distanceFromUser: center.distanceFromUser
        }));
};

export interface EvacuationRouteResponse {
    routes: EvacuationRoute[];
    isLoading: boolean;
    error: string | null;
    fetchEvacuationRoutes: (latitude: number, longitude: number, map: MapboxMap) => Promise<void>;
    getRouteDirections: (route: EvacuationRoute, map: MapboxMap) => Promise<GeoJSON.LineString>;
}

export const useEvacuationRoutes = (): EvacuationRouteResponse => {
    const [routes, setRoutes] = useState<EvacuationRoute[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchEvacuationRoutes = async (latitude: number, longitude: number, map: MapboxMap) => {
        try {
            setIsLoading(true);
            setError(null);

            // Create a single route calculator instance
            const routeCalculator = new RouteCalculator(map);
            const currentLocation: [number, number] = [longitude, latitude];

            // Get flood data from map to check if current location is in a flooded area
            const floodData = map.queryRenderedFeatures(
                map.project(currentLocation),
                { layers: ['flood-tiles-layer'] }
            );

            const isInFloodedArea = floodData.some(feature => 
                feature.properties?.status === 'critical' || 
                feature.properties?.status === 'alarm'
            );

            if (isInFloodedArea) {
                console.warn('Warning: Current location is in a flooded area. Calculating routes to nearest safe zones.');
            }

            // Get evacuation centers near the user's location
            // Start with 5km radius, expand if no centers found
            let evacuationCenters = getEvacuationCentersNearLocation(latitude, longitude, 5);
            
            if (evacuationCenters.length === 0) {
                // Expand search radius to 10km if no centers found within 5km
                evacuationCenters = getEvacuationCentersNearLocation(latitude, longitude, 10);
            }
            
            if (evacuationCenters.length === 0) {
                // Final fallback: expand to 20km
                evacuationCenters = getEvacuationCentersNearLocation(latitude, longitude, 20);
            }

            if (evacuationCenters.length === 0) {
                setError('No evacuation centers found within 20km of your location. Please try a different location or contact emergency services.');
                return;
            }

            console.log(`Found ${evacuationCenters.length} evacuation centers within range`);

            // Pre-load the road network for the entire area to avoid multiple loads
            const bounds = new mapboxgl.LngLatBounds();
            bounds.extend(currentLocation);
            evacuationCenters.forEach(center => bounds.extend(center.coordinates));
            
            // Add padding to the bounds
            bounds.extend([
                bounds.getWest() - 0.02,
                bounds.getSouth() - 0.02
            ]).extend([
                bounds.getEast() + 0.02,
                bounds.getNorth() + 0.02
            ]);

            console.log('Pre-loading road network for area...');
            await routeCalculator.loadRoadNetwork(bounds);

            if (!routeCalculator.isNetworkLoaded()) {
                console.warn('Road network failed to load, routes will use Mapbox Directions API');
            }

            // Calculate routes to all nearby evacuation centers
            const routesWithDistances = await Promise.allSettled(
                evacuationCenters.map(async (center) => {
                    try {
                        console.log(`Calculating route to ${center.name}...`);
                        
                        // Calculate route with flood avoidance
                        const routeGeometry = await routeCalculator.calculateRoute(
                            currentLocation,
                            center.coordinates,
                            { 
                                avoidFlooding: true, 
                                preferMainRoads: true 
                            }
                        );

                        // Calculate total distance and estimated time
                        const distance = routeGeometry.coordinates.reduce((total, coord, i) => {
                            if (i === 0) return 0;
                            const prev = routeGeometry.coordinates[i - 1];
                            const dist = calculateDistance(
                                prev[1], prev[0], // lat, lng
                                coord[1], coord[0]  // lat, lng
                            ) * 1000; // Convert to meters
                            return total + dist;
                        }, 0);

                        // Estimate walking time (assuming 5 km/h average walking speed)
                        const walkingSpeed = 5000 / 3600; // 5 km/h in meters per second
                        const duration = distance / walkingSpeed;

                        // Format facilities list
                        const facilitiesList = center.facilities
                            .slice(0, 3)
                            .join(', ') + 
                            (center.facilities.length > 3 ? ` and ${center.facilities.length - 3} more...` : '');

                        // Check if route passes through flooded areas
                        let routeFloodCheck = false;
                        try {
                            routeFloodCheck = routeGeometry.coordinates.some(coord => {
                                const features = map.queryRenderedFeatures(
                                    map.project(coord as [number, number]),
                                    { layers: ['flood-tiles-layer'] }
                                );
                                return features.some(f => 
                                    f.properties?.status === 'critical' || 
                                    f.properties?.status === 'alarm'
                                );
                            });
                        } catch (floodError) {
                            console.warn('Error checking flood data for route:', floodError);
                        }

                        return {
                            id: center.id,
                            name: center.name,
                            destination: `${center.name}\n${
                                routeFloodCheck ? '⚠️ Route passes through flooded areas\n' : ''
                            }Facilities: ${facilitiesList}\nCapacity: ~${center.capacity} people`,
                            coordinates: {
                                start: currentLocation,
                                end: center.coordinates
                            },
                            walkTime: `${Math.round(duration / 60)} mins`,
                            distance: `${(distance / 1000).toFixed(1)} km`,
                            directDistance: center.distanceFromUser // Store the direct distance for reference
                        } as EvacuationRoute & { directDistance: number };
                    } catch (error) {
                        console.error(`Error calculating route to ${center.name}:`, error);
                        
                        // If route calculation fails, create a basic route entry with direct distance
                        const directDistance = center.distanceFromUser;
                        const estimatedWalkTime = Math.round((directDistance / 5) * 60); // Rough estimate at 5km/h
                        
                        return {
                            id: center.id,
                            name: center.name,
                            destination: `${center.name}\n⚠️ Route calculation failed - showing direct path\nFacilities: ${center.facilities.slice(0, 3).join(', ')}\nCapacity: ~${center.capacity} people`,
                            coordinates: {
                                start: currentLocation,
                                end: center.coordinates
                            },
                            walkTime: `~${estimatedWalkTime} mins`,
                            distance: `${directDistance.toFixed(1)} km`,
                            directDistance: directDistance
                        } as EvacuationRoute & { directDistance: number };
                    }
                })
            );

            // Filter successful routes
            const successfulRoutes = routesWithDistances
                .filter((result): result is PromiseFulfilledResult<EvacuationRoute & { directDistance: number }> => 
                    result.status === 'fulfilled'
                )
                .map(result => result.value);

            // Sort by actual walking distance (or direct distance if route calculation failed)
            const sortedRoutes = successfulRoutes
                .sort((a, b) => {
                    const distA = parseFloat(a.distance);
                    const distB = parseFloat(b.distance);
                    return distA - distB;
                })
                .slice(0, 5); // Limit to top 5 closest routes

            if (sortedRoutes.length === 0) {
                setError('No safe evacuation routes found. Please try a different location or contact emergency services.');
            } else {
                setRoutes(sortedRoutes);
                console.log(`Successfully calculated ${sortedRoutes.length} evacuation routes`);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch evacuation routes');
            console.error('Error fetching evacuation routes:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const getRouteDirections = async (route: EvacuationRoute, map: MapboxMap): Promise<GeoJSON.LineString> => {
        try {
            const routeCalculator = new RouteCalculator(map);
            return await routeCalculator.calculateRoute(
                route.coordinates.start,
                route.coordinates.end,
                { avoidFlooding: true, preferMainRoads: true }
            );
        } catch (err) {
            console.error('Error getting route directions:', err);
            throw err;
        }
    };

    return {
        routes,
        isLoading,
        error,
        fetchEvacuationRoutes,
        getRouteDirections
    };
};