import heapq
from datetime import datetime
import time
from typing import List, Dict, Any, Union

def parse_iso(ts: Union[str, datetime]) -> Union[datetime, str]:
    try:
        if ts.endswith('Z'):
            ts = ts[:-1] + '+00:00'
        return datetime.fromisoformat(ts)
    except Exception:
        return ts

def k_way_merge(arrays: List[List[Dict[str, Any]]]) -> Dict[str, Any]:
    result = []
    steps = []
    heap = []
    
    for idx, arr in enumerate(arrays):
        if len(arr) > 0:
            item = arr[0]
            ts = parse_iso(item.get('timestamp', ''))
            heapq.heappush(heap, (ts, idx, 0, item))
            
    steps.append({
        'type': 'init',
        'desc': f'Initialized min-heap with {len(heap)} elements (one from each active satellite)',
        'heapState': [f"[{h[3].get('satellite')}] {h[3].get('timestamp')}" for h in heap[:8]],
        'extracted': None
    })
    
    iteration = 0
    while heap:
        ts, srcIdx, itemIdx, min_item = heapq.heappop(heap)
        clean = min_item.copy()
        result.append(clean)
        
        nextIdx = itemIdx + 1
        if nextIdx < len(arrays[srcIdx]):
            next_item = arrays[srcIdx][nextIdx]
            next_ts = parse_iso(next_item.get('timestamp', ''))
            heapq.heappush(heap, (next_ts, srcIdx, nextIdx, next_item))
            
        if len(steps) < 30:
            steps.append({
                'type': 'extract',
                'desc': f"Extracted [{min_item.get('satellite')}] @ {min_item.get('timestamp')} -> result[{len(result)-1}]",
                'heapState': [f"[{h[3].get('satellite')}] {h[3].get('timestamp')}" for h in heap[:8]],
                'extracted': min_item.get('satellite')
            })
        iteration += 1
        
    steps.append({
        'type': 'done',
        'desc': f'✅ Merge complete! {len(result)} records unified in chronological order',
        'heapState': [],
        'extracted': None
    })
    return {'result': result, 'steps': steps}

def heap_merge(arrays: List[List[Dict[str, Any]]]) -> Dict[str, Any]:
    heap = []
    steps = []
    total_inserted = 0
    for idx, arr in enumerate(arrays):
        for item in arr:
            ts = parse_iso(item.get('timestamp', ''))
            heapq.heappush(heap, (ts, idx, item))
            total_inserted += 1
            
        sat_name = arr[0].get('satellite') if arr else 'Unknown'
        steps.append({
            'type': 'insert',
            'desc': f'Inserted all {len(arr)} records from {sat_name} into priority queue (total: {total_inserted})',
            'heapState': [f"[{h[2].get('satellite')}] {h[2].get('timestamp')}" for h in heap[:8]],
            'extracted': sat_name
        })
        
    result = []
    while heap:
        ts, idx, min_item = heapq.heappop(heap)
        result.append(min_item)
        if len(steps) < 30:
            steps.append({
                'type': 'extract',
                'desc': f"Extracted min: [{min_item.get('satellite')}] @ {min_item.get('timestamp')}",
                'heapState': [f"[{h[2].get('satellite')}] {h[2].get('timestamp')}" for h in heap[:8]],
                'extracted': min_item.get('satellite')
            })
            
    steps.append({
        'type': 'done',
        'desc': f'✅ Heap merge complete! {len(result)} records processed',
        'heapState': [],
        'extracted': None
    })
    return {'result': result, 'steps': steps}

def naive_merge(arrays: List[List[Dict[str, Any]]]) -> Dict[str, Any]:
    steps = []
    combined = []
    for arr in arrays:
        combined.extend(arr)
        sat_name = arr[0].get('satellite') if arr else 'Unknown'
        steps.append({
            'type': 'concat',
            'desc': f'Concatenated {len(arr)} records from {sat_name} -- running total: {len(combined)}',
            'heapState': [],
            'extracted': sat_name
        })
        
    steps.append({
        'type': 'sort',
        'desc': f'Sorting {len(combined)} records using Python sort (Timsort) -- O(N log N)',
        'heapState': [],
        'extracted': None
    })
    result = sorted(combined, key=lambda x: parse_iso(x.get('timestamp', '')))
    steps.append({
        'type': 'done',
        'desc': f'✅ Naive merge complete! {len(result)} records sorted chronologically',
        'heapState': [],
        'extracted': None
    })
    return {'result': result, 'steps': steps}

def run_merge(arrays: List[List[Dict[str, Any]]], algorithm: str) -> Dict[str, Any]:
    start = time.perf_counter()
    if algorithm == 'heap':
        output = heap_merge(arrays)
    elif algorithm == 'naive':
        output = naive_merge(arrays)
    else:
        output = k_way_merge(arrays)
    elapsed = round((time.perf_counter() - start) * 1000, 3)
    output['elapsed'] = elapsed
    output['algorithm'] = algorithm
    return output
