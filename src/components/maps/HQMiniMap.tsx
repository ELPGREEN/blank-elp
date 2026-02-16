import { MapPin, ExternalLink, Navigation } from 'lucide-react';
import { openExternal } from '@/lib/openExternal';

type HQMiniMapProps = {
  lat: number;
  lon: number;
  title: string;
  subtitle?: string;
  zoom?: number;
};

export function HQMiniMap({ lat, lon, title, subtitle, zoom = 17 }: HQMiniMapProps) {
  // Use Mapbox Static Images API for embedded map
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
  
  // Mapbox static map URL with marker
  const mapWidth = 400;
  const mapHeight = 200;
  const markerColor = 'f97316'; // Orange color
  const mapStyle = 'streets-v12';
  
  const mapboxStaticUrl = mapboxToken 
    ? `https://api.mapbox.com/styles/v1/mapbox/${mapStyle}/static/pin-l+${markerColor}(${lon},${lat})/${lon},${lat},${zoom},0/${mapWidth}x${mapHeight}@2x?access_token=${mapboxToken}`
    : null;

  // Fallback: OpenStreetMap static tile
  const osmTileZ = 16;
  const osmTileX = Math.floor((lon + 180) / 360 * Math.pow(2, osmTileZ));
  const osmTileY = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, osmTileZ));
  
  // Multiple tiles for better coverage
  const osmTiles = [
    `https://tile.openstreetmap.org/${osmTileZ}/${osmTileX}/${osmTileY}.png`,
    `https://tile.openstreetmap.org/${osmTileZ}/${osmTileX + 1}/${osmTileY}.png`,
    `https://tile.openstreetmap.org/${osmTileZ}/${osmTileX}/${osmTileY + 1}.png`,
    `https://tile.openstreetmap.org/${osmTileZ}/${osmTileX + 1}/${osmTileY + 1}.png`,
  ];

  const osmLink = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=${zoom}/${lat}/${lon}`;
  const googleMapsLink = `https://www.google.com/maps?q=${lat},${lon}&z=${zoom}`;

  return (
    <div className="h-full w-full rounded-xl overflow-hidden border border-border bg-card shadow-lg flex flex-col">
      {/* Map container */}
      <div className="flex-1 relative min-h-0 bg-muted overflow-hidden">
        {mapboxToken ? (
          /* Mapbox Static Map */
          <img
            src={mapboxStaticUrl!}
            alt={`Mapa de ${title}`}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          /* Fallback: OSM Tiles Grid */
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
            {osmTiles.map((tile, idx) => (
              <img
                key={idx}
                src={tile}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ))}
            {/* Overlay gradient for tile edges */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-t from-background/30 via-transparent to-background/30" />
            </div>
          </div>
        )}
        
        {/* Center marker (for OSM fallback) */}
        {!mapboxToken && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-10">
            <div className="relative">
              <div className="absolute -inset-2 bg-primary/30 rounded-full animate-ping" />
              <div className="relative bg-primary rounded-full p-1.5 shadow-lg border-2 border-background">
                <MapPin className="h-4 w-4 text-primary-foreground" />
              </div>
              {/* Pin tail */}
              <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-primary" />
            </div>
          </div>
        )}
        
        {/* Info tooltip at bottom */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 w-[90%] max-w-[220px]">
          <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-xl text-center">
            <div className="text-xs font-bold text-foreground truncate">{title}</div>
            {subtitle && (
              <div className="text-[10px] text-muted-foreground truncate mt-0.5">{subtitle}</div>
            )}
            <div className="text-[9px] text-muted-foreground/60 font-mono mt-1">
              {lat.toFixed(4)}°, {lon.toFixed(4)}°
            </div>
          </div>
        </div>
      </div>
      
      {/* Action buttons bar at bottom */}
      <div className="flex border-t border-border bg-muted/30">
        <button
          type="button"
          onClick={() => openExternal(osmLink, 'Clique em "Abrir manualmente" para ver no OpenStreetMap.')}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors border-r border-border"
        >
          <ExternalLink className="h-3 w-3" />
          OpenStreetMap
        </button>
        <button
          type="button"
          onClick={() => openExternal(googleMapsLink, 'Clique em "Abrir manualmente" para ver no Google Maps.')}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-muted-foreground hover:text-blue-500 hover:bg-blue-500/5 transition-colors"
        >
          <Navigation className="h-3 w-3" />
          Google Maps
        </button>
      </div>
    </div>
  );
}
