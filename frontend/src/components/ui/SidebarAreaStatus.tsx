import React from 'react';
import flood from '../../assets/flood.svg';
import droplet from '../../assets/dropley.svg';

export const SidebarAreaStatus: React.FC = () => {
    return (
        <div className="m-8">
            <h2 className="text-xl font-bold text-[#066AAA] text-center mb-5">
                Your Area's Status
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white border border-slate-200 rounded-xl p-5 text-center shadow-sm">
                    <div className="text-xs text-slate-500 font-medium mb-4 uppercase tracking-wide">
                        Water Level
                    </div>
                    <div className="flex justify-center mb-4">
                        <img src={droplet} alt="droplet" className="w-20" />
                    </div>
                    <div className="text-xs font-semibold px-3 py-1.5 rounded-full bg-green-100 text-green-800 uppercase tracking-wide">
                        Normal
                    </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5 text-center shadow-sm">
                    <div className="text-xs text-slate-500 font-medium mb-4 uppercase tracking-wide">
                        Flood Hazard
                    </div>
                    <div className="flex justify-center mb-4">
                        <img src={flood} alt="flood" className="w-20" />
                    </div>
                    <div className="text-xs font-semibold px-3 py-1.5 rounded-full bg-green-100 text-green-800 uppercase tracking-wide">
                        No Flooding
                    </div>
                </div>
            </div>
        </div>
    );
};