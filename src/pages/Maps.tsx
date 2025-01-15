import { useEffect, useRef } from 'react';
import * as atlas from 'azure-maps-control';
import { Layers, Filter } from 'lucide-react';

const Maps = () => {
  const mapRef = useRef<atlas.Map>();

  useEffect(() => {
    // Initialize the Azure Map
    mapRef.current = new atlas.Map('myMap', {
      authOptions: {
        authType: atlas.AuthenticationType.subscriptionKey,
        subscriptionKey: '2rXCYNGMq3WAWayJjxXD64jmtbVFEHhjBDRqMLEDmZhuuKm0IJkGJQQJ99BAACYeBjFfxZmvAAAgAZMP4a2f',
      },
      center: [80.0369, 12.9081], // Tambaram coordinates
      zoom: 12,
      style: 'road',
      showAttributionButton: false,
      showFeedbackLink: false,
      showLogo: false,
      renderWorldCopies: false,
    });

    // Add markers when the map is ready
    mapRef.current.events.add('ready', () => {
      // Log to ensure the map is ready
      console.log('Map is ready!');

      // Blue pin for the current location
      const myLocationMarker = new atlas.HtmlMarker({
        htmlContent: '<div style="color: blue; font-size: 24px;">🔵</div>',
        position: [80.0369, 12.9081],
      });
      mapRef.current?.markers.add(myLocationMarker);

      // Define important locations (police stations, hospitals, bus stops, railway stations)
      const importantLocations = [
        { position: [80.0498, 12.9101], name: 'Police Station 1' },
        { position: [80.0275, 12.9080], name: 'Hospital 1' },
        { position: [80.0323, 12.9125], name: 'Bus Stop 1' },
        { position: [80.0400, 12.9055], name: 'Railway Station 1' },
      ];

      // Add red pins for these locations
      importantLocations.forEach((location) => {
        const marker = new atlas.HtmlMarker({
          htmlContent: '<div style="color: red; font-size: 24px;">🔴</div>',
          position: location.position,
        });
        mapRef.current?.markers.add(marker);
        console.log(`Added marker at: ${location.position} (${location.name})`);
      });
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Location Map</h2>
          <div className="flex space-x-3">
            <button className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
              <Layers className="h-5 w-5 mr-2" />
              Layers
            </button>
            <button className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div id="myMap" style={{ height: '80vh', width: '100%' }} />
        </div>
      </div>
    </div>
  );
};

export default Maps;
