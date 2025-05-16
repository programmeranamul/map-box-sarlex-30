import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken = "pk.eyJ1Ijoicm9uaXRqYWluIiwiYSI6ImNtYWR0cW05MDAwazEybHNmNzY1YzBjcm8ifQ.bmlMJ6vOAFces2OFHE1t1A";

export default function Map({ locations, styleJSON }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);

  useEffect(() => {
    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: styleJSON,
        center: [76.6950, 11.4102], // Initial center (e.g., Ooty)
        zoom: 8,
        interactive: true,
        preserveDrawingBuffer: true,
        attributionControl: false
      });
    } else {
      map.current.setStyle(styleJSON);
    }
  }, [styleJSON]);

  useEffect(() => {
    if (!map.current || !locations.length) return;
    console.log(locations);
    // Remove old markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    const bounds = new mapboxgl.LngLatBounds();

    locations.forEach(loc => {
      const marker = new mapboxgl.Marker().setLngLat(loc.coords).addTo(map.current);
      markers.current.push(marker);
      bounds.extend(loc.coords);
    });

    if (locations.length === 1) {
      // If only one location, center there
      map.current.setCenter(locations[0].coords);
      map.current.setZoom(12);
    } else {
      // Fit all markers with padding
      map.current.fitBounds(bounds, {
        padding: 100,
        maxZoom: 12,
        linear: true
      });
    }
  }, [locations]);

  return (
    <div ref={mapContainer} className="mapbox-map" />
  );
}