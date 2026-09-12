import React, { useState, useRef, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export default function Editor() {
  const mainMediaRef = useRef(null);
  const pipMediaRef = useRef(null);
  const audioMediaRef = useRef(null);
  
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const ffmpegRef = useRef(new FFmpeg());

  const [isExporting, setIsExporting] = useState(false);
  const [exportAsGif, setExportAsGif] = useState(false);

  const [project, setProject] = useState({
    duration: 30, zoomLevel: 10, selectedClipId: null, activePreviewUrl: null,
    tracks: [
      { id: 't-main', type: 'main_video', name: 'Primary', muted: false, clips: [] },
      { id: 't-pip', type: 'overlay', name: 'Overlays', muted: false, clips: [] },
      { id: 't-audio', type: 'audio', name: 'Audio/SFX', muted: false, clips: [] }
    ]
  });

  const [censorRenderPos, setCensorRenderPos] = useState({ x: 50, y: 50 });
  
  // Ref engines for touch dragging
  const isDraggingCensor = useRef(false);
  const trimDrag = useRef({ active: false, edge: null, startX: 0, initialStart: 0, initialDuration: 0, clipId: null, trackId: null });

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

  const toggleTrackMute = (trackId) => {
    setProject(prev => ({ ...prev, tracks: prev.tracks.map(t => t.id === trackId ? { ...t, muted: !t.muted } : t) }));
  };

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
        timelineStartTime: 0, duration: isImage ? 5 : 15, color: defaultColor, url: fileUrl, zoom: 1.0, speed: 1.0, muted: false
      });
      return { ...prev, tracks: newTracks, activePreviewUrl: fileUrl, selectedClipId: newClipId };
    });
    e.target.value = ''; 
  };

  const addCensorBlock = () => {
    const newClipId = 'c-' + Math.random().toString(36).substr(2, 9);
    setProject(prev => {
      const newTracks = [...prev.tracks];
      newTracks[1].clips.push({ id: newClipId, name: 'Censor Box', type: 'censor', timelineStartTime: 0, duration: 15, color: '#E91E63', keyframes: [] });
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
    if (isDraggingCensor.current || !videoRef.current) return;
    const pipClip = project.tracks[1].clips[0];
    if (pipClip?.keyframes?.length > 0) {
      const pastKeyframes = pipClip.keyframes.filter(kf => kf.time <= videoRef.current.currentTime);
      if (pastKeyframes.length > 0) {
        const latestKf = pastKeyframes[pastKeyframes.length - 1];
        setCensorRenderPos({ x: latestKf.x, y: latestKf.y });
      }
    }
  };

  // --- CLIP TRIMMING ENGINE ---
  const handleTrimStart = (e, clip, trackId, edge) => {
    e.stopPropagation(); // Prevent the timeline from scrolling or unselecting the clip
    const touch = e.touches[0];
    trimDrag.current = {
      active: true, edge, startX: touch.clientX,
      initialStart: clip.timelineStartTime, initialDuration: clip.duration,
      clipId: clip.id, trackId: trackId
    };
  };

  const handleTimelineTouchMove = (e) => {
    if (!trimDrag.current.active) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - trimDrag.current.startX;
    const deltaSeconds = deltaX / project.zoomLevel;

    setProject(prev => {
      const newTracks = prev.tracks.map(track => {
        if (track.id !== trimDrag.current.trackId) return track;
        return {
          ...track,
          clips: track.clips.map(c => {
            if (c.id !== trimDrag.current.clipId) return c;
            
            let newStart = c.timelineStartTime;
            let newDuration = c.duration;

            if (trimDrag.current.edge === 'left') {
              // Dragging the left edge alters the start time AND duration
              newStart = Math.max(0, trimDrag.current.initialStart + deltaSeconds);
              const timeDiff = newStart - trimDrag.current.initialStart;
              newDuration = Math.max(0.5, trimDrag.current.initialDuration - timeDiff); // Minimum 0.5s length
            } else if (trimDrag.current.edge === 'right') {
              // Dragging the right edge only alters the duration
              newDuration = Math.max(0.5, trimDrag.current.initialDuration + deltaSeconds);
            }

            return { ...c, timelineStartTime: newStart, duration: newDuration };
          })
        };
      });
      return { ...prev, tracks: newTracks };
    });
  };

  const handleTimelineTouchEnd = () => { trimDrag.current.active = false; };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#000', color: '#ECECEC', fontFamily: 'sans-serif' }}>
      
      <input type="file" accept="video/*,image/*" ref={mainMediaRef} onChange={(e) => handleAddMedia(e, 0, '#4CAF50')} style={{ display: 'none' }} />
      <input type="file" accept="video/*,image/*" ref={pipMediaRef} onChange={(e) => handleAddMedia(e, 1, '#FF9800')} style={{ display: 'none' }} />
      <input type="file" accept="audio/*" ref={audioMediaRef} onChange={(e) => handleAddMedia(e, 2, '#00BCD4')} style={{ display: 'none' }} />

      {/* 1. Viewport */}
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
             style={{ 
               position: 'absolute', top: `${censorRenderPos.y}%`, left: `${censorRenderPos.x}%`, transform: 'translate(-50%, -50%)',
               width: '80px', height: '80px', backgroundColor: 'rgba(233, 30, 99, 0.8)', border: '2px solid #fff', borderRadius: '8px', 
               display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px', fontWeight: 'bold', zIndex: 20,
               boxShadow: selectedData?.clip?.id === project.tracks[1].clips[0].id ? '0 0 15px #fff' : 'none'
             }}>
             DRAG
           </div>
        )}
      </div>

      <div style={{ height: '40px', backgroundColor: '#1A1A1A', display: 'flex', alignItems: 'center', padding: '0 15px', justifyContent: 'center', borderBottom: '1px solid #222' }}>
         <button onClick={() => videoRef.current?.play()} style={{ background: 'none', color: '#fff', border: 'none', fontSize: '20px' }}>▶</button>
      </div>

      {/* 3. Multi-Track Timeline (Now with touch dragging bound to the container) */}
      <div 
        onTouchMove={handleTimelineTouchMove}
        onTouchEnd={handleTimelineTouchEnd}
        style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', backgroundColor: '#121212', position: 'relative', paddingBottom: '80px' }}
      >
        <div style={{ minWidth: `${project.duration * project.zoomLevel + 100}px`, paddingTop: '10px' }}>
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
                  <div key={clip.id} onClick={(e) => { e.stopPropagation(); setProject(prev => ({ ...prev, selectedClipId: clip.id, activePreviewUrl: clip.url || prev.activePreviewUrl })); }}
                    style={{
                      position: 'absolute', left: `${clip.timelineStartTime * project.zoomLevel}px`, width: `${clip.duration * project.zoomLevel}px`,
                      backgroundColor: clip.color, height: '100%', borderRadius: '4px', border: selectedData?.clip?.id === clip.id ? '2px solid #fff' : '1px solid #000',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#fff', opacity: track.muted ? 0.5 : 1
                    }}
                  >
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', padding: '0 5px' }}>{clip.name} {clip.muted && '🔇'}</span>

                    {/* Interactive Trim Handles (Only appear when clip is selected) */}
                    {selectedData?.clip?.id === clip.id && (
                      <>
                        <div onTouchStart={(e) => handleTrimStart(e, clip, track.id, 'left')}
                             style={{ position: 'absolute', left: '-2px', top: 0, bottom: 0, width: '15px', backgroundColor: '#fff', borderRadius: '4px 0 0 4px', zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: '2px', height: '15px', backgroundColor: '#000' }} />
                        </div>
                        
                        <div onTouchStart={(e) => handleTrimStart(e, clip, track.id, 'right')}
                             style={{ position: 'absolute', right: '-2px', top: 0, bottom: 0, width: '15px', backgroundColor: '#fff', borderRadius: '0 4px 4px 0', zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
