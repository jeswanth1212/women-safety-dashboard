import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import { useLocation } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { seedSafeZones } from '../utils/seedSafeZones';
import { seedDangerZones } from '../utils/seedDangerZones';
import { seedResponseTeams } from '../utils/seedResponseTeams';
import { seedIssues } from '../utils/seedIssues';
import { seedPatrols } from '../utils/seedPatrols';
import { useAuth } from '../contexts/AuthContext';
import { Shield, AlertTriangle } from 'lucide-react';
import AddSafeZoneModal from '../components/AddSafeZoneModal';
import AddDangerZoneModal from '../components/AddDangerZoneModal';

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

interface Alert {
  id: string;
  userId: string;
  name: string;
  phoneNumber: string;
  latitude: number;
  longitude: number;
  timestamp: any;
  status: 'pending' | 'resolved';
}

interface SafeZone {
  id: string;
  name: string;
  type: 'mall' | 'police_station' | 'hospital' | 'public_place';
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  radius: number;
  verifiedBy: string;
  securityFeatures: string[];
  rating: number;
}

interface DangerZone {
  id: string;
  location: {
    latitude: number;
    longitude: number;
  };
  threatLevel: 'high' | 'medium' | 'low';
  incidentCount: number;
  timePattern: {
    dangerousHours: string[];
    safestTime: string;
  };
  aiPredictedRisk: number;
  radius: number;
  incidentTypes: string[];
  areaName: string;
  description: string;
}

interface ResponseTeam {
  id: string;
  teamName: string;
  teamType: 'police' | 'medical' | 'fire' | 'rescue';
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  contactInfo: {
    phone: string;
    email: string;
  };
  members: Array<{
    name: string;
    role: string;
    phone: string;
    badgeNumber: string;
  }>;
  availability: string;
  responseRadius: number;
  currentStatus: 'available' | 'busy' | 'offline';
  lastActive: any;
}

