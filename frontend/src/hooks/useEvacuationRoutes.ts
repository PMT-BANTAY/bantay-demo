import { useState } from 'react';
import type { EvacuationRoute } from '../context/EvacuationContext';
import { RouteCalculator } from '../utils/routeCalculator';
import type { Map as MapboxMap } from 'mapbox-gl';
import evacuationCentersData from '../data/evacuation-centers.json';

// Filter evacuation centers in Marikina area
const EVACUATION_CENTERS = evacuationCentersData.features
    .filter(center => {
        const [lng, lat] = center.geometry.coordinates;
        // Rough bounding box for Marikina area
        return (
            lng >= 121.0800 && lng <= 121.1200 &&
            lat >= 14.6200 && lat <= 14.6800
        );
    })
    .map(center => ({
        id: `evac_${center.properties.name.toLowerCase().replace(/\s+/g, '_')}`,
        name: center.properties.name,
        coordinates: center.geometry.coordinates as [number, number],
        facilities: center.properties.facilities,
        capacity: center.properties.facilities.length * 100 // Rough estimate based on number of facilities
    }));

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

            // Calculate routes to all evacuation centers
            const routesWithDistances = await Promise.all(
                EVACUATION_CENTERS.map(async (center) => {
                    try {
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
                            const dist = routeCalculator['calculateDistance'](prev, coord);
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
                        const routeFloodCheck = routeGeometry.coordinates.some(coord => {
                            const features = map.queryRenderedFeatures(
                                map.project(coord as [number, number]),
                                { layers: ['flood-tiles-layer'] }
                            );
                            return features.some(f => 
                                f.properties?.status === 'critical' || 
                                f.properties?.status === 'alarm'
                            );
                        });

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
                            distance: `${(distance / 1000).toFixed(1)} km`
                        } as EvacuationRoute;
                    } catch (error) {
                        console.error(`Error calculating route to ${center.name}:`, error);
                        throw error;
                    }
                })
            );

            // Sort by actual walking distance and filter out unreachable routes
            const sortedRoutes = routesWithDistances
                .filter(route => route !== null)
                .sort((a, b) => {
                    const distA = parseFloat(a.distance);
                    const distB = parseFloat(b.distance);
                    return distA - distB;
                });

            if (sortedRoutes.length === 0) {
                setError('No safe evacuation routes found. Please try a different location or contact emergency services.');
            } else {
                setRoutes(sortedRoutes);
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