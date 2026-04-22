from fastapi import FastAPI, Depends, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
from algorithms import run_merge
from data_generator import get_preloaded_data, get_disaster_datasets

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MergeRequest(BaseModel):
    algorithm: str
    datasets: List[List[Dict[str, Any]]]

@app.get("/api/preloaded")
def fetch_preloaded() -> Dict[str, List[Dict[str, Any]]]:
    return get_preloaded_data()

@app.get("/api/disaster/{disaster_type}")
def fetch_disaster(disaster_type: str) -> Dict[str, List[Dict[str, Any]]]:
    datasets: Dict[str, Dict[str, List[Dict[str, Any]]]] = get_disaster_datasets()
    if disaster_type in datasets:
        return datasets[disaster_type]
    return {}

@app.post("/api/merge")
def merge_datasets(request: MergeRequest) -> Dict[str, Any]:
    if not request.datasets:
        return {"result": [], "steps": [], "elapsed": 0.0, "algorithm": request.algorithm}
    
    valid_arrays: List[List[Dict[str, Any]]] = []
    for arr in request.datasets:
        if len(arr) > 0 and 'timestamp' in arr[0]:
            valid_arrays.append(arr)
            
    if not valid_arrays:
         return {"error": "Invalid datasets provided, timestamp required."}
    
    output = run_merge(valid_arrays, request.algorithm)
    return output

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
