import React, { useState } from "react";
import Map from "./Map"; // import your Map component
import "./styles.css";

export default function App() {
  const [locations, setLocations] = useState("");
  const [title, setTitle] = useState("Honeymoon");
  const [description, setDescription] = useState("Julie & Alex");

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
          <input
            type="text"
            placeholder="Add your locations"
            value={locations}
            onChange={(e) => setLocations(e.target.value)}
            className="input-box"
          />
        </section>

        <section>
          <h3>2. Choose your Map Style</h3>
          <p>
            Select your preferred map style from the options listed below. Tip:
            If you do not see the map lines, try adding the locations again.
          </p>
          <div className="color-options">
            <div className="color-dot selected" style={{ backgroundColor: "#d1e8ff" }} />
            <div className="color-dot" style={{ backgroundColor: "#a0d8ef" }} />
            <div className="color-dot" style={{ backgroundColor: "#8ac6b1" }} />
            <div className="color-dot" style={{ backgroundColor: "#e5a75f" }} />
            <div className="color-dot" style={{ backgroundColor: "#b75072" }} />
            <div className="color-dot" style={{ backgroundColor: "#b0a1d8" }} />
            <div className="color-dot" style={{ backgroundColor: "#5a3974" }} />
            <div className="color-dot" style={{ backgroundColor: "#003540" }} />
            <div className="color-dot" style={{ backgroundColor: "#a8c59a" }} />
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
      </div>

      {/* Right panel */}
      <div className="right-panel">
        <div className="map-frame">
          <Map locations={locations} />
          <div className="map-labels">
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}