// Type definitions for better type safety
interface Sensor {
    centroid: [number, number]; // [lat, lng]
    status: 'alert' | 'alarm' | 'critical';
    sensor: string;
    tiles: Tile[];
}

interface Tile {
    centroid: [number, number]; // [lat, lng]
    status: 'alert' | 'alarm' | 'critical';
}

interface GridFeature {
    type: 'Feature';
    geometry: {
        type: 'Polygon';
        coordinates: number[][][];
    };
    properties: {
        sensorId: string;
        sensorStatus: string;
        tileStatus: string;
        tileIndex: number;
        riskLevel: number;
        distanceToSensor: number;
        boxSizeMeters: number;
        tileCentroid: [number, number];
        sensorCentroid: [number, number];
        statusColor: string;
    };
}

export const metersToDegrees = (meters: number, latitude: number) => {
    const metersPerDegreeLat = 111320
    const metersPerDegreeLng = 111320 * Math.cos(latitude * Math.PI / 180)
    return {
        lat: meters / metersPerDegreeLat,
        lng: meters / metersPerDegreeLng
    }
}

export const calculateDistanceInMeters = (
    lng1: number,
    lat1: number,
    lng2: number,
    lat2: number
): number => {
    const R = 6371000 // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

// Status to numeric mapping for visualization
const statusToNumeric: Record<string, number> = {
    'alert': 1,
    'alarm': 2,
    'critical': 3
}

const statusToColor: Record<string, string> = {
    'alert': '#ffff00',    // Yellow
    'alarm': '#ff8800',    // Orange
    'critical': '#ff0000'  // Red
}

export const createSensorVicinityGrid = (sensorsData: Sensor[]): GeoJSON.FeatureCollection => {
    const features: GridFeature[] = []
    const boxSizeMeters = 30 // 30m grid cells
    let totalTilesProcessed = 0

    // Validate input data
    if (!Array.isArray(sensorsData) || sensorsData.length === 0) {
        console.warn('No sensor data provided to createSensorVicinityGrid')
        return {
            type: 'FeatureCollection',
            features: []
        }
    }

    sensorsData.forEach((sensor) => {
        // Validate sensor data structure
        if (!sensor || !sensor.centroid || !Array.isArray(sensor.centroid) || sensor.centroid.length !== 2) {
            console.warn('Invalid sensor centroid data:', sensor)
            return
        }

        if (!sensor.tiles || !Array.isArray(sensor.tiles)) {
            console.warn('Invalid sensor tiles data:', sensor)
            return
        }

        const sensorCentroid = sensor.centroid
        const sensorStatus = sensor.status || 'alert'
        const sensorName = sensor.sensor || 'Unknown Sensor'
        const sensorTileCount = sensor.tiles.length

        console.log(`Processing sensor "${sensorName}" with ${sensorTileCount} tiles - NO LIMIT APPLIED`)

        // Process ALL tiles in the sensor - no limit
        sensor.tiles.forEach((tile: Tile, index: number) => {
            // Validate tile data
            if (!tile || !tile.centroid || !Array.isArray(tile.centroid) || tile.centroid.length !== 2) {
                console.warn('Invalid tile centroid data:', tile, 'for sensor:', sensorName)
                return
            }

            const tileCentroid = tile.centroid
            const tileStatus = tile.status || 'alert'

            // Validate coordinates are numbers
            if (typeof tileCentroid[0] !== 'number' || typeof tileCentroid[1] !== 'number') {
                console.warn('Invalid tile coordinates:', tileCentroid, 'for sensor:', sensorName)
                return
            }

            // Calculate the box size in degrees based on the tile's latitude
            const boxSizeDegrees = metersToDegrees(boxSizeMeters, tileCentroid[0])

            // Create a grid cell around each tile centroid
            const halfBoxLng = boxSizeDegrees.lng / 2
            const halfBoxLat = boxSizeDegrees.lat / 2

            // Center the box on the tile centroid
            const cellLng = tileCentroid[1] - halfBoxLng
            const cellLat = tileCentroid[0] - halfBoxLat

            // Calculate distance from tile to main sensor
            const distanceToSensor = calculateDistanceInMeters(
                tileCentroid[1], tileCentroid[0],
                sensorCentroid[1], sensorCentroid[0]
            )

            // Create the polygon coordinates (GeoJSON format: [lng, lat])
            const coordinates = [
                [cellLng, cellLat], // Bottom-left
                [cellLng + boxSizeDegrees.lng, cellLat], // Bottom-right
                [cellLng + boxSizeDegrees.lng, cellLat + boxSizeDegrees.lat], // Top-right
                [cellLng, cellLat + boxSizeDegrees.lat], // Top-left
                [cellLng, cellLat] // Close the polygon
            ]

            features.push({
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [coordinates]
                },
                properties: {
                    sensorId: sensorName,
                    sensorStatus: sensorStatus,
                    tileStatus: tileStatus,
                    tileIndex: index,
                    riskLevel: statusToNumeric[tileStatus] || 0,
                    distanceToSensor: Math.round(distanceToSensor),
                    boxSizeMeters: boxSizeMeters,
                    tileCentroid: tileCentroid,
                    sensorCentroid: sensorCentroid,
                    statusColor: statusToColor[tileStatus] || '#00ff00'
                }
            })

            totalTilesProcessed++
        })

        console.log(`Completed processing sensor "${sensorName}" - processed ${sensorTileCount} tiles`)
    })

    console.log(`Total tiles processed across all sensors: ${totalTilesProcessed}`)
    console.log(`Total grid features created: ${features.length}`)

    return {
        type: 'FeatureCollection',
        features
    }
}

// Alternative function name to maintain compatibility with existing code
export const createDamVicinityGrid = createSensorVicinityGrid