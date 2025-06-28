import React, { useEffect } from 'react';
import { useEvacuationRoutes, EvacuationRoute } from '../../hooks/useEvacuationRoutes';
import { Loader2 } from 'lucide-react';

interface EvacuationRoutesProps {
    isVisible: boolean;
    onClose: () => void;
    currentLocation: {
        latitude: number;
        longitude: number;
    } | null;
}

export const EvacuationRoutes: React.FC<EvacuationRoutesProps> = ({ isVisible, onClose, currentLocation }) => {
    const { routes, isLoading, error, fetchEvacuationRoutes } = useEvacuationRoutes();

    useEffect(() => {
        if (isVisible && currentLocation) {
            fetchEvacuationRoutes(currentLocation.latitude, currentLocation.longitude);
        }
    }, [isVisible, currentLocation]);

    if (!isVisible) return null;

    return (
        <div className="mt-4 bg-white rounded-lg shadow-lg border-l-8 border-l-[#066AAA] overflow-hidden">
            <div className="px-4 flex items-center justify-between">
                <div className="flex items-center text-slate-700">
                    <h3 className="text-lg font-semibold">Evacuation Routes</h3>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="p-4">
                {isLoading ? (
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                ) : error ? (
                    <div className="text-center text-red-600 p-4">
                        <p>Error loading evacuation routes: {error}</p>
                    </div>
                ) : !currentLocation ? (
                    <div className="text-center text-gray-500 p-4">
                        Please enter a location to see evacuation routes
                    </div>
                ) : (
                    <div className="space-y-3">
                        {routes.map((route, index) => (
                            <div key={index} className="bg-blue-50 p-4 rounded-lg hover:bg-blue-100 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-semibold text-gray-800">{route.name}</h4>
                                        <p className="text-sm text-gray-600 mt-1">{route.destination}</p>
                                    </div>
                                    <div className="flex items-center text-gray-500">
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-sm">{route.walkTime}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};