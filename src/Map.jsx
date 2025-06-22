// map.jsx
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = "pk.eyJ1Ijoicm9uaXRqYWluIiwiYSI6ImNtYWR0cW05MDAwazEybHNmNzY1YzBjcm8ifQ.bmlMJ6vOAFces2OFHE1t1A";

const commonStyle = {
  markerSize: 20, // diameter in px
  labelFontFamily: ["EB Garamond Bold"],
}

const styleLight = {
  markerColor: "#ffffff",
  markerTextColor: "#211522", // Dark color for light markers
  markerBorderColor: "#ffffff",
  labelTextColor: "#ffffff",
  routeLineColor: "#ffffff",
  routeLineWidth: 2,
  routeDashArray: [1, 2],
  routeLineOpacity: 0.8,
  ...commonStyle
};

const styleDark = {
  markerColor: "#1a1a1a",
  markerTextColor: "#EFF1DB", // Light color for dark markers
  markerBorderColor: "#1a1a1a",
  labelTextColor: "#1a1a1a",
  routeLineColor: "#1a1a1a",
  routeLineWidth: 2,
  routeDashArray: [1, 2],
  routeLineOpacity: 0.8,
  ...commonStyle
};

const styleLight1 = {
  markerColor: "#EFF1DB",
  markerBorderColor: "#EFF1DB",
  labelTextColor: "#EFF1DB",
  routeLineColor: "#FFD4DB",
  routeLineWidth: 2,
  routeDashArray: [1, 2],
  routeLineOpacity: 0.6,
  ...commonStyle
};

const styleDark1 = {
  markerColor: "#211522",
  markerBorderColor: "#211522",
  labelTextColor: "#211522",
  routeLineColor: "#613659",
  routeLineWidth: 2,
  routeDashArray: [1, 2],
  routeLineOpacity: 0.6,
  ...commonStyle
};

const mapStyles  = {
  "Basic": styleDark,
  "Monochrome - Sky blue": styleDark,
  "Monochrome - Vintage - Green": styleDark,
  "Monochrome - Rusty": styleLight,
  "Monochrome - Pink": styleDark,
  "Monochrome - Lavender": styleDark,
  "Monochrome - Royal Purple": styleLight,
  "Monochrome - Midnight Green": styleLight,
  "Monochrome - Light Green": styleLight,
  "IMP V2 RED": styleLight,
  "IMP V2 Grey": styleLight
};

async function getCountryBbox(lngLat) {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lngLat[0]},${lngLat[1]}.json` +
              `?types=country&access_token=${mapboxgl.accessToken}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.features && data.features[0] && data.features[0].bbox) {
    return data.features[0].bbox; // [minLng,minLat,maxLng,maxLat]
  }
  return null;
}

export default function Map({ locations, styleJSON, camera, isScreenshotMode, mapSize }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);
  const routeLayerId = "route";
  const labelSourceId = "label-source";
  const labelLayerId = "label-layer";
  const styleKey = styleJSON['name'];

  useEffect(() => {

    const initialCenter = camera?.center || [76.6950, 11.4102];
    const initialZoom = camera?.zoom ?? 8;
    const initialBearing = camera?.bearing ?? 0;
    const initialPitch = camera?.pitch ?? 0;

    console.log("Camera settings:", {
      center: initialCenter,
      zoom: initialZoom,
      bearing: initialBearing,
      pitch: initialPitch
    });
    const mapInitOptions = {
      container: mapContainer.current,
      style: styleJSON,
      center: initialCenter,
      zoom: initialZoom,
      bearing: initialBearing,
      pitch: initialPitch,
      interactive: true,
      preserveDrawingBuffer: true,
      attributionControl: false,
    };

    if (!map.current) {
      map.current = new mapboxgl.Map(mapInitOptions);
    } else {
      console.warn("Map instance already exists, skipping initialization.");
      console.log('setting new camera settings', camera);
      map.current.resize();
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
  
  }, [styleJSON, camera, mapSize]);

  useEffect(() => {

    if (!map.current) return;
    let style = mapStyles[styleKey];
    
    if (locations.length === 0) {
      markers.current.forEach(marker => marker.remove());
      markers.current = [];
  
      if (map.current.getLayer("route")) map.current.removeLayer("route");
      if (map.current.getSource("route")) map.current.removeSource("route");
  
      if (map.current.getLayer("label-layer")) map.current.removeLayer("label-layer");
      if (map.current.getSource("label-source")) map.current.removeSource("label-source");
      return;
    }

    const locationAdded = [];
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
      // Inside the locations.forEach loop in applyLocationLogic
      locations.forEach((loc, index) => {

        if (locationAdded.includes(loc.name)) {
          return;
        }
        locationAdded.push(loc.name);

        const el = document.createElement("div");
        const size = style.markerSize;
        
        // Marker styling
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.backgroundColor = style.markerColor;
        el.style.border = `2px solid ${style.markerBorderColor}`;
        el.style.borderRadius = "50%";

        // Number element
        const number = document.createElement("span");
        number.className = "marker-number";
        number.textContent = index + 1; // Sequence starts at 1
        number.style.position = "absolute";
        number.style.top = "50%";
        number.style.left = "50%";
        number.style.transform = "translate(-50%, -50%)";
        number.style.color = style.markerTextColor; // Use the new color
        number.style.fontFamily = style.labelFontFamily.join(", ");
        number.style.fontSize = "10px";
        number.style.fontWeight = "bold";
        number.style.userSelect = "none"; // Prevent text selection
        el.appendChild(number);

        // Create and add marker
        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat(loc.coords)
          .addTo(map.current);
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
            "text-font": style.labelFontFamily,
            "text-offset": [0, 0.5], // Subtle offset
            "text-anchor": "top",
            "text-allow-overlap": true,
            "text-size": 20
          },
          paint: {
            "text-color": style.labelTextColor
          }
        });
      }

      if (locations.length === 1) {
        // If only one location, center there
        map.current.setCenter(locations[0].coords);
        map.current.setZoom(12);
      } else {
        if (!isScreenshotMode) {
          // Fit all markers with padding
          map.current.fitBounds(bounds, {
            padding: 100,
            maxZoom: 12,
            linear: true
          });
        }

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
                "line-color": style.routeLineColor,         // Subtle dark gray
                "line-width": style.routeLineWidth,              // Thinner line
                "line-dasharray": style.routeDashArray,     // Dashed pattern: 2px dash, 4px gap
                "line-opacity": style.routeLineOpacity       // Slight transparency for elegance
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

  }, [locations, styleJSON, styleKey]);

  return (
    <div ref={mapContainer} className="mapbox-map" />
  );
}