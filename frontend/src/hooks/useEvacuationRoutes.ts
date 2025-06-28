import { useState } from 'react';

interface RouteCoordinates {
    start: {
        lat: number;
        lng: number;
    };
    end: {
        lat: number;
        lng: number;
    };
}

export interface EvacuationRoute {
    name: string;
    destination: string;
    walkTime: string;
    coordinates: RouteCoordinates;
}

interface EvacuationResponse {
    status: string;
    timestamp: string;
    routes: EvacuationRoute[];
}

export const useEvacuationRoutes = () => {
    const [routes, setRoutes] = useState<EvacuationRoute[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchEvacuationRoutes = async (latitude: number, longitude: number, maxDistance: number = 5000) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('http://localhost:8000/evacuation-routes/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    latitude,
                    longitude,
                    max_distance: maxDistance
                })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch evacuation routes');
            }

            const data: EvacuationResponse = await response.json();
            setRoutes(data.routes);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            setRoutes([]);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        routes,
        isLoading,
        error,
        fetchEvacuationRoutes
    };
}; 