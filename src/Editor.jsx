import React, { useState, useRef, useEffect } from 'react';

export default function Editor() {
  const mainMediaRef = useRef(null);
  const pipMediaRef = useRef(null);
  const audioMediaRef = useRef(null);
  
  const containerRef = useRef(null);

  const [project, setProject] = useState({
    duration: 30, zoomLevel: 10, selectedClipId: null,
    tracks: [
      { id: 't-main', type: 'main_video', name: 'Primary', muted: false, clips: [] },
      { id: 't-audio', type: 'audio', name: 'Audio/SFX', muted: false, clips: [] }
    ]
  });

  const [currentTime, setCurrentTime] = useState(0);
  const timeRef = useRef(0); // High-speed clock for touch tracking
  const [isPlaying, setIsPlaying] = useState(false);
  
  // High-speed drag references to bypass React state lag
  const [livePos, setLivePos] = useState({ x: 50, y: 50 });
  const isDraggingOverlay = useRef(false);
  const activeDragClip = useRef(null); // Tracks exactly which layer you grabbed
  const pinchRef = useRef({ active: false, startDist: 0, startZoom: 1 });
  const interaction = useRef({ type: null, targetId: null, trackId: null, edge: null, startX: 0, initialStart: 0, initialDuration: 0 });

  const getSelectedData = () => {
    if (!project.selectedClipId) return null;
    for (const track of project.tracks) {
      const clip = track.clips.find(c => c.id === project.selectedClipId);
      if (clip) return { clip, trackId: track.id, track };
    }
    return null;
  };

  const selectedData = getSelectedData();

  // --- MASTER CLOCK & SYNC ENGINE ---
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const nextTime = prev >= project.duration ? 0 : prev + 0.05;
          timeRef.current = nextTime;
          if (nextTime === 0) setIsPlaying(false);
          return nextTime;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isPlaying, project.duration]);

  useEffect(() => {
    const mediaElements = document.querySelectorAll('.compositor-media');
    mediaElements.forEach(media => {
      if (isPlaying && media.paused) media.play().catch(() => {});
      if (!isPlaying && !media.paused) media.pause();
    });
  }, [isPlaying, currentTime]);

  const togglePlayback = () => setIsPlaying(!isPlaying);

  const toggleTrackMute = (trackId) => setProject(prev => ({ ...prev, tracks: prev.tracks.map(t => t.id === trackId ? { ...t, muted: !t.muted } : t) }));

  const updateSelectedClip = (key, value) => {
    if (!selectedData) return;
    setProject(prev => {
      const newTracks = prev.tracks.map(t => {
        if (t.id !== selectedData.trackId) return t;
        return { ...t, clips: t.clips.map(c => c.id === selectedData.clip.id ? { ...c, [key]: value } : c) };
      });
      return { ...prev, tracks: newTracks };
    });
  };

  // --- DYNAMIC MEDIA ROUTER ---
  const handleAddMedia = (e, targetType, defaultColor) => {
    const file = e.target.files[0];
    if (!file) return;
    const fileUrl = URL.createObjectURL(file);
    const isImage = file.type.startsWith('image/');
    const isAudio = file.type.startsWith('audio/');
    const newClipId = 'c-' + Math.random().toString(36).substr(2, 9);

    const newClip = { 
      id: newClipId, name: file.name, type: isAudio ? 'audio' : (isImage ? 'image' : 'video'),
      timelineStartTime: currentTime, duration: isImage || isAudio ? 5 : 15, color: defaultColor, url: fileUrl, 
      zoom: 1.0, speed: 1.0, muted: false, keyframes: [], zoomKeyframes: [],
      baseX: 50, baseY: 50 // Base coordinates for static positioning
    };

    setProject(prev => {
      const newTracks = [...prev.tracks];
      if (targetType === 'main_video' || targetType === 'audio') {
        const trackIndex = newTracks.findIndex(t => t.type === targetType);
        newTracks[trackIndex].clips.push(newClip);
      } else if (targetType === 'overlay') {
        const overlayCount = newTracks.filter(t => t.type === 'overlay').length + 1;
        const newTrack = { id: `t-pip-${overlayCount}`, type: 'overlay', name: `Overlay ${overlayCount}`, muted: false, clips: [newClip] };
        const audioIndex = newTracks.findIndex(t => t.type === 'audio');
        newTracks.splice(audioIndex, 0, newTrack);
      }
      return { ...prev, tracks: newTracks, selectedClipId: newClipId };
    });
    e.target.value = ''; 
  };

  // --- LIVE MULTI-TOUCH ENGINE (Zoom & Drag) ---
  const handleZoomChange = (newZoom) => {
    if (!selectedData) return;
    setProject(prev => {
      const newTracks = prev.tracks.map(t => {
        if (t.id !== selectedData.trackId) return t;
        return { ...t, clips: t.clips.map(c => {
            if (c.id !== selectedData.clip.id) return c;
            const updatedClip = { ...c, zoom: newZoom };
            if (isPlaying) updatedClip.zoomKeyframes = [...(c.zoomKeyframes || []), { time: timeRef.current, zoom: newZoom }];
            return updatedClip;
          })
        };
      });
      return { ...prev, tracks: newTracks };
    });
  };

  const getPinchDistance = (touches) => Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);

  const handleViewportTouchStart = (e) => {
    // 2-Finger Pinch Zoom on Main Video
    if (selectedData && e.touches.length === 2 && selectedData.trackId === 't-main') {
      e.preventDefault();
      pinchRef.current = { active: true, startDist: getPinchDistance(e.touches), startZoom: selectedData.clip.zoom || 1 };
    }
  };

  const handleOverlayTouchStart = (e, clipId, trackId) => {
    e.stopPropagation(); // Stop the viewport from intercepting
    activeDragClip.current = { clipId, trackId };
    isDraggingOverlay.current = true;
    setProject(prev => ({ ...prev, selectedClipId: clipId })); // Auto-select the overlay you grabbed
  };

  const handleViewportTouchMove = (e) => {
    if (!containerRef.current) return;

    // Handle Pinch Zoom
    if (pinchRef.current.active && e.touches.length === 2 && selectedData?.trackId === 't-main') {
      const scaleMultiplier = getPinchDistance(e.touches) / pinchRef.current.startDist;
      let newZoom = Math.max(0.5, Math.min(5.0, pinchRef.current.startZoom * scaleMultiplier));
      handleZoomChange(newZoom);
    }
    
    // Handle Overlay Dragging
    else if (isDraggingOverlay.current && activeDragClip.current) {
      const rect = containerRef.current.getBoundingClientRect();
      let newX = Math.max(0, Math.min(100, ((e.touches[0].clientX - rect.left) / rect.width) * 100));
      let newY = Math.max(0, Math.min(100, ((e.touches[0].clientY - rect.top) / rect.height) * 100));
      setLivePos({ x: newX, y: newY }); // Update UI instantly

      setProject(prev => {
        const newTracks = [...prev.tracks];
        const tIndex = newTracks.findIndex(t => t.id === activeDragClip.current.trackId);
        if (tIndex === -1) return prev;
        const cIndex = newTracks[tIndex].clips.findIndex(c => c.id === activeDragClip.current.clipId);
        if (cIndex === -1) return prev;

        const clip = { ...newTracks[tIndex].clips[cIndex] };
        
        if (isPlaying) {
          // If video is playing, record keyframes
          if (!clip.keyframes) clip.keyframes = [];
          clip.keyframes.push({ time: timeRef.current, x: newX, y: newY });
        } else {
          // If paused, just permanently move the base location
          clip.baseX = newX;
          clip.baseY = newY;
        }

        newTracks[tIndex].clips[cIndex] = clip;
        return { ...prev, tracks: newTracks };
      });
    }
  };

  const handleViewportTouchEnd = () => { 
    pinchRef.current.active = false;
    isDraggingOverlay.current = false; 
    activeDragClip.current = null;
  };

  // --- TIMELINE INTERACTION ENGINE ---
  const startInteraction = (e, type, payload) => {
    e.stopPropagation();
    interaction.current = { type, startX: e.touches[0].clientX, ...payload };
    if (type === 'trim' || type === 'move') setProject(prev => ({ ...prev, selectedClipId: payload.clipId }));
  };

  const handleTimelineTouchMove = (e) => {
    const { type, edge, startX, initialStart, initialDuration, trackId, clipId } = interaction.current;
    if (!type) return;
    const deltaSeconds = (e.touches[0].clientX - startX) / project.zoomLevel;

    if (type === 'scrub') {
      const newTime = Math.max(0, initialStart + deltaSeconds);
      setCurrentTime(newTime);
      timeRef.current = newTime;
      return;
    }

    setProject(prev => {
      const newTracks = prev.tracks.map(track => {
        if (track.id !== trackId) return track;
        return {
          ...track, clips: track.clips.map(c => {
            if (c.id !== clipId) return c;
            let newStart = c.timelineStartTime;
            let newDuration = c.duration;
            if (type === 'move') newStart = Math.max(0, initialStart + deltaSeconds);
            else if (type === 'trim') {
              if (edge === 'left') {
                newStart = Math.max(0, initialStart + deltaSeconds);
                newDuration = Math.max(0.5, initialDuration - (newStart - initialStart));
              } else if (edge === 'right') newDuration = Math.max(0.5, initialDuration + deltaSeconds);
            }
            return { ...c, timelineStartTime: newStart, duration: newDuration };
          })
        };
      });
      return { ...prev, tracks: newTracks };
    });
  };
  const handleTimelineTouchEnd = () => { interaction.current.type = null; };

  // --- THE COMPOSITOR ---
  const activeMainClips = project.tracks.find(t => t.type === 'main_video')?.clips.filter(c => currentTime >= c.timelineStartTime && currentTime <= c.timelineStartTime + c.duration) || [];
  const overlayTracks = project.tracks.filter(t => t.type === 'overlay');
  const activeAudioClips = project.tracks.find(t => t.type === 'audio')?.clips.filter(c => currentTime >= c.timelineStartTime && currentTime <= c.timelineStartTime + c.duration) || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#000', color: '#ECECEC', fontFamily: 'sans-serif' }}>
      
      <input type="file" accept="*/*" ref={mainMediaRef} onChange={(e) => handleAddMedia(e, 'main_video', '#4CAF50')} style={{ display: 'none' }} />
      <input type="file" accept="*/*" ref={pipMediaRef} onChange={(e) => handleAddMedia(e, 'overlay', '#FF9800')} style={{ display: 'none' }} />
      <input type="file" accept="audio/*" ref={audioMediaRef} onChange={(e) => handleAddMedia(e, 'audio', '#00BCD4')} style={{ display: 'none' }} />

      {/* 1. VIEWPORT */}
      <div ref={containerRef} onTouchStart={handleViewportTouchStart} onTouchMove={handleViewportTouchMove} onTouchEnd={handleViewportTouchEnd} style={{ flex: '0 0 35%', backgroundColor: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', borderBottom: '1px solid #222' }}>
        
        {/* Layer 0: Main Reel */}
        {activeMainClips.map(clip => {
          let renderZoom = clip.zoom || 1.0;
          if (clip.zoomKeyframes?.length > 0 && (!isPlaying || project.selectedClipId !== clip.id)) {
            const pastKf = clip.zoomKeyframes.filter(kf => kf.time <= currentTime);
            if (pastKf.length > 0) renderZoom = pastKf[pastKf.length - 1].zoom;
          }
          return (
            <div key={clip.id} style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 1, transform: `scale(${renderZoom})`, opacity: project.tracks.find(t=>t.type==='main_video').muted ? 0.5 : 1 }}>
              {clip.type === 'image' ? (
                <img src={clip.url} style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} alt="main" />
              ) : (
                <video className="compositor-media" autoPlay={isPlaying} src={clip.url} style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} playsInline muted={clip.muted || project.tracks.find(t=>t.type==='main_video').muted} />
              )}
            </div>
          );
        })}

        {/* Layer Stack: Infinite Draggable Overlays */}
        {overlayTracks.map((track, trackIndex) => {
          const activeClips = track.clips.filter(c => currentTime >= c.timelineStartTime && currentTime <= c.timelineStartTime + c.duration);
          return activeClips.map(clip => {
            let posX = clip.baseX ?? 50; 
            let posY = clip.baseY ?? 50; 
            
            // Read keyframes if they exist, unless we are currently dragging this exact clip
            if (clip.keyframes?.length > 0 && (!isDraggingOverlay.current || activeDragClip.current?.clipId !== clip.id)) {
              const pastKf = clip.keyframes.filter(kf => kf.time <= currentTime);
              if (pastKf.length > 0) { posX = pastKf[pastKf.length - 1].x; posY = pastKf[pastKf.length - 1].y; }
            } else if (isDraggingOverlay.current && activeDragClip.current?.clipId === clip.id) {
              posX = livePos.x; posY = livePos.y;
            }

            return (
              <div key={clip.id} onTouchStart={(e) => handleOverlayTouchStart(e, clip.id, track.id)}
                style={{ 
                  position: 'absolute', top: `${posY}%`, left: `${posX}%`, transform: 'translate(-50%, -50%)', 
                  width: '35%', height: '35%', zIndex: 10 + trackIndex, 
                  border: project.selectedClipId === clip.id ? '2px solid #2196F3' : 'none', borderRadius: '8px', overflow: 'hidden' 
                }}>
                {clip.type === 'image' ? (
                  <img src={clip.url} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} alt="pip" /> 
                ) : (
                  <video className="compositor-media" autoPlay={isPlaying} src={clip.url} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} playsInline muted={clip.muted || track.muted} />
                )}
              </div>
            );
          });
        })}

        {activeAudioClips.map(clip => <audio key={clip.id} className="compositor-media" autoPlay={isPlaying} src={clip.url} muted={clip.muted || project.tracks.find(t=>t.type==='audio').muted} />)}
      </div>

      {/* 2. Transport */}
      <div style={{ height: '40px', backgroundColor: '#1A1A1A', display: 'flex', alignItems: 'center', padding: '0 15px', justifyContent: 'space-between', borderBottom: '1px solid #222' }}>
         <span style={{ fontSize: '12px', color: '#888', fontFamily: 'monospace' }}>{currentTime.toFixed(2)}s</span>
         <button onClick={togglePlayback} style={{ background: 'none', color: '#fff', border: 'none', fontSize: '20px' }}>{isPlaying ? '⏸' : '▶'}</button>
         <span style={{ fontSize: '12px', color: '#888', fontFamily: 'monospace' }}>{project.duration.toFixed(2)}s</span>
      </div>

      {/* 3. Multi-Track Timeline */}
      <div onTouchMove={handleTimelineTouchMove} onTouchEnd={handleTimelineTouchEnd} style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', backgroundColor: '#121212', position: 'relative', paddingBottom: '80px' }}>
        <div style={{ position: 'relative', minWidth: `${project.duration * project.zoomLevel + 100}px`, paddingTop: '30px' }}>
          
          <div onTouchStart={(e) => startInteraction(e, 'scrub', { initialStart: currentTime })}
            style={{ position: 'absolute', left: `${currentTime * project.zoomLevel + 70}px`, top: 0, bottom: 0, width: '2px', backgroundColor: '#E91E63', zIndex: 50 }}>
            <div style={{ position: 'absolute', top: '15px', left: '-6px', width: '14px', height: '14px', backgroundColor: '#E91E63', borderRadius: '50% 50% 0 50%', transform: 'rotate(45deg)', boxShadow: '0 0 4px rgba(0,0,0,0.5)' }} />
          </div>

          {project.tracks.map(track => (
            <div key={track.id} style={{ display: 'flex', marginBottom: '8px', height: '55px', position: 'relative', backgroundColor: '#1A1A1A' }}>
              <div style={{ position: 'sticky', left: 0, width: '70px', backgroundColor: '#222', borderRight: '1px solid #333', zIndex: 10, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 8px' }}>
                <span style={{ fontSize: '10px', color: '#fff', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden' }}>{track.name}</span>
                <button onClick={() => toggleTrackMute(track.id)} style={{ background: track.muted ? '#E91E63' : '#444', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '8px', padding: '4px', marginTop: '4px' }}>{track.muted ? '🔇 MUTED' : '🔊 MUTE'}</button>
              </div>

              <div style={{ position: 'relative', flex: 1 }} onClick={(e) => { if (e.target === e.currentTarget) setProject(p => ({ ...p, selectedClipId: null })) }}>
                {track.clips.map(clip => (
                  <div key={clip.id} onTouchStart={(e) => startInteraction(e, 'move', { clipId: clip.id, trackId: track.id, initialStart: clip.timelineStartTime })}
                    style={{
                      position: 'absolute', left: `${clip.timelineStartTime * project.zoomLevel}px`, width: `${clip.duration * project.zoomLevel}px`,
                      backgroundColor: clip.color, height: '100%', borderRadius: '4px', border: selectedData?.clip?.id === clip.id ? '2px solid #fff' : '1px solid #000',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#fff', opacity: track.muted ? 0.5 : 1
                    }}>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', padding: '0 5px', pointerEvents: 'none' }}>{clip.name} {clip.muted && '🔇'}</span>

                    {selectedData?.clip?.id === clip.id && (
                      <>
                        <div onTouchStart={(e) => startInteraction(e, 'trim', { clipId: clip.id, trackId: track.id, edge: 'left', initialStart: clip.timelineStartTime, initialDuration: clip.duration })} style={{ position: 'absolute', left: '-2px', top: 0, bottom: 0, width: '20px', backgroundColor: '#fff', borderRadius: '4px 0 0 4px', zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: '2px', height: '15px', backgroundColor: '#000' }} /></div>
                        <div onTouchStart={(e) => startInteraction(e, 'trim', { clipId: clip.id, trackId: track.id, edge: 'right', initialStart: clip.timelineStartTime, initialDuration: clip.duration })} style={{ position: 'absolute', right: '-2px', top: 0, bottom: 0, width: '20px', backgroundColor: '#fff', borderRadius: '0 4px 4px 0', zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: '2px', height: '15px', backgroundColor: '#000' }} /></div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Action Bar */}
      <div style={{ height: '70px', backgroundColor: '#111', borderTop: '1px solid #333', display: 'flex', alignItems: 'center', overflowX: 'auto', padding: '0 10px', position: 'fixed', bottom: 0, width: '100%', zIndex: 50 }}>
        {!selectedData ? (
          <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
            <button onClick={() => mainMediaRef.current.click()} style={actionBtnStyle}>+ Primary</button>
            <button onClick={() => pipMediaRef.current.click()} style={actionBtnStyle}>+ Overlay</button>
            <button onClick={() => audioMediaRef.current.click()} style={actionBtnStyle}>+ Audio</button>
            <div style={{ borderLeft: '1px solid #333', margin: '0 10px' }} />
            <button style={{ ...actionBtnStyle, borderColor: '#4CAF50', color: '#4CAF50' }}>Export</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', width: '100%' }}>
            <div style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold', marginRight: '10px', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '80px' }}>{selectedData.clip.name}</div>
            <button onClick={() => updateSelectedClip('muted', !selectedData.clip.muted)} style={toolBtnStyle}>{selectedData.clip.muted ? '🔇 Unmute' : '🔊 Mute'}</button>
            
            {/* LIVE ZOOM SLIDER */}
            {selectedData.trackId === 't-main' && (
              <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: '#E91E63', fontWeight: 'bold' }}>Live Zoom</span>
                <input type="range" min="1" max="3" step="0.1" value={selectedData.clip.zoom} onChange={(e) => handleZoomChange(parseFloat(e.target.value))} style={{ width: '80px' }} />
              </div>
            )}
            
            <button onClick={() => setProject(prev => { const newTracks = prev.tracks.map(t => ({ ...t, clips: t.clips.filter(c => c.id !== selectedData.clip.id) })); return { ...prev, tracks: newTracks, selectedClipId: null }; })} style={{ ...toolBtnStyle, color: '#f44336', borderColor: '#f44336', marginLeft: 'auto' }}>🗑️ Delete</button>
          </div>
        )}
      </div>
    </div>
  );
}

const actionBtnStyle = { backgroundColor: 'transparent', color: '#ECECEC', border: '1px solid #555', borderRadius: '8px', padding: '10px 15px', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', cursor: 'pointer' };
const toolBtnStyle = { backgroundColor: '#222', color: '#ECECEC', border: '1px solid #444', borderRadius: '4px', padding: '6px 12px', fontSize: '11px', cursor: 'pointer' };
