/* eslint-disable no-unused-vars */
// App.jsx
import React, { useState, useRef } from "react";
import Map from "./Map";
import LocationList from "./LocationList";
import customStyles from "./mapbox_styles/style.json";
import 'mapbox-gl/dist/mapbox-gl.css';
import "./styles.css";
import { useEffect } from "react";

export default function App() {
  const [locations, setLocations] = useState([]);
  const [title, setTitle] = useState("Honeymoon");
  const [description, setDescription] = useState("Julie & Alex");
  const [mapSize, setMapSize] = useState("A4"); // Default to A3
  const [selectedStyleKey, setSelectedStyleKey] =
    useState(Object.keys(customStyles)[0]);
  const [camera, setCamera] = useState(null); // ← added camera state
  const mapRef = useRef(null);
  const [isScreenshotMode, setIsScreenshotMode] = useState(false);
  const [forcedSize, setForcedSize] = useState(null);

  const sizePresets = {
    A4: { 
      width: 794,     // 210mm @72dpi (preview)
      height: 1123,   // 297mm @72dpi
      printWidth: 2480, // 300dpi actual size
      printHeight: 3508,
      aspectRatio: 210/297
    },
    Polaroid: {
      width: 600,     // ~79mm @72dpi
      height: 600,    // Square preview
      printWidth: 2550, // 300dpi (85x110mm)
      printHeight: 3300,
      aspectRatio: 85/110
    },
    "Instax Mini": {
      width: 500,     // 54mm @72dpi
      height: 800,    // 86mm @72dpi
      printWidth: 637,  // 300dpi actual size
      printHeight: 1016,
      aspectRatio: 54/86
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
  
    // Title & Description
    const qTitle = params.get("title");
    const qDesc = params.get("description");
    if (qTitle) setTitle(qTitle);
    if (qDesc) setDescription(qDesc);
  
    // Style
    const qStyle = params.get("style");
    if (qStyle && customStyles[qStyle]) {
      setSelectedStyleKey(qStyle);
    }
    
    const qWidth = parseInt(params.get("clientWidth"));
    const qHeight = parseInt(params.get("clientHeight"));
    if (qWidth && qHeight) {
      setForcedSize({ width: qWidth, height: qHeight });
    }

    // Locations
    const qLocs = params.get("locs");
    if (qLocs) {
      try {
        const parsed = JSON.parse(qLocs);
        if (Array.isArray(parsed)) setLocations(parsed);
      } catch (err) {
        console.warn("Invalid locations query param");
      }
    }

    if (params.get("screenshot") === "true") {
      setIsScreenshotMode(true);
    }

    const qSize = params.get("size");
    if (qSize && sizePresets[qSize]) {
      setMapSize(qSize);
    }
    
    const qCenter = params.get("center");
    const qZoom = parseFloat(params.get("zoom"));
    const qBearing = parseFloat(params.get("bearing"));
    const qPitch = parseFloat(params.get("pitch"));

    const qBounds = params.get("bounds");
    console.log('qBounds', qBounds);
    if (qCenter || qZoom || qBearing || qPitch) {
      const parsedCamera = {
        bounds: JSON.parse(qBounds), // bounds = [[sw_lng, sw_lat], [ne_lng, ne_lat]]
        center: qCenter ? JSON.parse(qCenter) : undefined,
        zoom: qZoom ? parseFloat(qZoom) : undefined,
        bearing: qBearing ? parseFloat(qBearing) : undefined,
        pitch: qPitch ? parseFloat(qPitch) : undefined,
      };
      setCamera(parsedCamera);
    }
  }, []);

  const handleDownload = async () => {
    try {
      const container = mapRef.current;
      const { width: clientWidth, height: clientHeight } = container.getBoundingClientRect();
      console.log('container', mapRef);
      console.log('ref', container);
      console.log('clientWidth', clientWidth, 'clientHeight', clientHeight);
      const { printWidth, printHeight } = sizePresets[mapSize];
    
      // Validate print dimensions
      if (!printWidth || !printHeight) {
        throw new Error('Invalid print size selected');
      }

      const map = window.__MAP__; // assuming you expose the map instance globally
      const bounds = map.getBounds(); // mapboxgl.LngLatBounds
      const camera = {
        center: map.getCenter(),     // { lng, lat }
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch(),
        bounds: [
          [bounds.getSouthWest().lng, bounds.getSouthWest().lat],
          [bounds.getNorthEast().lng, bounds.getNorthEast().lat]
        ]
      };
      

      const resp = await fetch("/api/print-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locations,
          title,
          description,
          styleKey: selectedStyleKey,
          camera,
          mapSize,
          printWidth,
          printHeight,
          clientWidth,
          clientHeight,
        })
      });
  
      if (!resp.ok) throw new Error("Print failed");
  
      const blob = await resp.blob();
      const link = document.createElement("a");
      link.download = "travel-map-A3-300dpi.png";
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error(err);
      alert("Print‑quality map generation failed.");
    }
  };  
  

  return (
    <div className={`app-container ${isScreenshotMode ? "screenshot-mode" : ""}`}
    data-size={isScreenshotMode ? mapSize : null}
    >
      <div className="left-panel">
        <h1>Add your travel pins</h1>

        <section>
          <h3>1. Add your locations</h3>
          <p>Use the search bar to add destinations…</p>
          <LocationList
            locations={locations}
            setLocations={setLocations}
          />
        </section>

        <section>
          <h3>2. Choose your Map Style</h3>
          <div className="color-options">
            {Object.entries(customStyles).map(
              ([key, style]) => (
                <div
                  key={key}
                  className={`color-dot ${
                    selectedStyleKey === key ? "selected" : ""
                  }`}
                  style={{
                    backgroundColor: style.metadata?.color || "#ccc",
                  }}
                  onClick={() => setSelectedStyleKey(key)}
                />
              )
            )}
          </div>
        </section>

        <section>
          <h3>4. Choose Map Size</h3>
          <div className="size-options">
            {Object.keys(sizePresets).map((sizeKey) => (
              <button
                key={sizeKey}
                className={`size-button ${mapSize === sizeKey ? "selected" : ""}`}
                onClick={() => setMapSize(sizeKey)}
              >
                {sizeKey}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3>3. Name your journey</h3>
          <p>Give a memorable title & description…</p>
          <input
            className="input-box"
            type="text"
            placeholder="Name your journey"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            className="input-box"
            type="text"
            placeholder="Add description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </section>

        <button
          className="download-button"
          onClick={handleDownload}
        >
          Download Map Poster
        </button>
      </div>

      <div className="right-panel">
      <div className={`map-inner ${mapSize === 'Polaroid' ? 'size-preset-polaroid' : ''} ${mapSize === 'Instax Mini' ? 'size-preset-instax' : ''}`}
        ref={mapRef}
        style={{
          '--map-aspect': sizePresets[mapSize].aspectRatio,
          '--forced-width': `363.8125px`,
          '--forced-height': `514.5499877929688px`,
        }}
      >
          <div className={`map-area ${isScreenshotMode ? "" : ""}`}>
            { (true) && (
              <Map
              locations={locations}
              styleJSON={customStyles[selectedStyleKey]}
              camera={camera}
              isScreenshotMode={isScreenshotMode}
              mapSize={mapSize}
            />
            )
          }
            <div className="map-labels">
              <h2>{title}</h2>
              <p>{description}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}