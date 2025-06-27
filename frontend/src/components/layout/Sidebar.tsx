import { useState } from 'react';
import bantayGrad from '../../assets/bantay-grad.svg';
import locIcon from '../../assets/loc-icon.svg';
import search from '../../assets/search-blue.svg';
import { SidebarHeader } from '../ui/SidebarHeader';
import { SidebarContent } from '../ui/SidebarContent';

type Props = {
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
};

const Sidebar = ({
                     currentCoords,
                     resetView,
                     toggle3D,
                     toggleWaterAreas,
                     toggle3DBuildings,
                     togglePixelatedOverlay,
                     showWaterAreas,
                     show3DBuildings,
                     showPixelatedOverlay
                 }: Props) => {
    const [location, setLocation] = useState('Caniogan, Pasig City');
    const [mapControlsExpanded, setMapControlsExpanded] = useState(false);

    const handleEmergencyCall = () => {
        window.open('tel:911', '_self');
    };

    const handleEvacuation = () => {
        console.log('Showing evacuation routes...');
    };

    const handleWeather = () => {
        console.log('Showing weather information...');
    };

    const handleLocationSearch = () => {
        console.log('Searching for location:', location);
    };

    const toggleMapControls = () => {
        setMapControlsExpanded(!mapControlsExpanded);
    };

    // Custom scrollbar styles
    const scrollbarStyles = {
        '::-webkit-scrollbar': {
            width: '6px',
        },
        '::-webkit-scrollbar-track': {
            background: '#f1f5f9',
        },
        '::-webkit-scrollbar-thumb': {
            background: '#cbd5e1',
            borderRadius: '3px',
        },
        '::-webkit-scrollbar-thumb:hover': {
            background: '#94a3b8',
        },
        // Firefox scrollbar styling
        scrollbarWidth: 'thin',
        scrollbarColor: '#cbd5e1 #f1f5f9',
    };

    return (
        <div
            className="fixed top-0 left-0 w-[60vh] h-screen bg-slate-50 text-slate-800 shadow-[2px_0_10px_rgba(0,0,0,0.1)] z-[1000] overflow-y-auto border-r border-slate-200"
            style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                ...scrollbarStyles
            }}
        >
            <SidebarHeader
                location={location}
                setLocation={setLocation}
                handleEmergencyCall={handleEmergencyCall}
                handleEvacuation={handleEvacuation}
                handleWeather={handleWeather}
                handleLocationSearch={handleLocationSearch}
                bantayGrad={bantayGrad}
                locIcon={locIcon}
                search={search}
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