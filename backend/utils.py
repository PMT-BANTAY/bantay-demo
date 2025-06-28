import aiohttp
import asyncio
import time
import random
import math
from datetime import datetime
from typing import List, Dict, Tuple, Set, Optional
from collections import deque, defaultdict
from constants import *
import heapq

# Simulation configuration
SIMULATION_MODE = True  # Set to True for demonstration purposes
SIMULATION_SCENARIOS = {
    'light_flooding': {
        'description': 'Light flooding scenario',
        'base_multiplier': 1.1,  # 10% above normal
        'max_propagation_distance': 5,  # Increased from 3
        'tile_reduction_factor': 0.95
    },
    'moderate_flooding': {
        'description': 'Moderate flooding scenario', 
        'base_multiplier': 1.3,  # 30% above normal
        'max_propagation_distance': 7,  # Increased from 4
        'tile_reduction_factor': 0.90
    },
    'severe_flooding': {
        'description': 'Severe flooding scenario',
        'base_multiplier': 1.6,  # 60% above normal
        'max_propagation_distance': 9,  # Increased from 5
        'tile_reduction_factor': 0.85
    },
    'critical_flooding': {
        'description': 'Critical flooding scenario',
        'base_multiplier': 2.0,  # 100% above normal (double the critical threshold)
        'max_propagation_distance': 12,  # Increased from 6
        'tile_reduction_factor': 0.80
    }
}

def get_sensor_code(sensor_data):
    """Extract sensor code from either integer or dictionary structure"""
    if isinstance(sensor_data, int):
        return sensor_data
    elif isinstance(sensor_data, dict) and 'sensor_code' in sensor_data:
        return sensor_data['sensor_code']
    else:
        raise ValueError(f"Invalid sensor data structure: {sensor_data}")

async def get_pagasa_water_level(session, station_code='11105201', date_time=None):
    """
    Get water level data from PAGASA API

    Args:
        session: Shared aiohttp ClientSession
        station_code (str): Station observation code (default: '11105201')
        date_time (datetime): Specific datetime (default: current time)

    Returns:
        dict: Water level data from PAGASA API
    """

    # Use current time if not specified
    if date_time is None:
        date_time = datetime.now()

    # Format timestamp to YYYYMMDDHHMM
    timestamp = date_time.strftime('%Y%m%d%H%M')

    # API endpoint
    url = 'https://pasig-marikina-tullahanffws.pagasa.dost.gov.ph/water/detail_list.do'

    # Request headers
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': 'https://pasig-marikina-tullahanffws.pagasa.dost.gov.ph/water/table.do'
    }

    # Request data
    data = {
        'obscd': str(station_code),
        'ymdhm': timestamp
    }

    try:
        async with session.post(url, headers=headers, data=data) as response:
            response.raise_for_status()
            return await response.json()

    except aiohttp.ClientError as e:
        return {'error': f'Request failed: {str(e)}'}
    except Exception as e:
        return {'error': f'Unexpected error: {str(e)}'}

def extract_water_level_value(data, station_name):
    """Extract numeric water level from API response"""
    try:
        if isinstance(data, list) and len(data) > 0:
            # Look for first reading with actual water level data (not '-')
            for reading in data:
                if isinstance(reading, dict):
                    wl = reading.get('wl', '-')
                    if wl != '-' and wl is not None:
                        try:
                            # Remove any asterisk (*) markers and convert to float
                            clean_wl = str(wl).replace('(*)', '').replace('*', '').strip()
                            return float(clean_wl)
                        except (ValueError, TypeError):
                            continue
        return None
    except Exception:
        return None

