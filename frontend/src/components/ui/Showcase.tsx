import React from 'react';
import BantayBlue from '../../assets/GUMAGALAW.svg';
import solution from '../../assets/our-solution.png';
import problem from '../../assets/the-problem.png';
// import waterMonitor from '../../assets/water-monitor.png';

const Showcase: React.FC = () => {
    return (
        <div className="min-h-screen bg-white relative overflow-hidden">
            {/* Wave icon */}
            <div className="flex justify-center pt-16 mb-8">
                {/*<BantayBlue/>*/}
                <img src={BantayBlue} className="w-[10vw]" alt="bantay logo"/>
            </div>

            {/* Main heading */}
            <div className="text-center px-8 mb-12">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-800 leading-tight mb-6 geo-medium">
                    Transforming Flood Response<br />
                    Through Predictive Intelligence
                </h1>
                <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                    For the 13 million residents of Metro Manila's flood-prone communities—as well as
                    emergency responders and local government officials—BANTAY offers a smarter, faster
                    way to prepare for floods.
                </p>
            </div>

            {/* Flood Prediction Section */}
            <div className="px-8 py-16">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-800 mb-6 geo-medium">
                        Stay ahead of the floods.
                    </h2>
                    <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
                        Real-time flood predictions and evacuation routes for Metro Manila
                    </p>
                </div>

                {/* Problem and Solution Cards */}
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8">
                    {/* The Problem We Solve Card */}
                    <div className="relative rounded-3xl  overflow-hidden group">
                        {/* Background Image */}
                        <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-slate-800">
                            <img src={problem} alt={"Flooding"} />
                            {/* Simulated aerial flood view */}
                            <div className="absolute inset-0 opacity-30">
                                <div className="h-full w-full bg-gradient-to-br from-blue-900 via-slate-700 to-slate-900"></div>
                                {/* Overlay pattern to simulate flood imagery */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                            </div>
                        </div>

                        {/*<div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30 w-full">
*/}

                        {/* Card Content */}
                        <div className="relative z-10 p-8 md:p-12 h-80 flex flex-col justify-between">
                            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 geo-medium">
                                The Problem<br />We Solve
                            </h3>
                            <p className="text-white/90 text-sm md:text-base leading-relaxed">
                                Metro Manila's 13 million residents face deadly flooding from the Pasig-Marikina-Tullahan River Basin. Current systems only react after floods begin, leaving communities vulnerable and unprepared.
                            </p>
                        </div>
                    </div>

                    {/* Our Solution Card */}
                    <div className="relative rounded-3xl overflow-hidden group">
                        {/* Background Image */}
                        <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-blue-700">
                            <img src={solution}/>
                            {/* Simulated emergency response/monitoring imagery */}
                            <div className="absolute inset-0 opacity-40">
                                <div className="h-full w-full bg-gradient-to-br from-blue-800 via-slate-600 to-slate-800"></div>
                                {/* Overlay pattern to simulate monitoring/response imagery */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                            </div>
                        </div>

                        {/* Card Content */}
                        <div className="relative z-10 p-8 md:p-12 h-80 flex flex-col justify-between">
                            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 geo-medium">
                                Our Solution
                            </h3>
                            <p className="text-white/90 text-sm md:text-base leading-relaxed">
                                BANTAY transforms existing PAGASA sensor data into live flood predictions and evacuation guidance, shifting from reactive bulletins to proactive community intelligence.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Showcase;