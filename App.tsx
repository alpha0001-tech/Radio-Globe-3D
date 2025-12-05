import React, { useState, useEffect, useRef, useCallback } from 'react';
import GlobeScene from './components/GlobeScene';
import Overlay from './components/Overlay';
import { fetchRadioStations } from './services/radioService';
import { RadioStation, GlobeClickEvent } from './types';

function App() {
  const [loading, setLoading] = useState(true);
  const [allStations, setAllStations] = useState<RadioStation[]>([]);
  const [sidebarStations, setSidebarStations] = useState<RadioStation[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('');
  
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [currentTime, setCurrentTime] = useState('--:--');

  const audioRef = useRef<HTMLAudioElement>(new Audio());

  // Initialize Audio
  useEffect(() => {
    const audio = audioRef.current;
    
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleError = () => {
      setIsPlaying(false);
      alert("Cannot stream this station (CORS policy or offline).");
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      audio.pause();
    };
  }, []);

  // Update volume
  useEffect(() => {
    audioRef.current.volume = volume;
  }, [volume]);

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchRadioStations();
        setAllStations(data);
        // Only stop loading once we have data, but we wait for Globe to say it's ready too
      } catch (e) {
        console.error(e);
        // Fallback or empty state
        setLoading(false); 
      }
    };
    loadData();
  }, []);

  const handleGlobeReady = useCallback(() => {
    setLoading(false);
  }, []);

  const handleGlobeClick = useCallback((event: GlobeClickEvent) => {
    const { point, nearbyStations } = event;
    
    setSidebarStations(nearbyStations);
    setSidebarOpen(true);
    
    // Calculate approximate local time based on longitude
    // Longitude is derived from x/z in 3D, but we already have geo_lat/long in nearbyStations[0]
    // If no stations, we approximate from click point
    let estTime = "--:--";
    if (nearbyStations.length > 0) {
        setSelectedRegion(nearbyStations[0].country);
    } else {
        setSelectedRegion("Unknown Region");
    }

    // Calculate time
    // Roughly: -180 to 180 lon. 
    // lon = atan2(z, -x) * 180 / PI - 180 (Rough logic from original code)
    const lon = (Math.atan2(point.z, -point.x) * 180 / Math.PI) - 180;
    const utcOffset = Math.round(lon / 15);
    const now = new Date();
    const localHour = (now.getUTCHours() + utcOffset + 24) % 24;
    const localMin = now.getUTCMinutes().toString().padStart(2, '0');
    setCurrentTime(`${localHour}:${localMin}`);
  }, []);

  const playStation = (station: RadioStation) => {
    setCurrentStation(station);
    const audio = audioRef.current;
    audio.src = station.url_resolved || station.url;
    audio.play().catch(e => console.warn("Autoplay blocked", e));
  };

  const togglePlay = () => {
    if (!currentStation && sidebarStations.length > 0) {
      playStation(sidebarStations[0]);
      return;
    }
    
    const audio = audioRef.current;
    if (audio.paused && audio.src) {
      audio.play();
    } else {
      audio.pause();
    }
  };

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden select-none">
      <GlobeScene 
        stations={allStations} 
        onGlobeClick={handleGlobeClick}
        onReady={handleGlobeReady}
      />
      
      <Overlay 
        isLoading={loading}
        sidebarOpen={sidebarOpen}
        stations={sidebarStations}
        selectedRegion={selectedRegion}
        currentTime={currentTime}
        onCloseSidebar={() => setSidebarOpen(false)}
        onPlayStation={playStation}
        currentStation={currentStation}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        volume={volume}
        onVolumeChange={setVolume}
      />
    </div>
  );
}

export default App;