import React, { createContext, useContext, useState } from 'react';

export interface Sensor {
    sensor: string;
    status: 'normal' | 'alert' | 'alarm' | 'critical';
    water_level?: number;
    alert?: number;
    alarm?: number;
    critical?: number;
    centroid: [number, number];
}

interface SensorContextType {
    selectedSensor: Sensor | null;
    setSelectedSensor: (sensor: Sensor | null) => void;
}

const SensorContext = createContext<SensorContextType | undefined>(undefined);

export const SensorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);

    return (
        <SensorContext.Provider value={{ selectedSensor, setSelectedSensor }}>
            {children}
        </SensorContext.Provider>
    );
};

export const useSensor = () => {
    const context = useContext(SensorContext);
    if (context === undefined) {
        throw new Error('useSensor must be used within a SensorProvider');
    }
    return context;
}; 