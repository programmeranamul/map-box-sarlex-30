// map.jsx
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = "pk.eyJ1Ijoicm9uaXRqYWluIiwiYSI6ImNtYWR0cW05MDAwazEybHNmNzY1YzBjcm8ifQ.bmlMJ6vOAFces2OFHE1t1A";

const commonStyle = {
  markerSize: 15, // diameter in px
  labelFontFamily: ["EB Garamond Regular"],
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

export default function Map({ locations, styleJSON, camera, isScreenshotMode }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);
  const routeLayerId = "route";
  const labelSourceId = "label-source";
  const labelLayerId = "label-layer";
  const styleKey = styleJSON['name'];

  useEffect(() => {
    if (isScreenshotMode && map.current) {
      setTimeout(() => {
        map.current.resize();
        // Re-apply camera settings after resize
        if (camera?.center) map.current.setCenter(camera.center);
        if (camera?.zoom !== undefined) map.current.setZoom(camera.zoom);
        if (camera?.bearing !== undefined) map.current.setBearing(camera.bearing);
        if (camera?.pitch !== undefined) map.current.setPitch(camera.pitch);
      }, 0); // Adjust delay as needed
    }
  }, [isScreenshotMode, camera]);

  useEffect(() => {

    const initialCenter = camera?.center || [76.6950, 11.4102];
    const initialZoom = camera?.zoom ?? 8;
    const initialBearing = camera?.bearing ?? 0;
    const initialPitch = camera?.pitch ?? 0;

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

      // ✅ Step 1: Create outer container
      const minimapContainer = document.createElement('div');
      minimapContainer.className = 'minimap-container'; // This sets size, border, etc.

      // ✅ Step 2: Append to DOM first
      map.current.getContainer().appendChild(minimapContainer);

      // ✅ Step 3: Create inner container with full size
      const minimapInnerContainer = document.createElement('div');
      minimapInnerContainer.style.width = '100%';
      minimapInnerContainer.style.height = '100%';

      // ✅ Step 4: Append inner container to outer container
      minimapContainer.appendChild(minimapInnerContainer);

      // ✅ Step 5: Initialize minimap AFTER container is mounted
      const minimap = new mapboxgl.Map({
        container: minimapInnerContainer,
        style: styleJSON,
        center: [78.9629, 20.5937],
        zoom: 3.5,
        interactive: false,
        attributionControl: false,
        preserveDrawingBuffer: true,
        maxBounds: [
          [68.1, 6.7],
          [97.4, 35.7]
        ]
      });
    
      // Add viewport box
      minimap.on('load', () => {
        // Add bounding box layer
        minimap.addSource('viewport', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[]]
            }
          }
        });
        
        minimap.addLayer({
          id: 'viewport-box',
          type: 'line',
          source: 'viewport',
          paint: {
            'line-color': '#FF0000',
            'line-width': 2
          }
        });
    
        // Hide unnecessary map elements
        minimap.setRenderWorldCopies(false); // Hide other countries
        minimap.setPadding({ top: 10, bottom: 10, left: 10, right: 10 });

        minimap.resize();
      });
    
      // Update viewport box position
      const updateViewportBox = () => {
        const bounds = map.current.getBounds();
        const coordinates = [
          [bounds.getWest(), bounds.getSouth()],
          [bounds.getEast(), bounds.getSouth()],
          [bounds.getEast(), bounds.getNorth()],
          [bounds.getWest(), bounds.getNorth()],
          [bounds.getWest(), bounds.getSouth()]
        ];
        
        if (minimap.getSource('viewport')) {
          minimap.getSource('viewport').setData({
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [coordinates]
            }
          });
          
          // Maintain India-centric view
          minimap.fitBounds([[68.1, 6.7], [97.4, 35.7]], {
            padding: 20,
            duration: 0
          });
        }
      };
    
      map.current.on('moveend', updateViewportBox);
      

    } else {
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
    let style = mapStyles[styleKey];
    
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
        const el = document.createElement("div");
        const size = style.markerSize;
        
        // Marker styling
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.backgroundColor = style.markerColor;
        el.style.border = `2px solid ${style.markerBorderColor}`;
        el.style.borderRadius = "50%";

        // Number element
        const numberText = loc.number ? loc.number : index + 1;
        const number = document.createElement("span");
        number.textContent = numberText; // Sequence starts at 1
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
            "text-offset": [0, 0.1], // Subtle offset
            "text-anchor": "top",
            "text-allow-overlap": true
          },
          paint: {
            "text-color": style.labelTextColor,
            "text-size": [
              "interpolate",
              ["linear"],
              ["zoom"],
              5, 12,
              10, 16,
              15, 20
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
        if (!isScreenshotMode) {
          map.current.fitBounds(bounds, {
            padding: isScreenshotMode ? 0: 100,
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