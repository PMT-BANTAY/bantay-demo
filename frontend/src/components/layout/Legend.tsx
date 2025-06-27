const Legend = () => {
    return (
        <div>
            <div className="absolute bottom-5 right-5 bg-white bg-opacity-90 p-4 rounded-lg text-xs shadow-lg z-10 max-w-[200px] text-black">
                <h4 className="m-0 mb-2.5 text-black"><strong>Legend</strong></h4>

                <div className="mb-4">
                    <strong className="block mb-1.5 text-black">Building Heights:</strong>
                    <div className="mb-1 flex items-center text-black">
                        <span className="inline-block w-3 h-3 mr-2 " style={{backgroundColor: '#2E5266'}}></span>
                        Tall (&gt;100m)
                    </div>
                    <div className="mb-1 flex items-center text-black">
                        <span className="inline-block w-3 h-3 mr-2" style={{backgroundColor: '#FF8C42'}}></span>
                        Medium (50-100m)
                    </div>
                    <div className="mb-1 flex items-center text-black">
                        <span className="inline-block w-3 h-3 mr-2 bg-gray-200"></span>
                        Short (&lt;50m)
                    </div>
                </div>

                <div className="mb-4">
                    <strong className="block mb-1.5 text-black">Water Areas:</strong>
                    <div className="mb-1 flex items-center text-black">
                        <span className="inline-block w-3 h-3 mr-2 rounded-full" style={{backgroundColor: '#1CB5E0'}}></span>
                        Rivers, Lakes, Creeks
                    </div>
                </div>

                <div className="mb-4">
                    <strong className="block mb-1.5 text-black">Dam Alert Levels:</strong>
                    <div className="mb-1 flex items-center text-black">
                        <span className="inline-block w-3 h-3 mr-2 rounded-full" style={{backgroundColor: '#ff3300'}}></span>
                        Critical Level (Level 3)
                    </div>
                    <div className="mb-1 flex items-center text-black">
                        <span className="inline-block w-3 h-3 mr-2 rounded-full" style={{backgroundColor: '#ffcc00'}}></span>
                        Alarm Level (Level 2)
                    </div>
                    <div className="mb-1 flex items-center text-black">
                        <span className="inline-block w-3 h-3 mr-2 rounded-full" style={{backgroundColor: '#ffff00'}}></span>
                        Alert Level (Level 1)
                    </div>
                </div>

            </div>
        </div>
    )
}

export default Legend