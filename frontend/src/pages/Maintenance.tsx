import React from "react";

const Maintenance: React.FC = () => {
    return (
        <div className="min-h-screen flex bg-gray-50 text-gray-800">
            {/* Illustration */}
            <div className="w-1/2 flex items-center justify-center p-8">
                <img
                    src="/maintenance-char.png"
                    alt="Maintenance"
                    className="w-[50%] max-w-2xl h-auto"
                />
            </div>

            {/* Content */}
            <div className="w-1/2 flex items-center justify-start p-12">
                <div className="max-w-xl">
                    <h2 className="text-xl font-bold text-gray-700 mb-2">BANTAY</h2>

                    <h1 className="text-4xl font-bold mb-6 leading-tight">
                        Oops! BANTAY is taking a short break
                    </h1>

                    <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                        We're doing some maintenance to keep your flood updates fast, reliable,
                        and ready when you need them most.
                    </p>

                    <p className="text-gray-600 text-lg mb-8">
                        Don't worry — BANTAY will be back shortly to keep Metro Manila flood-ready.
                    </p>

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-yellow-400 text-black font-semibold px-6 py-3 rounded-lg hover:bg-yellow-500 transition"
                        >
                            Refresh
                        </button>
                        <a
                            href="/"
                            className="border-2 border-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition text-center"
                        >
                            Go Back to Homepage
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Maintenance;