def simulate_water_level(sensor: Dict, scenario: str = 'moderate_flooding') -> float:
    """
    Simulate water level for demonstration purposes based on sensor thresholds
    """
    scenario_config = SIMULATION_SCENARIOS.get(scenario, SIMULATION_SCENARIOS['moderate_flooding'])
    
    # Get sensor thresholds
    alert_threshold = sensor.get('alert', 15.0)
    alarm_threshold = sensor.get('alarm', 20.0) 
    critical_threshold = sensor.get('critical', 25.0)
    
    # Add some randomization to make it more realistic
    randomization_factor = random.uniform(0.9, 1.1)
    
    # Calculate simulated water level based on scenario
    if scenario == 'light_flooding':
        # Slightly above alert threshold
        base_level = alert_threshold * scenario_config['base_multiplier']
    elif scenario == 'moderate_flooding':
        # Between alert and alarm
        base_level = alarm_threshold * scenario_config['base_multiplier']
    elif scenario == 'severe_flooding':
        # Above alarm threshold
        base_level = critical_threshold * scenario_config['base_multiplier']
    else:  # critical_flooding
        # Well above critical threshold
        base_level = critical_threshold * scenario_config['base_multiplier']
    
    return round(base_level * randomization_factor, 2)

def create_sensors_from_constants():
    """Create sensors list from constants with proper structure for flood mapping"""
    sensors = []
    
    # Randomly assign different flood scenarios to sensors for demonstration
    scenario_names = list(SIMULATION_SCENARIOS.keys())
    
    for i, (station_name, sensor_data) in enumerate(WATER_LEVEL_SENSORS_LOC_DICT.items()):
        if isinstance(sensor_data, dict):
            # Ensure proper lat/lng ordering - centroid is (lat, lng)
            lat, lng = sensor_data['centroid']
            
            # Assign scenario cyclically for demonstration
            scenario = scenario_names[i % len(scenario_names)]
            
            sensor = {
                'id': sensor_data['sensor_code'],
                'name': station_name,
                'latitude': lat,
                'longitude': lng,
                'location': f'{station_name} monitoring station',
                'alert': sensor_data.get('alert'),
                'alarm': sensor_data.get('alarm'),
                'critical': sensor_data.get('critical'),
                'current_water_level': None,  # Will be populated from API or simulation
                'elevation': sensor_data.get('elevation', 0),  # Add elevation data
                'simulation_scenario': scenario  # Track which scenario is applied
            }
            sensors.append(sensor)
    
    return sensors

async def fetch_all_water_levels():
    """Fetch water levels for all sensors and return updated sensors list"""
    print(f"Fetching water levels from PAGASA API...")
    start_time = time.time()
    
    # Create sensors list from constants
    sensors = create_sensors_from_constants()
    
    if SIMULATION_MODE:
        print("🎭 SIMULATION MODE: Using simulated water levels for demonstration")
        
        for sensor in sensors:
            scenario = sensor['simulation_scenario']
            simulated_level = simulate_water_level(sensor, scenario)
            sensor['current_water_level'] = simulated_level
            
            # Determine status based on simulated level
            if simulated_level >= sensor.get('critical', 25):
                status_emoji = "🔴"
            elif simulated_level >= sensor.get('alarm', 20):
                status_emoji = "🟠"
            elif simulated_level >= sensor.get('alert', 15):
                status_emoji = "🟡"
            else:
                status_emoji = "🟢"
                
            print(f"{status_emoji} {sensor['name']}: {simulated_level}m ({scenario})")
        
        print(f"\n🎯 Simulation completed in {time.time() - start_time:.2f}s")
        return sensors
    
    # Original API fetching code (for production use)
    # Create mapping for quick lookup
    sensor_lookup = {sensor['id']: sensor for sensor in sensors}
    
    async with aiohttp.ClientSession(
        connector=aiohttp.TCPConnector(limit=20),
        timeout=aiohttp.ClientTimeout(total=30)
    ) as session:
        
        # Create tasks for all sensors
        tasks = []
        sensor_ids = []
        
        for sensor in sensors:
            task = get_pagasa_water_level(
                session, 
                sensor['id'], 
                datetime(2024, 5, 27, 6, 0)
            )
            tasks.append(task)
            sensor_ids.append(sensor['id'])
        
        # Execute all requests concurrently
        print("Executing concurrent API requests...")
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Update sensors with fetched water levels
        successful = 0
        failed = 0
        
        for i, data in enumerate(responses):
            sensor_id = sensor_ids[i]
            sensor = sensor_lookup[sensor_id]
            
            if isinstance(data, Exception):
                print(f"✗ {sensor['name']}: API Exception")
                sensor['current_water_level'] = simulate_water_level(sensor, 'moderate_flooding')
                failed += 1
            else:
                water_level = extract_water_level_value(data, sensor['name'])
                if water_level is not None:
                    sensor['current_water_level'] = water_level
                    successful += 1
                    print(f"✓ {sensor['name']}: {water_level}")
                else:
                    # Use simulation for demo purposes
                    sensor['current_water_level'] = simulate_water_level(sensor, 'moderate_flooding')
                    failed += 1
                    print(f"⚠ {sensor['name']}: No data, using simulation")
    
    execution_time = time.time() - start_time
    print(f"\nAPI Fetch Summary: {successful} successful, {failed} failed in {execution_time:.2f}s")
    
    return sensors

