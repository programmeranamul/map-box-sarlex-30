import { useState } from "react";

export default function LocationList({ locations, setLocations }) {
  const [input, setInput] = useState("");

  const addLocation = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          input
        )}.json?access_token=pk.eyJ1Ijoicm9uaXRqYWluIiwiYSI6ImNtYWR0cW05MDAwazEybHNmNzY1YzBjcm8ifQ.bmlMJ6vOAFces2OFHE1t1A`
      );
      const data = await res.json();
      
      if (data.features && data.features.length > 0) {
        const newLocation = {
          name: data.features[0].place_name,
          coords: data.features[0].center,
        };
        
        setLocations([...locations, newLocation]);
        setInput("");
      }
    } catch (error) {
      console.error("Error fetching location:", error);
    }
  };

  return (
    <div>
      <form className="location-form" onSubmit={addLocation}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add your locations"
          className="modern-input"
        />
        <button type="submit" className="add-btn" aria-label="Add location">+</button>
      </form>
      <ul className="location-list">
        {locations.map((loc, i) => (
          <li key={i}>{loc.name}</li>
        ))}
      </ul>
    </div>
  );
} 