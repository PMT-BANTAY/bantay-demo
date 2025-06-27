import React from 'react';

interface SidebarContentProps {
    currentCoords: {
        lng: number;
        lat: number;
        zoom: number;
    };
    mapControlsExpanded: boolean;
    toggleMapControls: () => void;
    resetView: () => void;
    toggle3D: () => void;
    toggleWaterAreas: () => void;
    toggle3DBuildings: () => void;
    togglePixelatedOverlay: () => void;
    showWaterAreas: boolean;
    show3DBuildings: boolean;
    showPixelatedOverlay: boolean;
}

export const SidebarContent: React.FC<SidebarContentProps> = ({
                                                                  currentCoords,
                                                                  mapControlsExpanded,
                                                                  toggleMapControls,
                                                                  resetView,
                                                                  toggle3D,
                                                                  toggleWaterAreas,
                                                                  toggle3DBuildings,
                                                                  togglePixelatedOverlay,
                                                                  showWaterAreas,
                                                                  show3DBuildings,
                                                                  showPixelatedOverlay
                                                              }) => {
    const facilities = [
        {
            title: "Fire Station 1",
            distance: "0.8 km",
            type: "fire",
            typeLabel: "Fire"
        },
        {
            title: "Barangay Hall",
            distance: "0.3 km",
            type: "barangay",
            typeLabel: "Barangay"
        },
        {
            title: "Emergency Center",
            distance: "1.2 km",
            type: "evacuation",
            typeLabel: "Evacuation"
        },
        {
            title: "Elementary School",
            distance: "0.5 km",
            type: "school",
            typeLabel: "School"
        },
        {
            title: "Health Center",
            distance: "0.7 km",
            type: "health",
            typeLabel: "Health"
        }
    ];

    const getFacilityTypeStyles = (type: string) => {
        const styles = {
            fire: "bg-red-50 text-red-600",
            barangay: "bg-blue-50 text-blue-600",
            evacuation: "bg-slate-50 text-slate-600",
            school: "bg-yellow-50 text-yellow-600",
            health: "bg-green-50 text-green-600"
        };
        return styles[type as keyof typeof styles] || "bg-gray-50 text-gray-600";
    };

    const ToggleSwitch = ({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) => (
        <div
            className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-md mb-2 cursor-pointer transition-all duration-200 hover:bg-slate-100 hover:border-slate-300"
            onClick={onClick}
        >
            <span className="text-sm font-medium text-slate-600">{label}</span>
            <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors duration-200 ${active ? 'bg-sky-500' : 'bg-slate-300'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 shadow-sm ${active ? 'translate-x-5 left-0.5' : 'left-0.5'}`} />
            </div>
        </div>
    );

    return (
        <div className="p-6 pb-5">
            {/* Status Section */}
            <div className="mb-8">
                <h2 className="text-xl font-bold text-[#066AAA] text-center mb-5">
                    Your Area's Status
                </h2>
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-white border border-slate-200 rounded-xl p-5 text-center shadow-sm">
                        <div className="text-xs text-slate-500 font-medium mb-4 uppercase tracking-wide">
                            Water Level
                        </div>
                        <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-full bg-blue-50 text-sky-500 text-2xl">
                            💧
                        </div>
                        <div className="text-xs font-semibold px-3 py-1.5 rounded-full bg-green-100 text-green-800 uppercase tracking-wide">
                            Normal
                        </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-5 text-center shadow-sm">
                        <div className="text-xs text-slate-500 font-medium mb-4 uppercase tracking-wide">
                            Flood Hazard
                        </div>
                        <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-full bg-blue-50 text-sky-500 text-2xl">
                            🌊
                        </div>
                        <div className="text-xs font-semibold px-3 py-1.5 rounded-full bg-green-100 text-green-800 uppercase tracking-wide">
                            No Flooding
                        </div>
                    </div>
                </div>
            </div>

            {/* Facilities Section */}
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-800 text-center mb-5">
                    Nearby Facilities
                </h2>
                {facilities.map((facility, index) => (
                    <div key={index} className="flex items-center p-3 bg-white border border-slate-200 rounded-lg mb-2 shadow-sm">
                        <div className="flex-1">
                            <div className="text-sm font-medium text-slate-800 mb-1">
                                {facility.title}
                            </div>
                            <div className="text-xs text-slate-500">
                                {facility.distance}
                            </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium uppercase tracking-wide ${getFacilityTypeStyles(facility.type)}`}>
                            {facility.typeLabel}
                        </div>
                    </div>
                ))}
            </div>

            {/* Map Controls Section */}
            <div className="mt-6 pt-5 border-t border-slate-200">
                <div
                    className="text-base font-semibold text-slate-800 mb-4 flex items-center cursor-pointer select-none"
                    onClick={toggleMapControls}
                >
                    <span className="mr-2 text-lg">🗺️</span>
                    Map Controls
                    <span className={`ml-auto text-xs text-slate-500 transition-transform duration-200 ${mapControlsExpanded ? 'rotate-180' : ''}`}>
                        ▼
                    </span>
                </div>

                {mapControlsExpanded && (
                    <div className="animate-[slideDown_0.3s_ease-out]">
                        {/* View Controls */}
                        <div className="mb-4">
                            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                                View Controls
                            </div>
                            <button
                                onClick={resetView}
                                className="w-full p-2.5 mb-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-md cursor-pointer text-sm font-medium transition-all duration-200 flex items-center justify-between hover:bg-slate-100 hover:border-slate-300 active:bg-slate-200"
                            >
                                Reset View
                            </button>
                            <button
                                onClick={toggle3D}
                                className="w-full p-2.5 mb-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-md cursor-pointer text-sm font-medium transition-all duration-200 flex items-center justify-between hover:bg-slate-100 hover:border-slate-300 active:bg-slate-200"
                            >
                                Toggle 3D
                            </button>
                        </div>

                        {/* Layer Controls */}
                        <div className="mb-4">
                            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                                Layer Controls
                            </div>
                            <ToggleSwitch
                                active={showWaterAreas}
                                onClick={toggleWaterAreas}
                                label="Water Areas"
                            />
                            <ToggleSwitch
                                active={show3DBuildings}
                                onClick={toggle3DBuildings}
                                label="3D Buildings"
                            />
                            <ToggleSwitch
                                active={showPixelatedOverlay}
                                onClick={togglePixelatedOverlay}
                                label="Pixelated Overlay"
                            />
                        </div>

                        {/* Coordinates Display */}
                        <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 mb-4" style={{ fontFamily: 'SF Mono, Monaco, "Cascadia Code", monospace' }}>
                            <div className="text-xs font-semibold text-sky-500 uppercase tracking-wide mb-2">
                                Current Coordinates
                            </div>
                            <div className="flex justify-between items-center text-sm mb-1 text-slate-600">
                                <div className="font-medium">Longitude:</div>
                                <div className="font-semibold text-slate-800">{currentCoords.lng.toFixed(6)}</div>
                            </div>
                            <div className="flex justify-between items-center text-sm mb-1 text-slate-600">
                                <div className="font-medium">Latitude:</div>
                                <div className="font-semibold text-slate-800">{currentCoords.lat.toFixed(6)}</div>
                            </div>
                            <div className="flex justify-between items-center text-sm text-slate-600">
                                <div className="font-medium">Zoom:</div>
                                <div className="font-semibold text-slate-800">{currentCoords.zoom.toFixed(2)}</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};