import { useEffect, useRef } from 'react'
import mapboxgl, { Map } from 'mapbox-gl'

// Define proper types
type SensorStatus = "normal" | "alert" | "alarm" | "critical";

interface SensorTile {
    centroid: [number, number];
    status: SensorStatus;
    distance_from_source?: number;
    water_level?: number;
}

interface Sensor {
    sensor: string;
    status: SensorStatus;
    centroid: [number, number];
    tiles: SensorTile[];
}

interface FloodTilesProps {
    map: Map | null;
    sensorsData: Sensor[];
    isVisible: boolean;
}

// Grid cell size in meters (should match backend MARGIN_VALUE)
const TILE_SIZE_METERS = 30;

// Helper function to convert meters to degrees
const metersToDegrees = (meters: number, latitude: number) => {
    const metersPerDegreeLat = 111320;
    const metersPerDegreeLng = 111320 * Math.cos(latitude * Math.PI / 180);
    return {
        lat: meters / metersPerDegreeLat,
        lng: meters / metersPerDegreeLng
    };
};

// Function to create GeoJSON for flood tiles
const createFloodTilesGeoJSON = (sensorsData: Sensor[]): GeoJSON.FeatureCollection => {
    const features: GeoJSON.Feature[] = [];

    sensorsData.forEach((sensor) => {
        sensor.tiles.forEach((tile, index) => {
            // Skip normal status tiles for cleaner visualization
            if (tile.status === 'normal') return;

            const [tileLat, tileLng] = tile.centroid;

            // Calculate tile boundaries
            const tileDegrees = metersToDegrees(TILE_SIZE_METERS, tileLat);
            const halfTileLat = tileDegrees.lat / 2;
            const halfTileLng = tileDegrees.lng / 2;

            // Create polygon coordinates [lng, lat] format for Mapbox
            const coordinates = [[
                [tileLng - halfTileLng, tileLat - halfTileLat], // Bottom-left
                [tileLng + halfTileLng, tileLat - halfTileLat], // Bottom-right
                [tileLng + halfTileLng, tileLat + halfTileLat], // Top-right
                [tileLng - halfTileLng, tileLat + halfTileLat], // Top-left
                [tileLng - halfTileLng, tileLat - halfTileLat]  // Close polygon
            ]];

            const feature: GeoJSON.Feature = {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: coordinates
                },
                properties: {
                    sensorName: sensor.sensor,
                    sensorStatus: sensor.status,
                    status: tile.status,
                    tileIndex: index,
                    distanceFromSource: tile.distance_from_source ?? 0,
                    waterLevel: tile.water_level ?? 0,
                    centroid: tile.centroid
                }
            };

            features.push(feature);
        });
    });

    console.log(`Created ${features.length} flood tiles for visualization`);
    return {
        type: 'FeatureCollection',
        features: features
    };
};

