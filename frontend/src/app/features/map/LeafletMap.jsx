"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Crosshair, Layers, ZoomIn, ZoomOut } from "lucide-react";

export default function LeafletMap({
  center = [51.1605, 71.4704], // Default: Astana, Kazakhstan
  zoom = 10,
  markers = [],
  onLocationSelect,
  selectable = false,
  className = "",
  height = "400px",
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const selectedMarkerRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [L, setL] = useState(null);

  useEffect(() => {
    // Dynamically import Leaflet
    const loadLeaflet = async () => {
      const leaflet = await import("leaflet");
      setL(leaflet.default);

      // Import CSS
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      // Fix default marker icons
      delete leaflet.default.Icon.Default.prototype._getIconUrl;
      leaflet.default.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      setIsLoaded(true);
    };

    loadLeaflet();
  }, []);

  useEffect(() => {
    if (!isLoaded || !L || !mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView(center, zoom);

    // Add tile layer (OpenStreetMap)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Add click handler for selectable maps
    if (selectable) {
      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        setSelectedLocation({ lat, lng });

        // Remove previous selected marker
        if (selectedMarkerRef.current) {
          map.removeLayer(selectedMarkerRef.current);
        }

        // Create custom green marker icon
        const greenIcon = L.divIcon({
          className: "custom-marker",
          html: `<div style="
            background: linear-gradient(135deg, #22c55e, #16a34a);
            width: 32px;
            height: 32px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          "><div style="
            width: 12px;
            height: 12px;
            background: white;
            border-radius: 50%;
            transform: rotate(45deg);
          "></div></div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        });

        // Add new selected marker
        const marker = L.marker([lat, lng], { icon: greenIcon }).addTo(map);
        marker.bindPopup(
          `<div class="text-center p-2">
            <p class="font-semibold text-green-700">Выбранная локация</p>
            <p class="text-sm text-gray-600">${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
          </div>`
        );
        selectedMarkerRef.current = marker;

        if (onLocationSelect) {
          onLocationSelect({ lat, lng });
        }
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isLoaded, L, center, zoom, selectable, onLocationSelect]);

  // Update markers when they change
  useEffect(() => {
    if (!mapInstanceRef.current || !L) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Add new markers
    markers.forEach((markerData) => {
      const { lat, lng, title, description, type = "default" } = markerData;

      // Create custom icon based on type
      const iconColors = {
        farm: { primary: "#22c55e", secondary: "#16a34a" },
        pasture: { primary: "#eab308", secondary: "#ca8a04" },
        drone: { primary: "#3b82f6", secondary: "#2563eb" },
        default: { primary: "#22c55e", secondary: "#16a34a" },
      };

      const colors = iconColors[type] || iconColors.default;

      const customIcon = L.divIcon({
        className: "custom-marker",
        html: `<div style="
          background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary});
          width: 28px;
          height: 28px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
        "><div style="
          width: 10px;
          height: 10px;
          background: white;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(
        mapInstanceRef.current
      );

      if (title || description) {
        marker.bindPopup(
          `<div class="p-2">
            ${title ? `<p class="font-semibold text-gray-900">${title}</p>` : ""}
            ${description ? `<p class="text-sm text-gray-600">${description}</p>` : ""}
          </div>`
        );
      }

      markersRef.current.push(marker);
    });
  }, [markers, L]);

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  const handleLocateUser = () => {
    if (mapInstanceRef.current && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          mapInstanceRef.current.setView([latitude, longitude], 14);

          if (selectable) {
            setSelectedLocation({ lat: latitude, lng: longitude });
            if (onLocationSelect) {
              onLocationSelect({ lat: latitude, lng: longitude });
            }
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
        }
      );
    }
  };

  return (
    <div className={`relative rounded-xl overflow-hidden ${className}`} style={{ height }}>
      {/* Loading State */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-secondary flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground">Загрузка карты...</p>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Custom Controls */}
      {isLoaded && (
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-10 h-10 bg-card hover:bg-secondary rounded-lg shadow-lg flex items-center justify-center transition-colors border border-border"
            title="Приблизить"
          >
            <ZoomIn className="w-5 h-5 text-foreground" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-10 h-10 bg-card hover:bg-secondary rounded-lg shadow-lg flex items-center justify-center transition-colors border border-border"
            title="Отдалить"
          >
            <ZoomOut className="w-5 h-5 text-foreground" />
          </button>
          <button
            type="button"
            onClick={handleLocateUser}
            className="w-10 h-10 bg-card hover:bg-secondary rounded-lg shadow-lg flex items-center justify-center transition-colors border border-border"
            title="Моё местоположение"
          >
            <Crosshair className="w-5 h-5 text-primary" />
          </button>
        </div>
      )}

      {/* Selected Location Info */}
      {selectable && selectedLocation && (
        <div className="absolute bottom-4 left-4 right-4 bg-card/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-border z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Выбранные координаты</p>
              <p className="font-mono text-sm text-foreground">
                {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Instructions for selectable map */}
      {selectable && !selectedLocation && (
        <div className="absolute bottom-4 left-4 right-4 bg-card/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-border z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Crosshair className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              Кликните на карту, чтобы выбрать местоположение
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
