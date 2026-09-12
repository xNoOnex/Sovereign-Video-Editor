import React, { useState, useRef } from 'react';

export default function Editor() {
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  const [project, setProject] = useState({
    duration: 30, 
    zoomLevel: 10, 
    selectedClipId: null, 
    activePreviewUrl: null, // Holds the current video being played
    tracks: [
      { id: 't-main', type: 'main_video', name: 'Primary Reel', clips: [] },
      { id: 't-pip', type: 'overlay', name: 'PIP / Overlays', clips: [] },
      { id: 't-audio', type: 'audio', name: 'SFX / Music', clips: [] }
    ]
  });

  // 1. Bridge to Native Android Gallery
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 2. Generate a high-speed local stream link
    const fileUrl = URL.createObjectURL(file);
    const newClipId = 'c-' + Math.random().toString(36).substr(2, 9);

    // 3. Drop the new media into the Primary Reel data model
    setProject(prev => {
      const newTracks = [...prev.tracks];
      newTracks[0].clips.push({
        id: newClipId,
        name: file.name,
        timelineStartTime: 0,
        sourceStartTime: 0,
        sourceEndTime: 10, 
        duration: 10, // Defaulting block size to 10 seconds for preview
        color: '#4CAF50',
        url: fileUrl
      });
      
      return { 
        ...prev, 
        tracks: newTracks, 
        selectedClipId: newClipId,
        activePreviewUrl: fileUrl 
      };
    });
  };

  // Play the specific clip when tapped in the timeline
  const handleClipTap = (clip) => {
    setProject(prev => ({ 
      ...prev, 
      selectedClipId: prev.selectedClipId === clip.id ? null : clip.id,
      activePreviewUrl: clip.url || prev.activePreviewUrl
    }));
  };

  const getClipStyle = (clip) => ({
    position: 'absolute',
    left: `${clip.timelineStartTime * project.zoomLevel}px`,
    width: `${clip.duration * project.zoomLevel}px`,
    backgroundColor: clip.color,
    height: '100%',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    padding: '0 8px',
    fontSize: '10px',
    color: '#fff',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    boxShadow: project.selectedClipId === clip.id ? '0 0 0 2px #fff' : 'none',
    opacity: project.selectedClipId === clip.id ? 1 : 0.85
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#0A0A0A', color: '#ECECEC', fontFamily: 'sans-serif' }}>
      
      {/* 1. Video Preview Canvas */}
      <div style={{ flex: '0 0 40%', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        {project.activePreviewUrl ? (
          <video 
            ref={videoRef}
            src={project.activePreviewUrl} 
            controls 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        ) : (
          <p style={{ color: '#555' }}>[ No Media Selected ]</p>
        )}
        
        {/* Contextual Toolbar */}
        {project.selectedClipId && (
          <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px', backgroundColor: '#1E1E1E', padding: '8px 16px', borderRadius: '24px', border: '1px solid #333', zIndex: 20 }}>
            <button style={{ background: 'none', border: 'none', color: '#fff', fontSize: '12px' }}>✂️ Split</button>
            <button style={{ background: 'none', border: 'none', color: '#fff', fontSize: '12px' }}>🗑️ Delete</button>
          </div>
        )}
      </div>

      {/* 2. Transport Controls & Add Media */}
      <div style={{ height: '50px', backgroundColor: '#141414', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '12px', color: '#888' }}>00:00:00</span>
          <button onClick={() => videoRef.current?.play()} style={{ background: '#fff', color: '#000', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▶</button>
        </div>
        
        {/* Hidden File Input & Trigger Button */}
        <input 
          type="file" 
          accept="video/*" 
          ref={fileInputRef} 
          onChange={handleFileSelect} 
          style={{ display: 'none' }} 
        />
        <button 
          onClick={() => fileInputRef.current.click()} 
          style={{ backgroundColor: '#2196F3', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}
        >
          + Add Media
        </button>
      </div>

      {/* 3. Explicit Multi-Track Layering UI */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '10px 0', backgroundColor: '#121212', position: 'relative' }}>
        
        <div style={{ position: 'absolute', left: '100px', top: 0, bottom: 0, width: '2px', backgroundColor: '#fff', zIndex: 50 }}>
          <div style={{ position: 'absolute', top: '-6px', left: '-4px', width: '10px', height: '10px', backgroundColor: '#fff', transform: 'rotate(45deg)' }} />
        </div>

        <div style={{ overflowX: 'auto', paddingLeft: '20px', minWidth: `${project.duration * project.zoomLevel + 100}px` }}>
          {project.tracks.map(track => (
            <div key={track.id} style={{ display: 'flex', marginBottom: '10px', height: '50px', position: 'relative', backgroundColor: '#1A1A1A', borderRadius: '4px' }}>
              
              <div style={{ position: 'sticky', left: 0, width: '80px', backgroundColor: '#1A1A1A', borderRight: '1px solid #333', zIndex: 10, display: 'flex', alignItems: 'center', padding: '0 5px', fontSize: '10px', color: '#888' }}>
                {track.name}
              </div>

              <div style={{ position: 'relative', flex: 1 }}>
                {track.clips.map(clip => (
                  <div 
                    key={clip.id} 
                    style={getClipStyle(clip)}
                    onClick={() => handleClipTap(clip)}
                  >
                    {clip.name}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}
