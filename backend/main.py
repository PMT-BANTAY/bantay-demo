from fastapi import FastAPI, HTTPException
from datetime import datetime
from constants import WATER_LEVEL_SENSORS_LOC_DICT
from utils import fetch_all_water_levels, flood_mapping

app = FastAPI()


@app.get("/")
def read_root():
    return {"Status": "Working siya ate"}


@app.get("/flood-mapping/")
async def get_flood_mapping():
    """
    Generate and return real-time flood mapping data
    
    Returns:
        dict: Flood mapping results with sensor data and tile information
    """
    try:
        # Step 1: Fetch real water level data from PAGASA API
        sensors_with_data = await fetch_all_water_levels()
        
        # Step 2: Generate flood mapping
        flood_results = flood_mapping(sensors_with_data)
        
        # Step 3: Format response for frontend
        response = {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "total_sensors": len(flood_results),
            "data": flood_results
        }
        
        return response
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail={
                "status": "error",
                "message": f"Failed to generate flood mapping: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
        )


@app.get("/flood-mapping/summary/")
async def get_flood_mapping_summary():
    """
    Get a summary of current flood conditions
    
    Returns:
        dict: Summary of flood conditions across all sensors
    """
    try:
        # Fetch and process data
        sensors_with_data = await fetch_all_water_levels()
        flood_results = flood_mapping(sensors_with_data)
        
        # Calculate summary statistics
        total_sensors = len(flood_results)
        status_counts = {"normal": 0, "alert": 0, "alarm": 0, "critical": 0}
        
        for result in flood_results:
            status = result.get('status', 'normal')
            if status in status_counts:
                status_counts[status] += 1
        
        # Find sensors with alerts
        affected_sensors = [
            {
                "name": result['sensor'],
                "status": result['status'],
                "centroid": result['centroid'],
                "tiles_count": len(result['tiles'])
            }
            for result in flood_results 
            if result.get('status') != 'normal'
        ]
        
        response = {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "total_sensors": total_sensors,
                "status_distribution": status_counts,
                "affected_sensors_count": len(affected_sensors),
                "affected_sensors": affected_sensors
            }
        }
        
        return response
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "status": "error", 
                "message": f"Failed to generate flood summary: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
        )


    # return {
    #     "Angono": 7.0,
    #     "Burgos": 12.12,
    #     "La Mesa Dam": 12.1,
    #     "Mindanao": 12.1,
    #     "Montalban": 12.1,
    #     "Nangka": 12.1,
    #     "Napindan-1": 12.1,
    # }

