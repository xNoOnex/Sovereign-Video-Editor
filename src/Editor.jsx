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
  const [isPlaying, setIsPlaying] = useState(false);
  const [censorRenderPos, setCensorRenderPos] = useState({ x: 50, y: 50 });
  const [liveZoom, setLiveZoom] = useState(1);
  
  const interaction = useRef({ type: null, targetId: null, trackId: null, edge: null, startX: 0, initialStart: 0, initialDuration: 0 });
  const isDraggingCensor = useRef(false);
  const pinchRef = useRef({ active: false, startDist: 0, startZoom: 1 });

  const getSelectedData = () => {
    if (!project.selectedClipId) return null;
    for (const track of project.tracks) {
      const clip = track.clips.find(c => c.id === project.selectedClipId);
      if (clip) return { clip, trackId: track.id, track };
    }
    return null;
  };

  const selectedData = getSelectedData();

  // --- PLAYBACK ENGINE ---
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= project.duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.05; 
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isPlaying, project.duration]);

  const togglePlayback = () => {
    const videos = document.querySelectorAll('.compositor-media');
    if (isPlaying) {
      videos.forEach(v => v.pause && v.pause());
      setIsPlaying(false);
    } else {
      videos.forEach(v => v.play && v.play());
      setIsPlaying(true);
    }
  };

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

  const toggleTrackMute = (trackId) => setProject(prev => ({ ...prev, tracks: prev.tracks.map(t => t.id === trackId ? { ...t, muted: !t.muted } : t) }));

  // --- DYNAMIC TRACK MEDIA ROUTER ---
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
      zoom: 1.0, speed: 1.0, muted: false, keyframes: [], zoomKeyframes: []
    };

    setProject(prev => {
      const newTracks = [...prev.tracks];
      
      if (targetType === 'main_video' || targetType === 'audio') {
        const trackIndex = newTracks.findIndex(t => t.type === targetType);
        newTracks[trackIndex].clips.push(newClip);
      } else if (targetType === 'overlay') {
        // INFINITE OVERLAYS: Spawn a brand new track layer for every new overlay
        const overlayCount = newTracks.filter(t => t.type === 'overlay').length + 1;
        const newTrack = { id: `t-pip-${overlayCount}`, type: 'overlay', name: `Overlay ${overlayCount}`, muted: false, clips: [newClip] };
        // Insert right above the Audio track
        const audioIndex = newTracks.findIndex(t => t.type === 'audio');
        newTracks.splice(audioIndex, 0, newTrack);
      }
      return { ...prev, tracks: newTracks, selectedClipId: newClipId };
    });
    e.target.value = ''; 
  };

  const addCensorBlock = () => {
    const newClipId = 'c-' + Math.random().toString(36).substr(2, 9);
    setProject(prev => {
      const newTracks = [...prev.tracks];
      const overlayCount = newTracks.filter(t => t.type === 'overlay').length + 1;
      const newTrack = { 
        id: `t-pip-${overlayCount}`, type: 'overlay', name: `Censor ${overlayCount}`, muted: false, 
        clips: [{ id: newClipId, name: 'Censor Box', type: 'censor', timelineStartTime: currentTime, duration: 15, color: '#E91E63', keyframes: [] }] 
      };
      const audioIndex = newTracks.findIndex(t => t.type === 'audio');
      newTracks.splice(audioIndex, 0, newTrack);
      return { ...prev, tracks: newTracks, selectedClipId: newClipId };
    });
  };

  // --- MULTI-TOUCH MOTION SKETCHING (Position & Zoom) ---
  const getPinchDistance = (touches) => Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);

  const handleViewportTouchStart = (e) => {
    if (!selectedData) return;
    e.preventDefault(); 
    
    // 2-Finger Pinch (Zoom)
    if (e.touches.length === 2 && selectedData.trackId === 't-main') {
      pinchRef.current = { active: true, startDist: getPinchDistance(e.touches), startZoom: liveZoom };
      if (!isPlaying) togglePlayback();
    } 
    // 1-Finger Drag (Censor Position)
    else if (e.touches.length === 1 && selectedData.clip.type === 'censor') {
      isDraggingCensor.current = true;
      if (!isPlaying) togglePlayback();
    }
  };

  const handleViewportTouchMove = (e) => {
    if (!containerRef.current || !selectedData) return;
    
    // Record Pinch Zoom
    if (pinchRef.current.active && e.touches.length === 2 && selectedData.trackId === 't-main') {
      const currentDist = getPinchDistance(e.touches);
      const scaleMultiplier = currentDist / pinchRef.current.startDist;
      let newZoom = Math.max(0.5, Math.min(5.0, pinchRef.current.startZoom * scaleMultiplier)); // Clamp zoom between 0.5x and 5x
      
      setLiveZoom(newZoom);

      setProject(prev => {
        const newTracks = [...prev.tracks];
        const tIndex = newTracks.findIndex(t => t.id === selectedData.trackId);
        const cIndex = newTracks[tIndex].clips.findIndex(c => c.id === selectedData.clip.id);
        if (!newTracks[tIndex].clips[cIndex].zoomKeyframes) newTracks[tIndex].clips[cIndex].zoomKeyframes = [];
        newTracks[tIndex].clips[cIndex].zoomKeyframes.push({ time: currentTime, zoom: newZoom });
        return { ...prev, tracks: newTracks };
      });
    }
    // Record Censor Position
    else if (isDraggingCensor.current && e.touches.length === 1 && selectedData.clip.type === 'censor') {
      const rect = containerRef.current.getBoundingClientRect();
      let newX = Math.max(0, Math.min(100, ((e.touches[0].clientX - rect.left) / rect.width) * 100));
      let newY = Math.max(0, Math.min(100, ((e.touches[0].clientY - rect.top) / rect.height) * 100));
      setCensorRenderPos({ x: newX, y: newY });

      setProject(prev => {
        const newTracks = [...prev.tracks];
        const tIndex = newTracks.findIndex(t => t.id === selectedData.trackId);
        const cIndex = newTracks[tIndex].clips.findIndex(c => c.id === selectedData.clip.id);
        newTracks[tIndex].clips[cIndex].keyframes.push({ time: currentTime, x: newX, y: newY });
        return { ...prev, tracks: newTracks };
      });
    }
  };

  const handleViewportTouchEnd = () => { 
    pinchRef.current.active = false;
    isDraggingCensor.current = false; 
    if (isPlaying) togglePlayback(); 
  };

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
      setCurrentTime(Math.max(0, initialStart + deltaSeconds));
      return;
    }

    setProject(prev => {
      const newTracks = prev.tracks.map(track => {
        if (track.id !== trackId) return track;
        return {
          ...track,
          clips: track.clips.map(c => {
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

  // --- INFINITE LAYER COMPOSITOR ---
  const activeMainClips = project.tracks.find(t => t.type === 'main_video')?.clips.filter(c => currentTime >= c.timelineStartTime && currentTime <= c.timelineStartTime + c.duration) || [];
  const overlayTracks = project.tracks.filter(t => t.type === 'overlay');
  const activeAudioClips = project.tracks.find(t => t.type === 'audio')?.clips.filter(c => currentTime >= c.timelineStartTime && currentTime <= c.timelineStartTime + c.duration) || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#000', color: '#ECECEC', fontFamily: 'sans-serif' }}>
      
      <input type="file" accept="video/*,image/*" ref={mainMediaRef} onChange={(e) => handleAddMedia(e, 'main_video', '#4CAF50')} style={{ display: 'none' }} />
      <input type="file" accept="video/*,image/*" ref={pipMediaRef} onChange={(e) => handleAddMedia(e, 'overlay', '#FF9800')} style={{ display: 'none' }} />
      <input type="file" accept="audio/*" ref={audioMediaRef} onChange={(e) => handleAddMedia(e, 'audio', '#00BCD4')} style={{ display: 'none' }} />

      {/* 1. THE COMPOSITING VIEWPORT */}
      <div ref={containerRef} onTouchStart={handleViewportTouchStart} onTouchMove={handleViewportTouchMove} onTouchEnd={handleViewportTouchEnd} style={{ flex: '0 0 35%', backgroundColor: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', borderBottom: '1px solid #222' }}>
        
        {/* Layer 0: Main Reel (Bottom) */}
        {activeMainClips.map(clip => {
          // Calculate interpolated zoom for playback
          let renderZoom = clip.zoom || 1.0;
          if (clip.zoomKeyframes?.length > 0 && !pinchRef.current.active) {
            const pastKf = clip.zoomKeyframes.filter(kf => kf.time <= currentTime);
            if (pastKf.length > 0) renderZoom = pastKf[pastKf.length - 1].zoom;
          } else if (pinchRef.current.active && project.selectedClipId === clip.id) {
            renderZoom = liveZoom;
          }

          return (
            <div key={clip.id} style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 1, transform: `scale(${renderZoom})`, transition: pinchRef.current.active ? 'none' : 'transform 0.1s linear', opacity: project.tracks.find(t=>t.type==='main_video').muted ? 0.5 : 1 }}>
              {clip.type === 'image' ? (
                <img src={clip.url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="main" />
              ) : (
                <video className="compositor-media" src={clip.url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} playsInline muted={clip.muted || project.tracks.find(t=>t.type==='main_video').muted} />
              )}
            </div>
          );
        })}

        {/* Layer Stack: Infinite Overlays & Censors (Middle) */}
        {overlayTracks.map((track, trackIndex) => {
          const activeClips = track.clips.filter(c => currentTime >= c.timelineStartTime && currentTime <= c.timelineStartTime + c.duration);
          return activeClips.map(clip => {
            if (clip.type === 'censor') {
              let posX = 50, posY = 50;
              if (clip.keyframes?.length > 0 && !isDraggingCensor.current) {
                const pastKf = clip.keyframes.filter(kf => kf.time <= currentTime);
                if (pastKf.length > 0) { posX = pastKf[pastKf.length - 1].x; posY = pastKf[pastKf.length - 1].y; }
              } else if (isDraggingCensor.current && project.selectedClipId === clip.id) {
                posX = censorRenderPos.x; posY = censorRenderPos.y;
              }
              return (
                <div key={clip.id} style={{ position: 'absolute', top: `${posY}%`, left: `${posX}%`, transform: 'translate(-50%, -50%)', width: '80px', height: '80px', backgroundColor: 'rgba(233, 30, 99, 0.8)', border: '2px solid #fff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px', fontWeight: 'bold', zIndex: 10 + trackIndex, boxShadow: project.selectedClipId === clip.id ? '0 0 15px #fff' : 'none' }}>DRAG</div>
              );
            }
            return (
              <div key={clip.id} style={{ position: 'absolute', width: '35%', height: '35%', top: '10%', right: `${10 + (trackIndex * 5)}%`, zIndex: 10 + trackIndex, border: project.selectedClipId === clip.id ? '2px solid #2196F3' : '2px solid #fff', borderRadius: '8px', overflow: 'hidden' }}>
                {clip.type === 'image' ? <img src={clip.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="pip" /> : <video className="compositor-media" src={clip.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} playsInline muted={clip.muted || track.muted} />}
              </div>
            );
          });
        })}

        {/* Layer 2: Audio (Invisible) */}
        {activeAudioClips.map(clip => <audio key={clip.id} className="compositor-media" src={clip.url} muted={clip.muted || project.tracks.find(t=>t.type==='audio').muted} />)}
      </div>

      {/* 2. Transport */}
      <div style={{ height: '40px', backgroundColor: '#1A1A1A', display: 'flex', alignItems: 'center', padding: '0 15px', justifyContent: 'space-between', borderBottom: '1px solid #222' }}>
         <span style={{ fontSize: '12px', color: '#888', fontFamily: 'monospace' }}>{currentTime.toFixed(2)}s</span>
         <button onClick={togglePlayback} style={{ background: 'none', color: '#fff', border: 'none', fontSize: '20px' }}>{isPlaying ? '⏸' : '▶'}</button>
         <span style={{ fontSize: '12px', color: '#888', fontFamily: 'monospace' }}>{project.duration.toFixed(2)}s</span>
      </div>

      {/* 3. Fully Interactive Multi-Track Timeline */}
      <div onTouchMove={handleTimelineTouchMove} onTouchEnd={handleTimelineTouchEnd} style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', backgroundColor: '#121212', position: 'relative', paddingBottom: '80px' }}>
        <div style={{ position: 'relative', minWidth: `${project.duration * project.zoomLevel + 100}px`, paddingTop: '30px' }}>
          
          <div onTouchStart={(e) => startInteraction(e, 'scrub', { initialStart: currentTime })}
            style={{ position: 'absolute', left: `${currentTime * project.zoomLevel + 70}px`, top: 0, bottom: 0, width: '2px', backgroundColor: '#E91E63', zIndex: 50 }}>
            <div style={{ position: 'absolute', top: '15px', left: '-6px', width: '14px', height: '14px', backgroundColor: '#E91E63', borderRadius: '50% 50% 0 50%', transform: 'rotate(45deg)', boxShadow: '0 0 4px rgba(0,0,0,0.5)' }} />
          </div>

          {project.tracks.map(track => (
            <div key={track.id} style={{ display: 'flex', marginBottom: '8px', height: '55px', position: 'relative', backgroundColor: '#1A1A1A' }}>
              <div style={{ position: 'sticky', left: 0, width: '70px', backgroundColor: '#222', borderRight: '1px solid #333', zIndex: 10, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 8px' }}>
                <span style={{ fontSize: '10px', color: '#fff', fontWeight: 'bold' }}>{track.name}</span>
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
                        <div onTouchStart={(e) => startInteraction(e, 'trim', { clipId: clip.id, trackId: track.id, edge: 'left', initialStart: clip.timelineStartTime, initialDuration: clip.duration })}
                             style={{ position: 'absolute', left: '-2px', top: 0, bottom: 0, width: '20px', backgroundColor: '#fff', borderRadius: '4px 0 0 4px', zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: '2px', height: '15px', backgroundColor: '#000' }} />
                        </div>
                        <div onTouchStart={(e) => startInteraction(e, 'trim', { clipId: clip.id, trackId: track.id, edge: 'right', initialStart: clip.timelineStartTime, initialDuration: clip.duration })}
                             style={{ position: 'absolute', right: '-2px', top: 0, bottom: 0, width: '20px', backgroundColor: '#fff', borderRadius: '0 4px 4px 0', zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                           <div style={{ width: '2px', height: '15px', backgroundColor: '#000' }} />
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Contextual Bottom Action Bar */}
      <div style={{ height: '70px', backgroundColor: '#111', borderTop: '1px solid #333', display: 'flex', alignItems: 'center', overflowX: 'auto', padding: '0 10px', position: 'fixed', bottom: 0, width: '100%', zIndex: 50 }}>
        {!selectedData ? (
          <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
            <button onClick={() => mainMediaRef.current.click()} style={actionBtnStyle}>+ Main Video</button>
            <button onClick={() => pipMediaRef.current.click()} style={actionBtnStyle}>+ Overlay</button>
            <button onClick={() => audioMediaRef.current.click()} style={actionBtnStyle}>+ Audio</button>
            <button onClick={addCensorBlock} style={{ ...actionBtnStyle, backgroundColor: '#E91E63', border: 'none' }}>+ Censor</button>
            <div style={{ borderLeft: '1px solid #333', margin: '0 10px' }} />
            <button style={{ ...actionBtnStyle, borderColor: '#4CAF50', color: '#4CAF50' }}>Export</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', width: '100%' }}>
            <div style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold', marginRight: '10px', whiteSpace: 'nowrap' }}>{selectedData.clip.name}</div>
            <button onClick={() => updateSelectedClip('muted', !selectedData.clip.muted)} style={toolBtnStyle}>
              {selectedData.clip.muted ? '🔇 Unmute' : '🔊 Mute'}
            </button>
            {selectedData.trackId === 't-main' && (
              <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: '#888' }}>Speed</span>
                <input type="range" min="0.25" max="2" step="0.25" value={selectedData.clip.speed} onChange={(e) => updateSelectedClip('speed', parseFloat(e.target.value))} style={{ width: '60px' }} />
              </div>
            )}
            <button 
              onClick={() => {
                setProject(prev => {
                  const newTracks = prev.tracks.map(t => ({ ...t, clips: t.clips.filter(c => c.id !== selectedData.clip.id) }));
                  return { ...prev, tracks: newTracks, selectedClipId: null };
                });
              }} 
              style={{ ...toolBtnStyle, color: '#f44336', borderColor: '#f44336', marginLeft: 'auto' }}
            >
              🗑️ Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const actionBtnStyle = { backgroundColor: 'transparent', color: '#ECECEC', border: '1px solid #555', borderRadius: '8px', padding: '10px 15px', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', cursor: 'pointer' };
const toolBtnStyle = { backgroundColor: '#222', color: '#ECECEC', border: '1px solid #444', borderRadius: '4px', padding: '6px 12px', fontSize: '11px', cursor: 'pointer' };
