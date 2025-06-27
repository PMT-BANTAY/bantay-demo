import React, { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import HeroBg from '../../assets/enhanced-hero-bg.png';

interface HeroProps {
    className?: string;
}

const Hero: React.FC<HeroProps> = ({ className = '' }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Searching for:', searchQuery);
        // Handle search functionality here
    };

    return (
        <section
            className={`relative min-h-screen flex items-center justify-center overflow-hidden ${className}`}
        >
            {/* Background Image */}
            <img
                src={HeroBg}
                alt="Hero background"
                className="absolute inset-0 w-full min-h-full object-cover object-center"
            />

            {/* Gradient Overlay with Transparent Middle */}
            <div
                className="absolute inset-0"
                style={{
                    background: `linear-gradient(
                        to bottom,
                        rgba(255, 255, 255, 0.9) 0%,
                        rgba(255, 255, 255, 0.7) 8%,
                        rgba(240, 248, 255, 0.4) 15%,
                        rgba(176, 196, 222, 0.2) 20%,
                        transparent 25%,
                        transparent 35%,
                        transparent 45%,
                        transparent 55%,
                        transparent 65%,
                        transparent 70%,
                        transparent 80%,
                        rgba(6, 106, 170, 0.7) 90%,
                        rgba(6, 106, 170, 0.8) 100%
                    )`
                }}
            />

            {/* Optional: Light text shadow overlay for better readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />

            {/* Content */}
            <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                {/* Main Heading */}
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 pt-16 leading-tight drop-shadow-2xl geo-medium">
                    Intelligence Flows
                    <br />
                    <span className="text-white">Where Water Goes</span>
                </h1>

                {/* subtitle */}
                <p className="text-lg sm:text-xl text-white mb-12 max-w-3xl mx-auto leading-relaxed drop-shadow-xl">
                    PMT Waters Decoded: Pasig Flows, Marikina Knows, Tullahan Shows
                </p>

                {/* Search Bar */}
                <div className="max-w-2xl mx-auto mb-8 w-[50vh]">
                    <form onSubmit={handleSearch} className="relative">
                        <div className="flex items-center bg-white/30 backdrop-blur-sm rounded-full border border-white/20 hover:border-white/40 transition-all duration-300">
                            <div className="flex items-center pl-6 pr-4">
                                <MapPin className="h-5 w-5 text-blue-300" />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Start Tracking"
                                className="flex-1 bg-transparent text-white placeholder-white/70 font-light py-4 px-2 focus:outline-none text-md"
                            />
                            <button
                                type="submit"
                                className="m-2 p-3 hover:bg-white/20 rounded-full transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-transparent"
                                aria-label="Search"
                            >
                                <Search className="h-5 w-5 text-white" />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default Hero;