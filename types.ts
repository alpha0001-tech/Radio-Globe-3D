export interface RadioStation {
  changeuuid: string;
  stationuuid: string;
  name: string;
  url: string;
  url_resolved: string;
  homepage: string;
  favicon: string;
  tags: string;
  country: string;
  countrycode: string;
  state: string;
  language: string;
  votes: number;
  codec: string;
  bitrate: number;
  hls: number;
  lastcheckok: number;
  geo_lat: number;
  geo_long: number;
  dist?: number; // Added dynamically during distance calculation
}

export interface Coordinates {
  x: number;
  y: number;
  z: number;
}

export interface GlobeClickEvent {
  point: Coordinates;
  nearbyStations: RadioStation[];
}