import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css"; // Importez le CSS de Leaflet

// Coordonnées de Sfax, Tunisie
const sfaxCoordinates = [34.7406, 10.7603];

const SfaxMap = () => {
  return (
    <div style={{ width: "100%", height: "400px" }}>
      <MapContainer
        center={sfaxCoordinates} // Centrer la carte sur Sfax
        zoom={13} // Niveau de zoom initial
        style={{ width: "100%", height: "100%" }}
      >
        {/* Ajouter une couche de carte (tuiles OpenStreetMap) */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Ajouter un marqueur pour Sfax */}
        <Marker position={sfaxCoordinates}>
          <Popup>
            <b>Sfax, Tunisie</b> <br /> Ville côtière et économique.
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default SfaxMap;