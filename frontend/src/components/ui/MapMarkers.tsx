import { useEffect } from 'react'
import mapboxgl, { Map } from 'mapbox-gl'

// Define proper types
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

interface MapMarkersProps {
    map: Map | null;
    sensorsData: Sensor[];
    onSensorSelect: (sensor: Sensor) => void;
}

export const MapMarkers = ({ map, sensorsData, onSensorSelect }: MapMarkersProps) => {
    useEffect(() => {
        if (!map || sensorsData.length === 0) return;

        // Store markers to clean up later
        const markers: mapboxgl.Marker[] = [];

        sensorsData.forEach((sensor) => {
            const [lat, lng] = sensor.centroid;
            const { sensor: sensorName, status } = sensor;

            // Determine marker color based on status
            const statusColors = {
                'normal': '#00ff00',   // Green
                'alert': '#ffff00',    // Yellow
                'alarm': '#ff8800',    // Orange
                'critical': '#ff0000'  // Red
            };
            const markerColor = statusColors[status as keyof typeof statusColors] || '#00ff00';

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
            `;

            // Create custom marker element - slightly larger for better visibility
            const markerElement = document.createElement('div');
            markerElement.className = 'sensor-marker';
            markerElement.style.cssText = `
                width: 16px;
                height: 16px;
                background-color: ${markerColor};
                border: 3px solid white;
                border-radius: 50%;
                cursor: pointer;
                box-shadow: 0 3px 6px rgba(0,0,0,0.4);
                z-index: 1000;
            `;

            const marker = new mapboxgl.Marker({ element: markerElement })
                .setLngLat([lng, lat])
                .setPopup(new mapboxgl.Popup().setHTML(popupContent))
                .addTo(map);

            // Add click handler to update selected sensor
            markerElement.addEventListener('click', () => {
                onSensorSelect(sensor);
            });

            markers.push(marker);
        });

        // Cleanup function to remove markers when component unmounts or data changes
        return () => {
            markers.forEach(marker => marker.remove());
        };
    }, [map, sensorsData, onSensorSelect]);

    return null; // This component doesn't render anything itself
};

export default MapMarkers;