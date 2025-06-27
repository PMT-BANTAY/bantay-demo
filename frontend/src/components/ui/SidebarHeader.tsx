import emergencyIcon from '../../assets/emergency.svg';
import weatherIcon from '../../assets/weather.svg';
import evacuation from '../../assets/evac.svg';

type SidebarHeaderProps = {
    location: string;
    setLocation: (location: string) => void;
    handleEmergencyCall: () => void;
    handleEvacuation: () => void;
    handleWeather: () => void;
    handleLocationSearch: () => void;
    bantayGrad: string;
    locIcon: string;
    search: string;
};

export const SidebarHeader = ({
                                  location,
                                  setLocation,
                                  handleEmergencyCall,
                                  handleEvacuation,
                                  handleWeather,
                                  handleLocationSearch,
                                  bantayGrad,
                                  locIcon,
                                  search
                              }: SidebarHeaderProps) => {
    return (
        <div className="p-5 border-b border-slate-200 bg-white">
            <div className="h-10 flex items-center justify-center w-full border-b border-blue-400 pb-4">
                <img src={bantayGrad} alt="bantay logo" className="w-16" />
            </div>

            <div className="pt-5">
                <div className="text-sm text-[#066AAA] font-medium mb-2">Current Location:</div>
                <div className="relative flex items-center bg-slate-100 border border-slate-300 rounded-lg p-3">
                    <img src={locIcon} alt="location" className="pr-2" />
                    <input
                        type="text"
                        className="flex-1 bg-transparent border-none text-sm text-slate-600 outline-none placeholder-slate-400"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Enter location"
                    />
                    <img src={search} alt="search" className="pr-2 cursor-pointer" onClick={handleLocationSearch} />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-6">
                <button
                    className="group relative flex flex-col items-center justify-center p-5 bg-gradient-to-br from-[#066AAA] to-[#0D4F73] text-white border-none rounded-2xl cursor-pointer text-xs font-semibold transition-all duration-300 ease-out min-h-[90px] shadow-lg hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98] active:translate-y-0"
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
                    className="group relative flex flex-col items-center justify-center p-5 bg-gradient-to-br from-[#066AAA] to-[#0D4F73] text-white border-none rounded-2xl cursor-pointer text-xs font-semibold transition-all duration-300 ease-out min-h-[90px] shadow-lg hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98] active:translate-y-0"
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
                    className="group relative flex flex-col items-center justify-center p-5 bg-gradient-to-br from-[#066AAA] to-[#0D4F73] text-white border-none rounded-2xl cursor-pointer text-xs font-semibold transition-all duration-300 ease-out min-h-[90px] shadow-lg hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98] active:translate-y-0"
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
                        <span className="font-bold tracking-wide text-shadow-sm">Weather</span>
                    </div>

                    {/* Subtle pulse animation */}
                    <div className="absolute inset-0 rounded-2xl bg-[#066AAA] opacity-0 group-hover:opacity-20 animate-pulse" />
                </button>
            </div>
        </div>
    );
};