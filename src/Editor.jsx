import React, { useState, useRef, useEffect } from 'react';

export default function Editor() {
  const mainMediaRef = useRef(null);
  const pipMediaRef = useRef(null);
  const audioMediaRef = useRef(null);
  
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const [project, setProject] = useState({
    duration: 30, zoomLevel: 10, selectedClipId: null, activePreviewUrl: null,
    tracks: [
      { id: 't-main', type: 'main_video', name: 'Primary', muted: false, clips: [] },
      { id: 't-pip', type: 'overlay', name: 'Overlays', muted: false, clips: [] },
      { id: 't-audio', type: 'audio', name: 'Audio/SFX', muted: false, clips: [] }
    ]
  });

  const [currentTime, setCurrentTime] = useState(0);
  const [censorRenderPos, setCensorRenderPos] = useState({ x: 50, y: 50 });
  
  // UNIFIED INTERACTION ENGINE
  // Tracks exactly what your thumb is doing on the timeline
  const interaction = useRef({ type: null, targetId: null, trackId: null, edge: null, startX: 0, initialStart: 0, initialDuration: 0 });
  const isDraggingCensor = useRef(false);

  const getSelectedData = () => {
    if (!project.selectedClipId) return null;
    for (const track of project.tracks) {
      const clip = track.clips.find(c => c.id === project.selectedClipId);
      if (clip) return { clip, trackId: track.id, track };
    }
    return null;
  };

  const selectedData = getSelectedData();

  useEffect(() => {
    if (videoRef.current && selectedData?.clip) {
      videoRef.current.playbackRate = selectedData.clip.speed || 1.0;
      videoRef.current.muted = selectedData.track.muted || selectedData.clip.muted;
    }
  }, [selectedData?.clip?.speed, selectedData?.clip?.muted, selectedData?.track?.muted]);

  const updateSelectedClip = (key, value) => {
    if (!selectedData) return;
    setProject(prev => {
      const newTracks = prev.tracks.map(track => {
        if (track.id !== selectedData.trackId) return track;
        return { ...track, clips: track.clips.map(c => c.id === selectedData.clip.id ? { ...c, [key]: value } : c) };
      });
      return { ...prev, tracks: newTracks };
    });
  };

  const toggleTrackMute = (trackId) => setProject(prev => ({ ...prev, tracks: prev.tracks.map(t => t.id === trackId ? { ...t, muted: !t.muted } : t) }));

  const handleAddMedia = (e, targetTrackIndex, defaultColor) => {
    const file = e.target.files[0];
    if (!file) return;
    const fileUrl = URL.createObjectURL(file);
    const isImage = file.type.startsWith('image/');
    const newClipId = 'c-' + Math.random().toString(36).substr(2, 9);

    setProject(prev => {
      const newTracks = [...prev.tracks];
      newTracks[targetTrackIndex].clips.push({ 
        id: newClipId, name: file.name, type: isImage ? 'image' : 'video',
        timelineStartTime: currentTime, // Drops media exactly where the playhead is!
        duration: isImage ? 5 : 15, color: defaultColor, url: fileUrl, zoom: 1.0, speed: 1.0, muted: false
      });
      return { ...prev, tracks: newTracks, activePreviewUrl: fileUrl, selectedClipId: newClipId };
    });
    e.target.value = ''; 
  };

  const addCensorBlock = () => {
    const newClipId = 'c-' + Math.random().toString(36).substr(2, 9);
    setProject(prev => {
      const newTracks = [...prev.tracks];
      newTracks[1].clips.push({ id: newClipId, name: 'Censor Box', type: 'censor', timelineStartTime: currentTime, duration: 15, color: '#E91E63', keyframes: [] });
      return { ...prev, tracks: newTracks, selectedClipId: newClipId };
    });
  };

  // --- CENSOR MOTION SKETCHING ---
  const handleCensorTouchStart = (e) => { e.preventDefault(); isDraggingCensor.current = true; videoRef.current?.play(); };
  const handleCensorTouchEnd = () => { isDraggingCensor.current = false; videoRef.current?.pause(); };
  const handleCensorTouchMove = (e) => {
    if (!containerRef.current || !videoRef.current || !isDraggingCensor.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    let newX = Math.max(0, Math.min(100, ((touch.clientX - rect.left) / rect.width) * 100));
    let newY = Math.max(0, Math.min(100, ((touch.clientY - rect.top) / rect.height) * 100));
    setCensorRenderPos({ x: newX, y: newY });

    if (project.selectedClipId) {
      setProject(prev => {
        const newTracks = [...prev.tracks];
        const clipIndex = newTracks[1].clips.findIndex(c => c.id === prev.selectedClipId);
        if (clipIndex !== -1) newTracks[1].clips[clipIndex].keyframes.push({ time: videoRef.current.currentTime, x: newX, y: newY });
        return { ...prev, tracks: newTracks };
      });
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime); // Move playhead with video

    if (isDraggingCensor.current) return;
    const pipClip = project.tracks[1].clips[0];
    if (pipClip?.keyframes?.length > 0) {
      const pastKeyframes = pipClip.keyframes.filter(kf => kf.time <= videoRef.current.currentTime);
      if (pastKeyframes.length > 0) {
        const latestKf = pastKeyframes[pastKeyframes.length - 1];
        setCensorRenderPos({ x: latestKf.x, y: latestKf.y });
      }
    }
  };

  // --- UNIFIED TIMELINE INTERACTION ENGINE ---
  const startInteraction = (e, type, payload) => {
    e.stopPropagation();
    const touch = e.touches[0];
    interaction.current = { type, startX: touch.clientX, ...payload };
    
    // Select clip immediately if we grab it
    if (type === 'trim' || type === 'move') {
      setProject(prev => ({ ...prev, selectedClipId: payload.clipId }));
    }
  };

  const handleTimelineTouchMove = (e) => {
    const { type, edge, startX, initialStart, initialDuration, trackId, clipId } = interaction.current;
    if (!type) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - startX;
    const deltaSeconds = deltaX / project.zoomLevel;

    if (type === 'scrub') {
      let newTime = Math.max(0, initialStart + deltaSeconds);
      setCurrentTime(newTime);
      if (videoRef.current) videoRef.current.currentTime = newTime; // Sync video
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

            if (type === 'move') {
              newStart = Math.max(0, initialStart + deltaSeconds);
            } else if (type === 'trim') {
              if (edge === 'left') {
                newStart = Math.max(0, initialStart + deltaSeconds);
                newDuration = Math.max(0.5, initialDuration - (newStart - initialStart));
              } else if (edge === 'right') {
                newDuration = Math.max(0.5, initialDuration + deltaSeconds);
              }
            }
            return { ...c, timelineStartTime: newStart, duration: newDuration };
          })
        };
      });
      return { ...prev, tracks: newTracks };
    });
  };

  const handleTimelineTouchEnd = () => { interaction.current.type = null; };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#000', color: '#ECECEC', fontFamily: 'sans-serif' }}>
      
      <input type="file" accept="video/*,image/*" ref={mainMediaRef} onChange={(e) => handleAddMedia(e, 0, '#4CAF50')} style={{ display: 'none' }} />
      <input type="file" accept="video/*,image/*" ref={pipMediaRef} onChange={(e) => handleAddMedia(e, 1, '#FF9800')} style={{ display: 'none' }} />
      <input type="file" accept="audio/*" ref={audioMediaRef} onChange={(e) => handleAddMedia(e, 2, '#00BCD4')} style={{ display: 'none' }} />

      <div ref={containerRef} style={{ flex: '0 0 35%', backgroundColor: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', borderBottom: '1px solid #222' }}>
        {project.activePreviewUrl ? (
          <div style={{ width: '100%', height: '100%', transform: `scale(${selectedData?.trackId === 't-main' ? selectedData.clip.zoom : 1.0})`, transition: 'transform 0.1s ease-out' }}>
            {selectedData?.clip?.type === 'image' ? (
              <img src={project.activePreviewUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="preview" />
            ) : (
              <video ref={videoRef} src={project.activePreviewUrl} onTimeUpdate={handleTimeUpdate} style={{ width: '100%', height: '100%', objectFit: 'contain' }} playsInline loop />
            )}
          </div>
        ) : (
          <p style={{ color: '#444', fontSize: '14px' }}>Sovereign Engine Idle</p>
        )}
        
        {project.tracks[1].clips.length > 0 && (
           <div onTouchStart={handleCensorTouchStart} onTouchMove={handleCensorTouchMove} onTouchEnd={handleCensorTouchEnd}
             style={{ position: 'absolute', top: `${censorRenderPos.y}%`, left: `${censorRenderPos.x}%`, transform: 'translate(-50%, -50%)', width: '80px', height: '80px', backgroundColor: 'rgba(233, 30, 99, 0.8)', border: '2px solid #fff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px', fontWeight: 'bold', zIndex: 20, boxShadow: selectedData?.clip?.id === project.tracks[1].clips[0].id ? '0 0 15px #fff' : 'none' }}>
             DRAG
           </div>
        )}
      </div>

      <div style={{ height: '40px', backgroundColor: '#1A1A1A', display: 'flex', alignItems: 'center', padding: '0 15px', justifyContent: 'space-between', borderBottom: '1px solid #222' }}>
         <span style={{ fontSize: '12px', color: '#888', fontFamily: 'monospace' }}>{currentTime.toFixed(2)}s</span>
         <button onClick={() => videoRef.current?.play()} style={{ background: 'none', color: '#fff', border: 'none', fontSize: '20px' }}>▶</button>
         <span style={{ fontSize: '12px', color: '#888', fontFamily: 'monospace' }}>{project.duration.toFixed(2)}s</span>
      </div>

      {/* 3. Fully Interactive Multi-Track Timeline */}
      <div 
        onTouchMove={handleTimelineTouchMove}
        onTouchEnd={handleTimelineTouchEnd}
        style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', backgroundColor: '#121212', position: 'relative', paddingBottom: '80px' }}
      >
        <div style={{ position: 'relative', minWidth: `${project.duration * project.zoomLevel + 100}px`, paddingTop: '30px' }}>
          
          {/* DRAGGABLE PLAYHEAD */}
          <div 
            onTouchStart={(e) => startInteraction(e, 'scrub', { initialStart: currentTime })}
            style={{ position: 'absolute', left: `${currentTime * project.zoomLevel + 70}px`, top: 0, bottom: 0, width: '2px', backgroundColor: '#E91E63', zIndex: 50 }}
          >
            <div style={{ position: 'absolute', top: '15px', left: '-6px', width: '14px', height: '14px', backgroundColor: '#E91E63', borderRadius: '50% 50% 0 50%', transform: 'rotate(45deg)', boxShadow: '0 0 4px rgba(0,0,0,0.5)' }} />
          </div>

          {project.tracks.map(track => (
            <div key={track.id} style={{ display: 'flex', marginBottom: '8px', height: '55px', position: 'relative', backgroundColor: '#1A1A1A' }}>
              
              <div style={{ position: 'sticky', left: 0, width: '70px', backgroundColor: '#222', borderRight: '1px solid #333', zIndex: 10, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 8px' }}>
                <span style={{ fontSize: '10px', color: '#fff', fontWeight: 'bold' }}>{track.name}</span>
                <button onClick={() => toggleTrackMute(track.id)} style={{ background: track.muted ? '#E91E63' : '#444', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '8px', padding: '4px', marginTop: '4px' }}>
                  {track.muted ? '🔇 MUTED' : '🔊 MUTE'}
                </button>
              </div>

              <div style={{ position: 'relative', flex: 1 }} onClick={(e) => { if (e.target === e.currentTarget) setProject(p => ({ ...p, selectedClipId: null })) }}>
                {track.clips.map(clip => (
                  <div key={clip.id} 
                    onTouchStart={(e) => startInteraction(e, 'move', { clipId: clip.id, trackId: track.id, initialStart: clip.timelineStartTime })}
                    style={{
                      position: 'absolute', left: `${clip.timelineStartTime * project.zoomLevel}px`, width: `${clip.duration * project.zoomLevel}px`,
                      backgroundColor: clip.color, height: '100%', borderRadius: '4px', border: selectedData?.clip?.id === clip.id ? '2px solid #fff' : '1px solid #000',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#fff', opacity: track.muted ? 0.5 : 1
                    }}
                  >
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', padding: '0 5px', pointerEvents: 'none' }}>{clip.name} {clip.muted && '🔇'}</span>

                    {/* Trim Handles */}
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
                <span style={{ fontSize: '10px', color: '#888' }}>Zoom</span>
                <input type="range" min="1" max="3" step="0.1" value={selectedData.clip.zoom} onChange={(e) => updateSelectedClip('zoom', parseFloat(e.target.value))} style={{ width: '60px' }} />
                <span style={{ fontSize: '10px', color: '#888', marginLeft: '10px' }}>Speed</span>
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
