import mapboxgl from 'mapbox-gl';

interface Node {
    id: string;
    coordinates: [number, number];
    connections: Connection[];
}

interface Connection {
    nodeId: string;
    weight: number;  // Distance in meters
    roadType: string;
    floodRisk: number; // 0-1, where 1 is highest risk
}

interface RoadNetwork {
    nodes: { [key: string]: Node };
}

interface RouteOptions {
    avoidFlooding?: boolean;
    preferMainRoads?: boolean;
}

export class RouteCalculator {
    private roadNetwork: RoadNetwork;
    private map: mapboxgl.Map;

    constructor(map: mapboxgl.Map) {
        this.map = map;
        this.roadNetwork = { nodes: {} };
    }

    // Load road network data from Mapbox within a bounding box
    async loadRoadNetwork(bounds: mapboxgl.LngLatBounds): Promise<void> {
        try {
            // Query road features from Mapbox using queryRenderedFeatures
            const roadFeatures = this.map.queryRenderedFeatures(
                [
                    this.map.project(bounds.getSouthWest()),
                    this.map.project(bounds.getNorthEast())
                ],
                {
                    layers: ['road-primary', 'road-secondary', 'road-street']
                }
            );

            // Process road features into our graph structure
            roadFeatures.forEach(feature => {
                if (feature.geometry.type === 'LineString') {
                    const coordinates = feature.geometry.coordinates;
                    const roadType = feature.properties?.class || 'street';

                    // Create nodes for each coordinate point
                    coordinates.forEach((coord, idx) => {
                        const nodeId = `node-${coord[0]}-${coord[1]}`;
                        
                        if (!this.roadNetwork.nodes[nodeId]) {
                            this.roadNetwork.nodes[nodeId] = {
                                id: nodeId,
                                coordinates: [coord[0], coord[1]],
                                connections: []
                            };
                        }

                        // Connect to next node if it exists
                        if (idx < coordinates.length - 1) {
                            const nextCoord = coordinates[idx + 1];
                            const nextNodeId = `node-${nextCoord[0]}-${nextCoord[1]}`;
                            const distance = this.calculateDistance(coord, nextCoord);
                            
                            // Get flood risk from map data layer if available
                            const floodRisk = this.getFloodRisk(coord);

                            // Add bidirectional connections
                            this.roadNetwork.nodes[nodeId].connections.push({
                                nodeId: nextNodeId,
                                weight: distance,
                                roadType,
                                floodRisk
                            });

                            // Create the next node if it doesn't exist
                            if (!this.roadNetwork.nodes[nextNodeId]) {
                                this.roadNetwork.nodes[nextNodeId] = {
                                    id: nextNodeId,
                                    coordinates: [nextCoord[0], nextCoord[1]],
                                    connections: [{
                                        nodeId,
                                        weight: distance,
                                        roadType,
                                        floodRisk
                                    }]
                                };
                            }
                        }
                    });
                }
            });
        } catch (error) {
            console.error('Error loading road network:', error);
            throw error;
        }
    }

