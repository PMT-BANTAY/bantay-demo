import React from 'react';
import { useFacilitySearch } from '../../hooks/useFacilitySearch';
import { Loader2 } from 'lucide-react';

interface SidebarNearbySupportProps {
    currentLocation: {
        latitude: number;
        longitude: number;
    } | null;
}

const SidebarNearbySupport: React.FC<SidebarNearbySupportProps> = ({ currentLocation }) => {
    const { facilities, isLoading, error, searchFacilities } = useFacilitySearch();

    React.useEffect(() => {
        if (currentLocation) {
            searchFacilities(currentLocation.latitude, currentLocation.longitude);
        }
    }, [currentLocation]);

    if (error) {
        return (
            <div className="p-4 text-center text-red-600">
                <p>Error loading facilities: {error}</p>
            </div>
        );
    }

    return (
        <div className="max-w-full">
            <h1 className="text-xl text-center font-bold text-[#066AAA] mb-6">Nearby Support Facilities</h1>

            {isLoading ? (
                <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
            ) : !currentLocation ? (
                <div className="text-center text-gray-500 p-4">
                    Please enter a location to see nearby facilities
                </div>
            ) : (
                <div className="space-y-3">
                    {facilities.map((facility) => (
                        <div
                            key={facility.id}
                            className={`${facility.bgColor} rounded-lg border-l-8 ${facility.color} p-4 shadow-sm hover:shadow-md transition-shadow`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-800 text-sm mb-1">
                                        {facility.title}
                                    </h3>
                                    <p className="text-gray-600 text-sm">
                                        {facility.distance_text}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs font-medium">
                                        {facility.tag}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SidebarNearbySupport;