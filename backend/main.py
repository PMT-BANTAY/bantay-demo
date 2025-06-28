from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from constants import WATER_LEVEL_SENSORS_LOC_DICT
from utils import fetch_all_water_levels, enhanced_flood_mapping, calculate_nearest_facilities, calculate_distance, SIMULATION_MODE, SIMULATION_SCENARIOS
import logging
import asyncio
import json
from typing import List, Dict
from pydantic import BaseModel
import random

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Bantay Flood Mapping API", version="1.0.0")

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(f"WebSocket client disconnected. Total connections: {len(self.active_connections)}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except Exception as e:
            logger.error(f"Error sending message to client: {e}")
            self.disconnect(websocket)

    async def broadcast(self, message: str):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error broadcasting to client: {e}")
                disconnected.append(connection)
        
        # Remove disconnected clients
        for connection in disconnected:
            self.disconnect(connection)

manager = ConnectionManager()

# Background task for real-time flood monitoring
async def flood_monitoring_task():
    """Background task that continuously monitors flood conditions and broadcasts updates"""
    while True:
        try:
            if len(manager.active_connections) > 0:
                logger.info("Fetching real-time flood data for WebSocket clients...")
                
                # Fetch fresh data
                sensors_with_data = await fetch_all_water_levels()
                flood_results = enhanced_flood_mapping(sensors_with_data)
                
                # Format response for frontend compatibility with detailed information
                formatted_results = []
                for result in flood_results:
                    sensor_lat, sensor_lng = result['centroid']
                    
                    # Find the original sensor data to get thresholds
                    original_sensor = None
                    for sensor in sensors_with_data:
                        if sensor['name'] == result['sensor']:
                            original_sensor = sensor
                            break
                    
                    formatted_result = {
                        "sensor": result['sensor'],
                        "status": result['status'],
                        "centroid": [sensor_lat, sensor_lng],
                        "water_level": result.get('water_level', 0),
                        "alert": original_sensor.get('alert') if original_sensor else None,
                        "alarm": original_sensor.get('alarm') if original_sensor else None,
                        "critical": original_sensor.get('critical') if original_sensor else None,
                        "tiles": [
                            {
                                "centroid": tile['centroid'],
                                "status": tile['status'],
                                "distance_from_source": tile.get('distance_from_source', 0),
                                "water_level": tile.get('water_level', 0)
                            }
                            for tile in result['tiles']
                        ]
                    }
                    formatted_results.append(formatted_result)
                
                # Create WebSocket message
                ws_message = {
                    "type": "flood_update",
                    "status": "success",
                    "timestamp": datetime.now().isoformat(),
                    "total_sensors": len(formatted_results),
                    "data": formatted_results
                }
                
                # Broadcast to all connected clients
                await manager.broadcast(json.dumps(ws_message))
                logger.info(f"Broadcasted flood update to {len(manager.active_connections)} clients")
            
            # Wait 30 seconds before next update (much more frequent than HTTP polling)
            await asyncio.sleep(120)
            
        except Exception as e:
            logger.error(f"Error in flood monitoring task: {e}")
            await asyncio.sleep(60)  # Wait longer on error

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Start the background flood monitoring task"""
    logger.info("Starting background flood monitoring task...")
    asyncio.create_task(flood_monitoring_task())

@app.get("/")
def read_root():
    return {"Status": "Bantay Flood Mapping API is running", "version": "1.0.0"}

@app.websocket("/ws/flood-mapping")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time flood mapping updates"""
    await manager.connect(websocket)
    try:
        # Send initial flood data immediately upon connection
        logger.info("New WebSocket client connected, sending initial data...")
        
        sensors_with_data = await fetch_all_water_levels()
        flood_results = enhanced_flood_mapping(sensors_with_data)
        
        # Format response for frontend compatibility with detailed information
        formatted_results = []
        for result in flood_results:
            sensor_lat, sensor_lng = result['centroid']
            
            # Find the original sensor data to get thresholds
            original_sensor = None
            for sensor in sensors_with_data:
                if sensor['name'] == result['sensor']:
                    original_sensor = sensor
                    break
            
            formatted_result = {
                "sensor": result['sensor'],
                "status": result['status'],
                "centroid": [sensor_lat, sensor_lng],
                "water_level": result.get('water_level', 0),
                "alert": original_sensor.get('alert') if original_sensor else None,
                "alarm": original_sensor.get('alarm') if original_sensor else None,
                "critical": original_sensor.get('critical') if original_sensor else None,
                "tiles": [
                    {
                        "centroid": tile['centroid'],
                        "status": tile['status'],
                        "distance_from_source": tile.get('distance_from_source', 0),
                        "water_level": tile.get('water_level', 0)
                    }
                    for tile in result['tiles']
                ]
            }
            formatted_results.append(formatted_result)
        
        initial_message = {
            "type": "initial_data",
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "total_sensors": len(formatted_results),
            "data": formatted_results
        }
        
        await manager.send_personal_message(json.dumps(initial_message), websocket)
        
        # Keep connection alive and handle incoming messages
        while True:
            try:
                # Wait for client messages (ping/pong, etc.)
                data = await websocket.receive_text()
                
                # Handle client messages if needed
                try:
                    message = json.loads(data)
                    if message.get("type") == "ping":
                        pong_response = {
                            "type": "pong",
                            "timestamp": datetime.now().isoformat()
                        }
                        await manager.send_personal_message(json.dumps(pong_response), websocket)
                except json.JSONDecodeError:
                    logger.warning(f"Received invalid JSON from client: {data}")
                    
            except WebSocketDisconnect:
                break
            except Exception as e:
                logger.error(f"WebSocket error: {e}")
                break
                
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.error(f"WebSocket connection error: {e}")
    finally:
        manager.disconnect(websocket)


@app.get("/sensors/")
async def get_sensors():
    """
    Get all sensor locations and basic information
    
    Returns:
        dict: List of all sensors with their locations and thresholds
    """
    try:
        sensors = []
        for station_name, sensor_data in WATER_LEVEL_SENSORS_LOC_DICT.items():
            if isinstance(sensor_data, dict):
                # Fix coordinate order: ensure lat, lng format
                lat, lng = sensor_data['centroid']
                sensor = {
                    'id': sensor_data['sensor_code'],
                    'name': station_name,
                    'centroid': [lat, lng],  # [latitude, longitude]
                    'alert': sensor_data.get('alert'),
                    'alarm': sensor_data.get('alarm'),
                    'critical': sensor_data.get('critical'),
                }
                sensors.append(sensor)
        
        return {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "total_sensors": len(sensors),
            "sensors": sensors
        }
        
    except Exception as e:
        logger.error(f"Error getting sensors: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "status": "error",
                "message": f"Failed to get sensors: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
        )


@app.get("/flood-mapping/")
async def get_flood_mapping():
    """
    Generate and return real-time flood mapping data with tile propagation
    
    Returns:
        dict: Flood mapping results with sensor data and tile information
    """
    try:
        logger.info("Starting flood mapping generation...")
        
        # Step 1: Fetch real water level data from PAGASA API
        sensors_with_data = await fetch_all_water_levels()
        logger.info(f"Fetched data for {len(sensors_with_data)} sensors")
        
        # Step 2: Generate flood mapping with tile propagation
        flood_results = enhanced_flood_mapping(sensors_with_data)
        logger.info(f"Generated flood mapping for {len(flood_results)} sensors")
        
        # Step 3: Format response for frontend compatibility
        formatted_results = []
        for result in flood_results:
            # Ensure coordinate format consistency [lat, lng]
            sensor_lat, sensor_lng = result['centroid']
            
            formatted_result = {
                "sensor": result['sensor'],
                "status": result['status'],
                "centroid": [sensor_lat, sensor_lng],  # [latitude, longitude]
                "tiles": [
                    {
                        "centroid": tile['centroid'],  # Already in [lat, lng] format from utils
                        "status": tile['status']
                    }
                    for tile in result['tiles']
                ]
            }
            formatted_results.append(formatted_result)
        
        response = {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "total_sensors": len(formatted_results),
            "data": formatted_results
        }
        
        logger.info("Flood mapping completed successfully")
        return response
        
    except Exception as e:
        logger.error(f"Error in flood mapping: {str(e)}")
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
        logger.info("Generating flood mapping summary...")
        
        # Fetch and process data
        sensors_with_data = await fetch_all_water_levels()
        flood_results = enhanced_flood_mapping(sensors_with_data)
        
        # Calculate summary statistics
        total_sensors = len(flood_results)
        status_counts = {"normal": 0, "alert": 0, "alarm": 0, "critical": 0}
        
        for result in flood_results:
            status = result.get('status', 'normal')
            if status in status_counts:
                status_counts[status] += 1
            else:
                status_counts['normal'] += 1
        
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
        
        logger.info("Summary generated successfully")
        return response
        
    except Exception as e:
        logger.error(f"Error generating summary: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "status": "error", 
                "message": f"Failed to generate flood summary: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
        )


@app.get("/simulation/status/")
async def get_simulation_status():
    """
    Get current simulation configuration and status
    
    Returns:
        dict: Current simulation settings and available scenarios
    """
    try:
        from utils import SIMULATION_MODE, SIMULATION_SCENARIOS
        
        return {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "simulation": {
                "enabled": SIMULATION_MODE,
                "available_scenarios": {
                    name: {
                        "description": config["description"],
                        "max_tiles": config["max_propagation_distance"] ** 2,
                        "intensity": config["base_multiplier"]
                    }
                    for name, config in SIMULATION_SCENARIOS.items()
                }
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting simulation status: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "status": "error",
                "message": f"Failed to get simulation status: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
        )


@app.post("/simulation/toggle/")
async def toggle_simulation_mode():
    """
    Toggle simulation mode on/off
    
    Returns:
        dict: New simulation status
    """
    try:
        import utils
        utils.SIMULATION_MODE = not utils.SIMULATION_MODE
        
        return {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "simulation_enabled": utils.SIMULATION_MODE,
            "message": f"Simulation mode {'enabled' if utils.SIMULATION_MODE else 'disabled'}"
        }
        
    except Exception as e:
        logger.error(f"Error toggling simulation: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "status": "error",
                "message": f"Failed to toggle simulation: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
        )


@app.get("/flood-mapping/detailed/")
async def get_detailed_flood_mapping():
    """
    Get detailed flood mapping with enhanced information including scenarios and tile counts
    
    Returns:
        dict: Detailed flood mapping with additional metadata
    """
    try:
        logger.info("Generating detailed flood mapping...")
        
        # Fetch and process data
        sensors_with_data = await fetch_all_water_levels()
        flood_results = enhanced_flood_mapping(sensors_with_data)
        
        # Calculate detailed statistics
        total_tiles = sum(len(result['tiles']) for result in flood_results)
        scenarios_used = {}
        status_distribution = {"normal": 0, "alert": 0, "alarm": 0, "critical": 0}
        
        detailed_results = []
        for result in flood_results:
            # Count scenarios
            scenario = result.get('scenario', 'unknown')
            scenarios_used[scenario] = scenarios_used.get(scenario, 0) + 1
            
            # Count statuses
            sensor_status = result.get('status', 'normal')
            if sensor_status in status_distribution:
                status_distribution[sensor_status] += 1
            
            # Enhanced result with tile statistics
            tile_stats = {
                'total': len(result['tiles']),
                'by_status': {}
            }
            
            for tile in result['tiles']:
                tile_status = tile['status']
                tile_stats['by_status'][tile_status] = tile_stats['by_status'].get(tile_status, 0) + 1
            
            sensor_lat, sensor_lng = result['centroid']
            
            # Find the original sensor data to get thresholds
            original_sensor = None
            for sensor in sensors_with_data:
                if sensor['name'] == result['sensor']:
                    original_sensor = sensor
                    break
            
            detailed_result = {
                "sensor": result['sensor'],
                "status": result['status'],
                "centroid": [sensor_lat, sensor_lng],
                "water_level": result.get('water_level', 0),
                "alert": original_sensor.get('alert') if original_sensor else None,
                "alarm": original_sensor.get('alarm') if original_sensor else None,
                "critical": original_sensor.get('critical') if original_sensor else None,
                "scenario": scenario,
                "tile_statistics": tile_stats,
                "tiles": [
                    {
                        "centroid": tile['centroid'],
                        "status": tile['status'],
                        "distance_from_source": tile.get('distance_from_source', 0),
                        "water_level": tile.get('water_level', 0)
                    }
                    for tile in result['tiles']
                ]
            }
            detailed_results.append(detailed_result)
        
        response = {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "simulation_enabled": SIMULATION_MODE,
            "summary": {
                "total_sensors": len(detailed_results),
                "total_tiles": total_tiles,
                "status_distribution": status_distribution,
                "scenarios_used": scenarios_used,
                "average_tiles_per_sensor": round(total_tiles / len(detailed_results) if detailed_results else 0, 1)
            },
            "data": detailed_results
        }
        
        logger.info(f"Detailed mapping completed: {total_tiles} total tiles across {len(detailed_results)} sensors")
        return response
        
    except Exception as e:
        logger.error(f"Error in detailed flood mapping: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "status": "error",
                "message": f"Failed to generate detailed flood mapping: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
        )

class LocationSearch(BaseModel):
    latitude: float
    longitude: float
    max_distance: float = 5000  # Default 5km radius

@app.post("/nearest-facilities/")
async def find_nearest_facilities(search: LocationSearch):
    """
    Find nearest facilities based on user's location using Dijkstra's algorithm
    """
    try:
        # Load facilities data from your locations.json
        # In production, this should come from a database
        with open("../frontend/src/components/config/locations.json") as f:
            locations_data = json.load(f)
        
        # Convert locations to the format expected by calculate_nearest_facilities
        facilities = []
        for loc in locations_data["locations"]:
            # Here you would normally get actual lat/lng from your database
            # For demo, we'll generate some coordinates around the search point
            facility = {
                "id": loc["id"],
                "title": loc["title"],
                "category": loc["category"],
                "tag": loc["tag"],
                # Generate coordinates within ~2km of search point for demo
                "latitude": search.latitude + (random.random() - 0.5) * 0.02,
                "longitude": search.longitude + (random.random() - 0.5) * 0.02
            }
            facilities.append(facility)
        
        # Calculate nearest facilities
        nearest = calculate_nearest_facilities(
            search.latitude,
            search.longitude,
            facilities,
            search.max_distance
        )
        
        # Add category styling from the original config
        for facility in nearest:
            category_config = locations_data["categoryConfig"].get(facility["category"], {})
            facility["color"] = category_config.get("color", "")
            facility["bgColor"] = category_config.get("bgColor", "")
        
        return {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "total_facilities": len(nearest),
            "facilities": nearest
        }
        
    except Exception as e:
        logger.error(f"Error finding nearest facilities: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "status": "error",
                "message": f"Failed to find nearest facilities: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
        )

class EvacuationRouteRequest(BaseModel):
    latitude: float
    longitude: float
    max_distance: float = 5000  # Default 5km radius

@app.post("/evacuation-routes/")
async def get_evacuation_routes(request: EvacuationRouteRequest):
    """
    Get evacuation routes to the nearest three evacuation centers
    """
    try:
        # Load facilities data
        with open("../frontend/src/components/config/locations.json") as f:
            locations_data = json.load(f)
        
        # Filter evacuation centers
        evacuation_centers = []
        for loc in locations_data["locations"]:
            if loc["category"] == "evacuation":
                # For demo, generate coordinates around the search point
                center = {
                    "id": loc["id"],
                    "title": loc["title"],
                    "tag": loc["tag"],
                    "latitude": request.latitude + (random.random() - 0.5) * 0.02,
                    "longitude": request.longitude + (random.random() - 0.5) * 0.02
                }
                evacuation_centers.append(center)
        
        # Calculate distances and sort
        for center in evacuation_centers:
            distance = calculate_distance(
                request.latitude,
                request.longitude,
                center["latitude"],
                center["longitude"]
            )
            center["distance"] = distance
            # Calculate estimated walk time (assuming average walking speed of 5km/h)
            walk_time_hours = distance / 5000  # Convert meters to hours at 5km/h
            walk_time_minutes = int(walk_time_hours * 60)
            center["walk_time"] = f"{walk_time_minutes} mins walk"
        
        # Sort by distance and take top 3
        evacuation_centers.sort(key=lambda x: x["distance"])
        nearest_centers = evacuation_centers[:3]
        
        # Format routes
        routes = []
        for i, center in enumerate(nearest_centers):
            route_type = "Primary Route" if i == 0 else "Secondary Route" if i == 1 else "Alternate Route"
            routes.append({
                "name": route_type,
                "destination": f"To: {center['title']}",
                "walkTime": center["walk_time"],
                "coordinates": {
                    "start": {"lat": request.latitude, "lng": request.longitude},
                    "end": {"lat": center["latitude"], "lng": center["longitude"]}
                }
            })
        
        return {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "routes": routes
        }
        
    except Exception as e:
        logger.error(f"Error getting evacuation routes: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "status": "error",
                "message": f"Failed to get evacuation routes: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
        )

@app.get("/high-water-alerts/")
async def get_high_water_alerts():
    """
    Get sensors with highest water levels
    """
    try:
        # Get current water levels
        water_levels = await fetch_all_water_levels()
        
        # Sort sensors by water level
        sorted_sensors = sorted(
            water_levels,
            key=lambda x: x.get('current_water_level', 0),
            reverse=True
        )
        
        # Take top 3 highest water levels
        high_alerts = []
        for sensor in sorted_sensors[:3]:
            # Get threshold levels from constants
            sensor_config = WATER_LEVEL_SENSORS_LOC_DICT.get(sensor['name'], {})
            critical = sensor_config.get('critical', 0)
            alarm = sensor_config.get('alarm', 0)
            alert = sensor_config.get('alert', 0)
            
            # Determine status based on water level
            current_level = sensor.get('current_water_level', 0)
            if current_level >= critical:
                status = "CRITICAL"
                color = "red"
            elif current_level >= alarm:
                status = "WARNING"
                color = "orange"
            elif current_level >= alert:
                status = "ALERT"
                color = "yellow"
            else:
                status = "NORMAL"
                color = "green"
            
            high_alerts.append({
                "name": sensor['name'],
                "water_level": current_level,
                "status": status,
                "color": color,
                "timestamp": sensor.get('timestamp', datetime.now().isoformat()),
                "location": {
                    "latitude": sensor_config.get('centroid', [0, 0])[0],
                    "longitude": sensor_config.get('centroid', [0, 0])[1]
                }
            })
        
        return {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "alerts": high_alerts
        }
        
    except Exception as e:
        logger.error(f"Error getting high water alerts: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "status": "error",
                "message": f"Failed to get high water alerts: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
        ) 