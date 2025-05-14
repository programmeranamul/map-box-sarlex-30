import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken = "pk.eyJ1Ijoicm9uaXRqYWluIiwiYSI6ImNtYWR0cW05MDAwazEybHNmNzY1YzBjcm8ifQ.bmlMJ6vOAFces2OFHE1t1A";

export default function Map({ locations }) {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/light-v10",
        center: [76.6950, 11.4102], // Ooty coordinates
        zoom: 8,
        interactive: true,
      });

      map.current.on('load', () => {
        // Add a source for the markers
        map.current.addSource('markers', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });

        // Add a layer for the markers
        map.current.addLayer({
          id: 'markers',
          type: 'circle',
          source: 'markers',
          paint: {
            'circle-radius': 6,
            'circle-color': '#FF5722',
            'circle-stroke-width': 0
          }
        });
      });
    }

    // Update markers when locations change
    if (map.current && map.current.loaded()) {
      const features = locations.map(loc => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: loc.coords
        },
        properties: {
          name: loc.name
        }
      }));

      map.current.getSource('markers').setData({
        type: 'FeatureCollection',
        features
      });

      // Fit bounds to show all markers
      if (features.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        features.forEach(feature => {
          bounds.extend(feature.geometry.coordinates);
        });
        map.current.fitBounds(bounds, { padding: 50 });
      }
    }
  }, [locations]);

  return (
    <div ref={mapContainer} className="mapbox-map" />
  );
}