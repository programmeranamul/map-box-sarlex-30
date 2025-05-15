import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import customStyle from "./mapbox_styles/style.json";

mapboxgl.accessToken = "pk.eyJ1Ijoicm9uaXRqYWluIiwiYSI6ImNtYWR0cW05MDAwazEybHNmNzY1YzBjcm8ifQ.bmlMJ6vOAFces2OFHE1t1A";

export default function Map({ locations }) {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: customStyle,
        center: [76.6950, 11.4102], // Ooty coordinates
        zoom: 8,
        interactive: true,
      });
    }
  }, [locations]);

  return (
    <div ref={mapContainer} className="mapbox-map" />
  );
}