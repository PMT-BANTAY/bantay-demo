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
        <div className=" p-6 pb-5">

            {/* Map Controls Section */}
            <div className="pt-5 border-t border-slate-200">
                <div
                    className="text-base font-semibold text-slate-800 mb-4 flex items-center cursor-pointer select-none"
                    onClick={toggleMapControls}
                >
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