const Maps = () => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [emergencyServices, setEmergencyServices] = useState<EmergencyService[]>([]);
  const [safeZones, setSafeZones] = useState<SafeZone[]>([]);
  const [dangerZones, setDangerZones] = useState<DangerZone[]>([]);
  const [responseTeams, setResponseTeams] = useState<ResponseTeam[]>([]);
  const [showAddZoneModal, setShowAddZoneModal] = useState(false);
  const [showAddDangerZoneModal, setShowAddDangerZoneModal] = useState(false);
  const [newZoneLocation, setNewZoneLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [newDangerZoneLocation, setNewDangerZoneLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [isAddingDangerMode, setIsAddingDangerMode] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(13);
  const location = useLocation();
  const { centerLocation } = (location.state as LocationState) || {};
  const { adminUser } = useAuth();

  const MIN_ZOOM_FOR_SERVICES = 12; // Start showing emergency services at zoom level 12+
  const MAX_ICONS_PER_TYPE = {
    12: { police: 3, hospital: 5, fire_station: 2 }, // Very few icons at low zoom
    13: { police: 5, hospital: 8, fire_station: 3 },  // More icons at medium zoom
    14: { police: 8, hospital: 12, fire_station: 5 }, // Even more at higher zoom
    15: { police: 12, hospital: 20, fire_station: 8 }, // Most icons at high zoom
    16: { police: 20, hospital: 30, fire_station: 12 } // All icons at very high zoom
  };

  // Seed safe zones, danger zones, and response teams on initial load
  useEffect(() => {
    seedSafeZones();
    seedDangerZones();
    seedResponseTeams();
    seedIssues();
    seedPatrols();
  }, []);

  // Function to fetch nearby emergency services
  const fetchNearbyServices = async (lat: number, lon: number) => {
    try {
      const radius = 5000; // 5km in meters (increased for better coverage)
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
      console.log('Fetched emergency services:', response.data.elements);

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

      // Track zoom changes
      mapRef.current.on('zoomend', () => {
        if (mapRef.current) {
          const zoom = mapRef.current.getZoom();
          setCurrentZoom(zoom);
        }
      });

      // Set initial zoom
      setCurrentZoom(mapRef.current.getZoom());

      // Fetch emergency services for initial center
      fetchNearbyServices(initialCenter[0], initialCenter[1]);
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

  // Handle map clicks for adding safe zones and danger zones
  useEffect(() => {
    if (!mapRef.current) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (isAddingMode) {
        setNewZoneLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
        setShowAddZoneModal(true);
        setIsAddingMode(false);
      } else if (isAddingDangerMode) {
        setNewDangerZoneLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
        setShowAddDangerZoneModal(true);
        setIsAddingDangerMode(false);
      }
    };

    mapRef.current.on('click', handleMapClick);

    return () => {
      if (mapRef.current) {
        mapRef.current.off('click', handleMapClick);
      }
    };
  }, [isAddingMode, isAddingDangerMode]);

  // Create custom icon with symbol
  const createIconWithSymbol = (symbol: string, bgColor: string, textColor: string = 'white') => {
    return L.divIcon({
      className: 'custom-icon-marker',
      html: `
        <div style="
          background-color: ${bgColor};
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          font-size: 18px;
          font-weight: bold;
          color: ${textColor};
        ">
          ${symbol}
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  };

  const serviceIcons = {
    police: createIconWithSymbol('👮', '#1e40af'), // Police officer emoji
    hospital: createIconWithSymbol('➕', '#dc2626'), // Plus icon
    fire_station: createIconWithSymbol('🔥', '#ea580c') // Fire emoji
  };

  const responseTeamIcons = {
    police: createIconWithSymbol('🚓', '#3b82f6', 'white'), // Police car
    medical: createIconWithSymbol('🚑', '#ef4444', 'white'), // Ambulance
    fire: createIconWithSymbol('🚒', '#f97316', 'white'), // Fire truck
    rescue: createIconWithSymbol('🛟', '#8b5cf6', 'white') // Rescue/lifebuoy
  };

  // Fetch safe zones from Firestore
  useEffect(() => {
    const safeZonesCollection = collection(db, 'safeZones');
    
    const unsubscribe = onSnapshot(safeZonesCollection, (snapshot) => {
      const fetchedZones: SafeZone[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedZones.push({
          id: doc.id,
          name: data.name,
          type: data.type,
          address: data.address,
          location: data.location,
          radius: data.radius,
          verifiedBy: data.verifiedBy,
          securityFeatures: data.securityFeatures || [],
          rating: data.rating
        });
      });
      setSafeZones(fetchedZones);
      console.log('Fetched safe zones:', fetchedZones);
    }, (error) => {
      console.error('Error fetching safe zones:', error);
    });

    return () => unsubscribe();
  }, []);

  // Fetch danger zones from Firestore
  useEffect(() => {
    const dangerZonesCollection = collection(db, 'dangerZones');
    
    const unsubscribe = onSnapshot(dangerZonesCollection, (snapshot) => {
      const fetchedZones: DangerZone[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedZones.push({
          id: doc.id,
          location: data.location,
          threatLevel: data.threatLevel,
          incidentCount: data.incidentCount,
          timePattern: data.timePattern,
          aiPredictedRisk: data.aiPredictedRisk,
          radius: data.radius,
          incidentTypes: data.incidentTypes || [],
          areaName: data.areaName,
          description: data.description
        });
      });
      setDangerZones(fetchedZones);
      console.log('Fetched danger zones:', fetchedZones);
    }, (error) => {
      console.error('Error fetching danger zones:', error);
    });

    return () => unsubscribe();
  }, []);

  // Fetch response teams from Firestore
  useEffect(() => {
    const responseTeamsCollection = collection(db, 'responseTeams');
    
    const unsubscribe = onSnapshot(responseTeamsCollection, (snapshot) => {
      const fetchedTeams: ResponseTeam[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedTeams.push({
          id: doc.id,
          teamName: data.teamName,
          teamType: data.teamType,
          location: data.location,
          contactInfo: data.contactInfo,
          members: data.members || [],
          availability: data.availability,
          responseRadius: data.responseRadius,
          currentStatus: data.currentStatus,
          lastActive: data.lastActive
        });
      });
      setResponseTeams(fetchedTeams);
      console.log('Fetched response teams:', fetchedTeams);
    }, (error) => {
      console.error('Error fetching response teams:', error);
    });

    return () => unsubscribe();
  }, []);

  // Handle alerts - fetch all alerts and filter for PENDING in JavaScript
  useEffect(() => {
    const alertsCollection = collection(db, 'sos');
    
    const unsubscribe = onSnapshot(alertsCollection, (snapshot) => {
      const fetchedAlerts: Alert[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const alert: Alert = {
          id: doc.id,
          userId: data.userId || '',
          name: data.name || 'Unknown',
          phoneNumber: data.phoneNumber || '',
          latitude: data.latitude || 0,
          longitude: data.longitude || 0,
          timestamp: data.timestamp,
          status: data.status || 'pending'
        };
        
        // Only add pending alerts
        if (alert.status === 'pending') {
          fetchedAlerts.push(alert);
        }
      });
      setAlerts(fetchedAlerts);
      console.log('Fetched pending alerts for map:', fetchedAlerts);
    }, (error) => {
      console.error('Error fetching alerts for map:', error);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing alert markers first
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        const icon = layer.options.icon as L.DivIcon;
        const htmlContent = icon?.options?.html;
        if (typeof htmlContent === 'string' && htmlContent.includes('🚨')) { // SOS alert marker
          mapRef.current?.removeLayer(layer);
        }
      }
    });

    // Add alert markers
    alerts.forEach((alert) => {
      const latitude = alert.latitude;
      const longitude = alert.longitude;

      if (latitude && longitude && mapRef.current) {
        const sosIcon = L.divIcon({
          className: 'custom-icon-marker',
          html: `
            <div style="
              background-color: #ef4444;
              width: 36px;
              height: 36px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 3px solid white;
              box-shadow: 0 2px 10px rgba(239, 68, 68, 0.6);
              font-size: 20px;
              font-weight: bold;
              color: white;
              animation: pulse 2s infinite;
            ">
              🚨
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });

        const marker = L.marker([latitude, longitude], {
          icon: sosIcon
        });

        marker.bindPopup(`
          <div style="min-width: 200px;">
            <strong style="color: #ef4444; font-size: 16px;">🚨 SOS ALERT</strong><br><br>
            <strong>Name:</strong> ${alert.name}<br>
            <strong>Phone:</strong> ${alert.phoneNumber}<br>
            <strong>Status:</strong> <span style="color: #ef4444;">PENDING</span><br>
            <br>
            <a href="https://www.google.com/maps?q=${latitude},${longitude}" 
               target="_blank" 
               style="color: #2563eb; text-decoration: underline;">
              View in Google Maps
            </a>
          </div>
        `).addTo(mapRef.current);
      }
    });
  }, [alerts]);

  // Render safe zones as green circles
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing safe zone circles
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Circle) {
        mapRef.current?.removeLayer(layer);
      }
    });

    // Add safe zone circles
    safeZones.forEach((zone) => {
    if (mapRef.current) {
        const circle = L.circle([zone.location.latitude, zone.location.longitude], {
          color: '#22c55e',      // Green border (darker)
          fillColor: '#22c55e',  // Green fill
          fillOpacity: 0.3,      // Translucent
          opacity: 0.7,          // Border opacity
          radius: zone.radius,   // Radius in meters
          weight: 2              // Border width
        });

        // Create popup content with safe zone details
        const typeLabels: Record<string, string> = {
          mall: '🛍️ Mall',
          police_station: '👮 Police Station',
          hospital: '🏥 Hospital',
          public_place: '🏛️ Public Place'
        };

        const popupContent = `
          <div style="min-width: 250px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span style="font-size: 24px;">🛡️</span>
              <strong style="color: #22c55e; font-size: 18px;">${zone.name}</strong>
            </div>
            <div style="margin-bottom: 12px;">
              <span style="background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                ${typeLabels[zone.type]}
              </span>
              <span style="margin-left: 8px; color: #f59e0b;">★ ${zone.rating}/5</span>
            </div>
            <div style="margin-bottom: 8px;">
              <strong>📍 Address:</strong><br>
              <span style="font-size: 12px; color: #666;">${zone.address}</span>
            </div>
            <div style="margin-bottom: 8px;">
              <strong>🛡️ Security Features:</strong><br>
              ${zone.securityFeatures.map(f => `<span style="display: inline-block; background: #f3f4f6; padding: 2px 6px; margin: 2px; border-radius: 4px; font-size: 11px;">✓ ${f}</span>`).join('')}
            </div>
            <div style="margin-bottom: 8px; font-size: 12px; color: #666;">
              <strong>Coverage:</strong> ${zone.radius}m radius
            </div>
            <div style="font-size: 11px; color: #999; font-style: italic;">
              Verified by: ${zone.verifiedBy}
            </div>
          </div>
        `;

        circle.bindPopup(popupContent).addTo(mapRef.current);
      }
    });
  }, [safeZones]);

  // Render danger zones as red circles
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing danger zone circles
      mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Circle && (layer.options as any).isDangerZone) {
          mapRef.current?.removeLayer(layer);
        }
      });

    // Add danger zone circles
    dangerZones.forEach((zone) => {
      if (mapRef.current) {
        const threatColors = {
          high: { fill: '#ef4444', border: '#dc2626' },
          medium: { fill: '#f97316', border: '#ea580c' },
          low: { fill: '#eab308', border: '#ca8a04' }
        };

        const colors = threatColors[zone.threatLevel];

        const circle = L.circle([zone.location.latitude, zone.location.longitude], {
          color: colors.border,
          fillColor: colors.fill,
          fillOpacity: 0.25,
          opacity: 0.6,
          radius: zone.radius,
          weight: 2,
          ...({ isDangerZone: true } as any)
        });

        const threatEmojis = {
          high: '🔴',
          medium: '🟠',
          low: '🟡'
        };

        const popupContent = `
          <div style="min-width: 280px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span style="font-size: 24px;">⚠️</span>
              <strong style="color: ${colors.fill}; font-size: 18px;">${zone.areaName}</strong>
            </div>
            <div style="margin-bottom: 12px;">
              <span style="background: ${colors.fill}20; color: ${colors.border}; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                ${threatEmojis[zone.threatLevel]} ${zone.threatLevel.toUpperCase()} RISK
              </span>
              <span style="margin-left: 8px; font-weight: 600; color: #dc2626;">
                AI Risk: ${(zone.aiPredictedRisk * 100).toFixed(0)}%
              </span>
            </div>
            <div style="margin-bottom: 8px;">
              <strong>📝 Description:</strong><br>
              <span style="font-size: 12px; color: #666;">${zone.description}</span>
            </div>
            <div style="margin-bottom: 8px;">
              <strong>📊 Incidents Reported:</strong> ${zone.incidentCount}
            </div>
            <div style="margin-bottom: 8px;">
              <strong>⚠️ Incident Types:</strong><br>
              ${zone.incidentTypes.map(type => `<span style="display: inline-block; background: #fee2e2; color: #991b1b; padding: 2px 6px; margin: 2px; border-radius: 4px; font-size: 11px;">⚠️ ${type}</span>`).join('')}
            </div>
            ${zone.timePattern.dangerousHours.length > 0 ? `
              <div style="margin-bottom: 8px;">
                <strong>🕐 Dangerous Hours:</strong><br>
                <span style="font-size: 11px; color: #dc2626;">${zone.timePattern.dangerousHours.join(', ')}</span>
              </div>
            ` : ''}
            ${zone.timePattern.safestTime ? `
              <div style="margin-bottom: 8px;">
                <strong>✅ Safest Time:</strong> <span style="color: #059669;">${zone.timePattern.safestTime}</span>
              </div>
            ` : ''}
            <div style="font-size: 12px; color: #666;">
              <strong>Coverage:</strong> ${zone.radius}m radius
            </div>
          </div>
        `;

        circle.bindPopup(popupContent).addTo(mapRef.current);
      }
    });
  }, [dangerZones]);

  // Render response team markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing response team markers
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        const icon = layer.options.icon as L.DivIcon;
        const htmlContent = icon?.options?.html;
        if (typeof htmlContent === 'string' && 
            (htmlContent.includes('🚓') || htmlContent.includes('🚑') || 
             htmlContent.includes('🚒') || htmlContent.includes('🛟'))) {
          mapRef.current?.removeLayer(layer);
        }
      }
    });

    // Add response team markers
    responseTeams.forEach((team) => {
      if (mapRef.current) {
        const icon = responseTeamIcons[team.teamType];
        
        const statusColors = {
          available: '#22c55e',
          busy: '#f59e0b',
          offline: '#6b7280'
        };

        const statusLabels = {
          available: '🟢 Available',
          busy: '🟡 Busy',
          offline: '⚫ Offline'
        };

        const typeEmojis = {
          police: '🚓',
          medical: '🚑',
          fire: '🚒',
          rescue: '🛟'
        };

        const popupContent = `
          <div style="min-width: 280px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span style="font-size: 24px;">${typeEmojis[team.teamType]}</span>
              <strong style="color: #1e40af; font-size: 18px;">${team.teamName}</strong>
            </div>
            <div style="margin-bottom: 12px;">
              <span style="background: ${statusColors[team.currentStatus]}20; color: ${statusColors[team.currentStatus]}; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                ${statusLabels[team.currentStatus]}
              </span>
            </div>
            <div style="margin-bottom: 8px;">
              <strong>📍 Location:</strong><br>
              <span style="font-size: 12px; color: #666;">${team.location.address}</span>
            </div>
            <div style="margin-bottom: 8px;">
              <strong>📞 Contact:</strong><br>
              Phone: <a href="tel:${team.contactInfo.phone}" style="color: #2563eb;">${team.contactInfo.phone}</a><br>
              Email: <a href="mailto:${team.contactInfo.email}" style="color: #2563eb; font-size: 11px;">${team.contactInfo.email}</a>
            </div>
            <div style="margin-bottom: 8px;">
              <strong>👥 Team Lead:</strong><br>
              ${team.members[0]?.name || 'N/A'} - ${team.members[0]?.role || ''}<br>
              <span style="font-size: 11px; color: #666;">Badge: ${team.members[0]?.badgeNumber || 'N/A'}</span>
            </div>
            <div style="margin-bottom: 8px; font-size: 12px;">
              <strong>⏰ Availability:</strong> ${team.availability}
            </div>
            <div style="font-size: 12px; color: #666;">
              <strong>📡 Response Radius:</strong> ${team.responseRadius}m
            </div>
          </div>
        `;

        L.marker([team.location.latitude, team.location.longitude], { icon })
          .addTo(mapRef.current)
          .bindPopup(popupContent);
      }
    });
  }, [responseTeams]);

  useEffect(() => {
    if (mapRef.current) {
      // Clear existing emergency service markers
      mapRef.current.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          const icon = layer.options.icon as L.DivIcon;
          const htmlContent = icon?.options?.html;
          if (typeof htmlContent === 'string' && 
              (htmlContent.includes('👮') || htmlContent.includes('➕') || htmlContent.includes('🔥'))) {
            mapRef.current?.removeLayer(layer);
          }
        }
      });

      // Only show emergency services if zoomed in enough
      if (currentZoom >= MIN_ZOOM_FOR_SERVICES) {
        // Get the appropriate zoom level for icon limits
        const zoomLevel = Math.min(currentZoom, 16) as keyof typeof MAX_ICONS_PER_TYPE;
        const iconLimits = MAX_ICONS_PER_TYPE[zoomLevel];
        
        // Group services by type and limit them
        const servicesByType = {
          police: emergencyServices.filter(s => s.type === 'police'),
          hospital: emergencyServices.filter(s => s.type === 'hospital'),
          fire_station: emergencyServices.filter(s => s.type === 'fire_station')
        };

        // Sort each type by distance from map center and take only the closest ones
        const mapCenter = mapRef.current.getCenter();
        const centerLat = mapCenter.lat;
        const centerLng = mapCenter.lng;

        Object.keys(servicesByType).forEach(type => {
          const services = servicesByType[type as keyof typeof servicesByType];
          const limit = iconLimits[type as keyof typeof iconLimits];
          
          // Sort by distance from center and take only the closest ones
          const sortedServices = services
            .map(service => ({
              ...service,
              distance: Math.sqrt(
                Math.pow(service.lat - centerLat, 2) + Math.pow(service.lon - centerLng, 2)
              )
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, limit);

          // Add markers for the limited services
          sortedServices.forEach(service => {
        const icon = serviceIcons[service.type];
            const typeLabels = {
              police: 'Police Station',
              hospital: 'Hospital',
              fire_station: 'Fire Station'
            };
        L.marker([service.lat, service.lon], { icon })
          .addTo(mapRef.current!)
              .bindPopup(`<strong>${service.name}</strong><br>${typeLabels[service.type]}`);
          });
        });
      }
    }
  }, [emergencyServices, currentZoom]);

  // Change cursor when in adding mode
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.getContainer().style.cursor = (isAddingMode || isAddingDangerMode) ? 'crosshair' : '';
    }
  }, [isAddingMode, isAddingDangerMode]);

  const handleAddZoneClick = () => {
    setIsAddingMode(true);
    setIsAddingDangerMode(false);
  };

  const handleCancelAddZone = () => {
    setIsAddingMode(false);
    setNewZoneLocation(null);
  };

  const handleAddDangerZoneClick = () => {
    setIsAddingDangerMode(true);
    setIsAddingMode(false);
  };

  const handleCancelAddDangerZone = () => {
    setIsAddingDangerMode(false);
    setNewDangerZoneLocation(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">DEFENSHE - Safety Map</h1>
          <div className="flex gap-3">
            <button
              onClick={isAddingMode ? handleCancelAddZone : handleAddZoneClick}
              disabled={isAddingDangerMode}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                isAddingMode
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              <Shield className="w-5 h-5" />
              {isAddingMode ? 'Cancel' : 'Add Safe Zone'}
            </button>
            <button
              onClick={isAddingDangerMode ? handleCancelAddDangerZone : handleAddDangerZoneClick}
              disabled={isAddingMode}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                isAddingDangerMode
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
              {isAddingDangerMode ? 'Cancel' : 'Add Danger Zone'}
            </button>
          </div>
        </div>

        {isAddingMode && (
          <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4 animate-pulse">
            <p className="text-green-800 font-semibold text-center">
              🛡️ Click anywhere on the map to place a new safe zone
            </p>
          </div>
        )}

        {isAddingDangerMode && (
          <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 animate-pulse">
            <p className="text-red-800 font-semibold text-center">
              ⚠️ Click anywhere on the map to place a new danger zone
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg overflow-hidden relative">
          {/* Map Container */}
          <div ref={mapContainerRef} style={{ height: '80vh', width: '100%', position: 'relative' }} />
          
          {/* Legend - Always on Top */}
          <div 
            className="p-4 bg-white rounded-lg shadow-xl border-2 border-gray-300" 
            style={{ 
              position: 'absolute', 
              top: '10px', 
              right: '10px', 
              zIndex: 1000,
              maxWidth: '280px'
            }}
          >
            <h3 className="text-lg font-bold mb-3 text-gray-800 border-b pb-2">📍 Map Legend</h3>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-3 p-1.5 rounded hover:bg-gray-50">
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid white',
                  boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)',
                  fontSize: '14px'
                }}>🚨</div>
                <span className="font-bold text-sm text-red-600">SOS Alert</span>
              </div>
              <div className="flex items-center gap-3 p-1.5 rounded hover:bg-gray-50">
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(34, 197, 94, 0.4)',
                  border: '2px solid #22c55e'
                }}></div>
                <span className="text-sm font-medium text-green-700">Safe Zone</span>
              </div>
              <div className="flex items-center gap-3 p-1.5 rounded hover:bg-gray-50">
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(239, 68, 68, 0.25)',
                  border: '2px solid #dc2626'
                }}></div>
                <span className="text-sm font-medium text-red-700">Danger Zone</span>
              </div>
              <div className={`flex items-center gap-3 p-1.5 rounded hover:bg-gray-50 ${currentZoom < MIN_ZOOM_FOR_SERVICES ? 'opacity-40' : ''}`}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: '#1e40af',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  fontSize: '14px'
                }}>👮</div>
                <span className="text-sm font-medium text-blue-800">
                  Police Station
                  {currentZoom < MIN_ZOOM_FOR_SERVICES && ' (zoom in)'}
                  {currentZoom >= MIN_ZOOM_FOR_SERVICES && ` (${Math.min(currentZoom, 16) >= 12 ? MAX_ICONS_PER_TYPE[Math.min(currentZoom, 16) as keyof typeof MAX_ICONS_PER_TYPE].police : 0} shown)`}
                </span>
              </div>
              <div className={`flex items-center gap-3 p-1.5 rounded hover:bg-gray-50 ${currentZoom < MIN_ZOOM_FOR_SERVICES ? 'opacity-40' : ''}`}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  fontSize: '14px',
                  color: 'white',
                  fontWeight: 'bold'
                }}>➕</div>
                <span className="text-sm font-medium text-red-700">
                  Hospital
                  {currentZoom < MIN_ZOOM_FOR_SERVICES && ' (zoom in)'}
                  {currentZoom >= MIN_ZOOM_FOR_SERVICES && ` (${Math.min(currentZoom, 16) >= 12 ? MAX_ICONS_PER_TYPE[Math.min(currentZoom, 16) as keyof typeof MAX_ICONS_PER_TYPE].hospital : 0} shown)`}
                </span>
              </div>
              <div className={`flex items-center gap-3 p-1.5 rounded hover:bg-gray-50 ${currentZoom < MIN_ZOOM_FOR_SERVICES ? 'opacity-40' : ''}`}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: '#ea580c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  fontSize: '14px'
                }}>🔥</div>
                <span className="text-sm font-medium text-orange-600">
                  Fire Station
                  {currentZoom < MIN_ZOOM_FOR_SERVICES && ' (zoom in)'}
                  {currentZoom >= MIN_ZOOM_FOR_SERVICES && ` (${Math.min(currentZoom, 16) >= 12 ? MAX_ICONS_PER_TYPE[Math.min(currentZoom, 16) as keyof typeof MAX_ICONS_PER_TYPE].fire_station : 0} shown)`}
                </span>
              </div>
              <hr className="my-2 border-gray-300" />
              <p className="text-xs font-semibold text-gray-600 mb-2">Response Teams:</p>
              <div className="flex items-center gap-3 p-1.5 rounded hover:bg-gray-50">
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  fontSize: '14px'
                }}>🚓</div>
                <span className="text-sm font-medium text-blue-600">Police Team</span>
              </div>
              <div className="flex items-center gap-3 p-1.5 rounded hover:bg-gray-50">
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  fontSize: '14px'
                }}>🚑</div>
                <span className="text-sm font-medium text-red-600">Medical Team</span>
              </div>
              <div className="flex items-center gap-3 p-1.5 rounded hover:bg-gray-50">
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: '#f97316',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  fontSize: '14px'
                }}>🚒</div>
                <span className="text-sm font-medium text-orange-600">Fire Team</span>
              </div>
              <div className="flex items-center gap-3 p-1.5 rounded hover:bg-gray-50">
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: '#8b5cf6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  fontSize: '14px'
                }}>🛟</div>
                <span className="text-sm font-medium text-purple-600">Rescue Team</span>
              </div>
            </div>
          </div>
          <style>
            {`
              .custom-icon-marker {
                background: none !important;
                border: none !important;
              }
              
              @keyframes pulse {
                0%, 100% {
                  transform: scale(1);
                  opacity: 1;
                }
                50% {
                  transform: scale(1.1);
                  opacity: 0.9;
                }
              }
            `}
          </style>
        </div>

        {/* Add Safe Zone Modal */}
        {showAddZoneModal && newZoneLocation && adminUser && (
          <AddSafeZoneModal
            location={newZoneLocation}
            adminName={adminUser.name}
            onClose={() => {
              setShowAddZoneModal(false);
              setNewZoneLocation(null);
            }}
            onSuccess={() => {
              console.log('Safe zone added successfully!');
            }}
          />
        )}

        {/* Add Danger Zone Modal */}
        {showAddDangerZoneModal && newDangerZoneLocation && adminUser && (
          <AddDangerZoneModal
            location={newDangerZoneLocation}
            adminName={adminUser.name}
            onClose={() => {
              setShowAddDangerZoneModal(false);
              setNewDangerZoneLocation(null);
            }}
            onSuccess={() => {
              console.log('Danger zone added successfully!');
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Maps;