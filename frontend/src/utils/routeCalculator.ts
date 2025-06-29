import mapboxgl from 'mapbox-gl';

interface Node {
    id: string;
    coordinates: [number, number];
    connections: Connection[];
}

interface Connection {
    nodeId: string;
    weight: number;
    roadType: string;
    floodRisk: number;
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
    private networkLoaded: boolean = false;
    private loadingPromise: Promise<void> | null = null;
    private loadedBounds: mapboxgl.LngLatBounds | null = null;

    constructor(map: mapboxgl.Map) {
        this.map = map;
        this.roadNetwork = { nodes: {} };
    }

    async loadRoadNetwork(bounds: mapboxgl.LngLatBounds): Promise<void> {
        // If already loading, wait for existing load to complete
        if (this.loadingPromise) {
            await this.loadingPromise;
        }

        // Check if we already have data for these bounds
        if (this.networkLoaded && this.loadedBounds && this.boundsContain(this.loadedBounds, bounds)) {
            console.log('Road network already loaded for these bounds');
            return;
        }

        // Start loading
        this.loadingPromise = this.performLoadRoadNetwork(bounds);
        await this.loadingPromise;
        this.loadingPromise = null;
    }

    private boundsContain(loadedBounds: mapboxgl.LngLatBounds, requestedBounds: mapboxgl.LngLatBounds): boolean {
        return loadedBounds.getWest() <= requestedBounds.getWest() &&
               loadedBounds.getEast() >= requestedBounds.getEast() &&
               loadedBounds.getSouth() <= requestedBounds.getSouth() &&
               loadedBounds.getNorth() >= requestedBounds.getNorth();
    }