export const FloodTiles = ({ map, sensorsData, isVisible }: FloodTilesProps) => {
    // Use refs to store event handlers so they can be properly removed
    const clickHandlerRef = useRef<((e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => void) | null>(null);
    const mouseEnterHandlerRef = useRef<(() => void) | null>(null);
    const mouseLeaveHandlerRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (!map || sensorsData.length === 0) return;

        // Wait for map to be fully loaded
        if (!map.isStyleLoaded()) {
            map.once('load', () => {
                initializeFloodTiles();
            });
        } else {
            initializeFloodTiles();
        }

        function initializeFloodTiles() {
            if (!map) return;

            // Create flood tiles visualization using detailed sensor data
            const floodTilesGeoJSON = createFloodTilesGeoJSON(sensorsData);

            // Check if source already exists
            if (map.getSource('flood-tiles')) {
                // Update existing source
                (map.getSource('flood-tiles') as mapboxgl.GeoJSONSource).setData(floodTilesGeoJSON);
            } else {
                // Add flood tiles source
                map.addSource('flood-tiles', {
                    type: 'geojson',
                    data: floodTilesGeoJSON
                });

                // Add flood tiles layer - positioned above water but below buildings
                map.addLayer({
                    id: 'flood-tiles-layer',
                    type: 'fill',
                    source: 'flood-tiles',
                    layout: { visibility: isVisible ? 'visible' : 'none' },
                    paint: {
                        'fill-color': [
                            'case',
                            ['==', ['get', 'status'], 'critical'], '#ff0000',  // Red for critical
                            ['==', ['get', 'status'], 'alarm'], '#ff8800',     // Orange for alarm/hazard
                            ['==', ['get', 'status'], 'alert'], '#ffff00',     // Yellow for alert
                            'rgba(255, 255, 255, 0)' // Transparent for normal/other
                        ],
                        'fill-opacity': [
                            'interpolate', ['linear'], ['zoom'],
                            9, 0.6,
                            12, 0.5,
                            15, 0.3
                        ]
                    }
                });

                // Add flood tiles outline for better visibility
                map.addLayer({
                    id: 'flood-tiles-outline',
                    type: 'line',
                    source: 'flood-tiles',
                    layout: { visibility: isVisible ? 'visible' : 'none' },
                    paint: {
                        'line-color': [
                            'case',
                            ['==', ['get', 'status'], 'critical'], '#cc0000',  // Darker red outline
                            ['==', ['get', 'status'], 'alarm'], '#cc6600',     // Darker orange outline
                            ['==', ['get', 'status'], 'alert'], '#cccc00',     // Darker yellow outline
                            'rgba(255, 255, 255, 0)' // Transparent outline for normal
                        ],
                        'line-width': [
                            'interpolate', ['linear'], ['zoom'],
                            9, 0.5,
                            12, 1,
                            15, 1.5
                        ],
                        'line-opacity': 0.8
                    }
                });

                // Create and store click event handler
                clickHandlerRef.current = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
                    if (!e.features || !e.features[0]) return;

                    const feature = e.features[0];
                    const props = feature.properties;

                    // Get status color for display
                    const statusColors = {
                        'critical': '#ff0000',  // Red
                        'alarm': '#ff8800',     // Orange
                        'alert': '#ffff00'      // Yellow
                    };
                    const statusColor = statusColors[props?.status as keyof typeof statusColors] || '#cccccc';

                    new mapboxgl.Popup()
                        .setLngLat(e.lngLat)
                        .setHTML(`
                            <div class="popup-content">
                                <h3 class="popup-title">Flood Tile</h3>
                                <p><strong>Source Sensor:</strong> ${props?.sensorName || 'Unknown'}</p>
                                <p><strong>Tile Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${props?.status?.toUpperCase() || 'Unknown'}</span></p>
                                <p><strong>Water Level:</strong> ${props?.waterLevel?.toFixed(2) || 'N/A'}m</p>
                                <p><strong>Distance from Sensor:</strong> ${props?.distanceFromSource?.toFixed(0) || 'N/A'}m</p>
                                <p><strong>Tile Size:</strong> ${TILE_SIZE_METERS}m × ${TILE_SIZE_METERS}m</p>
                                <p><strong>Coordinates:</strong> ${props?.centroid?.[0]?.toFixed(6) || 'N/A'}, ${props?.centroid?.[1]?.toFixed(6) || 'N/A'}</p>
                            </div>
                        `)
                        .addTo(map);
                };

                // Create and store mouse enter handler
                mouseEnterHandlerRef.current = () => {
                    if (map) {
                        map.getCanvas().style.cursor = 'pointer';
                    }
                };

                // Create and store mouse leave handler
                mouseLeaveHandlerRef.current = () => {
                    if (map) {
                        map.getCanvas().style.cursor = '';
                    }
                };

                // Add event listeners
                map.on('click', 'flood-tiles-layer', clickHandlerRef.current);
                map.on('mouseenter', 'flood-tiles-layer', mouseEnterHandlerRef.current);
                map.on('mouseleave', 'flood-tiles-layer', mouseLeaveHandlerRef.current);
            }
        }

        // Cleanup function
        return () => {
            if (!map || !map.getStyle()) return;

            // Remove event listeners using stored refs
            if (clickHandlerRef.current) {
                map.off('click', 'flood-tiles-layer', clickHandlerRef.current);
            }
            if (mouseEnterHandlerRef.current) {
                map.off('mouseenter', 'flood-tiles-layer', mouseEnterHandlerRef.current);
            }
            if (mouseLeaveHandlerRef.current) {
                map.off('mouseleave', 'flood-tiles-layer', mouseLeaveHandlerRef.current);
            }
        };
    }, [map, sensorsData, isVisible]);

    // Handle visibility changes separately
    useEffect(() => {
        if (!map || !map.getLayer('flood-tiles-layer')) return;

        const visibility = isVisible ? 'visible' : 'none';
        map.setLayoutProperty('flood-tiles-layer', 'visibility', visibility);
        map.setLayoutProperty('flood-tiles-outline', 'visibility', visibility);
    }, [map, isVisible]);

    return null; // This component doesn't render anything itself
};

export default FloodTiles;