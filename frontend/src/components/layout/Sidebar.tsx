import React, { useState } from 'react';
import { SidebarHeader } from '../ui/SidebarHeader';
import type { Map as MapboxMap } from 'mapbox-gl';
import bantayGrad from '../../assets/bantay-grad.svg';
import locIcon from '../../assets/loc-icon.svg';
import search from '../../assets/search-blue.svg';
import { SidebarContent } from '../ui/SidebarContent';

interface Props {
    currentCoords: {
        lng: number;
        lat: number;
        zoom: number;
    };
    resetView: () => void;
    toggle3D: () => void;
    toggleWaterAreas: () => void;
    toggle3DBuildings: () => void;
    togglePixelatedOverlay: () => void;
    showWaterAreas: boolean;
    show3DBuildings: boolean;
    showPixelatedOverlay: boolean;
    map: MapboxMap | null;
}

const Sidebar: React.FC<Props> = ({
    currentCoords,
    resetView,
    toggle3D,
    toggleWaterAreas,
    toggle3DBuildings,
    togglePixelatedOverlay,
    showWaterAreas,
    show3DBuildings,
    showPixelatedOverlay,
    map
}) => {
    const [location, setLocation] = useState('');
    const [mapControlsExpanded, setMapControlsExpanded] = useState(false);

    // const handleEmergencyCall = () => {
    //     window.open('tel:911', '_self');
    // };
    //
    // const handleEvacuation = () => {
    //     console.log('Showing evacuation routes...');
    // };
    //
    // const handleWeather = () => {
    //     console.log('Showing weather information...');
    // };

    const handleLocationSearch = () => {
        console.log('Searching for location:', location);
    };

    const toggleMapControls = () => {
        setMapControlsExpanded(!mapControlsExpanded);
    };

    return (
        <div
            className="absolute top-0 left-0 h-full w-[400px] bg-white shadow-lg z-10 overflow-y-auto"
            style={{
                scrollbarWidth: 'thin' as const,
                scrollbarColor: '#CBD5E1 #F1F5F9',
                msOverflowStyle: 'auto'
            }}
        >
            <SidebarHeader
                location={location}
                setLocation={setLocation}
                // handleEmergencyCall={handleEmergencyCall}
                // handleEvacuation={handleEvacuation}
                // handleWeather={handleWeather}
                handleLocationSearch={handleLocationSearch}
                bantayGrad={bantayGrad}
                locIcon={locIcon}
                search={search}
                map={map}
            />
            <SidebarContent
                currentCoords={currentCoords}
                mapControlsExpanded={mapControlsExpanded}
                toggleMapControls={toggleMapControls}
                resetView={resetView}
                toggle3D={toggle3D}
                toggleWaterAreas={toggleWaterAreas}
                toggle3DBuildings={toggle3DBuildings}
                togglePixelatedOverlay={togglePixelatedOverlay}
                showWaterAreas={showWaterAreas}
                show3DBuildings={show3DBuildings}
                showPixelatedOverlay={showPixelatedOverlay}
            />
        </div>
    );
};

export default Sidebar;