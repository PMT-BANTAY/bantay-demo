// import React from 'react';
// import FeatBg from '../../assets/feature-bg.svg';
import WaterLevel from '../../assets/water-level.png';
import WaterMonitor from '../../assets/water-monitor.png';
import Email from '../../assets/pic-email.jpg';
import Evacuation from '../../assets/evacuation.png';

const SystemHighlights = () => {
    return (
        <div className="relative min-h-screen w-full overflow-hidden px-28">
            {/* Full viewport background with gradient fallback */}
            <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-[#9CDAF3] via-[#229AE7] to-white">
                {/*/!* You can uncomment this when you have the SVG available *!/*/}
                {/*<img*/}
                {/*    src={FeatBg}*/}
                {/*    alt="Feature Image"*/}
                {/*    className="absolute inset-0 w-full h-full object-cover object-center"*/}
                {/*/>*/}
            </div>

            {/* Content wrapper with proper centering and z-index */}
            <div className="relative z-10 w-full h-full">
                <div className="container mx-auto px-4 py-8 h-full">
                    {/* Features Grid - Responsive layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-8 w-full h-full">
                        {/* Left Column */}
                        <div className="space-y-8 w-full pt-32">
                            {/* Interactive Flood Map */}
                            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30 w-full">
                                <div className="mb-4">
                                    <div className="bg-white rounded-lg h-64 mb-4 relative z-20 overflow-hidden">
                                        <img src={WaterMonitor} alt={"Water Monitor"} className="w-full h-full object-cover rounded-lg" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2 arame">INTERACTIVE FLOOD MAP</h3>
                                <p className="text-white/90 text-sm leading-relaxed">
                                    Real-time colored mesh grid showing current flood propagation
                                    based on water level monitoring data
                                </p>
                            </div>

                            {/* Evacuation Routing Card */}
                            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30 w-full">
                                <div className="bg-white rounded-lg h-64 mb-4 relative z-20 overflow-hidden">
                                    <img src={Evacuation} alt={"Evacuation"} className="w-full h-full object-cover rounded-lg" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2 arame">EVACUATION ROUTING</h3>
                                <p className="text-white/90 text-sm leading-relaxed">
                                    Dynamic pathfinding to nearest safe evacuation centers based on
                                    current flood conditions
                                </p>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-8 w-full">
                            {/* Header moved to right column */}
                            <div className="text-right pt-8 mb-8">
                                <h1 className="text-7xl font-bold text-white mb-2 geo-medium">System</h1>
                                <h1 className="text-7xl font-bold text-white geo-medium">Highlights</h1>
                            </div>

                            {/* Alert System */}
                            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30 w-full">
                                <div className="bg-white rounded-lg h-64 mb-4 relative z-20 overflow-hidden">
                                    <img src={Email} alt={"email update"} className="w-full h-full object-cover rounded-lg" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2 arame">ALERT SYSTEM</h3>
                                <p className="text-white/90 text-sm leading-relaxed">
                                    Automated notifications and warnings sent to residents
                                    in affected areas via multiple channels
                                </p>
                            </div>

                            {/* Water Level Monitoring */}
                            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30 w-full">
                                <div className="bg-white rounded-lg h-64 mb-4 relative z-20 overflow-hidden">
                                    <img src={WaterLevel} alt="Water Level" className="w-full h-full object-cover rounded-lg"/>
                                </div>

                                <h3 className="text-lg font-bold text-white mb-2 arame">WATER LEVEL MONITORING</h3>
                                <p className="text-white/90 text-sm leading-relaxed">
                                    Real-time sensor data from multiple monitoring stations
                                    across the flood-prone areas
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemHighlights;