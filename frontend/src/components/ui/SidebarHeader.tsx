import React, { useState, useRef } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import emergencyIcon from '../../assets/emergency.svg';
import weatherIcon from '../../assets/weather.svg';
import evacuation from '../../assets/evac.svg';
import { useEmergencyHandlers } from '../../hooks/useEmergencyHandlers';
import { EmergencyContacts } from '../ui/EmergencyContact';
import { EvacuationRoutes } from '../ui/EvacuationRoute';
import { WeatherAlerts } from '../ui/WeatherAlert';
import SidebarNearbySupport from '../ui/SidebarNearbySupport';

// Types
interface LocationSuggestion {
  id: string;
  place_name: string;
  text: string;
  center: [number, number];
  properties?: Record<string, any>;
}

interface MapboxResponse {
  features: LocationSuggestion[];
}


type SidebarHeaderProps = {
  location: string;
  setLocation: (location: string) => void;
  handleLocationSearch: () => void;
  bantayGrad: string;
  locIcon: string;
  search: string;
};

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  location,
  setLocation,
  handleLocationSearch,
  bantayGrad,
  locIcon,
  search
}) => {
  // Location search state
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [isGettingLocation, setIsGettingLocation] = useState<boolean>(false);
  const [currentLocation, setCurrentLocation] = useState<{latitude: number; longitude: number} | null>(null);
  
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  
  const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoianBjdXJhZGEiLCJhIjoiY21iNmc1cXd6MDBnMTJtc2hpcmhpc3gyYyJ9.kzc47FSUdqOwuQzCdzdXnQ';
  
  const {
    showEmergencyContacts,
    showEvacuationRoutes,
    showWeatherAlerts,
    handleEmergencyCall,
    handleEvacuation,
    handleWeather,
    closeEmergencyContacts,
    closeEvacuationRoutes,
    closeWeatherAlerts
  } = useEmergencyHandlers();

  // Location search functionality
  const searchPlaces = async (query: string): Promise<void> => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('Searching for:', query);
      
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=PH&proximity=121.0437,14.6760&types=place,locality,neighborhood,address,poi&limit=10&language=en`
      );
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }
      
      const data: MapboxResponse = await response.json();
      console.log('API Response:', data);
      
      setSuggestions(data.features || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error searching places:', error);
      setSuggestions([]);
      setShowSuggestions(false);
      alert(`Search failed: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getLocationErrorMessage = (error: GeolocationPositionError): string => {
    switch (error.code) {
      case 1: // PERMISSION_DENIED
        return 'Location access denied. Please enable location permissions in your browser settings.';
      case 2: // POSITION_UNAVAILABLE
        return 'Location unavailable. Please ensure location services are enabled and try again.';
      case 3: // TIMEOUT
        return 'Location request timed out. Please try again.';
      default:
        return 'Unable to get your current location. Please try again or enter your location manually.';
    }
  };

  const getCurrentLocation = async (): Promise<void> => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser. Please enter your location manually.');
      return;
    }

    // Check if we're on HTTPS (required for geolocation in most browsers)
    if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
      alert('Location services require a secure connection (HTTPS). Please enter your location manually.');
      return;
    }

    setIsGettingLocation(true);

    // Enhanced geolocation options
    const geoOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000, // 15 seconds timeout
      maximumAge: 300000, // 5 minutes cache
    };

    navigator.geolocation.getCurrentPosition(
      async (position: GeolocationPosition) => {
        try {
          const { latitude, longitude } = position.coords;
          
          console.log('Got coordinates:', latitude, longitude);
          
          // Update current location for nearby facilities
          setCurrentLocation({
            latitude,
            longitude
          });
          
          // Reverse geocoding to get address
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_ACCESS_TOKEN}&types=address,place,locality&limit=1`
          );
          
          if (!response.ok) {
            throw new Error('Failed to get address for current location');
          }
          
          const data: MapboxResponse = await response.json();
          
          if (data.features && data.features.length > 0) {
            const locationName = data.features[0].place_name;
            setLocation(locationName);
            console.log('Location set to:', locationName);
          } else {
            const fallbackLocation = `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
            setLocation(fallbackLocation);
            console.log('Using fallback location:', fallbackLocation);
          }
          
          setShowSuggestions(false);
          
          // Call the original handleLocationSearch to update the map
          handleLocationSearch();
          
        } catch (error) {
          console.error('Error with reverse geocoding:', error);
          const { latitude, longitude } = position.coords;
          const fallbackLocation = `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
          setLocation(fallbackLocation);
          handleLocationSearch();
        }
      },
      (error: GeolocationPositionError) => {
        console.error('Geolocation error:', error);
        const errorMessage = getLocationErrorMessage(error);
        
        // Additional debugging info
        console.log('Error details:', {
          code: error.code,
          message: error.message,
          isHttps: window.location.protocol === 'https:',
          hostname: window.location.hostname,
          userAgent: navigator.userAgent
        });

        // For development: offer to use a default location
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          const useDefault = confirm(
            `${errorMessage}\n\nWould you like to use a default location (Quezon City) for testing?`
          );
          
          if (useDefault) {
            setLocation('Quezon City, Metro Manila, Philippines');
            handleLocationSearch();
            setIsGettingLocation(false);
            return;
          }
        }
        
        alert(errorMessage);
        setIsGettingLocation(false);
      },
      geoOptions
    );
    
    // Reset loading state after timeout
    setTimeout(() => {
      setIsGettingLocation(false);
    }, 16000); // Slightly longer than timeout
  };
  
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const query = e.target.value;
    setLocation(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      searchPlaces(query);
    }, 300);
  };
  
  const handleSuggestionClick = (suggestion: LocationSuggestion): void => {
    setLocation(suggestion.place_name);
    setSuggestions([]);
    setShowSuggestions(false);
    console.log('Selected coordinates:', suggestion.center);
    console.log('Selected place:', suggestion);
    
    // Update current location for nearby facilities
    setCurrentLocation({
      latitude: suggestion.center[1],
      longitude: suggestion.center[0]
    });
    
    // Call original handleLocationSearch if needed
    handleLocationSearch();
  };

  const handleOriginalSearch = (): void => {
    setShowSuggestions(false);
    handleLocationSearch();
  };

  return (
    <div className="p-5 border-b border-slate-200">
      <div className="h-10 flex items-center justify-center w-full border-b border-blue-400 pb-4">
        <img src={bantayGrad} alt="bantay logo" className="w-16" />
      </div>

      <div className="pt-5">
        <div className="text-sm text-[#066AAA] font-medium mb-2">Current Location:</div>
        <div className="relative">
          {/* Location Input */}
          <div className="relative flex items-center bg-slate-100 border border-slate-300 rounded-lg p-3">
            <img src={locIcon} alt="location" className="pr-2" />
            <input
              type="text"
              className="flex-1 bg-transparent border-none text-sm text-slate-600 outline-none placeholder-slate-400"
              value={location}
              onChange={handleSearchInput}
              placeholder="Enter location"
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
            />
            <img 
              src={search} 
              alt="search" 
              className="pr-2 cursor-pointer" 
              onClick={handleOriginalSearch} 
            />
          </div>

          {/* Use Current Location Button */}
          <button
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            className={`flex items-center justify-center space-x-2 w-full p-2 mt-2 rounded-lg transition-colors border text-xs ${
              isGettingLocation 
                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' 
                : 'hover:bg-blue-50 border-blue-200 text-blue-600 cursor-pointer'
            }`}
          >
            <Navigation className={`w-4 h-4 ${isGettingLocation ? 'text-gray-400 animate-spin' : 'text-blue-600'}`} />
            <span className={`font-medium ${isGettingLocation ? 'text-gray-400' : 'text-blue-600'}`}>
              {isGettingLocation ? 'Getting Location...' : 'Use My Current Location'}
            </span>
          </button>

          {/* Loading */}
          {isLoading && (
            <div className="absolute top-full left-0 right-0 bg-white border border-slate-300 rounded-lg mt-1 p-3 shadow-lg z-50">
              <div className="text-center text-gray-500 text-sm">Searching...</div>
            </div>
          )}

          {/* Search Results */}
          {showSuggestions && suggestions.length > 0 && !isLoading && (
            <div className="absolute top-full left-0 right-0 bg-white border border-slate-300 rounded-lg mt-1 shadow-lg z-50 max-h-60 overflow-y-auto">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="flex items-start space-x-3 w-full p-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
                >
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate text-sm">
                      {suggestion.text || suggestion.place_name.split(',')[0]}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {suggestion.place_name}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No Results */}
          {showSuggestions && location && !isLoading && suggestions.length === 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-slate-300 rounded-lg mt-1 p-4 shadow-lg z-50">
              <div className="text-center text-gray-500">
                <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No locations found</p>
                <p className="text-xs">Try a different search term</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-6">
        <button
          className={`group relative flex flex-col items-center justify-center p-5 bg-gradient-to-br from-[#066AAA] to-[#0D4F73] text-white border-none rounded-2xl cursor-pointer text-xs font-semibold transition-all duration-300 ease-out min-h-[90px] shadow-lg hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98] active:translate-y-0 ${showEmergencyContacts ? 'ring-2 ring-white ring-opacity-50' : ''}`}
          style={{
            boxShadow: '0 4px 15px rgba(6, 106, 170, 0.3), 0 2px 8px rgba(6, 106, 170, 0.15)',
            backdropFilter: 'blur(10px)'
          }}
          onClick={handleEmergencyCall}
        >
          {/* Shine effect overlay */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Subtle border glow */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent opacity-30" />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-2 p-2 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors duration-300">
              <img src={emergencyIcon} alt="emergency" className="w-7 h-7 filter drop-shadow-sm" />
            </div>
            <span className="font-bold tracking-wide text-shadow-sm">Emergency</span>
          </div>

          {/* Subtle pulse animation */}
          <div className="absolute inset-0 rounded-2xl bg-[#066AAA] opacity-0 group-hover:opacity-20 animate-pulse" />
        </button>

        <button
          className={`group relative flex flex-col items-center justify-center p-5 bg-gradient-to-br from-[#066AAA] to-[#0D4F73] text-white border-none rounded-2xl cursor-pointer text-xs font-semibold transition-all duration-300 ease-out min-h-[90px] shadow-lg hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98] active:translate-y-0 ${showEvacuationRoutes ? 'ring-2 ring-white ring-opacity-50' : ''}`}
          style={{
            boxShadow: '0 4px 15px rgba(6, 106, 170, 0.3), 0 2px 8px rgba(6, 106, 170, 0.15)',
            backdropFilter: 'blur(10px)'
          }}
          onClick={handleEvacuation}
        >
          {/* Shine effect overlay */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Subtle border glow */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent opacity-30" />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-2 p-2 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors duration-300">
              <img src={evacuation} alt="evacuation" className="filter drop-shadow-sm" />
            </div>
            <span className="font-bold tracking-wide text-shadow-sm">Evacuation</span>
          </div>

          {/* Subtle pulse animation */}
          <div className="absolute inset-0 rounded-2xl bg-[#066AAA] opacity-0 group-hover:opacity-20 animate-pulse" />
        </button>

        <button
          className={`group relative flex flex-col items-center justify-center p-5 bg-gradient-to-br from-[#066AAA] to-[#0D4F73] text-white border-none rounded-2xl cursor-pointer text-xs font-semibold transition-all duration-300 ease-out min-h-[90px] shadow-lg hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98] active:translate-y-0 ${showWeatherAlerts ? 'ring-2 ring-white ring-opacity-50' : ''}`}
          style={{
            boxShadow: '0 4px 15px rgba(6, 106, 170, 0.3), 0 2px 8px rgba(6, 106, 170, 0.15)',
            backdropFilter: 'blur(10px)'
          }}
          onClick={handleWeather}
        >
          {/* Shine effect overlay */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Subtle border glow */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent opacity-30" />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-2 p-2 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors duration-300">
              <img src={weatherIcon} alt="weather icon" className="w-8 h-8 filter drop-shadow-sm" />
            </div>
            <span className="font-bold tracking-wide text-shadow-sm">Alert</span>
          </div>

          {/* Subtle pulse animation */}
          <div className="absolute inset-0 rounded-2xl bg-[#066AAA] opacity-0 group-hover:opacity-20 animate-pulse" />
        </button>
      </div>

      <EmergencyContacts
        isVisible={showEmergencyContacts}
        onClose={closeEmergencyContacts}
      />
      <EvacuationRoutes
        isVisible={showEvacuationRoutes}
        onClose={closeEvacuationRoutes}
        currentLocation={currentLocation}
      />
      <WeatherAlerts
        isVisible={showWeatherAlerts}
        onClose={closeWeatherAlerts}
      />
      <SidebarNearbySupport currentLocation={currentLocation} />
    </div>
  );
};