import React, { useState, useEffect } from 'react';
import locationData from '../config/locations.json';

// Define the types
interface LocationItem {
    id: string;
    title: string;
    distance: string;
    category: LocationCategory;
    tag: string;
}

type LocationCategory = 'rescuer' | 'evacuation' | 'school' | 'medical' | 'government' | 'emergency';



const SidebarNearbySupport: React.FC = () => {
    const [locations, setLocations] = useState<LocationItem[]>([]);
    const [categoryConfig, setCategoryConfig] = useState<Record<LocationCategory, { color: string; bgColor: string }>>({} as Record<LocationCategory, { color: string; bgColor: string }>);

    useEffect(() => {
        // Load data from JSON file with type assertion
        setLocations(locationData.locations as LocationItem[]);
        setCategoryConfig(locationData.categoryConfig as Record<LocationCategory, { color: string; bgColor: string }>);
    }, []);

    return (
        <div className="max-w-full ">
            <h1 className="text-xl text-center font-bold text-[#066AAA] mb-6">Nearby Support Facilities</h1>

            {/* Location list */}
            <div className="space-y-3">
                {locations.map((location) => {
                    const config = categoryConfig[location.category];
                    if (!config) return null;

                    return (
                        <div
                            key={location.id}
                            className={`${config.bgColor} rounded-lg border-l-8 ${config.color} p-4 shadow-sm hover:shadow-md transition-shadow`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-800 text-sm mb-1">
                                        {location.title}
                                    </h3>
                                    <p className="text-gray-600 text-sm">
                                        {location.distance}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                  <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs font-medium">
                    {location.tag}
                  </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SidebarNearbySupport;