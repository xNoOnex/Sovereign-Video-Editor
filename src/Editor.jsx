import React, { useState } from 'react';

export default function Editor() {
  // Implementing the explicit Timeline Data Model from the architectural notes
  const [project, setProject] = useState({
    duration: 30, // Total project time in seconds
    zoomLevel: 10, // Pixels per second for mapping touch gestures
    selectedClipId: null, // For Progressive Disclosure UI
    tracks: [
      {
        id: 't-main',
        type: 'main_video',
        name: 'Primary Reel',
        clips: [
          { id: 'c1', name: 'Desert_Driving.mp4', timelineStartTime: 0, sourceStartTime: 5, sourceEndTime: 15, duration: 10, color: '#4CAF50' },
          { id: 'c2', name: 'Campfire.mp4', timelineStartTime: 10, sourceStartTime: 0, sourceEndTime: 5, duration: 5, color: '#4CAF50' }
        ]
      },
      {
        id: 't-pip',
        type: 'overlay',
        name: 'PIP / Overlays',
        clips: [
          { id: 'c3', name: 'Watermark.png', timelineStartTime: 2, sourceStartTime: 0, sourceEndTime: 0, duration: 8, color: '#E91E63' }
        ]
      },
      {
        id: 't-audio',
        type: 'audio',
        name: 'SFX / Music',
        clips: [
          { id: 'c4', name: 'Engine_Rev.wav', timelineStartTime: 1, sourceStartTime: 0, sourceEndTime: 4, duration: 4, color: '#00BCD4' }
        ]
      }
    ]
  });

  // Calculate width and position based on Timeline Coordinate Math
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
      <div style={{ flex: '0 0 40%', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <p style={{ color: '#555' }}>Preview Engine Output</p>
        
        {/* Progressive Disclosure UI Toolbar (Appears only when clip is selected) */}
        {project.selectedClipId && (
          <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px', backgroundColor: '#1E1E1E', padding: '8px 16px', borderRadius: '24px', border: '1px solid #333' }}>
            <button style={{ background: 'none', border: 'none', color: '#fff', fontSize: '12px' }}>✂️ Split</button>
            <button style={{ background: 'none', border: 'none', color: '#fff', fontSize: '12px' }}>⏱️ Speed</button>
            <button style={{ background: 'none', border: 'none', color: '#fff', fontSize: '12px' }}>🗑️ Delete</button>
          </div>
        )}
      </div>

      {/* 2. Transport Controls */}
      <div style={{ height: '50px', backgroundColor: '#141414', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', padding: '0 15px', gap: '15px' }}>
        <span style={{ fontSize: '12px', color: '#888' }}>00:00:00</span>
        <button style={{ background: '#fff', color: '#000', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▶</button>
        <span style={{ fontSize: '12px', color: '#888' }}>/ 00:00:30</span>
      </div>

      {/* 3. Explicit Multi-Track Layering UI */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '10px 0', backgroundColor: '#121212' }}>
        
        {/* Playhead Placeholder */}
        <div style={{ position: 'absolute', left: '100px', top: '45%', bottom: 0, width: '2px', backgroundColor: '#fff', zIndex: 50 }}>
          <div style={{ position: 'absolute', top: '-6px', left: '-4px', width: '10px', height: '10px', backgroundColor: '#fff', transform: 'rotate(45deg)' }} />
        </div>

        {/* Scrollable Timeline Area */}
        <div style={{ overflowX: 'auto', paddingLeft: '20px', minWidth: `${project.duration * project.zoomLevel + 100}px` }}>
          {project.tracks.map(track => (
            <div key={track.id} style={{ display: 'flex', marginBottom: '10px', height: '50px', position: 'relative', backgroundColor: '#1A1A1A', borderRadius: '4px' }}>
              
              {/* Track Header */}
              <div style={{ position: 'sticky', left: 0, width: '80px', backgroundColor: '#1A1A1A', borderRight: '1px solid #333', zIndex: 10, display: 'flex', alignItems: 'center', padding: '0 5px', fontSize: '10px', color: '#888' }}>
                {track.name}
              </div>

              {/* Clip Blocks */}
              <div style={{ position: 'relative', flex: 1 }}>
                {track.clips.map(clip => (
                  <div 
                    key={clip.id} 
                    style={getClipStyle(clip)}
                    onClick={() => setProject(prev => ({ ...prev, selectedClipId: prev.selectedClipId === clip.id ? null : clip.id }))}
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
