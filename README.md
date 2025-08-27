# Drone Tracking Frontend

This project is the **frontend implementation** for a Drone Tracking System. It visualizes live drone data streamed from the backend over WebSockets, displays drones on a Mapbox map, and provides real‑time classification, listing, and interaction features.

---

## Features

* **Live WebSocket updates**: The app connects to the backend and continuously receives drone telemetry.
* **Mapbox visualization**:

  * Drones shown as markers with orientation (yaw) rendered as an arrow.
  * Each drone’s path is drawn on the map from the moment the page is opened.
  * Hovering on a marker displays altitude and flight time.
* **Drone classification**:

  * Drones with registration numbers starting with **B** are marked as **Green (Allowed)**.
  * All others are marked as **Red (Not allowed)**.
* **Drone list (side panel)**:

  * Lists all drones currently in the sky with status, altitude, and flight duration.
  * Clicking a drone in the list moves the map to that drone.
  * Clicking a drone on the map highlights it in the list.
* **Counters & dashboard**:

  * Red drones counter shown at bottom‑right of the map.
  * Small dashboard cards show totals (Total / Green / Red).
* **Responsive design**:

  * Side panel and map adapt to desktop and mobile layouts.
* **Performance**:

  * Efficient state management and Mapbox sources ensure smooth rendering even with thousands of drones.

---

## Tech Stack

* **Framework**: React (with Vite)
* **Language**: TypeScript
* **Map**: Mapbox GL JS
* **State Management**: Zustand
* **Realtime**: Socket.IO client (WebSocket)
* **Styling**: CSS modules with responsive layout

---

## Project Structure

```
src/
├─ components/
│  ├─ Map.tsx           # Mapbox rendering and overlays
│  └─ ...
├─ pages/
│  ├─ Dashboard.tsx     # Simple dashboard page
│  ├─ DronesPage.tsx    # Main live drone tracking page
├─ services/
│  └─ socket.ts         # WebSocket client logic
├─ state/
│  └─ useDronesStore.ts # Zustand store (drones, selection)
├─ App.tsx              # Router & app shell
├─ main.tsx             # Entry point
└─ index.css            # Global styles
```

---

## Setup & Running

### Prerequisites

* Node.js (>= 16)
* npm or yarn
* A Mapbox access token (free from [mapbox.com](https://www.mapbox.com/))
* Backend service running (provided with the task)

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_WS_URL=http://localhost:9013   # or backend WebSocket URL
VITE_MAPBOX_TOKEN=your-mapbox-token
```

### Run Dev Server

```bash
npm run dev
```

Open `http://localhost:5173` in the browser.

### Build for Production

```bash
npm run build
```

The output will be in the `dist/` folder.

---

## Design & Code Notes

* **Zustand store** handles all drones in memory with:

  * Path smoothing & bounding (last N points).
  * Stable ID assignment from backend IDs or registration.
* **Classification** is based on the last segment of the registration string (ex: `SG-BA` → Allowed).
* **Performance optimizations**:

  * Single GeoJSON source per layer instead of many React markers.
  * Path ring buffer to control memory.
* **Responsive CSS grid** adapts layout on small screens.

---

## Deployment

* Any static host can serve the built app (e.g., Netlify, Vercel, GitHub Pages).
* Make sure `.env` values are provided in the host environment.

---

## License

This project is for educational and demonstration purposes as part of the given task.
