import React, { useState, useRef, useEffect } from 'react';

export default function Editor() {
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const [timeline, setTimeline] = useState({
    videoControls: { zoom: 1.0, speed: 1.0 },
    overlay: { active: true, x: 50, y: 50, keyframes: [] }
  });

  // Dynamically update the video playback speed when the slider changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = timeline.videoControls.speed;
    }
  }, [timeline.videoControls.speed]);

  const handleTouchStart = (e) => {
    e.preventDefault(); 
    if (videoRef.current) videoRef.current.play();
  };

  const handleTouchMove = (e) => {
    if (!containerRef.current || !videoRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    
    let newX = ((touch.clientX - rect.left) / rect.width) * 100;
    let newY = ((touch.clientY - rect.top) / rect.height) * 100;
    
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

  const handleTouchEnd = () => {
    if (videoRef.current) videoRef.current.pause();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', height: '100%' }}>
      
      {/* Live Tracking & Zoom Preview Area */}
      <div 
        ref={containerRef}
        style={{ height: '35vh', backgroundColor: '#000', borderRadius: '8px', position: 'relative', border: '1px solid #333', overflow: 'hidden' }}
      >
        {/* The video wrapper handles the dynamic zooming */}
        <div style={{ width: '100%', height: '100%', transform: `scale(${timeline.videoControls.zoom})`, transition: 'transform 0.1s ease-out' }}>
          <video 
            ref={videoRef} 
            src="https://www.w3schools.com/html/mov_bbb.mp4" 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            muted playsInline loop
          />
        </div>
        
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
               transform: 'translate(-50%, -50%)',
               width: '60px', height: '60px',
               backgroundColor: 'rgba(233, 30, 99, 0.8)', border: '2px solid #fff',
               borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
               color: 'white', fontSize: '0.6rem', fontWeight: 'bold', textAlign: 'center',
               boxShadow: '0 4px 8px rgba(0,0,0,0.5)',
               zIndex: 10
             }}>
             DRAG ME
           </div>
        )}
      </div>

      <div style={{ backgroundColor: '#1e1e1e', padding: '15px', borderRadius: '8px', flex: 1, overflowY: 'auto' }}>
        
        {/* Playback & View Controls */}
        <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#2a2a2a', borderLeft: '4px solid #4CAF50', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.8rem', color: '#4CAF50', marginBottom: '10px', fontWeight: 'bold' }}>VIDEO CONTROLS</div>
          
          <div style={{ marginBottom: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#aaa', marginBottom: '5px' }}>
              <span>Zoom</span>
              <span>{timeline.videoControls.zoom.toFixed(1)}x</span>
            </div>
            <input 
              type="range" min="1" max="3" step="0.1" 
              value={timeline.videoControls.zoom} 
              onChange={(e) => setTimeline(prev => ({ ...prev, videoControls: { ...prev.videoControls, zoom: parseFloat(e.target.value) } }))}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#aaa', marginBottom: '5px' }}>
              <span>Speed (Playback Rate)</span>
              <span>{timeline.videoControls.speed.toFixed(2)}x</span>
            </div>
            <input 
              type="range" min="0.25" max="2" step="0.25" 
              value={timeline.videoControls.speed} 
              onChange={(e) => setTimeline(prev => ({ ...prev, videoControls: { ...prev.videoControls, speed: parseFloat(e.target.value) } }))}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Live Tracking Panel */}
        <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#2a2a2a', borderLeft: '4px solid #E91E63', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.8rem', color: '#E91E63', marginBottom: '10px', fontWeight: 'bold' }}>MOTION TRACKING ({timeline.overlay.keyframes.length} pts)</div>
          <button 
            onClick={() => setTimeline(prev => ({ ...prev, overlay: { ...prev.overlay, keyframes: [] } }))}
            style={{ width: '100%', padding: '8px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.7rem' }}
          >
            Clear Tracking Data
          </button>
        </div>

      </div>
    </div>
  );
}
