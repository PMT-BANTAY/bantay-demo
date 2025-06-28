import React, { createContext, useContext, useState } from 'react';

export interface EvacuationRoute {
    id: string;
    name: string;
    destination: string;
    coordinates: {
        start: [number, number];
        end: [number, number];
    };
    walkTime: string;
    distance: string;
}

interface EvacuationContextType {
    selectedRoute: EvacuationRoute | null;
    setSelectedRoute: (route: EvacuationRoute | null) => void;
    routeGeometry: any | null;  // GeoJSON geometry for the route
    setRouteGeometry: (geometry: any | null) => void;
}

const EvacuationContext = createContext<EvacuationContextType | undefined>(undefined);

export const EvacuationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [selectedRoute, setSelectedRoute] = useState<EvacuationRoute | null>(null);
    const [routeGeometry, setRouteGeometry] = useState<any | null>(null);

    return (
        <EvacuationContext.Provider value={{ 
            selectedRoute, 
            setSelectedRoute,
            routeGeometry,
            setRouteGeometry
        }}>
            {children}
        </EvacuationContext.Provider>
    );
};

export const useEvacuation = () => {
    const context = useContext(EvacuationContext);
    if (context === undefined) {
        throw new Error('useEvacuation must be used within an EvacuationProvider');
    }
    return context;
}; 