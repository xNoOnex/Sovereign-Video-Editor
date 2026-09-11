import React, { useState, useRef } from 'react';

export default function Editor() {
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const [timeline, setTimeline] = useState({
    overlay: {
      active: true,
      x: 50, 
      y: 50,
      keyframes: []
    }
  });

  // 1. Finger touches the overlay -> Play video
  const handleTouchStart = (e) => {
    // Prevent screen scrolling while dragging
    e.preventDefault(); 
    if (videoRef.current) videoRef.current.play();
  };

  // 2. Finger drags -> Move overlay and record keyframes
  const handleTouchMove = (e) => {
    if (!containerRef.current || !videoRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    
    // Calculate new position as a percentage of the video container
    let newX = ((touch.clientX - rect.left) / rect.width) * 100;
    let newY = ((touch.clientY - rect.top) / rect.height) * 100;
    
    // Keep the overlay inside the box
    newX = Math.max(0, Math.min(100, newX));
    newY = Math.max(0, Math.min(100, newY));
    
    const currentTime = videoRef.current.currentTime;
    
    setTimeline(prev => ({
      ...prev,
      overlay: {
        ...prev.overlay,
        x: newX,
        y: newY,
        keyframes: [...prev.overlay.keyframes, { time: currentTime.toFixed(2), x: newX.toFixed(2), y: newY.toFixed(2) }]
      }
    }));
  };

  // 3. Finger lifts -> Pause video
  const handleTouchEnd = () => {
    if (videoRef.current) videoRef.current.pause();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', height: '100%' }}>
      
      {/* Live Tracking Preview Area */}
      <div 
        ref={containerRef}
        style={{ height: '35vh', backgroundColor: '#000', borderRadius: '8px', position: 'relative', border: '1px solid #333', overflow: 'hidden' }}
      >
        {/* Hidden video element used to drive the time engine */}
        <video 
          ref={videoRef} 
          src="https://www.w3schools.com/html/mov_bbb.mp4" 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          muted playsInline
        />
        
        {/* The Draggable Censor/Overlay */}
        {timeline.overlay.active && (
           <div 
             onTouchStart={handleTouchStart}
             onTouchMove={handleTouchMove}
             onTouchEnd={handleTouchEnd}
             style={{ 
               position: 'absolute', 
               top: `${timeline.overlay.y}%`, 
               left: `${timeline.overlay.x}%`, 
               transform: 'translate(-50%, -50%)', /* Centers finger on the box */
               width: '60px', height: '60px',
               backgroundColor: 'rgba(233, 30, 99, 0.8)', border: '2px solid #fff',
               borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
               color: 'white', fontSize: '0.6rem', fontWeight: 'bold', textAlign: 'center',
               boxShadow: '0 4px 8px rgba(0,0,0,0.5)'
             }}>
             DRAG ME
           </div>
        )}
      </div>

      <div style={{ backgroundColor: '#1e1e1e', padding: '15px', borderRadius: '8px', flex: 1, overflowY: 'auto' }}>
        <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#2a2a2a', borderLeft: '4px solid #E91E63', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.8rem', color: '#E91E63', marginBottom: '10px', fontWeight: 'bold' }}>RECORDED KEYFRAMES ({timeline.overlay.keyframes.length})</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '150px', overflowY: 'auto' }}>
            {timeline.overlay.keyframes.slice().reverse().map((kf, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#aaa', backgroundColor: '#111', padding: '6px', borderRadius: '4px' }}>
                <span>Time: {kf.time}s</span>
                <span>X: {kf.x}% | Y: {kf.y}%</span>
              </div>
            ))}
          </div>
          <button 
            onClick={() => setTimeline(prev => ({ ...prev, overlay: { ...prev.overlay, keyframes: [] } }))}
            style={{ marginTop: '10px', width: '100%', padding: '8px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.7rem' }}
          >
            Clear Tracking Data
          </button>
        </div>
      </div>
    </div>
  );
}
