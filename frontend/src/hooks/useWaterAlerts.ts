import { useState } from 'react';

export interface WaterAlert {
    name: string;
    water_level: number;
    status: 'CRITICAL' | 'WARNING' | 'ALERT' | 'NORMAL';
    color: string;
    timestamp: string;
    location: {
        latitude: number;
        longitude: number;
    };
}

interface AlertResponse {
    status: string;
    timestamp: string;
    alerts: WaterAlert[];
}

export const useWaterAlerts = () => {
    const [alerts, setAlerts] = useState<WaterAlert[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchWaterAlerts = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('http://localhost:8000/high-water-alerts/');

            if (!response.ok) {
                throw new Error('Failed to fetch water alerts');
            }

            const data: AlertResponse = await response.json();
            setAlerts(data.alerts);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            setAlerts([]);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        alerts,
        isLoading,
        error,
        fetchWaterAlerts
    };
}; 