# Enhanced Flood Mapping Functions
def round_coord(value: float) -> float:
    return round(value, 6)

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two coordinates in meters"""
    R = 6371000  # Earth's radius in meters
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_lat/2) * math.sin(delta_lat/2) +
         math.cos(lat1_rad) * math.cos(lat2_rad) *
         math.sin(delta_lon/2) * math.sin(delta_lon/2))
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

def get_grid_neighbors(longitude: float, latitude: float, distance_from_source: int, scenario: str, parent_elevation: float) -> List[Tuple[float, float]]:
    """Get neighboring tiles in a strict grid pattern to prevent overlaps"""
    neighbors = []
    step = MARGIN_VALUE  # This is our grid cell size
    
    # Define grid directions (no diagonals to prevent overlaps)
    # Added diagonal directions with proper spacing to maintain grid alignment
    grid_directions = [
        (0, -1),   # South
        (-1, 0),   # West
        (1, 0),    # East
        (0, 1),    # North
        (-1, -1),  # Southwest
        (1, -1),   # Southeast
        (-1, 1),   # Northwest
        (1, 1)     # Northeast
    ]
    
    # Weight directions based on natural flow (south has higher probability)
    direction_weights = [0.25, 0.20, 0.20, 0.15, 0.05, 0.05, 0.05, 0.05]  # Adjusted weights
    
    # Increase base neighbors and add more for critical scenarios
    base_neighbors = 3 if distance_from_source < 3 else 2  # Increased from 2/1
    if scenario == 'critical_flooding':
        base_neighbors += 2  # Increased from 1
    elif scenario == 'severe_flooding':
        base_neighbors += 1
    elif scenario == 'moderate_flooding' and distance_from_source < 4:
        base_neighbors += 1
    
    # Generate neighbors in grid pattern
    used_directions = set()
    for _ in range(base_neighbors):
        if not grid_directions:  # No more available directions
            break
            
        # Choose direction based on weights, excluding used ones
        available_directions = [(d, w) for i, (d, w) in enumerate(zip(grid_directions, direction_weights))
                              if d not in used_directions]
        if not available_directions:
            break
            
        directions, weights = zip(*available_directions)
        # Normalize weights
        weights_sum = sum(weights)
        normalized_weights = [w/weights_sum for w in weights]
        
        direction = random.choices(directions, weights=normalized_weights)[0]
        used_directions.add(direction)
        
        dx, dy = direction
        # For diagonal directions, adjust step size to maintain grid alignment
        if abs(dx) == 1 and abs(dy) == 1:
            # Use exact step size for diagonal movements
            new_lon = round_coord(longitude + (dx * step))
            new_lat = round_coord(latitude + (dy * step))
        else:
            # Regular orthogonal movements
            new_lon = round_coord(longitude + (dx * step))
            new_lat = round_coord(latitude + (dy * step))
        
        neighbors.append((new_lon, new_lat))
    
    return neighbors

# Create an alias for backward compatibility
get_organic_neighbors = get_grid_neighbors

def estimate_elevation(longitude: float, latitude: float, parent_elevation: float, distance_from_center: float) -> float:
    """
    Estimate elevation with realistic terrain patterns for Metro Manila
    """
    # Metro Manila terrain characteristics:
    # - Generally flat with slight slope towards Manila Bay (west)
    # - Eastern areas (Marikina, Rodriguez) are higher (foothills)
    # - Central and western areas are lower and flood-prone
    
    # Base elevation follows natural slope towards Manila Bay
    west_slope = -0.05 * abs(longitude - 121.0)  # Gentle slope westward
    
    # Eastern areas are higher (near mountain foothills)
    if longitude > 121.10:  # Eastern areas (Marikina, Rodriguez)
        elevation_bonus = 2.0 + random.uniform(0, 3.0)
    elif longitude < 121.02:  # Western areas (Manila Bay area)
        elevation_bonus = -1.0 + random.uniform(-2.0, 0)
    else:  # Central areas
        elevation_bonus = random.uniform(-1.0, 1.0)
    
    # Add natural terrain variation
    terrain_roughness = random.uniform(-0.5, 0.5)
    
    # River valleys and flood plains are lower
    if random.random() < 0.2:  # 20% chance of being in flood plain
        flood_plain_reduction = random.uniform(-2.0, -0.5)
    else:
        flood_plain_reduction = 0
    
    # Distance decay from source
    distance_decay = -0.02 * distance_from_center
    
    estimated_elevation = (parent_elevation + 
                          west_slope + 
                          elevation_bonus + 
                          terrain_roughness + 
                          flood_plain_reduction + 
                          distance_decay)
    
    return max(0.1, estimated_elevation)  # Minimum elevation above sea level

def compute_enhanced_status(node: Dict, parent: Dict, distance_from_source: float, scenario_config: Dict):
    """Enhanced status computation with better propagation logic"""
    level = node['current_water_level']
    
    # Check if this is the root sensor node
    is_sensor_node = (
        'alert' in node and node['alert'] is not None and
        'alarm' in node and node['alarm'] is not None and
        'critical' in node and node['critical'] is not None
    )
    
    if is_sensor_node:
        # Root sensor - determine status based on thresholds
        if level >= node['critical']:
            status = 'critical'
        elif level >= node['alarm']:
            status = 'alarm'
        elif level >= node['alert']:
            status = 'alert'
        else:
            status = 'normal'
    else:
        # Propagated tile - consider elevation, distance, and parent status
        current_elevation = node.get('elevation', 0)
        parent_elevation = parent.get('elevation', 0)
        
        # Water doesn't flow uphill significantly
        if current_elevation > parent_elevation + 2.0:
            status = 'normal'
            node['current_water_level'] = 0
        else:
            # Get parent status
            parent_status = parent.get('status', 'normal')
            
            if parent_status == 'normal':
                status = 'normal'
                node['current_water_level'] = 0
            else:
                # Water level decreases with distance and elevation difference
                elevation_reduction = max(0, (current_elevation - parent_elevation) * 0.1)
                distance_reduction = distance_from_source * 0.05
                
                # Apply reduction based on scenario
                reduction_factor = scenario_config['tile_reduction_factor']
                total_reduction = reduction_factor - elevation_reduction - distance_reduction
                total_reduction = max(0.3, total_reduction)  # Minimum reduction to prevent negative values
                
                node['current_water_level'] = parent['current_water_level'] * total_reduction
                
                # More realistic status determination based on multiple factors
                water_level = node['current_water_level']
                
                # Base status from water level
                if water_level >= 15.0:  # High water level
                    base_status = 'critical'
                elif water_level >= 8.0:  # Moderate water level
                    base_status = 'alarm' 
                elif water_level >= 3.0:  # Low but concerning water level
                    base_status = 'alert'
                else:
                    base_status = 'normal'
                
                # Modify based on distance and parent status
                if parent_status == 'critical':
                    if distance_from_source <= 2:
                        status = base_status if base_status != 'normal' else 'alert'
                    elif distance_from_source <= 5:
                        status = 'alarm' if base_status == 'critical' else base_status
                    elif distance_from_source <= 8:
                        status = 'alert' if base_status in ['critical', 'alarm'] else base_status
                    else:
                        status = base_status if base_status == 'normal' else 'alert'
                        
                elif parent_status == 'alarm':
                    if distance_from_source <= 3:
                        status = base_status if base_status != 'normal' else 'alert'
                    elif distance_from_source <= 6:
                        status = 'alert' if base_status in ['critical', 'alarm'] else base_status
                    else:
                        status = base_status
                        
                elif parent_status == 'alert':
                    if distance_from_source <= 4:
                        status = base_status if base_status != 'normal' else 'alert'
                    else:
                        status = base_status
                else:
                    status = base_status
                
                # Final realistic checks
                if water_level < 1.0:
                    status = 'normal'
                elif current_elevation > parent_elevation + 3.0:  # Significantly higher ground
                    status = 'normal'
            
    node['status'] = status

def enhanced_flood_mapping(sensors: List[Dict]) -> List[Dict]:
    """Enhanced flood mapping with improved tile propagation"""
    coord_map = {
        (round_coord(s['longitude']), round_coord(s['latitude'])): s
        for s in sensors
    }
    
    output = []

    for sensor in sensors:
        # Get scenario configuration
        scenario = sensor.get('simulation_scenario', 'moderate_flooding')
        scenario_config = SIMULATION_SCENARIOS[scenario]
        max_distance = scenario_config['max_propagation_distance']
        
        visited = set()
        queue = deque([(sensor, 0)])  # (node, distance_from_source)
        tiles = []
        
        print(f"Processing {sensor['name']} with {scenario} scenario (max distance: {max_distance})")

        while queue:
            node, distance_from_source = queue.popleft()
            key = (round_coord(node['longitude']), round_coord(node['latitude']))
            
            if key in visited or distance_from_source > max_distance:
                continue
                
            visited.add(key)

            # Compute status for this node
            if distance_from_source == 0:
                compute_enhanced_status(node, sensor, distance_from_source, scenario_config)
            else:
                compute_enhanced_status(node, sensor, distance_from_source, scenario_config)

            tiles.append({
                'centroid': (node['latitude'], node['longitude']),
                'status': node['status'],
                'distance_from_source': distance_from_source,
                'water_level': node.get('current_water_level', 0)
            })

            # Add neighboring tiles if flooding continues
            if node['status'] != 'normal' and distance_from_source < max_distance:
                # Modified probability calculation for more extensive propagation
                base_probability = 0.9  # Increased from 0.7
                distance_factor = distance_from_source / max_distance
                scenario_bonus = {
                    'critical_flooding': 0.3,
                    'severe_flooding': 0.2,
                    'moderate_flooding': 0.1,
                    'light_flooding': 0.0
                }.get(scenario, 0.0)
                
                propagation_probability = base_probability - (distance_factor * 0.6) + scenario_bonus
                
                if random.random() > propagation_probability:
                    continue
                
                # Get neighbors based on grid pattern
                neighbors = get_grid_neighbors(
                    node['longitude'], 
                    node['latitude'], 
                    distance_from_source, 
                    scenario,
                    node.get('elevation', 0)
                )
                
                for lon, lat in neighbors:
                    neighbor_key = (lon, lat)
                    if neighbor_key not in visited:
                        if neighbor_key in coord_map:
                            queue.append((coord_map[neighbor_key], distance_from_source + 1))
                        else:
                            # Calculate distance from center for elevation estimation
                            center_distance = calculate_distance(
                                sensor['latitude'], sensor['longitude'],
                                lat, lon
                            )
                            
                            # Enhanced elevation estimation
                            neighbor_elevation = estimate_elevation(
                                lon, lat, 
                                node.get('elevation', 0), 
                                center_distance
                            )
                            
                            # Water level reduction with more realistic factors
                            base_reduction = scenario_config['tile_reduction_factor']
                            
                            # Additional reduction factors for realism
                            distance_factor = 1.0 - (distance_from_source / max_distance) * 0.5
                            elevation_factor = 1.0 if neighbor_elevation <= node.get('elevation', 0) else 0.7
                            random_factor = random.uniform(0.8, 1.0)  # Natural variation
                            
                            total_reduction = base_reduction * distance_factor * elevation_factor * random_factor
                            
                            neighbor_node = {
                                'longitude': lon,
                                'latitude': lat,
                                'current_water_level': node['current_water_level'] * total_reduction,
                                'elevation': neighbor_elevation
                            }
                            queue.append((neighbor_node, distance_from_source + 1))

        # Filter out normal status tiles at edges to clean up the output
        filtered_tiles = [tile for tile in tiles if tile['status'] != 'normal' or tile['distance_from_source'] == 0]
        
        output.append({
            'sensor': sensor['name'],
            'status': sensor['status'],
            'centroid': (sensor['latitude'], sensor['longitude']),
            'tiles': filtered_tiles,
            'scenario': scenario,
            'total_tiles': len(filtered_tiles),
            'water_level': sensor['current_water_level']
        })
        
        print(f"  ✓ Generated {len(filtered_tiles)} tiles for {sensor['name']}")

    return output

# Create an alias for backward compatibility
flood_mapping = enhanced_flood_mapping

def calculate_nearest_facilities(
    start_lat: float,
    start_lng: float,
    facilities: List[Dict],
    max_distance: float = 5000  # 5km radius by default
) -> List[Dict]:
    """
    Use Dijkstra's algorithm to find the nearest facilities from a starting point.
    
    Args:
        start_lat: Starting latitude
        start_lng: Starting longitude
        facilities: List of facility dictionaries with lat, lng coordinates
        max_distance: Maximum search radius in meters
        
    Returns:
        List of facilities with calculated distances, sorted by distance
    """
    # Create a list to store facilities with their distances
    facilities_with_distances = []
    
    # Calculate distances for each facility
    for facility in facilities:
        # Extract facility coordinates
        facility_lat = float(facility.get('latitude', 0))
        facility_lng = float(facility.get('longitude', 0))
        
        # Calculate distance using Haversine formula
        distance = calculate_distance(start_lat, start_lng, facility_lat, facility_lng)
        
        # Only include facilities within max_distance
        if distance <= max_distance:
            # Add distance to facility info
            facility_info = facility.copy()
            facility_info['distance'] = distance
            facility_info['distance_text'] = format_distance(distance)
            facilities_with_distances.append(facility_info)
    
    # Sort facilities by distance
    facilities_with_distances.sort(key=lambda x: x['distance'])
    
    return facilities_with_distances

def format_distance(distance: float) -> str:
    """Format distance in meters to human readable string"""
    if distance < 1000:
        return f"{round(distance)} m away"
    else:
        return f"{round(distance/1000, 1)} km away"

# async def main():
#     """Main function that combines API fetching with flood mapping"""
#     print("PAGASA Flood Mapping System")
#     print("="*50)
    
#     # Step 1: Fetch real water level data
#     sensors_with_data = await fetch_all_water_levels()
    
#     # Step 2: Generate flood mapping
#     print(f"\nGenerating flood mapping for {len(sensors_with_data)} sensors...")
#     flood_results = flood_mapping(sensors_with_data)
    
#     # Step 3: Display results
#     print("\nFLOOD MAPPING RESULTS:")
#     print("="*50)
    
#     for update in flood_results:
#         print(f"Sensor: {update['sensor']}")
#         print(f"  Status: {update['status']}")
#         print(f"  Tiles Generated: {len(update['tiles'])}")
#         print(f"  Centroid: {update['centroid']}")
#         print()
    
#     # Step 4: Export as JSON
#     print("\nExporting results...")
#     with open('flood_mapping_results.json', 'w') as f:
#         json.dump(flood_results, f, indent=2)
    
#     print("Results saved to 'flood_mapping_results.json'")
    
#     return flood_results

# if __name__ == "__main__":
#     results = asyncio.run(main())
#     print(f"\nCompleted: Generated flood mapping for {len(results)} sensors")