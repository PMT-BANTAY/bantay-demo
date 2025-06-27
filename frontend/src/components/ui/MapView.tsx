import { useRef, useEffect, useState } from 'react'
import mapboxgl, { Map } from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import '../../styles/MapView.css'

import sensorsDataRaw from '../../data/sensorData.json'
import Legend from '../layout/Legend.tsx'
import Sidebar from '../layout/Sidebar.tsx'

import { createDamVicinityGrid } from '../../utils/grid.ts'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || import.meta.env.VITE_MAPBOX_API

// Define proper types to match expected interface
type SensorStatus = "alert" | "alarm" | "critical";

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

// Type assertion to ensure the data matches our expected structure
const sensorsData: Sensor[] = sensorsDataRaw.map(sensor => ({
    ...sensor,
    centroid: sensor.centroid as [number, number],
    status: sensor.status as SensorStatus,
    tiles: sensor.tiles.map(tile => ({
        ...tile,
        centroid: tile.centroid as [number, number],
        status: tile.status as SensorStatus
    }))
}))

function MapView() {
    const mapRef = useRef<Map | null>(null)
    const mapContainerRef = useRef<HTMLDivElement | null>(null)
    const [showWaterAreas, setShowWaterAreas] = useState(true)
    const [show3DBuildings, setShow3DBuildings] = useState(true)
    const [showPixelatedOverlay, setShowPixelatedOverlay] = useState(false)
    const [currentCoords, setCurrentCoords] = useState({
        lng: 121.049309,
        lat: 14.651489,
        zoom: 11
    })

    useEffect(() => {
        if (!mapContainerRef.current) return

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
                    'alert': '#ffff00',    // Yellow
                    'alarm': '#ff8800',    // Orange
                    'critical': '#ff0000'  // Red
                }
                const markerColor = statusColors[status as keyof typeof statusColors] || '#00ff00'

                const popupContent = `
          <div class="popup-content">
            <h3 class="popup-title">${sensorName}</h3>
            <p><strong>Status:</strong> <span style="color: ${markerColor}; font-weight: bold;">${status.toUpperCase()}</span></p>
            <p><strong>Coordinates:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
            <p><strong>Adjacent Tiles:</strong> ${sensor.tiles.length}</p>
            <div style="margin-top: 10px;">
              <p><strong>Tile Statuses:</strong></p>
              ${sensor.tiles.map((tile, index) =>
                    `<p style="margin: 2px 0; font-size: 12px;">
                  Tile ${index + 1}: <span style="color: ${statusColors[tile.status as keyof typeof statusColors]}; font-weight: bold;">${tile.status}</span>
                </p>`
                ).join('')}
            </div>
            <p><strong>Grid Resolution:</strong> 30m per cell</p>
          </div>
        `

                // Create custom marker element
                const markerElement = document.createElement('div')
                markerElement.className = 'sensor-marker'
                markerElement.style.cssText = `
          width: 12px;
          height: 12px;
          background-color: ${markerColor};
          border: 2px solid white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        `

                new mapboxgl.Marker({ element: markerElement })
                    .setLngLat([lng, lat])
                    .setPopup(new mapboxgl.Popup().setHTML(popupContent))
                    .addTo(map)
            })

            // Create and add pixelated grid overlay using sensor data
            const pixelatedData = createDamVicinityGrid(sensorsData)
            map.addSource('pixelated-grid', {
                type: 'geojson',
                data: pixelatedData
            })

            // Add pixelated overlay layers - positioned above water but below buildings
            map.addLayer({
                id: 'pixelated-overlay',
                type: 'fill',
                source: 'pixelated-grid',
                layout: { visibility: 'none' },
                paint: {
                    'fill-color': [
                        'case',
                        ['==', ['get', 'tileStatus'], 'critical'], '#ff0000',
                        ['==', ['get', 'tileStatus'], 'alarm'], '#ff8800',
                        ['==', ['get', 'tileStatus'], 'alert'], '#ffff00',
                        '#00ff00'
                    ],
                    'fill-opacity': [
                        'interpolate', ['linear'], ['zoom'],
                        9, 0.7,
                        12, 0.6,
                        15, 0.4
                    ]
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

            // Add click event for pixelated grid
            map.on('click', 'pixelated-overlay', (e) => {
                if (!e.features || !e.features[0]) return

                const feature = e.features[0]
                const props = feature.properties

                // Type guard to check if geometry has coordinates
                if (feature.geometry.type === 'Polygon') {
                    const coordinates = feature.geometry.coordinates[0]
                    let lngSum = 0
                    let latSum = 0
                    const pointCount = coordinates.length - 1 // Exclude duplicate closing point

                    for (let i = 0; i < pointCount; i++) {
                        lngSum += coordinates[i][0]
                        latSum += coordinates[i][1]
                    }

                    const centroidLng = lngSum / pointCount
                    const centroidLat = latSum / pointCount

                    // Fixed template literal syntax
                    const tileCentroidText = props?.tileCentroid
                        ? `${props.tileCentroid[0].toFixed(6)}, ${props.tileCentroid[1].toFixed(6)}`
                        : 'N/A'

                    new mapboxgl.Popup()
                        .setLngLat(e.lngLat)
                        .setHTML(`
                <div class="popup-content">
                  <h3 class="popup-title">Sensor Tile Assessment</h3>
                  <p><strong>Sensor:</strong> ${props?.sensorId || 'Unknown'}</p>
                  <p><strong>Sensor Status:</strong> <span style="color: ${props?.statusColor}; font-weight: bold;">${props?.sensorStatus?.toUpperCase() || 'Unknown'}</span></p>
                  <p><strong>Tile Status:</strong> <span style="color: ${props?.statusColor}; font-weight: bold;">${props?.tileStatus?.toUpperCase() || 'Unknown'}</span></p>
                  <p><strong>Tile Index:</strong> ${props?.tileIndex + 1 || 'N/A'}</p>
                  <p><strong>Risk Level:</strong> ${props?.riskLevel || 0}</p>
                  <p><strong>Distance to Sensor:</strong> ${props?.distanceToSensor || 0}m</p>
                  <p><strong>Grid Cell Size:</strong> ${props?.boxSizeMeters || 30}m × ${props?.boxSizeMeters || 30}m</p>
                  <p><strong>Tile Centroid:</strong> ${tileCentroidText}</p>
                  <p><strong>Cell Centroid:</strong> ${centroidLat.toFixed(6)}, ${centroidLng.toFixed(6)}</p>
                </div>
              `)
                        .addTo(map)
                }
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
    }, [])

    const toggleLayer = (id: string, visible: boolean) => {
        if (mapRef.current) {
            // Fixed visibility logic
            const visibility = visible ? 'visible' : 'none'
            mapRef.current.setLayoutProperty(id, 'visibility', visibility)
        }
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
                    toggleLayer('pixelated-overlay', newShowPixelatedOverlay)
                    // Only toggle pixelated-outline if it exists
                    if (mapRef.current && mapRef.current.getLayer('pixelated-outline')) {
                        toggleLayer('pixelated-outline', newShowPixelatedOverlay)
                    }
                    setShowPixelatedOverlay(newShowPixelatedOverlay)
                }}
                showWaterAreas={showWaterAreas}
                show3DBuildings={show3DBuildings}
                showPixelatedOverlay={showPixelatedOverlay}
            />

            <Legend />
            <div id="map-container" ref={mapContainerRef} />
        </>
    )
}

export default MapView