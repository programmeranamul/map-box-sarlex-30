import React, { useState, useRef } from "react";
import Map from "./Map";
import LocationList from "./LocationList";
import customStyles from "./mapbox_styles/style.json";
import html2canvas from "html2canvas";            // ← switch to html2canvas
import 'mapbox-gl/dist/mapbox-gl.css';
import "./styles.css";

export default function App() {
  const [locations, setLocations] = useState([]);
  const [title, setTitle] = useState("Honeymoon");
  const [description, setDescription] = useState("Julie & Alex");
  const [selectedStyleKey, setSelectedStyleKey] =
    useState(Object.keys(customStyles)[0]);

  const mapRef = useRef(null);

  const handleDownload = async () => {
    if (!mapRef.current) return;
    const node = mapRef.current;

    // set up scale for ~300 dpi on a 100 dpi screen
    const scale = 14;

    try {
      const canvas = await html2canvas(node, {
        backgroundColor: null,
        useCORS: true,
        scale,
        logging: false
      });

      // Trigger download
      canvas.toBlob((blob) => {
        const link = document.createElement("a");
        link.download = "travel-map-highres.png";
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
      }, "image/png");

    } catch (err) {
      console.error("High‑res download failed:", err);
    }
  };

  return (
    <div className="app-container">
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