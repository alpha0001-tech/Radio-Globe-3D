import React from 'react';
import { RadioStation } from '../types';

interface OverlayProps {
  isLoading: boolean;
  sidebarOpen: boolean;
  stations: RadioStation[];
  selectedRegion: string;
  onCloseSidebar: () => void;
  onPlayStation: (station: RadioStation) => void;
  currentStation: RadioStation | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  volume: number;
  onVolumeChange: (val: number) => void;
  currentTime: string;
}

const Overlay: React.FC<OverlayProps> = ({
  isLoading,
  sidebarOpen,
  stations,
  selectedRegion,
  onCloseSidebar,
  onPlayStation,
  currentStation,
  isPlaying,
  onTogglePlay,
  volume,
  onVolumeChange,
  currentTime
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between">
      {/* Loading Screen */}
      {isLoading && (
        <div className="fixed inset-0 bg-neutral-950 flex flex-col justify-center items-center z-50 transition-opacity duration-500 pointer-events-auto">
          <div className="w-12 h-12 border-4 border-white/10 border-t-[#00ff88] rounded-full animate-spin mb-5"></div>
          <div className="text-white text-lg tracking-wider">Initializing Satellites...</div>
        </div>
      )}

      {/* Sidebar - Slide In */}
      <div 
        className={`absolute top-0 right-0 w-80 h-full bg-slate-900/80 backdrop-blur-xl border-l border-white/10 transform transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] pointer-events-auto flex flex-col shadow-2xl ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <button 
          onClick={onCloseSidebar}
          className="absolute top-3 right-3 text-white/50 hover:text-white transition-colors text-2xl leading-none px-2"
        >
          &times;
        </button>
        
        <div className="p-6 border-b border-white/10">
          <h2 className="text-[#00ff88] font-bold text-xl m-0">{selectedRegion || "Select Region"}</h2>
          <p className="text-white/70 text-sm mt-1 font-mono">{currentTime}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {stations.length === 0 ? (
            <div className="text-white/40 text-center mt-10 text-sm">No stations found in this range.</div>
          ) : (
            stations.map((st) => (
              <div 
                key={st.stationuuid}
                onClick={() => onPlayStation(st)}
                className="p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-transparent hover:border-[#00ff88]/50 cursor-pointer transition-all group"
              >
                <h3 className="text-white font-medium text-sm mb-1 group-hover:text-[#00ff88] transition-colors truncate">{st.name}</h3>
                <div className="text-xs text-white/40 truncate">{st.tags || 'Music'}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Attribution */}
      <div className="absolute bottom-4 left-4 text-[10px] text-white/30 pointer-events-none">
        Data by Radio-Browser.info | Vis by Three.js
      </div>

      {/* Bottom Player */}
      <div className="pointer-events-auto self-center mb-8 w-[90%] max-w-2xl">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-5 shadow-2xl shadow-black/50">
          
          <button 
            onClick={onTogglePlay}
            className="w-12 h-12 rounded-full bg-[#00ff88] text-black hover:scale-110 active:scale-95 transition-transform flex items-center justify-center text-xl pl-1 shadow-[0_0_20px_rgba(0,255,136,0.3)]"
          >
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 -ml-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 ml-0.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
              </svg>
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="text-white font-bold truncate">
              {currentStation ? currentStation.name : "Select a location"}
            </div>
            <div className="text-[#00ff88]/80 text-xs mt-1 truncate">
              {currentStation ? `${currentStation.country} ${currentStation.state ? `- ${currentStation.state}` : ''}` : "Click green dots on the globe to explore"}
            </div>
          </div>

          <div className="flex items-center gap-3 text-white/60 text-xs font-semibold">
            <span>VOL</span>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-20 accent-[#00ff88] h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
            />
          </div>

        </div>
      </div>
    </div>
  );
};

export default Overlay;