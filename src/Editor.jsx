import React, { useState } from 'react';

export default function Editor() {
  const [timeline, setTimeline] = useState({
    mainVideo: { volume: 1.0 },
    watermark: { active: true, text: '© 2026 Sovereign', x: 80, y: 80 },
    gifExport: { active: false, start: 0, end: 5 } // New GIF state
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', height: '100%', paddingBottom: '20px' }}>
      
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

      <div style={{ backgroundColor: '#1e1e1e', padding: '15px', borderRadius: '8px', flex: 1, overflowY: 'auto' }}>
        
        {/* Custom Watermark Panel */}
        <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#2a2a2a', borderLeft: '4px solid #FFC107', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.8rem', color: '#FFC107', marginBottom: '10px', fontWeight: 'bold' }}>CUSTOM WATERMARK</div>
          <input 
            type="text" 
            value={timeline.watermark.text} 
            onChange={(e) => setTimeline(prev => ({ ...prev, watermark: { ...prev.watermark, text: e.target.value } }))}
            style={{ width: '100%', padding: '8px', backgroundColor: '#111', color: '#fff', border: '1px solid #444', borderRadius: '4px', boxSizing: 'border-box' }}
          />
        </div>

        {/* High-Fidelity GIF Creator Panel */}
        <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#2a2a2a', borderLeft: '4px solid #00BCD4', borderRadius: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ fontSize: '0.8rem', color: '#00BCD4', fontWeight: 'bold' }}>GIF EXPORT MODE</div>
            <button 
              onClick={() => setTimeline(prev => ({ ...prev, gifExport: { ...prev.gifExport, active: !prev.gifExport.active } }))}
              style={{ padding: '4px 8px', backgroundColor: timeline.gifExport.active ? '#00BCD4' : '#444', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.7rem' }}
            >
              {timeline.gifExport.active ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>
          
          {timeline.gifExport.active && (
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.7rem', color: '#aaa' }}>Start (sec)</label>
                <input 
                  type="number" min="0" step="0.1" value={timeline.gifExport.start}
                  onChange={(e) => setTimeline(prev => ({ ...prev, gifExport: { ...prev.gifExport, start: parseFloat(e.target.value) } }))}
                  style={{ width: '100%', padding: '8px', backgroundColor: '#111', color: '#fff', border: '1px solid #444', borderRadius: '4px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.7rem', color: '#aaa' }}>End (sec)</label>
                <input 
                  type="number" min="0" step="0.1" value={timeline.gifExport.end}
                  onChange={(e) => setTimeline(prev => ({ ...prev, gifExport: { ...prev.gifExport, end: parseFloat(e.target.value) } }))}
                  style={{ width: '100%', padding: '8px', backgroundColor: '#111', color: '#fff', border: '1px solid #444', borderRadius: '4px', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
