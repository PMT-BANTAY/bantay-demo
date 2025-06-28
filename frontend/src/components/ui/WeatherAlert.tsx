import React, { useEffect } from 'react';
import { useWaterAlerts, WaterAlert } from '../../hooks/useWaterAlerts';
import { Loader2 } from 'lucide-react';

interface WeatherAlertsProps {
    isVisible: boolean;
    onClose: () => void;
}

export const WeatherAlerts: React.FC<WeatherAlertsProps> = ({ isVisible, onClose }) => {
    const { alerts, isLoading, error, fetchWaterAlerts } = useWaterAlerts();

    useEffect(() => {
        if (isVisible) {
            fetchWaterAlerts();
        }
    }, [isVisible]);

    if (!isVisible) return null;

    return (
        <div className="mt-4 bg-white rounded-lg shadow-lg border-l-8 border-l-[#066AAA] overflow-hidden">
            <div className="px-4 flex items-center justify-between">
                <div className="flex items-center text-slate-700">
                    <h3 className="text-lg font-semibold">Water Level Alerts</h3>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="p-4">
                {isLoading ? (
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                ) : error ? (
                    <div className="text-center text-red-600 p-4">
                        <p>Error loading water alerts: {error}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {alerts.map((alert, index) => (
                            <div 
                                key={index} 
                                className={`p-4 rounded-lg transition-colors ${
                                    alert.status === 'CRITICAL' ? 'bg-red-50' :
                                    alert.status === 'WARNING' ? 'bg-orange-50' :
                                    alert.status === 'ALERT' ? 'bg-yellow-50' :
                                    'bg-green-50'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-semibold text-gray-800">{alert.name}</h4>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Water Level: {alert.water_level.toFixed(2)} m
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 rounded text-xs font-medium ${
                                            alert.status === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                                            alert.status === 'WARNING' ? 'bg-orange-100 text-orange-800' :
                                            alert.status === 'ALERT' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-green-100 text-green-800'
                                        }`}>
                                            {alert.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};