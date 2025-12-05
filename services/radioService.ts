import { RadioStation } from '../types';

const CONFIG = {
  stationLimit: 4000,
  api: 'https://de1.api.radio-browser.info/json/stations/search'
};

export const fetchRadioStations = async (): Promise<RadioStation[]> => {
  try {
    const response = await fetch(`${CONFIG.api}?limit=${CONFIG.stationLimit}&order=clickcount&reverse=true&hidebroken=true&tagList=music,news,talk`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data: RadioStation[] = await response.json();
    
    // Filter logic: Native browser support (mp3, aac, ogg) only
    return data.filter(s => {
      const validCoords = s.geo_lat !== null && s.geo_long !== null;
      const format = s.codec ? s.codec.toLowerCase() : '';
      const playable = format === 'mp3' || format === 'aac' || format === 'ogg' || s.url.endsWith('.mp3');
      return validCoords && playable;
    });
  } catch (error) {
    console.error("Failed to load stations:", error);
    throw error;
  }
};