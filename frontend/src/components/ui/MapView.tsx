import { useRef, useEffect, useState } from 'react'
import mapboxgl, { Map } from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import '../../styles/MapView.css'

import Legend from '../layout/Legend.tsx'
import Sidebar from '../layout/Sidebar.tsx'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || import.meta.env.VITE_MAPBOX_API

// Define proper types to match API response
type SensorStatus = "normal" | "alert" | "alarm" | "critical";

interface SensorTile {
    centroid: [number, number];
    status: SensorStatus;
}

interface Sensor {
    sensor: string;
    status: SensorStatus;
    centroid: [number, number];
    tiles: SensorTile[];
}

interface FloodMappingResponse {
    status: string;
    timestamp: string;
    total_sensors: number;
    data: Sensor[];
}

// API configuration
const API_BASE_URL = 'http://localhost:8000'
const WS_BASE_URL = 'ws://localhost:8000'

// WebSocket message types
interface WebSocketMessage {
    type: 'initial_data' | 'flood_update' | 'pong';
    status: string;
    timestamp: string;
    total_sensors: number;
    data: Sensor[];
}

// Connection states
type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error'

// Grid cell size in meters (should match backend MARGIN_VALUE)
const TILE_SIZE_METERS = 30

// Helper function to convert meters to degrees
const metersToDegrees = (meters: number, latitude: number) => {
    const metersPerDegreeLat = 111320
    const metersPerDegreeLng = 111320 * Math.cos(latitude * Math.PI / 180)
    return {
        lat: meters / metersPerDegreeLat,
        lng: meters / metersPerDegreeLng
    }
}

// Function to create GeoJSON for flood tiles
const createFloodTilesGeoJSON = (sensorsData: Sensor[]): GeoJSON.FeatureCollection => {
    const features: GeoJSON.Feature[] = []

    sensorsData.forEach((sensor) => {
        sensor.tiles.forEach((tile, index) => {
            // Skip normal status tiles for cleaner visualization
            if (tile.status === 'normal') return

            const [tileLat, tileLng] = tile.centroid
            
            // Calculate tile boundaries
            const tileDegrees = metersToDegrees(TILE_SIZE_METERS, tileLat)
            const halfTileLat = tileDegrees.lat / 2
            const halfTileLng = tileDegrees.lng / 2

            // Create polygon coordinates [lng, lat] format for Mapbox
            const coordinates = [[
                [tileLng - halfTileLng, tileLat - halfTileLat], // Bottom-left
                [tileLng + halfTileLng, tileLat - halfTileLat], // Bottom-right
                [tileLng + halfTileLng, tileLat + halfTileLat], // Top-right
                [tileLng - halfTileLng, tileLat + halfTileLat], // Top-left
                [tileLng - halfTileLng, tileLat - halfTileLat]  // Close polygon
            ]]

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
                    distanceFromSource: (tile as any).distance_from_source || 0,
                    waterLevel: (tile as any).water_level || 0,
                    centroid: tile.centroid
                }
            }

            features.push(feature)
        })
    })

    console.log(`Created ${features.length} flood tiles for visualization`)
    return {
        type: 'FeatureCollection',
        features: features
    }
}

