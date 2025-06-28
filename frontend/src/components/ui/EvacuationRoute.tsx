import React, { useEffect } from 'react';
import { useEvacuationRoutes } from '../../hooks/useEvacuationRoutes';
import { useEvacuation } from '../../context/EvacuationContext';
import { Loader2, MapPin, Clock, ArrowRight } from 'lucide-react';
import type { Map as MapboxMap } from 'mapbox-gl';

interface EvacuationRoutesProps {
    isVisible: boolean;
    onClose: () => void;
    currentLocation: {
        latitude: number;
        longitude: number;
    } | null;
    map: MapboxMap | null;
}

export const EvacuationRoutes: React.FC<EvacuationRoutesProps> = ({ isVisible, onClose, currentLocation, map }) => {
    const { routes, isLoading, error, fetchEvacuationRoutes, getRouteDirections } = useEvacuationRoutes();
    const { selectedRoute, setSelectedRoute, setRouteGeometry } = useEvacuation();

    useEffect(() => {
        if (isVisible && currentLocation && map) {
            fetchEvacuationRoutes(currentLocation.latitude, currentLocation.longitude, map);
        }
    }, [isVisible, currentLocation, map]);

    const handleRouteSelect = async (route: typeof routes[0]) => {
        if (!map) return;

        try {
            // If clicking the same route, deselect it
            if (selectedRoute?.id === route.id) {
                setSelectedRoute(null);
                setRouteGeometry(null);
                return;
            }

            setSelectedRoute(route);
            const geometry = await getRouteDirections(route, map);
            setRouteGeometry(geometry);
        } catch (error) {
            console.error('Error selecting route:', error);
        }
    };

    if (!isVisible) return null;

    return (
        <div className="mt-4 bg-white rounded-lg shadow-lg border-l-8 border-l-[#066AAA] overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
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
                        {routes.map((route) => (
                            <button
                                key={route.id}
                                onClick={() => handleRouteSelect(route)}
                                className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                                    selectedRoute?.id === route.id
                                        ? 'bg-blue-100 border-2 border-blue-500'
                                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                            <MapPin className="h-4 w-4 text-blue-600" />
                                            <h4 className="font-semibold text-gray-800">{route.name}</h4>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1 ml-6">{route.destination}</p>
                                        <div className="flex items-center space-x-4 mt-2 ml-6">
                                            <div className="flex items-center text-gray-500">
                                                <Clock className="h-4 w-4 mr-1" />
                                                <span className="text-sm">{route.walkTime}</span>
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {route.distance}
                                            </div>
                                        </div>
                                    </div>
                                    <ArrowRight className={`h-5 w-5 transform transition-transform ${
                                        selectedRoute?.id === route.id ? 'rotate-90 text-blue-600' : 'text-gray-400'
                                    }`} />
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};