    // Calculate distance between two points in meters
    private calculateDistance(coord1: number[], coord2: number[]): number {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = (coord1[1] * Math.PI) / 180;
        const φ2 = (coord2[1] * Math.PI) / 180;
        const Δφ = ((coord2[1] - coord1[1]) * Math.PI) / 180;
        const Δλ = ((coord2[0] - coord1[0]) * Math.PI) / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    // Get flood risk for a coordinate from map data
    private getFloodRisk(coord: number[]): number {
        try {
            const floodData = this.map.queryRenderedFeatures(
                this.map.project(coord as [number, number]),
                { layers: ['flood-tiles-layer'] }
            );

            if (floodData.length > 0) {
                const status = floodData[0].properties?.status;
                switch (status) {
                    case 'critical': return 1;
                    case 'alarm': return 0.7;
                    case 'alert': return 0.4;
                    default: return 0;
                }
            }
            return 0;
        } catch (error) {
            console.warn('Error getting flood risk:', error);
            return 0;
        }
    }

    // Find nearest node to a coordinate
    private findNearestNode(coord: [number, number]): string {
        let nearestNode = '';
        let minDistance = Infinity;

        Object.entries(this.roadNetwork.nodes).forEach(([nodeId, node]) => {
            const distance = this.calculateDistance(coord, node.coordinates);
            if (distance < minDistance) {
                minDistance = distance;
                nearestNode = nodeId;
            }
        });

        return nearestNode;
    }

    // Dijkstra's algorithm implementation with custom weighting
    findRoute(
        start: [number, number],
        end: [number, number],
        options: RouteOptions = {}
    ): [number, number][] {
        const startNodeId = this.findNearestNode(start);
        const endNodeId = this.findNearestNode(end);

        const distances: { [key: string]: number } = {};
        const previous: { [key: string]: string } = {};
        const unvisited = new Set<string>();

        // Initialize distances
        Object.keys(this.roadNetwork.nodes).forEach(nodeId => {
            distances[nodeId] = Infinity;
            unvisited.add(nodeId);
        });
        distances[startNodeId] = 0;

        while (unvisited.size > 0) {
            // Find node with minimum distance
            let current = '';
            let minDistance = Infinity;
            unvisited.forEach(nodeId => {
                if (distances[nodeId] < minDistance) {
                    minDistance = distances[nodeId];
                    current = nodeId;
                }
            });

            if (current === endNodeId) break;
            if (current === '' || distances[current] === Infinity) break;

            unvisited.delete(current);

            // Update distances to neighbors
            const currentNode = this.roadNetwork.nodes[current];
            currentNode.connections.forEach(connection => {
                if (!unvisited.has(connection.nodeId)) return;

                // Calculate weighted distance based on options
                let weight = connection.weight;
                if (options.avoidFlooding) {
                    weight *= (1 + connection.floodRisk * 2); // Heavily penalize flood risk
                }
                if (options.preferMainRoads) {
                    weight *= connection.roadType === 'primary' ? 0.8 : 
                             connection.roadType === 'secondary' ? 0.9 : 1.2;
                }

                const distance = distances[current] + weight;
                if (distance < distances[connection.nodeId]) {
                    distances[connection.nodeId] = distance;
                    previous[connection.nodeId] = current;
                }
            });
        }

        // Reconstruct path
        const path: [number, number][] = [];
        let current = endNodeId;
        while (current && current !== startNodeId) {
            path.unshift(this.roadNetwork.nodes[current].coordinates);
            current = previous[current];
        }
        if (current === startNodeId) {
            path.unshift(this.roadNetwork.nodes[startNodeId].coordinates);
        }

        return path;
    }

    // Main route finding function with fallback to Mapbox Directions API
    async calculateRoute(
        start: [number, number],
        end: [number, number],
        options: RouteOptions = {}
    ): Promise<GeoJSON.LineString> {
        try {
            // Try Dijkstra first
            const bounds = new mapboxgl.LngLatBounds()
                .extend(start)
                .extend(end);
            
            // Extend bounds to include potential routes
            bounds.extend([
                bounds.getWest() - 0.01,
                bounds.getSouth() - 0.01
            ]).extend([
                bounds.getEast() + 0.01,
                bounds.getNorth() + 0.01
            ]);

            await this.loadRoadNetwork(bounds);
            const route = this.findRoute(start, end, options);

            if (route.length > 1) {
                return {
                    type: 'LineString',
                    coordinates: route
                };
            }

            // Fallback to Mapbox Directions API
            console.log('Falling back to Mapbox Directions API');
            return this.getMapboxDirections(start, end);
        } catch (error) {
            console.error('Error in route calculation:', error);
            return this.getMapboxDirections(start, end);
        }
    }

    // Mapbox Directions API fallback
    private async getMapboxDirections(
        start: [number, number],
        end: [number, number]
    ): Promise<GeoJSON.LineString> {
        const response = await fetch(
            `https://api.mapbox.com/directions/v5/mapbox/walking/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch directions from Mapbox API');
        }

        const data = await response.json();
        return data.routes[0].geometry;
    }
} 