function MapView() {
    const mapRef = useRef<Map | null>(null)
    const mapContainerRef = useRef<HTMLDivElement | null>(null)
    const [showWaterAreas, setShowWaterAreas] = useState(true)
    const [show3DBuildings, setShow3DBuildings] = useState(true)
    const [showPixelatedOverlay, setShowPixelatedOverlay] = useState(true)
    const [sensorsData, setSensorsData] = useState<Sensor[]>([])
    const [connectionState, setConnectionState] = useState<ConnectionState>('connecting')
    const [error, setError] = useState<string | null>(null)
    const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null)
    const [websocket, setWebsocket] = useState<WebSocket | null>(null)
    const [currentCoords, setCurrentCoords] = useState({
        lng: 121.049309,
        lat: 14.651489,
        zoom: 11
    })

    // WebSocket connection management
    const connectWebSocket = () => {
        try {
            setConnectionState('connecting')
            setError(null)
            
            const ws = new WebSocket(`${WS_BASE_URL}/ws/flood-mapping`)
            
            ws.onopen = () => {
                console.log('WebSocket connected for real-time flood mapping')
                setConnectionState('connected')
                setError(null)
                
                // Send ping every 30 seconds to keep connection alive
                const pingInterval = setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ type: 'ping' }))
                    } else {
                        clearInterval(pingInterval)
                    }
                }, 30000)
                
                // Store interval ID to clear on close
                ;(ws as any).pingInterval = pingInterval
            }
            
            ws.onmessage = (event) => {
                try {
                    const message: WebSocketMessage = JSON.parse(event.data)
                    
                    if (message.type === 'initial_data' || message.type === 'flood_update') {
                        if (message.status === 'success' && message.data) {
                            console.log(`🔄 ${message.type === 'initial_data' ? 'Initial' : 'Updated'} flood data: ${message.total_sensors} sensors`)
                            
                            setSensorsData(message.data)
                            setLastUpdateTime(message.timestamp)
                        }
                    } else if (message.type === 'pong') {
                        // Handle pong response (connection is alive)
                        console.log('WebSocket connection alive')
                    }
                } catch (err) {
                    console.error('Error parsing WebSocket message:', err)
                }
            }
            
            ws.onclose = (event) => {
                console.log('WebSocket connection closed:', event.code, event.reason)
                setConnectionState('disconnected')
                
                // Clear ping interval
                if ((ws as any).pingInterval) {
                    clearInterval((ws as any).pingInterval)
                }
                
                // Attempt to reconnect after 3 seconds
                setTimeout(() => {
                    if (!websocket || websocket.readyState === WebSocket.CLOSED) {
                        console.log('Attempting to reconnect WebSocket...')
                        connectWebSocket()
                    }
                }, 3000)
            }
            
            ws.onerror = (error) => {
                console.error('WebSocket error:', error)
                setConnectionState('error')
                setError('WebSocket connection failed. Attempting to reconnect...')
            }
            
            setWebsocket(ws)
            
        } catch (err) {
            console.error('Failed to create WebSocket connection:', err)
            setConnectionState('error')
            setError(err instanceof Error ? err.message : 'Failed to connect')
        }
    }

    // Fallback HTTP fetch for when WebSocket fails
    const fetchFloodMappingDataHTTP = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/flood-mapping/detailed/`)
            if (!response.ok) {
                throw new Error(`Failed to fetch flood mapping data: ${response.statusText}`)
            }
            
            const data: FloodMappingResponse = await response.json()
            
            if (data.status === 'success' && data.data) {
                setSensorsData(data.data)
                setLastUpdateTime(data.timestamp)
                console.log(`📡 Fallback HTTP: Loaded ${data.total_sensors} sensors`)
            }
        } catch (err) {
            console.error('HTTP fallback failed:', err)
            throw err
        }
    }

    // Initialize WebSocket connection on component mount
    useEffect(() => {
        connectWebSocket()
        
        // Cleanup on unmount
        return () => {
            if (websocket) {
                websocket.close()
            }
        }
    }, [])

    // Manual reconnect function
    const handleManualReconnect = () => {
        if (websocket) {
            websocket.close()
        }
        setTimeout(connectWebSocket, 500)
    }

    // Helper function to get connection status display info
    const getConnectionDisplay = () => {
        switch (connectionState) {
            case 'connected':
                return {
                    emoji: '🟢',
                    text: 'Live Stream',
                    color: '#4caf50',
                    borderColor: '#4caf50',
                    subtext: 'Real-time updates every 30s'
                }
            case 'connecting':
                return {
                    emoji: '🟡',
                    text: 'Connecting...',
                    color: '#ff9800',
                    borderColor: '#ff9800',
                    subtext: 'Establishing connection...'
                }
            case 'error':
                return {
                    emoji: '🔴',
                    text: 'Connection Error',
                    color: '#f44336',
                    borderColor: '#f44336',
                    subtext: 'Click to reconnect'
                }
            case 'disconnected':
                return {
                    emoji: '⚪',
                    text: 'Disconnected',
                    color: '#9e9e9e',
                    borderColor: '#9e9e9e',
                    subtext: 'Click to reconnect'
                }
        }
    }

    const connectionDisplay = getConnectionDisplay()

    useEffect(() => {
        if (!mapContainerRef.current || connectionState === 'connecting') return

        const bounds: mapboxgl.LngLatBoundsLike = [
            [120.94, 14.45],
            [121.12, 14.76]
        ]

        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/light-v11',
            center: [121.049309, 14.651489],
            zoom: 11,
            pitch: 45,
            bearing: 0,
            maxBounds: bounds,
            minZoom: 9,
            maxZoom: 18
        })

        mapRef.current = map

        map.on('mousemove', (e) => {
            setCurrentCoords({
                lng: e.lngLat.lng,
                lat: e.lngLat.lat,
                zoom: map.getZoom()
            })
        })

        map.on('load', () => {
            // Water areas layer
            map.addLayer({
                id: 'water-areas',
                type: 'fill',
                source: 'composite',
                'source-layer': 'water',
                paint: {
                    'fill-color': '#1CB5E0',
                    'fill-opacity': 0.6
                }
            })

            // Add sensor markers
            sensorsData.forEach((sensor) => {
                const [lat, lng] = sensor.centroid
                const { sensor: sensorName, status } = sensor

                // Determine marker color based on status
                const statusColors = {
                    'normal': '#00ff00',   // Green
                    'alert': '#ffff00',    // Yellow
                    'alarm': '#ff8800',    // Orange
                    'critical': '#ff0000'  // Red
                }
                const markerColor = statusColors[status as keyof typeof statusColors] || '#00ff00'

                // Simplified popup content - only essential sensor information
                const popupContent = `
          <div class="popup-content">
            <h3 class="popup-title">${sensorName}</h3>
            <p><strong>Coordinates:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
            <p><strong>Current Water Level:</strong> <span style="color: ${markerColor}; font-weight: bold;">${(sensor as any).water_level || 'N/A'}m</span></p>
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
              <p style="margin: 2px 0; font-size: 12px;"><strong>Alert:</strong> ${(sensor as any).alert || 'N/A'}m</p>
              <p style="margin: 2px 0; font-size: 12px;"><strong>Alarm:</strong> ${(sensor as any).alarm || 'N/A'}m</p>
              <p style="margin: 2px 0; font-size: 12px;"><strong>Critical:</strong> ${(sensor as any).critical || 'N/A'}m</p>
            </div>
          </div>
        `

                // Create custom marker element - slightly larger for better visibility
                const markerElement = document.createElement('div')
                markerElement.className = 'sensor-marker'
                markerElement.style.cssText = `
          width: 16px;
          height: 16px;
          background-color: ${markerColor};
          border: 3px solid white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 3px 6px rgba(0,0,0,0.4);
          z-index: 1000;
        `

                new mapboxgl.Marker({ element: markerElement })
                    .setLngLat([lng, lat])
                    .setPopup(new mapboxgl.Popup().setHTML(popupContent))
                    .addTo(map)
            })

            // Create flood tiles visualization using detailed sensor data
            const floodTilesGeoJSON = createFloodTilesGeoJSON(sensorsData)
            
            // Add flood tiles source
            map.addSource('flood-tiles', {
                type: 'geojson',
                data: floodTilesGeoJSON
            })

            // Add flood tiles layer - positioned above water but below buildings
            map.addLayer({
                id: 'flood-tiles-layer',
                type: 'fill',
                source: 'flood-tiles',
                layout: { visibility: 'visible' }, // Start visible to show tiles by default
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
            })

            // Add flood tiles outline for better visibility
            map.addLayer({
                id: 'flood-tiles-outline',
                type: 'line',
                source: 'flood-tiles',
                layout: { visibility: 'visible' },
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
            })

            // 3D buildings - added after pixelated layers so they appear on top
            map.addLayer({
                id: '3d-buildings',
                source: 'composite',
                'source-layer': 'building',
                filter: ['==', 'extrude', 'true'],
                type: 'fill-extrusion',
                minzoom: 12,
                paint: {
                    'fill-extrusion-color': [
                        'case',
                        ['>', ['get', 'height'], 100], '#2E5266',
                        ['>', ['get', 'height'], 50], '#FF8C42',
                        '#e8e8e8'
                    ],
                    'fill-extrusion-height': [
                        'interpolate', ['linear'], ['zoom'],
                        12, 0,
                        12.05, ['get', 'height']
                    ],
                    'fill-extrusion-base': [
                        'interpolate', ['linear'], ['zoom'],
                        12, 0,
                        12.05, ['get', 'min_height']
                    ],
                    'fill-extrusion-opacity': 0.8
                }
            })

            // Add navigation controls
            map.addControl(new mapboxgl.NavigationControl(), 'top-right')

            // Add scale control
            map.addControl(new mapboxgl.ScaleControl({
                maxWidth: 100,
                unit: 'metric'
            }), 'bottom-left')

            // Add fullscreen control
            map.addControl(new mapboxgl.FullscreenControl(), 'top-right')

            // Add click event for flood tiles
            map.on('click', 'flood-tiles-layer', (e) => {
                if (!e.features || !e.features[0]) return

                const feature = e.features[0]
                const props = feature.properties

                // Get status color for display
                const statusColors = {
                    'critical': '#ff0000',  // Red
                    'alarm': '#ff8800',     // Orange
                    'alert': '#ffff00'      // Yellow
                }
                const statusColor = statusColors[props?.status as keyof typeof statusColors] || '#cccccc'

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
                        .addTo(map)
            })

            // Add hover effects for tiles
            map.on('mouseenter', 'flood-tiles-layer', () => {
                map.getCanvas().style.cursor = 'pointer'
            })

            map.on('mouseleave', 'flood-tiles-layer', () => {
                map.getCanvas().style.cursor = ''
            })

            // Roads overlay
            map.addLayer({
                id: 'roads-overlay',
                type: 'line',
                source: 'composite',
                'source-layer': 'road',
                filter: ['in', 'class', 'motorway', 'trunk', 'primary', 'secondary'],
                paint: {
                    'line-color': '#666666',
                    'line-width': [
                        'interpolate', ['linear'], ['zoom'],
                        10, 1,
                        15, 3
                    ],
                    'line-opacity': 0.7
                }
            })
        })

        return () => {
            map.remove()
        }
    }, [sensorsData, connectionState]) // Re-run when sensor data changes

    const toggleLayer = (id: string, visible: boolean) => {
        if (mapRef.current) {
            // Fixed visibility logic
            const visibility = visible ? 'visible' : 'none'
            mapRef.current.setLayoutProperty(id, 'visibility', visibility)
        }
    }

    // Show loading state
    if (connectionState === 'connecting') {
        return (
            <div className="map-loading-container" style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: '#f5f5f5',
                flexDirection: 'column'
            }}>
                <div className="loading-spinner" style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid #e3e3e3',
                    borderTop: '4px solid #1CB5E0',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginBottom: '20px'
                }} />
                <p style={{ fontSize: '18px', color: '#333' }}>Connecting to real-time flood monitoring...</p>
                <p style={{ fontSize: '14px', color: '#666' }}>Establishing WebSocket connection to PAGASA data stream</p>
            </div>
        )
    }

    // Show error state
    if (error) {
        return (
            <div className="map-error-container" style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: '#f5f5f5',
                flexDirection: 'column'
            }}>
                <div style={{
                    backgroundColor: '#ffebee',
                    border: '1px solid #f44336',
                    borderRadius: '8px',
                    padding: '20px',
                    maxWidth: '500px',
                    textAlign: 'center'
                }}>
                    <h3 style={{ color: '#d32f2f', marginTop: 0 }}>Failed to Load Flood Data</h3>
                    <p style={{ color: '#666', marginBottom: '20px' }}>{error}</p>
                    <button
                        onClick={handleManualReconnect}
                        style={{
                            backgroundColor: '#1CB5E0',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Reconnect
                    </button>
                </div>
            </div>
        )
    }

    return (
        <>
            <Sidebar
                currentCoords={currentCoords}
                resetView={() => {
                    mapRef.current?.flyTo({
                        center: [121.049309, 14.651489],
                        zoom: 11,
                        pitch: 45,
                        bearing: 0,
                        duration: 2000
                    })
                }}
                toggle3D={() => {
                    if (mapRef.current) {
                        const currentPitch = mapRef.current.getPitch()
                        mapRef.current.flyTo({
                            pitch: currentPitch > 0 ? 0 : 45,
                            duration: 1000
                        })
                    }
                }}
                toggleWaterAreas={() => {
                    const newShowWaterAreas = !showWaterAreas
                    toggleLayer('water-areas', newShowWaterAreas)
                    setShowWaterAreas(newShowWaterAreas)
                }}
                toggle3DBuildings={() => {
                    const newShow3DBuildings = !show3DBuildings
                    toggleLayer('3d-buildings', newShow3DBuildings)
                    setShow3DBuildings(newShow3DBuildings)
                }}
                togglePixelatedOverlay={() => {
                    const newShowPixelatedOverlay = !showPixelatedOverlay
                    toggleLayer('flood-tiles-layer', newShowPixelatedOverlay)
                    toggleLayer('flood-tiles-outline', newShowPixelatedOverlay)
                    setShowPixelatedOverlay(newShowPixelatedOverlay)
                }}
                showWaterAreas={showWaterAreas}
                show3DBuildings={show3DBuildings}
                showPixelatedOverlay={showPixelatedOverlay}
            />

            <Legend />
            <div id="map-container" ref={mapContainerRef} />
            
            {/* Connection status indicator */}
            <div 
                style={{
                    position: 'absolute',
                    bottom: '60px',
                    right: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    zIndex: 1000,
                    border: `2px solid ${connectionDisplay.borderColor}`,
                    cursor: connectionState === 'error' || connectionState === 'disconnected' ? 'pointer' : 'default'
                }}
                onClick={connectionState === 'error' || connectionState === 'disconnected' ? handleManualReconnect : undefined}
            >
                <div style={{ 
                    color: connectionDisplay.color,
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                }}>
                    <span>{connectionDisplay.emoji}</span>
                    {connectionDisplay.text}
                    {connectionState === 'connected' && ` (${sensorsData.length} sensors)`}
                </div>
                {lastUpdateTime && (
                    <div style={{ color: '#666', fontSize: '10px', marginTop: '2px' }}>
                        Last update: {new Date(lastUpdateTime).toLocaleTimeString()}
                    </div>
                )}
                <div style={{ color: '#666', fontSize: '10px', marginTop: '2px' }}>
                    {connectionDisplay.subtext}
                </div>
            </div>
        </>
    )
}

export default MapView