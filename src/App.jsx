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
  const [mapSize, setMapSize] = useState("A3"); // Default to A3
  const [selectedStyleKey, setSelectedStyleKey] =
    useState(Object.keys(customStyles)[0]);
  const [camera, setCamera] = useState(null); // ← added camera state
  const mapRef = useRef(null);
  const [isScreenshotMode, setIsScreenshotMode] = useState(false);

  const sizePresets = {
    A4: { width: 794, height: 1123 }, // 72 DPI preview of 210mm x 297mm
    A3: { width: 1123, height: 1587 }, // 297mm x 420mm
    Polaroid: { width: 800, height: 950 }, // Approx. square with room for label
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

    if (qCenter || qZoom || qBearing || qPitch) {
      const parsedCamera = {
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
      const map = window.__MAP__; // assuming you expose the map instance globally
      const camera = {
        center: map.getCenter(),     // { lng, lat }
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch()
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
          mapSize
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
    <div className={`app-container ${isScreenshotMode ? "screenshot-mode" : ""}`}>
      <div className="left-panel">
        <h1>Create your travel map</h1>

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
        <div className="map-frame" ref={mapRef}>
          <div className="map-inner">
            <div className="map-area">
              <Map
                locations={locations}
                styleJSON={customStyles[selectedStyleKey]}
                camera={camera}
                isScreenshotMode={isScreenshotMode}
              />
              <div className="map-labels">
                <h2>{title}</h2>
                <p>{description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}