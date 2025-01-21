import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import { useLocation } from 'react-router-dom';

interface LocationState {
  centerLocation?: {
    latitude: number;
    longitude: number;
  };
}

interface EmergencyService {
  id: number;
  lat: number;
  lon: number;
  name: string;
  type: 'police' | 'hospital' | 'fire_station';
}

const Maps = () => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [emergencyServices, setEmergencyServices] = useState<EmergencyService[]>([]);
  const location = useLocation();
  const { centerLocation } = (location.state as LocationState) || {};

  // Initialize map
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const initialCenter = centerLocation 
        ? [centerLocation.latitude, centerLocation.longitude]
        : [13.072090, 80.201859];

      mapRef.current = L.map(mapContainerRef.current).setView(initialCenter as [number, number], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: ' OpenStreetMap contributors'
      }).addTo(mapRef.current);
    }

    // If centerLocation changes, update the map center
    if (mapRef.current && centerLocation) {
      mapRef.current.setView([centerLocation.latitude, centerLocation.longitude], 15);
      fetchNearbyServices(centerLocation.latitude, centerLocation.longitude);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [centerLocation]);

  const fetchNearbyServices = async (lat: number, lon: number) => {
    try {
      // Build Overpass API query for emergency services within 5km radius
      const radius = 5000; // 5km in meters
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="police"](around:${radius},${lat},${lon});
          node["amenity"="hospital"](around:${radius},${lat},${lon});
          node["amenity"="fire_station"](around:${radius},${lat},${lon});
        );
        out body;
      `;

      const response = await axios.post('https://overpass-api.de/api/interpreter', query);
      
      const services: EmergencyService[] = response.data.elements.map((element: any) => ({
        id: element.id,
        lat: element.lat,
        lon: element.lon,
        name: element.tags.name || 'Unnamed',
        type: element.tags.amenity as 'police' | 'hospital' | 'fire_station'
      }));

      setEmergencyServices(services);
    } catch (error) {
      console.error('Error fetching emergency services:', error);
    }
  };

  // Create custom icons for different services
  const createCustomIcon = (color: string) => {
    return L.divIcon({
      className: 'custom-marker',
      html: `<div class="marker-pin" style="background-color: ${color};"></div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 30]
    });
  };

  const serviceIcons = {
    police: createCustomIcon('#996600'), // Brown
    hospital: createCustomIcon('#dc2626'), // Red
    fire_station: createCustomIcon('#2563eb') // Blue
  };

  // Handle alerts
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/alerts');
        setAlerts(response.data);
      } catch (error) {
        console.error('Error fetching alerts:', error);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);

    return () => clearInterval(interval);
  }, []);

  // Update markers when alerts or emergency services change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapRef.current?.removeLayer(layer);
      }
    });

    // Add alert markers
    alerts.forEach((alert) => {
      const latitude = alert.location?.latitude;
      const longitude = alert.location?.longitude;

      if (latitude && longitude && mapRef.current) {
        const marker = L.marker([latitude, longitude], {
          icon: createCustomIcon('#22c55e') // Green color for alerts
        });

        marker.bindPopup(`
          <strong>Alert!</strong><br>
          Name: ${alert.name}<br>
          Message: ${alert.message}<br>
          Phone: ${alert.phone}
        `).addTo(mapRef.current);
      }
    });

    // Add emergency service markers
    emergencyServices.forEach((service) => {
      if (mapRef.current) {
        const marker = L.marker([service.lat, service.lon], {
          icon: serviceIcons[service.type]
        });

        marker.bindPopup(`
          <strong>${service.type.replace('_', ' ').toUpperCase()}</strong><br>
          ${service.name}
        `).addTo(mapRef.current);
      }
    });
  }, [alerts, emergencyServices]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div ref={mapContainerRef} style={{ height: '80vh', width: '100%' }} />
          <div className="p-4 border-t">
            <h3 className="text-lg font-semibold mb-2">Map Legend</h3>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#22c55e]" />
                <span>Alert Location</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#964B00]" />
                <span>Police Station</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#dc2626]" />
                <span>Hospital</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#2563eb]" />
                <span>Fire Station</span>
              </div>
            </div>
          </div>
          <style>
            {`
              .marker-pin {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: 2px solid white;
                box-shadow: 0 0 4px rgba(0,0,0,0.3);
              }
              .custom-marker {
                background: none;
                border: none;
              }
            `}
          </style>
        </div>
      </div>
    </div>
  );
};

export default Maps;