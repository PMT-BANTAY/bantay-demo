import React from 'react';


interface WeatherAlert {
    message: string;
    timeAgo: string;
    severity: 'low' | 'medium' | 'high';
}

interface WeatherAlertsProps {
    isVisible: boolean;
    onClose: () => void;
}

const weatherAlerts: WeatherAlert[] = [
    {
        message: "Moderate rainfall expected in the next 2 hours",
        timeAgo: "2 hours ago",
        severity: "medium"
    },
    {
        message: "Flood advisory lifted for Quezon City",
        timeAgo: "6 hours ago",
        severity: "low"
    },
    {
        message: "Weather conditions improving",
        timeAgo: "12 hours ago",
        severity: "low"
    }
];

const getSeverityStyles = (severity: string) => {
    switch (severity) {
        case 'high':
            return 'bg-red-50 border-l-red-400 text-red-800';
        case 'medium':
            return 'bg-yellow-50 border-l-yellow-400 text-yellow-800';
        default:
            return 'bg-blue-50 border-l-blue-400 text-blue-800';
    }
};

const getSeverityIcon = (severity: string) => {
    switch (severity) {
        case 'high':
            return (
                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
            );
        case 'medium':
            return (
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
            );
        default:
            return (
                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
            );
    }
};

export const WeatherAlerts: React.FC<WeatherAlertsProps> = ({ isVisible, onClose }) => {
    if (!isVisible) return null;

    return (
        <div className="mt-4 bg-white rounded-lg shadow-lg border-l-8 border-l-[#066AAA] overflow-hidden">
            <div className=" px-4 flex items-center justify-between">
                <div className="flex items-center text-slate-700">
                    <h3 className="text-lg font-semibold">Weather Alerts</h3>
                </div>
                <button
                    onClick={onClose}
                    className="text-white hover:text-gray-200 transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="p-4 space-y-3">
                {weatherAlerts.map((alert, index) => (
                    <div
                        key={index}
                        className={`p-4 rounded-lg ${getSeverityStyles(alert.severity)} transition-colors hover:bg-opacity-80`}
                    >
                        <div className="flex items-start">
                            <div className="mr-3 mt-0.5">
                                {getSeverityIcon(alert.severity)}
                            </div>
                            <div className="flex-1">
                                <p className="font-medium">{alert.message}</p>
                                <p className="text-sm opacity-75 mt-1">{alert.timeAgo}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};