import React from 'react';

interface EvacuationRoute {
    name: string;
    destination: string;
    walkTime: string;
}

interface EvacuationRoutesProps {
    isVisible: boolean;
    onClose: () => void;
}

const evacuationRoutes: EvacuationRoute[] = [
    {
        name: "Primary Route",
        destination: "To: Quirino High School",
        walkTime: "3 mins walk"
    },
    {
        name: "Secondary Route",
        destination: "To: World Citi Hospital",
        walkTime: "6 mins walk"
    },
    {
        name: "Alternate Route",
        destination: "To: Everlasting High School",
        walkTime: "7 mins walk"
    }
];

export const EvacuationRoutes: React.FC<EvacuationRoutesProps> = ({ isVisible, onClose }) => {
    if (!isVisible) return null;

    return (
        <div className="mt-4 bg-white rounded-lg shadow-lg border-l-8 border-l-[#066AAA] overflow-hidden">
            <div className=" px-4 flex items-center justify-between">
                <div className="flex items-center text-slate-700">

                    <h3 className="text-lg font-semibold">Evacuation Routes</h3>
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
                {evacuationRoutes.map((route, index) => (
                    <div key={index} className="bg-blue-50 p-4 rounded-lg hover:bg-blue-100 transition-colors">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-semibold text-gray-800">{route.name}</h4>
                                <p className="text-sm text-gray-600 mt-1">{route.destination}</p>
                            </div>
                            <div className="flex items-center text-gray-500">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-sm">{route.walkTime}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};