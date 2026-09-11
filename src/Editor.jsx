import React, { useState } from 'react';

export default function Editor() {
  const [timeline, setTimeline] = useState({
    mainVideo: { volume: 1.0 },
    overlays: [
      {
        id: 1,
        name: 'tracking_sticker.png',
        active: true,
        keyframes: [
          { time: 0.0, x: 10, y: 10 },
          { time: 3.0, x: 80, y: 80 } // Moves across the screen over 3 seconds
        ]
      }
    ]
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', height: '100%', paddingBottom: '20px' }}>
      
      {/* Real-time Preview Area */}
      <div style={{ height: '30vh', backgroundColor: '#000', borderRadius: '8px', position: 'relative', border: '1px solid #333', overflow: 'hidden' }}>
        <p style={{ color: '#888', textAlign: 'center', marginTop: '10%' }}>[ Main Video Background ]</p>
        
        {/* Render Overlays Based on their FIRST Keyframe for preview purposes */}
        {timeline.overlays.map(overlay => (
           overlay.active && overlay.keyframes.length > 0 && (
             <div key={overlay.id} style={{ 
               position: 'absolute', 
               top: `${overlay.keyframes[0].y}%`, 
               left: `${overlay.keyframes[0].x}%`, 
               backgroundColor: 'rgba(233, 30, 99, 0.5)', border: '2px solid #E91E63',
               padding: '5px', borderRadius: '4px', color: 'white', fontSize: '0.7rem'
             }}>
               {overlay.name} [Keyframed]
             </div>
           )
        ))}
      </div>

      <div style={{ backgroundColor: '#1e1e1e', padding: '15px', borderRadius: '8px', flex: 1, overflowY: 'auto' }}>
        
        {/* Keyframe Animation Panel */}
        <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#2a2a2a', borderLeft: '4px solid #E91E63', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.8rem', color: '#E91E63', marginBottom: '10px', fontWeight: 'bold' }}>MOTION TRACKING (KEYFRAMES)</div>
          
          {timeline.overlays.map(overlay => (
            <div key={overlay.id} style={{ backgroundColor: '#111', padding: '10px', borderRadius: '4px' }}>
              <strong style={{ fontSize: '0.8rem', color: '#fff' }}>{overlay.name}</strong>
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {overlay.keyframes.map((kf, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#aaa', backgroundColor: '#222', padding: '6px', borderRadius: '4px' }}>
                    <span>Time: {kf.time}s</span>
                    <span>X: {kf.x}% | Y: {kf.y}%</span>
                  </div>
                ))}
              </div>
              <button style={{ marginTop: '10px', width: '100%', padding: '6px', backgroundColor: '#444', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.7rem' }}>
                + Record New Keyframe Here
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