    private async performLoadRoadNetwork(bounds: mapboxgl.LngLatBounds): Promise<void> {
        try {
            console.log('Loading road network for bounds:', bounds.toArray());
            
            // Wait for style to be loaded
            if (!this.map.isStyleLoaded()) {
                await new Promise(resolve => this.map.once('idle', resolve));
            }

            // Reset network for new bounds
            this.roadNetwork = { nodes: {} };
            this.networkLoaded = false;

            // Get all available layers
            const availableLayers = this.map.getStyle().layers.map(layer => layer.id);
            
            // Priority order: try most specific road layers first
            const roadLayerPriority = [
                'road-simple', // Main layer found in light-v11
                'roads-overlay', // Secondary layer found in light-v11
                'road-motorway-trunk',
                'road-primary',
                'road-secondary-tertiary',
                'road-minor',
                'road-street',
                'road-pedestrian',
                'road-path'
            ];

            // Find available road layers in priority order
            const foundLayers = roadLayerPriority.filter(layer => availableLayers.includes(layer));
            
            // If no priority layers found, try pattern matching
            if (foundLayers.length === 0) {
                const patternLayers = availableLayers.filter(layer => 
                    layer.toLowerCase().includes('road') &&
                    !layer.toLowerCase().includes('label') // Exclude text labels
                );
                foundLayers.push(...patternLayers);
            }

            console.log('Available road layers:', foundLayers);

            let allRoadFeatures: mapboxgl.MapboxGeoJSONFeature[] = [];

            // Query each found layer
            for (const layerId of foundLayers) {
                try {
                    const features = this.map.queryRenderedFeatures(
                        [
                            this.map.project(bounds.getSouthWest()),
                            this.map.project(bounds.getNorthEast())
                        ],
                        { layers: [layerId] }
                    );
                    
                    if (features.length > 0) {
                        allRoadFeatures = allRoadFeatures.concat(features);
                        console.log(`Found ${features.length} features in layer ${layerId}`);
                    }
                } catch (error) {
                    console.warn(`Could not query layer ${layerId}:`, error);
                }
            }

            console.log(`Total road features found: ${allRoadFeatures.length}`);

            // Process the features to build road network
            allRoadFeatures.forEach((feature) => {
                if (feature.geometry?.type === 'LineString') {
                    const coordinates = feature.geometry.coordinates;
                    const roadType = feature.properties?.class || 
                                   feature.properties?.type || 
                                   feature.layer?.id || 
                                   'street';

                    coordinates.forEach((coord, idx) => {
                        // Use more precision for node IDs to avoid duplicates
                        const nodeId = `node-${coord[0].toFixed(6)}-${coord[1].toFixed(6)}`;
                        
                        if (!this.roadNetwork.nodes[nodeId]) {
                            this.roadNetwork.nodes[nodeId] = {
                                id: nodeId,
                                coordinates: [coord[0], coord[1]],
                                connections: []
                            };
                        }

                        if (idx < coordinates.length - 1) {
                            const nextCoord = coordinates[idx + 1];
                            const nextNodeId = `node-${nextCoord[0].toFixed(6)}-${nextCoord[1].toFixed(6)}`;
                            const distance = this.calculateDistance(coord, nextCoord);
                            
                            const floodRisk = this.getFloodRisk(coord);

                            this.roadNetwork.nodes[nodeId].connections.push({
                                nodeId: nextNodeId,
                                weight: distance,
                                roadType,
                                floodRisk
                            });

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

            const nodeCount = Object.keys(this.roadNetwork.nodes).length;
            console.log(`Road network loaded: ${nodeCount} nodes from ${allRoadFeatures.length} features`);
            
            if (nodeCount === 0) {
                console.warn('No road network nodes created. Available layers:', availableLayers);
                throw new Error('Failed to load road network: No nodes created');
            }

            this.networkLoaded = true;
            this.loadedBounds = bounds;
            
        } catch (error) {
            console.error('Error loading road network:', error);
            this.networkLoaded = false;
            this.loadedBounds = null;
            throw error;
        }
    }

    isNetworkLoaded(): boolean {
        return this.networkLoaded && Object.keys(this.roadNetwork.nodes).length > 0;
    }

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

    findRoute(
        start: [number, number],
        end: [number, number],
        options: RouteOptions = {}
    ): [number, number][] {
        // Input validation
        if (!start || !end) {
            throw new Error('Start or end coordinates are undefined');
        }

        if (!Array.isArray(start) || start.length !== 2 || 
            !Array.isArray(end) || end.length !== 2) {
            throw new Error('Invalid coordinate format');
        }

        if (!this.isNetworkLoaded()) {
            throw new Error('Road network is empty. Make sure loadRoadNetwork was called successfully.');
        }

        const startNodeId = this.findNearestNode(start);
        const endNodeId = this.findNearestNode(end);

        if (!startNodeId || !endNodeId) {
            throw new Error('Could not find nearest nodes for start or end points');
        }

        if (!this.roadNetwork.nodes[startNodeId] || !this.roadNetwork.nodes[endNodeId]) {
            throw new Error('Start or end node not found in road network');
        }

        // Dijkstra's algorithm
        const distances: { [key: string]: number } = {};
        const previous: { [key: string]: string } = {};
        const unvisited = new Set<string>();

        Object.keys(this.roadNetwork.nodes).forEach(nodeId => {
            distances[nodeId] = Infinity;
            unvisited.add(nodeId);
        });
        distances[startNodeId] = 0;

        while (unvisited.size > 0) {
            // Find unvisited node with minimum distance
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

            const currentNode = this.roadNetwork.nodes[current];
            if (!currentNode || !currentNode.connections) continue;

            currentNode.connections.forEach(connection => {
                if (!unvisited.has(connection.nodeId)) return;

                let weight = connection.weight;
                
                // Apply routing options
                if (options.avoidFlooding) {
                    weight *= (1 + connection.floodRisk * 2); 
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
            const node = this.roadNetwork.nodes[current];
            if (!node || !node.coordinates) {
                console.error(`Node ${current} has invalid coordinates`);
                break;
            }
            path.unshift(node.coordinates);
            current = previous[current];
        }
        
        if (current === startNodeId) {
            const startNode = this.roadNetwork.nodes[startNodeId];
            if (startNode && startNode.coordinates) {
                path.unshift(startNode.coordinates);
            }
        }

        return path;
    }

    async calculateRoute(
        start: [number, number],
        end: [number, number],
        options: RouteOptions = {}
    ): Promise<GeoJSON.LineString> {
        try {
            if (!start || !end) {
                throw new Error('Start or end coordinates are required');
            }

            // Create bounds around start and end points
            const bounds = new mapboxgl.LngLatBounds()
                .extend(start)
                .extend(end);
            
            // Add padding to ensure we capture roads around the route
            bounds.extend([
                bounds.getWest() - 0.01,
                bounds.getSouth() - 0.01
            ]).extend([
                bounds.getEast() + 0.01,
                bounds.getNorth() + 0.01
            ]);

            // Load road network if not already loaded for these bounds
            await this.loadRoadNetwork(bounds);
            
            // Verify network is loaded
            if (!this.isNetworkLoaded()) {
                throw new Error('Road network failed to load');
            }

            const route = this.findRoute(start, end, options);

            if (route.length > 1) {
                return {
                    type: 'LineString',
                    coordinates: route
                };
            }

            // Fallback to Mapbox Directions API
            console.log('No route found, falling back to Mapbox Directions API');
            return this.getMapboxDirections(start, end);
        } catch (error) {
            console.error('Error in route calculation:', error);
            return this.getMapboxDirections(start, end);
        }
    }

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
        
        if (!data.routes || data.routes.length === 0) {
            throw new Error('No routes found from Mapbox Directions API');
        }

        return data.routes[0].geometry;
    }
}