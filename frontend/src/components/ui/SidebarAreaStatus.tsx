import React from 'react';
import flood from '../../assets/flood.svg';
import droplet from '../../assets/dropley.svg';
import { useSensor } from '../../context/SensorContext';

export const SidebarAreaStatus: React.FC = () => {
    const { selectedSensor } = useSensor();

    const getStatusColor = (status: string | undefined) => {
        switch (status) {
            case 'critical':
                return 'bg-red-100 text-red-800';
            case 'alarm':
                return 'bg-orange-100 text-orange-800';
            case 'alert':
                return 'bg-yellow-100 text-yellow-800';
            case 'normal':
            default:
                return 'bg-green-100 text-green-800';
        }
    };

    const getStatusText = (status: string | undefined) => {
        return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Normal';
    };

    return (
        <div className="m-8">
            <h2 className="text-xl font-bold text-[#066AAA] text-center mb-5">
                Sensor Status: {selectedSensor?.sensor}
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white border border-slate-200 rounded-xl p-5 text-center shadow-sm">
                    <div className="text-xs text-slate-500 font-medium mb-4 uppercase tracking-wide">
                        Water Level
                    </div>
                    <div className="flex justify-center mb-4">
                        <img src={droplet} alt="droplet" className="w-20" />
                    </div>
                    <div className="text-sm font-medium mb-2">
                        {selectedSensor ? (
                            <span className="text-lg font-bold text-blue-600">
                                {selectedSensor.water_level?.toFixed(2)}m
                            </span>
                        ) : (
                            <span className="text-gray-500">No sensor selected</span>
                        )}
                    </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5 text-center shadow-sm">
                    <div className="text-xs text-slate-500 font-medium mb-4 uppercase tracking-wide">
                        Status
                    </div>
                    <div className="flex justify-center mb-4">
                        <img src={flood} alt="flood" className="w-20" />
                    </div>
                    <div className={`text-xs font-semibold px-3 py-1.5 rounded-full ${getStatusColor(selectedSensor?.status)} uppercase tracking-wide`}>
                        {selectedSensor ? getStatusText(selectedSensor.status) : 'No Sensor Selected'}
                    </div>
                </div>
            </div>
        </div>
    );
};