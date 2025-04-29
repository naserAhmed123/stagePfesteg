import React, { useState, useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

function SfaxLightInterruptionRiskMap() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const zoneLayerGroupRef = useRef(null);
  const infoRef = useRef(null);
  const legendRef = useRef(null);
  const [zonesVisible, setZonesVisible] = useState(true);
  const [statistics, setStatistics] = useState({
    highRiskPercentage: 0,
    mediumRiskPercentage: 0,
    lowRiskPercentage: 0,
    timestamp: formatTimestamp(new Date())
  });
  const [activeTimeSlot, setActiveTimeSlot] = useState('now');
  
  const sfaxCoordinates = [34.7406, 10.7603];
  
  const districts = [
    { name: 'Sfax Medina', center: [34.7406, 10.7603], radius: 1200 },
    { name: 'Sfax Nord', center: [34.7650, 10.7550], radius: 1800 },
    { name: 'Sfax Sud', center: [34.7150, 10.7650], radius: 1500 },
    { name: 'Sakiet Ezzit', center: [34.7794, 10.7514], radius: 1300 },
    { name: 'Sakiet Eddaier', center: [34.7817, 10.6911], radius: 1400 },
    { name: 'Chihia', center: [34.7200, 10.7200], radius: 900 },
    { name: 'Thyna', center: [34.6731, 10.7167], radius: 1100 },
    { name: 'Agareb', center: [34.7431, 10.5617], radius: 800 },
    { name: 'Gremda', center: [34.832225, 10.666169], radius: 1000 },
    { name: 'El Ain', center: [34.7500, 10.6900], radius: 900 }
  ];

  function formatTimestamp(date) {
    return `Updated: ${date.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})} at ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }

  function createPopupContent(district, riskPercentage, riskLevel) {
    let riskColor;
    
    if (riskLevel === 'High') {
      riskColor = '#e74c3c';
    } else if (riskLevel === 'Medium') {
      riskColor = '#f1c40f';
    } else {
      riskColor = '#2ecc71';
    }
    
    return `
      <div class="font-sans">
        <div class="text-base font-bold mb-1 text-gray-800 border-b border-gray-200 pb-1">${district.name}</div>
        <div class="flex items-center mt-2">
          <div class="w-3 h-3 rounded-full mr-2" style="background-color: ${riskColor}"></div>
          <strong>${riskLevel} Risk: ${riskPercentage}%</strong>
        </div>
        <div class="mt-2 text-sm">
          <div>Population affected: ~${Math.floor(Math.random() * 5000 + 1000).toLocaleString()}</div>
          <div>Last outage: ${Math.floor(Math.random() * 7) + 1} days ago</div>
        </div>
      </div>
    `;
  }

  function updateStatistics(zones) {
    let highRiskCount = 0;
    let mediumRiskCount = 0;
    let lowRiskCount = 0;
    
    zones.forEach(zone => {
      const props = zone.properties;
      if (props.level === 'High') {
        highRiskCount++;
      } else if (props.level === 'Medium') {
        mediumRiskCount++;
      } else {
        lowRiskCount++;
      }
    });
    
    const totalZones = zones.length;
    const highRiskPercentage = Math.round((highRiskCount / totalZones) * 100);
    const mediumRiskPercentage = Math.round((mediumRiskCount / totalZones) * 100);
    const lowRiskPercentage = Math.round((lowRiskCount / totalZones) * 100);
    
    setStatistics({
      highRiskPercentage,
      mediumRiskPercentage,
      lowRiskPercentage,
      timestamp: formatTimestamp(new Date())
    });
  }

  function generateRiskZones() {
    if (!mapInstanceRef.current || !zoneLayerGroupRef.current) return;
    
    zoneLayerGroupRef.current.clearLayers();
    
    const zones = [];
    
    districts.forEach(district => {
      const riskPercentage = Math.floor(Math.random() * 100);
      let fillColor, riskLevel;
      
      if (riskPercentage < 30) {
        fillColor = '#2ecc71'; // Green
        riskLevel = 'Low';
      } else if (riskPercentage < 70) {
        fillColor = '#f1c40f'; // Yellow
        riskLevel = 'Medium';
      } else {
        fillColor = '#e74c3c'; // Red
        riskLevel = 'High';
      }
      
      const circle = L.circle(district.center, {
        color: '#333',
        fillColor: fillColor,
        fillOpacity: 0.5,
        weight: 1,
        radius: district.radius
      }).addTo(zoneLayerGroupRef.current);
      
      circle.properties = {
        name: district.name,
        risk: riskPercentage,
        level: riskLevel
      };
      
      zones.push(circle);
      
      circle.bindPopup(
        createPopupContent(district, riskPercentage, riskLevel)
      );
      
      circle.on('mouseover', function(e) {
        this.setStyle({
          fillOpacity: 0.7,
          weight: 3
        });
        if (infoRef.current) {
          infoRef.current.update(this.properties);
        }
      });
      
      circle.on('mouseout', function(e) {
        this.setStyle({
          fillOpacity: 0.5,
          weight: 1
        });
        if (infoRef.current) {
          infoRef.current.update();
        }
      });
    });
    
    updateStatistics(zones);
  }

  const toggleZones = () => {
    if (!mapInstanceRef.current || !zoneLayerGroupRef.current) return;
    
    if (zonesVisible) {
      mapInstanceRef.current.removeLayer(zoneLayerGroupRef.current);
    } else {
      mapInstanceRef.current.addLayer(zoneLayerGroupRef.current);
    }
    setZonesVisible(!zonesVisible);
  };

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

  const handleTimeSlotClick = (timeSlot) => {
    setActiveTimeSlot(timeSlot);
    generateRiskZones();
  };

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
    document.head.appendChild(link);
    
    if (!mapInstanceRef.current && mapRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        zoomControl: false, 
      }).setView(sfaxCoordinates, 13);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);
      
      zoneLayerGroupRef.current = L.layerGroup().addTo(mapInstanceRef.current);
      
      const info = L.control({position: 'bottomright'});
      
      info.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'info bg-white p-2 rounded-md shadow-md font-sans text-sm max-w-xs');
        this.update();
        return this._div;
      };
      
      info.update = function (props) {
        this._div.innerHTML = '<h4 class="text-blue-500 m-0 mb-1 border-b border-gray-100 pb-1">Light Interruption Risk</h4>' + (props ?
          '<b>' + props.name + '</b><br />' + props.risk + '% risk of interruption'
          : 'Hover over a zone for details');
      };
      
      info.addTo(mapInstanceRef.current);
      infoRef.current = info;
      
      // Add legend
      const legend = L.control({position: 'bottomright'});
      
      legend.onAdd = function (map) {
        const div = L.DomUtil.create('div', 'legend bg-white p-2 shadow-md rounded-md text-gray-600 leading-6');
        const grades = [0, 30, 70];
        const labels = ['Low Risk (<30%)', 'Medium Risk (30-70%)', 'High Risk (>70%)'];
        const colors = ['#2ecc71', '#f1c40f', '#e74c3c'];
        
        div.innerHTML = '<h4 class="text-sm font-bold m-0 mb-1">Risk Levels</h4>';
        
        for (let i = 0; i < grades.length; i++) {
          div.innerHTML +=
            '<i style="width:18px;height:18px;float:left;margin-right:8px;opacity:0.7;background:' + colors[i] + '"></i> ' +
            labels[i] + '<br>';
        }
        return div;
      };
      
      legend.addTo(mapInstanceRef.current);
      legendRef.current = legend;
      
      // City boundary approximation
      L.circle(sfaxCoordinates, {
        color: '#3498db',
        fillColor: '#3498db',
        fillOpacity: 0.05,
        weight: 2,
        radius: 10000
      }).addTo(mapInstanceRef.current);
      
      // Generate initial risk zones
      generateRiskZones();
    }
    
    return () => {
      // Clean up on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      
      // Remove Font Awesome when component unmounts
      const links = document.head.querySelectorAll('link');
      links.forEach(linkEl => {
        if (linkEl.href.includes('font-awesome')) {
          linkEl.remove();
        }
      });
    };
  }, []);

  return (
    <div className="flex flex-col h-full w-full max-w-full m-0 p-4 box-border bg-white">
      <div className="text-center mb-4 bg-white p-4 rounded-lg shadow-md">
        <h1 className="m-0 text-2xl font-bold text-gray-800">Sfax Light Interruption Risk Map</h1>
        <p className="text-gray-500 my-2">Real-time visualization of potential power outage zones in Sfax</p>
      </div>
      
      <div className="flex h-full gap-4 flex-col lg:flex-row">
        <div className="w-full lg:w-72 flex flex-col gap-4">
          <div className="bg-white p-4 rounded-lg shadow-md flex-shrink-0">
            <h3 className="mt-0 text-base font-bold text-gray-800">Select Time Period</h3>
            <div className="flex flex-col gap-2">
              {[
                { id: 'now', label: 'Current Status' },
                { id: 'morning', label: 'Today: 08:00 - 12:00' },
                { id: 'afternoon', label: 'Today: 12:00 - 18:00' },
                { id: 'evening', label: 'Today: 18:00 - 23:00' },
                { id: 'tomorrow', label: 'Tomorrow' }
              ].map(slot => (
                <div 
                  key={slot.id}
                  className={`p-2 rounded cursor-pointer transition-all duration-200 ${
                    activeTimeSlot === slot.id 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                  data-time={slot.id}
                  onClick={() => handleTimeSlotClick(slot.id)}
                >
                  {slot.label}
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-md flex-shrink-0">
            <div className="flex justify-between items-center mb-2">
              <h2 className="m-0 text-lg font-bold text-gray-800">Current Statistics</h2>
              <span className="text-sm text-gray-500">{statistics.timestamp}</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="bg-gray-100 p-4 rounded-md w-full text-center">
                <div className="text-2xl font-bold text-blue-500 my-2">{statistics.highRiskPercentage}%</div>
                <div className="text-sm text-gray-500">High Risk Areas</div>
              </div>
              <div className="bg-gray-100 p-4 rounded-md w-full text-center">
                <div className="text-2xl font-bold text-blue-500 my-2">{statistics.mediumRiskPercentage}%</div>
                <div className="text-sm text-gray-500">Medium Risk Areas</div>
              </div>
              <div className="bg-gray-100 p-4 rounded-md w-full text-center">
                <div className="text-2xl font-bold text-blue-500 my-2">{statistics.lowRiskPercentage}%</div>
                <div className="text-sm text-gray-500">Low Risk Areas</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="relative flex-grow h-96 lg:h-auto">
        <div className="absolute inset-0 rounded-lg overflow-hidden shadow-md border-2 border-gray-200 lg:h-full sm:h-auto">
        <div id="map" ref={mapRef} className="h-full w-full"></div>
          </div>
          
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
            <div className="w-10 h-10 bg-white rounded flex items-center justify-center shadow-md cursor-pointer hover:bg-gray-100 transition-all duration-200" 
                 title="Regenerate Zones" 
                 onClick={generateRiskZones}>
              <i className="fas fa-sync-alt"></i>
            </div>
            <div className="w-10 h-10 bg-white rounded flex items-center justify-center shadow-md cursor-pointer hover:bg-gray-100 transition-all duration-200" 
                 title={zonesVisible ? "Hide Risk Zones" : "Show Risk Zones"}
                 onClick={toggleZones}>
              <i className={`fas ${zonesVisible ? 'fa-eye' : 'fa-eye-slash'}`}></i>
            </div>
            <div className="w-10 h-10 bg-white rounded flex items-center justify-center shadow-md cursor-pointer hover:bg-gray-100 transition-all duration-200" 
                 title="Zoom In" 
                 onClick={handleZoomIn}>
              <i className="fas fa-plus"></i>
            </div>
            <div className="w-10 h-10 bg-white rounded flex items-center justify-center shadow-md cursor-pointer hover:bg-gray-100 transition-all duration-200" 
                 title="Zoom Out" 
                 onClick={handleZoomOut}>
              <i className="fas fa-minus"></i>
            </div>
          </div>
        </div>
        
        <div className="w-20 sm:w-32 md:w-40 lg:w-48">
        <div className="bg-white p-5 rounded-lg shadow-md mt-4 lg:mt-0">
            <h2 className="text-lg font-bold text-gray-800 mt-0 border-b-2 border-gray-100 pb-2">Risk Analysis</h2>
            <div className="flex justify-around flex-wrap my-5">
              <div className="text-center p-4 rounded bg-red-50 border-l-4 border-red-500 w-full mb-2">
                <h3 className="text-base font-bold m-0">High Risk</h3>
                <div className="text-2xl font-bold my-2">70%+</div>
              </div>
              <div className="text-center p-4 rounded bg-yellow-50 border-l-4 border-yellow-400 w-full mb-2">
                <h3 className="text-base font-bold m-0">Medium Risk</h3>
                <div className="text-2xl font-bold my-2">30-70%</div>
              </div>
              <div className="text-center p-4 rounded bg-green-50 border-l-4 border-green-500 w-full mb-2">
                <h3 className="text-base font-bold m-0">Low Risk</h3>
                <div className="text-2xl font-bold my-2">&lt;30%</div>
              </div>
            </div>
            <div className="italic bg-gray-50 p-3 rounded border-l-3 border-blue-500 mt-4">
              <strong>Note:</strong> This is an experimental visualization. For official power outage information, please contact the local electricity provider.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SfaxLightInterruptionRiskMap;