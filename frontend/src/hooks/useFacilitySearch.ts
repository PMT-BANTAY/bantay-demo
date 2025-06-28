import { useState } from 'react';

interface Facility {
    id: string;
    title: string;
    distance: number;
    distance_text: string;
    category: string;
    tag: string;
    color: string;
    bgColor: string;
    latitude: number;
    longitude: number;
}

interface SearchResponse {
    status: string;
    timestamp: string;
    total_facilities: number;
    facilities: Facility[];
}

export const useFacilitySearch = () => {
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const searchFacilities = async (latitude: number, longitude: number, maxDistance: number = 5000) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('http://localhost:8000/nearest-facilities/', {
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
                throw new Error('Failed to fetch facilities');
            }

            const data: SearchResponse = await response.json();
            setFacilities(data.facilities);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            setFacilities([]);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        facilities,
        isLoading,
        error,
        searchFacilities
    };
}; 