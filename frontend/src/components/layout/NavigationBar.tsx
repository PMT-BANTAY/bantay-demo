import React from 'react';
import { Link } from 'react-router-dom';
import NavLogo from '../../assets/bantay-blue.svg';

interface NavigationBarProps {
    className?: string;
}

const NavigationBar: React.FC<NavigationBarProps> = ({ className = '' }) => {
    const navItems = [
        { label: 'ABOUT', href: '/about' },
        { label: 'FEATURES', href: '/features' },
        { label: 'LIVE MAP', href: '/live-map' },
    ];

    return (
        <nav className={`w-full sticky top-10 left-0 z-50 px-4 sm:px-6 lg:px-8 ${className}`}>
            <div className="max-w-6xl mx-auto">
                <div className=" bg-gradient-to-r from-[#FFFFFF]/40 to-[#74D8FF]/40 rounded-4xl shadow-2xl backdrop-blur-sm ">
                    <div className="flex items-center justify-between h-16 md:h-15 px-6 md:px-8">
                        {/* Logo */}
                        <Link to="/" className="flex items-center space-x-2">
                            <div className="flex items-center">
                                {/* Wave icon */}
                                <img src={NavLogo} alt="logo" className="h-full w-15" />
                            </div>
                            <span className="text-[#066AAA] text-xl font-semibold tracking-wide arame">
                                BANTAY
                            </span>
                        </Link>

                        {/* Navigation Links */}
                        <div className="hidden md:block px-10">
                            <div className="ml-10 flex items-baseline space-x-8">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.label}
                                        to={item.href}
                                        className="text-[#066AAA] hover:text-[#066AAA]/70 transition-colors duration-200 text-sm font-medium tracking-wide hover:scale-105 transform transition-transform"
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Mobile menu button */}
                        <div className="md:hidden px-6">
                            <button
                                type="button"
                                className="text-gray-700 hover:text-blue-600 focus:outline-none focus:text-blue-600 transition-colors duration-200"
                                aria-label="Toggle navigation menu"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default NavigationBar;