# satellite dashboard

## Overview
A high-performance, real-time dashboard for aggregating and visualizing telemetry data from multiple satellite constellations. Built with a Python FastAPI backend and a React/Chart.js frontend.

## Features

- **K-Way Merge Integration**: Chronological data unification using min-heap priority queues.
- **Real-Time Visualization**: Interactive timeline and multi-metric charts for satellite health monitoring.
- **OLED Monochrome Theme**: High-contrast, premium dark mode optimized for mission control environments.
- **Custom Data Ingestion**: Support for uploading CSV/JSON telemetry datasets.
- **FastAPI Backend**: Scalable Python-based data processing and generation.

## Project Structure

- `/backend`: Python FastAPI server with data fusion algorithms and synthetic telemetry generation.
- `/frontend`: Vite-powered React application with Chart.js and Lucide icons.

## Setup Instructions

### Backend
1. Navigate to `backend/`
2. Install dependencies: `pip install -r requirements.txt`
3. Start the server: `python main.py` (Runs on port 8080)

### Frontend
1. Navigate to `frontend/`
2. Install dependencies: `npm install`
3. Start dev server: `npm run dev` (Runs on port 5173)

## Technologies Used

- **Frontend**: React, Chart.js, Lucide, Axios
- **Backend**: Python, FastAPI, Heapq, Datetime
- **Styling**: Vanilla CSS (Custom Monochrome Design System)

## Getting Started
Please refer to the source files for specific installation and usage instructions. Ensure that your local environment meets the standard requirements for the associated technologies.

## Project Structure
This project is organized into standard directories. Key configuration files and primary source code are located in the root directory.
