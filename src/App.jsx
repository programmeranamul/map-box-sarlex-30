import React, { useState, useRef } from "react";
import Map from "./Map";
import LocationList from "./LocationList";
import customStyles from "./mapbox_styles/style.json";
import domtoimage from "dom-to-image-more";
import 'mapbox-gl/dist/mapbox-gl.css';
import "./styles.css";

export default function App() {
  const [locations, setLocations] = useState([]);
  const [title, setTitle] = useState("Honeymoon");
  const [description, setDescription] = useState("Julie & Alex");
  const [selectedStyleKey, setSelectedStyleKey] = useState(Object.keys(customStyles)[0]); // default first

  const mapRef = useRef(null); // NEW: reference to map frame

  const handleDownload = () => {
    if (mapRef.current) {
      domtoimage.toPng(mapRef.current, { cacheBust: true })
        .then((dataUrl) => {
          const link = document.createElement("a");
          link.download = "travel-map.png";
          link.href = dataUrl;
          link.click();
        })
        .catch((error) => {
          console.error("Could not generate image", error);
        });
    }
  };

  return (
    <div className="app-container">
      {/* Left panel */}
      <div className="left-panel">
        <h1>Create your travel map</h1>

        <section>
          <h3>1. Add your locations</h3>
          <p>
            Use the search bar to add your destinations. Drag and move the
            locations using the three-line icon.
          </p>
          <LocationList locations={locations} setLocations={setLocations} />
        </section>

        <section>
          <h3>2. Choose your Map Style</h3>
          <div className="color-options">
            {Object.entries(customStyles).map(([key, style], idx) => (
              <div
                key={key}
                className={`color-dot ${selectedStyleKey === key ? "selected" : ""}`}
                style={{ backgroundColor: style.metadata?.color || "#ccc" }}
                onClick={() => setSelectedStyleKey(key)}
              />
            ))}
          </div>
        </section>

        <section>
          <h3>3. Name your journey</h3>
          <p>Give a memorable title & description in the text fields to personalize your map</p>
          <input
            type="text"
            placeholder="Name your journey"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-box"
          />
          <input
            type="text"
            placeholder="Add description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-box"
          />
        </section>

        {/* Download button */}
        <button onClick={handleDownload} className="download-button">
          Download Map Poster
        </button>
      </div>

      {/* Right panel */}
      <div className="right-panel">
        <div className="map-frame" ref={mapRef}>
          <Map locations={locations} styleJSON={customStyles[selectedStyleKey]} />
          <div className="map-labels">
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}