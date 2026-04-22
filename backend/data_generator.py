import random
import math
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple

def generate_telemetry(config: Dict[str, Any], count: int, base_time: datetime) -> List[Dict[str, Any]]:
    records: List[Dict[str, Any]] = []
    current_time = base_time
    val1 = config['r1'][0] + (config['r1'][1]-config['r1'][0])/2
    val2 = config['r2'][0] + (config['r2'][1]-config['r2'][0])/2
    val3 = config['r3'][0] + (config['r3'][1]-config['r3'][0])/2
    
    for _ in range(count):
        records.append({
            'timestamp': current_time.isoformat() + "Z",
            'satellite': config['id'],
            config['f1']: round(val1, 2),
            config['f2']: round(val2, 2),
            config['f3']: round(val3, 2),
        })
        current_time += timedelta(minutes=random.randint(*config['interval']))
        val1 += random.uniform(-config['v1'], config['v1'])
        val2 += random.uniform(-config['v2'], config['v2'])
        val3 += random.uniform(-config['v3'], config['v3'])
        val1 = max(config['r1'][0], min(config['r1'][1], val1))
        val2 = max(config['r2'][0], min(config['r2'][1], val2))
        val3 = max(config['r3'][0], min(config['r3'][1], val3))
        
    return records

def get_preloaded_data() -> Dict[str, List[Dict[str, Any]]]:
    base_time = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    sat_a_config = {
        'id': 'SAT-A', 
        'interval': (10, 15),
        'f1': 'temperature', 'r1': (15, 35), 'v1': 2.0,
        'f2': 'humidity', 'r2': (40, 80), 'v2': 5.0,
        'f3': 'altitude', 'r3': (500, 560), 'v3': 0.5
    }
    sat_b_config = {
        'id': 'SAT-B', 
        'interval': (12, 18),
        'f1': 'rainfall_mm', 'r1': (0, 50), 'v1': 4.0,
        'f2': 'pressure_hpa', 'r2': (980, 1030), 'v2': 2.0,
        'f3': 'altitude', 'r3': (700, 715), 'v3': 0.2
    }
    sat_c_config = {
        'id': 'SAT-C', 
        'interval': (10, 20),
        'f1': 'wind_kmh', 'r1': (5, 120), 'v1': 10.0,
        'f2': 'uv_index', 'r2': (0, 11), 'v2': 0.5,
        'f3': 'altitude', 'r3': (800, 810), 'v3': 0.1
    }
    sat_d_config = {
        'id': 'SAT-D', 
        'interval': (15, 25),
        'f1': 'sst_celsius', 'r1': (2, 30), 'v1': 0.5,
        'f2': 'wave_height_m', 'r2': (0.5, 8.0), 'v2': 0.3,
        'f3': 'altitude', 'r3': (650, 660), 'v3': 0.1
    }
    return {
        'SAT-A': generate_telemetry(sat_a_config, 120, base_time),
        'SAT-B': generate_telemetry(sat_b_config, 95, base_time),
        'SAT-C': generate_telemetry(sat_c_config, 108, base_time),
        'SAT-D': generate_telemetry(sat_d_config, 87, base_time)
    }

def get_disaster_datasets() -> Dict[str, Dict[str, List[Dict[str, Any]]]]:
    base_time = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    datasets: Dict[str, Dict[str, List[Dict[str, Any]]]] = {
        'hurricane': { 'SAT-A': [], 'SAT-B': [] },
        'wildfire': { 'SAT-A': [], 'SAT-C': [] }
    }
    htime = base_time - timedelta(days=2)
    pressure = 1010
    wind = 40
    for i in range(48):
        pressure -= random.uniform(0.5, 3.0)
        wind += random.uniform(1.0, 5.0)
        datasets['hurricane']['SAT-B'].append({
            'timestamp': htime.isoformat() + "Z",
            'satellite': 'SAT-B',
            'pressure_hpa': round(pressure, 2),
            'rainfall_mm': round(random.uniform(5, 50), 2),
            'altitude': 710.5
        })
        datasets['hurricane']['SAT-A'].append({
            'timestamp': (htime + timedelta(minutes=random.randint(5,15))).isoformat() + "Z",
            'satellite': 'SAT-A',
            'temperature': round(25 - (wind * 0.05), 2),
            'humidity': round(min(100, 70 + (wind * 0.2)), 2),
            'altitude': 550.0
        })
        htime += timedelta(hours=1)
    return datasets
