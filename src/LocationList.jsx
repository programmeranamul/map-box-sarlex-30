import { useState, useEffect } from "react";

export default function LocationList({ locations, setLocations }) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (input.trim().length > 2) {
      const timer = setTimeout(() => {
        fetchSuggestions(input);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
    }
  }, [input]);

  const fetchSuggestions = async (query) => {
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          query
        )}.json?access_token=pk.eyJ1Ijoicm9uaXRqYWluIiwiYSI6ImNtYWR0cW05MDAwazEybHNmNzY1YzBjcm8ifQ.bmlMJ6vOAFces2OFHE1t1A`
      );
      const data = await res.json();
      setSuggestions(data.features || []);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
    }
  };

  const addLocation = (feature) => {
    const newLocation = {
      name: feature.place_name,
      coords: feature.center,
    };
    setLocations([...locations, newLocation]);
    setInput("");
    setSuggestions([]);
    setShowDropdown(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (suggestions.length > 0) {
      addLocation(suggestions[0]);
    }
  };

  const moveItem = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= locations.length) return;
    const updated = [...locations];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setLocations(updated);
  };

  return (
    <div>
      <form className="location-search-container" onSubmit={handleSubmit}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            placeholder="Search for a location..."
            className="search-input"
          />
          {showDropdown && suggestions.length > 0 && (
            <div className="location-dropdown">
              {suggestions.map((feature, i) => (
                <div
                  key={i}
                  className="location-dropdown-item"
                  onMouseDown={() => addLocation(feature)}
                >
                  {feature.place_name}
                </div>
              ))}
            </div>
          )}
        </div>
        <button type="submit" className="add-btn" aria-label="Add location">
          +
        </button>
      </form>
      
      <ul className="location-list">
        {locations.map((loc, i) => (
          <li key={i} className="location-item">
            <span className="location-name">{loc.name}</span>
            <div className="location-actions">
              <button
                className="action-btn"
                onClick={(e) => {
                  e.preventDefault();
                  moveItem(i, i - 1);
                }}
                aria-label="Move up"
                disabled={i === 0}
              >
                ↑
              </button>
              <button
                className="action-btn"
                onClick={(e) => {
                  e.preventDefault();
                  moveItem(i, i + 1);
                }}
                aria-label="Move down"
                disabled={i === locations.length - 1}
              >
                ↓
              </button>
              <button
                className="action-btn"
                onClick={(e) => {
                  e.preventDefault();
                  const updated = [...locations];
                  updated.splice(i, 1);
                  setLocations(updated);
                }}
                aria-label="Delete"
              >
                ×
              </button>
            </div>
          </li>
        ))}
      </ul>
      
      {locations.length > 0 && (
        <button
          className="reset-all-btn"
          onClick={(e) => {
            e.preventDefault();
            setLocations([]);
          }}
        >
          Reset All Locations
        </button>
      )}
    </div>
  );
}