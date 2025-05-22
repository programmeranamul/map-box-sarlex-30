// map.jsx
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = "pk.eyJ1Ijoicm9uaXRqYWluIiwiYSI6ImNtYWR0cW05MDAwazEybHNmNzY1YzBjcm8ifQ.bmlMJ6vOAFces2OFHE1t1A";

export default function Map({ locations, styleJSON, camera, isScreenshotMode }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);
  const routeLayerId = "route";
  const labelSourceId = "label-source";
  const labelLayerId = "label-layer";

  useEffect(() => {
    if (isScreenshotMode && map.current) {
      setTimeout(() => {
        map.current.resize();
      }, 300); // slight delay to let CSS apply
    }
  }, [isScreenshotMode]);

  useEffect(() => {

    const initialCenter = camera?.center || [76.6950, 11.4102];
    const initialZoom = camera?.zoom ?? 8;
    const initialBearing = camera?.bearing ?? 0;
    const initialPitch = camera?.pitch ?? 0;
    if (!map.current) {
      console.log('cam init', camera);
      console.log(initialCenter, initialZoom, initialBearing, initialPitch);
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: styleJSON,
        center: initialCenter,
        zoom: initialZoom,
        bearing: initialBearing,
        pitch: initialPitch,
        interactive: true,
        preserveDrawingBuffer: true,
        attributionControl: false,
      });
    } else {
      console.log('cam style', camera);
      console.log(initialCenter, initialZoom, initialBearing, initialPitch);
      map.current.setStyle(styleJSON);

      if (camera?.center) {
        map.current.setCenter(camera.center);
      }
      if (typeof camera?.zoom === "number") {
        map.current.setZoom(camera.zoom);
      }
      if (typeof camera?.bearing === "number") {
        map.current.setBearing(camera.bearing);
      }
      if (typeof camera?.pitch === "number") {
        map.current.setPitch(camera.pitch);
      }
    }
  
    // 👇 Expose actual map instance for Puppeteer
    window.__MAP__ = map.current;
  
  }, [styleJSON, camera]);

  useEffect(() => {
    if (!map.current || !locations.length) return;

    const applyLocationLogic = () => {
      // Remove old markers
      markers.current.forEach(marker => marker.remove());
      markers.current = [];

      const labelGeoJSON = {
        type: "FeatureCollection",
        features: locations.map((loc) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: loc.coords,
          },
          properties: {
            title: loc.name.split(",")[0], // Only first word
          },
        })),
      };

      // Safely remove previous route layer & source
      if (map.current.getLayer(routeLayerId)) {
        map.current.removeLayer(routeLayerId);
      }
      if (map.current.getSource(routeLayerId)) {
        map.current.removeSource(routeLayerId);
      }

      const bounds = new mapboxgl.LngLatBounds();
      locations.forEach(loc => {
        const el = document.createElement("div");
        el.style.width = "10px";
        el.style.height = "10px";
        el.style.backgroundColor = "#1a1a1a"; // Unified fill + border color
        el.style.borderRadius = "50%";
        el.style.border = "2px solid #1a1a1a"; // Same as fill

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat(loc.coords)
          .addTo(map.current); // Always show the label
        markers.current.push(marker);
        bounds.extend(loc.coords);
      });

      if (map.current.getSource(labelSourceId)) {
        // If already exists, just update data
        map.current.getSource(labelSourceId).setData(labelGeoJSON);
      } else {
        // Otherwise, add new source and layer
        map.current.addSource(labelSourceId, {
          type: "geojson",
          data: labelGeoJSON,
        });

        map.current.addLayer({
          id: labelLayerId,
          type: "symbol",
          source: labelSourceId,
          layout: {
            "text-field": ["get", "title"],
            "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
            "text-offset": [0, 0.1], // Subtle offset
            "text-anchor": "top",
            "text-allow-overlap": true
          },
          paint: {
            "text-color": "#1a1a1a",
            "text-size": [
              "interpolate",
              ["linear"],
              ["zoom"],
              5, 8,
              10, 10,
              15, 12
            ]
          }
        });
      }

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

        // Build a request to the Directions API
        const coords = locations.map((loc) => loc.coords.join(',')).join(';');

        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?geometries=geojson&access_token=${mapboxgl.accessToken}`;

        fetch(url)
          .then((res) => res.json())
          .then((data) => {
            console.log(data);
            if (!data.routes || !data.routes[0]) return;
            const route = data.routes[0].geometry;

            map.current.addSource(routeLayerId, {
              type: "geojson",
              data: {
                type: "Feature",
                geometry: route
              }
            });

            map.current.addLayer({
              id: routeLayerId,
              source: routeLayerId,
              layout: {
                "line-join": "round",
                "line-cap": "round"
              },
              type: "line",
              paint: {
                "line-color": "#1a1a1a",         // Subtle dark gray
                "line-width": 2,              // Thinner line
                "line-dasharray": [1, 2],     // Dashed pattern: 2px dash, 4px gap
                "line-opacity": 0.6          // Slight transparency for elegance
              }
            });
          })
          .catch((err) => console.error("Directions API error:", err));
      }
    }

    // Wait for style to be ready before applying sources/layers
    if (map.current.isStyleLoaded()) {
      applyLocationLogic();
    } else {
      map.current.once("style.load", applyLocationLogic);
    }

  }, [locations, styleJSON]);

  return (
    <div ref={mapContainer} className="mapbox-map" />
  );
}