import { useState } from 'react';

export const useEmergencyHandlers = () => {
    const [showEmergencyContacts, setShowEmergencyContacts] = useState(false);
    const [showEvacuationRoutes, setShowEvacuationRoutes] = useState(false);
    const [showWeatherAlerts, setShowWeatherAlerts] = useState(false);

    const handleEmergencyCall = () => {
        // close other panels first
        setShowEvacuationRoutes(false);
        setShowWeatherAlerts(false);
        // toggle emergency contacts
        setShowEmergencyContacts(prev => !prev);
    };

    const handleEvacuation = () => {
        // close other panels first
        setShowEmergencyContacts(false);
        setShowWeatherAlerts(false);
        // toggle evacuation routes
        setShowEvacuationRoutes(prev => !prev);
    };

    const handleWeather = () => {
        // close other panels first
        setShowEmergencyContacts(false);
        setShowEvacuationRoutes(false);
        // toggle weather alerts
        setShowWeatherAlerts(prev => !prev);
    };

    const closeEmergencyContacts = () => setShowEmergencyContacts(false);
    const closeEvacuationRoutes = () => setShowEvacuationRoutes(false);
    const closeWeatherAlerts = () => setShowWeatherAlerts(false);

    return {
        // state
        showEmergencyContacts,
        showEvacuationRoutes,
        showWeatherAlerts,

        // handlers
        handleEmergencyCall,
        handleEvacuation,
        handleWeather,

        // close functions
        closeEmergencyContacts,
        closeEvacuationRoutes,
        closeWeatherAlerts
    };
};