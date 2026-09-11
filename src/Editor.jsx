import React, { useState } from 'react';

export default function Editor() {
  const [timeline, setTimeline] = useState({
    mainVideo: { name: 'Main Target', volume: 1.0, crop: { active: false, cropX: 10, cropY: 10, width: 80, height: 80 } },
    overlays: [], // For images and B-roll videos
    audioTracks: []
  });

  const addOverlay = () => {
    setTimeline(prev => ({
      ...prev,
      overlays: [...prev.overlays, { id: Date.now(), type: 'image', name: 'watermark.png', x: 80, y: 80, scale: 20 }]
    }));
  };

  const updateVolume = (val) => {
    setTimeline(prev => ({ ...prev, mainVideo: { ...prev.mainVideo, volume: parseFloat(val) } }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', height: '100%' }}>
      
      {/* Real-time Preview Area */}
      <div style={{ height: '30vh', backgroundColor: '#000', borderRadius: '8px', position: 'relative', border: '1px solid #333' }}>
        <p style={{ color: '#888', textAlign: 'center', marginTop: '10%' }}>[ Main Video Background ]</p>
        
        {/* Render Overlays in the Preview */}
        {timeline.overlays.map(overlay => (
           <div key={overlay.id} style={{ 
             position: 'absolute', 
             top: `${overlay.y}%`, left: `${overlay.x}%`, 
             width: `${overlay.scale}%`, height: `${overlay.scale}%`, 
             backgroundColor: 'rgba(255, 255, 255, 0.2)', border: '1px dashed #fff',
             display: 'flex', alignItems: 'center', justifyContent: 'center'
           }}>
             <span style={{ fontSize: '0.6rem' }}>{overlay.name}</span>
           </div>
        ))}
      </div>

      <div style={{ backgroundColor: '#1e1e1e', padding: '15px', borderRadius: '8px', flex: 1, overflowY: 'auto' }}>
        
        {/* Layer 1: Main Video & Cropping */}
        <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#2a2a2a', borderLeft: '4px solid #2196F3', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.8rem', color: '#2196F3', marginBottom: '10px', fontWeight: 'bold' }}>LAYER 1: MAIN VIDEO</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span>Volume: {Math.round(timeline.mainVideo.volume * 100)}%</span>
            <input 
              type="range" min="0" max="1" step="0.1" 
              value={timeline.mainVideo.volume} 
              onChange={(e) => updateVolume(e.target.value)} 
            />
          </div>
          <button style={{ padding: '6px 12px', backgroundColor: '#444', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.8rem' }}>
            Toggle Crop Editor
          </button>
        </div>

        {/* Layer 2: Overlays (Images / B-Roll) */}
        <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#2a2a2a', borderLeft: '4px solid #E91E63', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.8rem', color: '#E91E63', marginBottom: '10px', fontWeight: 'bold' }}>LAYER 2: OVERLAYS (PiP)</div>
          <button 
            onClick={addOverlay}
            style={{ padding: '6px 12px', backgroundColor: '#444', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.8rem', marginBottom: '10px' }}
          >
            + Add Image/Video Overlay
          </button>
          {timeline.overlays.map(overlay => (
             <div key={overlay.id} style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#1a1a1a', padding: '8px', borderRadius: '4px', marginTop: '5px' }}>
                <span style={{ fontSize: '0.8rem' }}>{overlay.name}</span>
                <span style={{ fontSize: '0.7rem', color: '#aaa' }}>Pos: ({overlay.x}, {overlay.y})</span>
             </div>
          ))}
        </div>

      </div>
    </div>
  );
}
