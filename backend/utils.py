import aiohttp
import asyncio
import time
from datetime import datetime
from typing import List, Dict, Tuple
from collections import deque
from constants import *

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

def create_sensors_from_constants():
    """Create sensors list from constants with proper structure for flood mapping"""
    sensors = []
    
    for station_name, sensor_data in WATER_LEVEL_SENSORS_LOC_DICT.items():
        if isinstance(sensor_data, dict):
            sensor = {
                'id': sensor_data['sensor_code'],
                'name': station_name,
                'latitude': sensor_data['centroid'][0],
                'longitude': sensor_data['centroid'][1],
                'location': f'{station_name} monitoring station',
                'alert': sensor_data.get('alert'),
                'alarm': sensor_data.get('alarm'),
                'critical': sensor_data.get('critical'),
                'current_water_level': None  # Will be populated from API   
            }
            sensors.append(sensor)
    
    return sensors

async def fetch_all_water_levels():
    """Fetch water levels for all sensors and return updated sensors list"""
    print(f"Fetching water levels from PAGASA API...")
    start_time = time.time()
    
    # Create sensors list from constants
    sensors = create_sensors_from_constants()
    
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
                sensor['current_water_level'] = 10.0  # Default value for demo
                failed += 1
            else:
                water_level = extract_water_level_value(data, sensor['name'])
                if water_level is not None:
                    sensor['current_water_level'] = water_level
                    successful += 1
                    print(f"✓ {sensor['name']}: {water_level}")
                else:
                    # Use fallback value for demo purposes
                    sensor['current_water_level'] = 10.0
                    failed += 1
                    print(f"⚠ {sensor['name']}: No data, using fallback")
    
    execution_time = time.time() - start_time
    print(f"\nAPI Fetch Summary: {successful} successful, {failed} failed in {execution_time:.2f}s")
    
    return sensors

# Flood Mapping Functions
def round_coord(value: float) -> float:
    return round(value, 6)

def get_neighbors(longitude: float, latitude: float) -> List[Tuple[float, float]]:
    return [
        (round_coord(longitude + MARGIN_VALUE), round_coord(latitude)),                   # T
        (round_coord(longitude + MARGIN_VALUE), round_coord(latitude + MARGIN_VALUE)),    # TR
        (round_coord(longitude), round_coord(latitude + MARGIN_VALUE)),                   # R
        (round_coord(longitude - MARGIN_VALUE), round_coord(latitude + MARGIN_VALUE)),    # RB
        (round_coord(longitude - MARGIN_VALUE), round_coord(latitude)),                   # B
        (round_coord(longitude - MARGIN_VALUE), round_coord(latitude - MARGIN_VALUE)),    # BL
        (round_coord(longitude), round_coord(latitude - MARGIN_VALUE)),                   # L
        (round_coord(longitude + MARGIN_VALUE), round_coord(latitude - MARGIN_VALUE))     # LT
    ]

def estimate_elevation(longitude: float, latitude: float, parent_elevation: float) -> float:
    """
    Estimate elevation for virtual tiles based on parent elevation with some variation
    In a real implementation, this would use a Digital Elevation Model (DEM)
    """
    import random
    # Add small random variation to simulate terrain changes
    variation = random.uniform(-2.0, 1.0)  # Slight downward bias for water flow
    return max(0, parent_elevation + variation)

def compute_status(node: Dict, parent: Dict, visited_len: int):
    level = node['current_water_level']
    
    # Check if this is the root sensor node (has alert/alarm/critical thresholds)
    is_sensor_node = (
        'alert' in node and node['alert'] is not None and
        'alarm' in node and node['alarm'] is not None and
        'critical' in node and node['critical'] is not None
    )
    
    if is_sensor_node:
        # THIS ONLY RUNS WHEN THERE'S A PRESENT CRITICAL ALARM OR ALERT
        # MEANING THIS ONLY EXECUTES FOR THE ROOT OR SENSOR
        if level >= node['critical']:
            status = 'critical'
        elif level >= node['alarm']:
            status = 'alarm'
        elif level >= node['alert']:
            status = 'alert'
        else:
            status = 'normal'
    else:
        # THIS RUNS WHEN THERE'S NO CRITICAL ALARM OR ALERT PRESENT ON THE NODE
        # MEANING THE STATUS CAN BE CALCULATED BY COMPARING THE ELEVATION OF THE CURRENT AND ITS PARENT
        
        current_elevation = node.get('elevation', 0)
        parent_elevation = parent.get('elevation', 0)
        
        # If current elevation is greater than parent's, water flow cuts off
        if current_elevation > parent_elevation:
            status = 'normal'
            node['current_water_level'] = 0  # No water flow uphill
        else:
            # Water flows downhill, inherit parent status but reduce water level
            # If parent doesn't have status yet, compute it first
            if 'status' not in parent:
                parent_is_sensor = (
                    'alert' in parent and parent['alert'] is not None and
                    'alarm' in parent and parent['alarm'] is not None and
                    'critical' in parent and parent['critical'] is not None
                )
                if parent_is_sensor:
                    parent_level = parent['current_water_level']
                    if parent_level >= parent['critical']:
                        parent['status'] = 'critical'
                    elif parent_level >= parent['alarm']:
                        parent['status'] = 'alarm'
                    elif parent_level >= parent['alert']:
                        parent['status'] = 'alert'
                    else:
                        parent['status'] = 'normal'
                else:
                    parent['status'] = 'normal'
            
            status = parent['status']
            if status == 'alert':
                node['current_water_level'] *= 0.90
            elif status == 'alarm':
                node['current_water_level'] *= 0.80
            elif status == 'critical':
                node['current_water_level'] *= 0.70
            
    node['status'] = status

def flood_mapping(sensors: List[Dict]) -> List[Dict]:
    coord_map = {
        (round_coord(s['longitude']), round_coord(s['latitude'])): s
        for s in sensors
    }
    
    output = []

    for sensor in sensors:
        visited = set()
        queue = deque([sensor])
        tiles = []

        while queue:
            node = queue.popleft()
            key = (round_coord(node['longitude']), round_coord(node['latitude']))
            if key in visited:
                continue
            visited.add(key)

            compute_status(node, sensor, len(visited))

            tiles.append({
                'centroid': (node['latitude'], node['longitude']),
                'status': node['status']
            })

            # Add neighboring tiles even if there's no sensor at that location
            for lon, lat in get_neighbors(node['longitude'], node['latitude']):
                neighbor_key = (lon, lat)
                if neighbor_key not in visited:
                    
                    # Check if there's a real sensor at this location
                    if neighbor_key in coord_map:
                        queue.append(coord_map[neighbor_key])
                    elif node['status'] != 'normal':  # Only expand if there's flooding
                        # Create a virtual neighbor tile
                        neighbor_elevation = estimate_elevation(lon, lat, node.get('elevation', 0))
                        neighbor_node = {
                            'longitude': lon,
                            'latitude': lat,
                            'current_water_level': node['current_water_level'] * 0.95,
                            'elevation': neighbor_elevation
                        }
                        queue.append(neighbor_node)

        output.append({
            'sensor': sensor['name'],
            'status': sensor['status'],
            'centroid': (sensor['latitude'], sensor['longitude']),
            'tiles': tiles
        })

    return output


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