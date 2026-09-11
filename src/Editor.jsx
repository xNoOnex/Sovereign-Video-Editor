import React, { useState } from 'react';

export default function Editor() {
  const [timeline, setTimeline] = useState({
    mainVideo: { volume: 1.0 },
    watermark: { active: true, text: '© 2026 Sovereign', x: 80, y: 80 }
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', height: '100%' }}>
      
      {/* Real-time Preview Area */}
      <div style={{ height: '30vh', backgroundColor: '#000', borderRadius: '8px', position: 'relative', border: '1px solid #333' }}>
        <p style={{ color: '#888', textAlign: 'center', marginTop: '10%' }}>[ Main Video Background ]</p>
        
        {/* Custom Watermark Overlay */}
        {timeline.watermark.active && (
           <div style={{ position: 'absolute', top: `${timeline.watermark.y}%`, left: `${timeline.watermark.x}%`, color: 'white', textShadow: '2px 2px 4px #000' }}>
             {timeline.watermark.text}
           </div>
        )}
      </div>

      <div style={{ backgroundColor: '#1e1e1e', padding: '15px', borderRadius: '8px', flex: 1 }}>
        <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#2a2a2a', borderLeft: '4px solid #FFC107', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.8rem', color: '#FFC107', marginBottom: '10px', fontWeight: 'bold' }}>CUSTOM WATERMARK</div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input 
              type="text" 
              value={timeline.watermark.text} 
              onChange={(e) => setTimeline(prev => ({ ...prev, watermark: { ...prev.watermark, text: e.target.value } }))}
              style={{ flex: 1, padding: '8px', backgroundColor: '#111', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
