import { useState } from "react";
import LocationList from "./LocationList.jsx";
import Map from "./Map.jsx";
import "./styles.css";

export default function App() {
  const [locations, setLocations] = useState([]);
  const [theme, setTheme] = useState("ocean");
  const [layout, setLayout] = useState("portrait");
  const [title, setTitle] = useState("Honeymoon");
  const [subtitle, setSubtitle] = useState("Julie & Alex");

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };

  const toggleLayout = () => {
    setLayout(prev => prev === "portrait" ? "landscape" : "portrait");
  };

  return (
    <div className="container">
      <div className="sidebar">
        <h1>Create your travel map</h1>

        <div className="step">
          <h2>1. Add your locations</h2>
          <LocationList locations={locations} setLocations={setLocations} />
        </div>

        <div className="step">
          <h2>2. Choose your Map Style</h2>
          <div className="theme-buttons">
            <button onClick={() => handleThemeChange('ocean')}></button>
            <button onClick={() => handleThemeChange('sunset')}></button>
            <button onClick={() => handleThemeChange('mint')}></button>
            <button onClick={() => handleThemeChange('desert')}></button>
            <button onClick={() => handleThemeChange('violet')}></button>
          </div>
        </div>

        <div className="step">
          <h2>3. Name your journey</h2>
          <input 
            type="text" 
            placeholder="Name your journey" 
            value={title}
            onChange={(e) => setTitle(e.target.value || 'Honeymoon')}
          />
          <input 
            type="text" 
            placeholder="Add description" 
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value || 'Julie & Alex')}
          />
        </div>

        <div className="step">
          <h2>4. Choose map orientation</h2>
          <button onClick={toggleLayout}>
            Switch to {layout === "portrait" ? "landscape" : "portrait"}
          </button>
        </div>

        <button className="download-btn">Download HD Printable Map</button>
      </div>

      <div id="poster" className={`poster ${layout} ${theme} rectangle`}>
        <div className="map-container">
          <Map locations={locations} />
        </div>
        <div className="details">
          <h1 id="place-title">{title}</h1>
          <h2 id="place-subtitle">{subtitle}</h2>
        </div>
      </div>
    </div>
  );
}