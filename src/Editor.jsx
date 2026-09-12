import React, { useState, useRef, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export default function Editor() {
  // Distinct hidden inputs for specific tracks
  const mainMediaRef = useRef(null);
  const pipMediaRef = useRef(null);
  const audioMediaRef = useRef(null);
  
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const ffmpegRef = useRef(new FFmpeg());

  const [isExporting, setIsExporting] = useState(false);
  const [exportAsGif, setExportAsGif] = useState(false);

  // Upgraded Data Model with Audio Track and Mute States
  const [project, setProject] = useState({
    duration: 30, zoomLevel: 10, selectedClipId: null, selectedTrackId: null, activePreviewUrl: null,
    tracks: [
      { id: 't-main', type: 'main_video', name: 'Primary', muted: false, clips: [] },
      { id: 't-pip', type: 'overlay', name: 'Overlays', muted: false, clips: [] },
      { id: 't-audio', type: 'audio', name: 'Audio/SFX', muted: false, clips: [] }
    ]
  });

  const [censorRenderPos, setCensorRenderPos] = useState({ x: 50, y: 50 });
  const isDragging = useRef(false);

  const getSelectedData = () => {
    if (!project.selectedClipId) return null;
    for (const track of project.tracks) {
      const clip = track.clips.find(c => c.id === project.selectedClipId);
      if (clip) return { clip, trackId: track.id, track };
    }
    return null;
  };

  const selectedData = getSelectedData();

  // Apply playback speed & volume based on track/clip state
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
        return {
          ...track,
          clips: track.clips.map(c => c.id === selectedData.clip.id ? { ...c, [key]: value } : c)
        };
      });
      return { ...prev, tracks: newTracks };
    });
  };

  const toggleTrackMute = (trackId) => {
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(t => t.id === trackId ? { ...t, muted: !t.muted } : t)
    }));
  };

  // Universal Media Ingestion Router
  const handleAddMedia = (e, targetTrackIndex, defaultColor) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const fileUrl = URL.createObjectURL(file);
    const isImage = file.type.startsWith('image/');
    const newClipId = 'c-' + Math.random().toString(36).substr(2, 9);

    setProject(prev => {
      const newTracks = [...prev.tracks];
      newTracks[targetTrackIndex].clips.push({ 
        id: newClipId, 
        name: file.name, 
        type: isImage ? 'image' : 'video',
        timelineStartTime: 0, 
        duration: isImage ? 5 : 15, // Images default to 5 seconds
        color: defaultColor, 
        url: fileUrl, 
        zoom: 1.0, 
        speed: 1.0,
        muted: false
      });
      return { ...prev, tracks: newTracks, activePreviewUrl: fileUrl, selectedClipId: newClipId };
    });
    e.target.value = ''; // Reset input
  };

  const addCensorBlock = () => {
    const newClipId = 'c-' + Math.random().toString(36).substr(2, 9);
    setProject(prev => {
      const newTracks = [...prev.tracks];
      newTracks[1].clips.push({ id: newClipId, name: 'Censor Box', type: 'censor', timelineStartTime: 0, duration: 15, color: '#E91E63', keyframes: [] });
      return { ...prev, tracks: newTracks, selectedClipId: newClipId };
    });
  };

  const handleTouchStart = (e) => { e.preventDefault(); isDragging.current = true; videoRef.current?.play(); };
  const handleTouchEnd = () => { isDragging.current = false; videoRef.current?.pause(); };
  const handleTouchMove = (e) => {
    if (!containerRef.current || !videoRef.current || !isDragging.current) return;
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
    if (isDragging.current || !videoRef.current) return;
    const pipClip = project.tracks[1].clips[0];
    if (pipClip?.keyframes?.length > 0) {
      const pastKeyframes = pipClip.keyframes.filter(kf => kf.time <= videoRef.current.currentTime);
      if (pastKeyframes.length > 0) {
        const latestKf = pastKeyframes[pastKeyframes.length - 1];
        setCensorRenderPos({ x: latestKf.x, y: latestKf.y });
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#000', color: '#ECECEC', fontFamily: 'sans-serif' }}>
      
      {/* Hidden File Routers */}
      <input type="file" accept="video/*,image/*" ref={mainMediaRef} onChange={(e) => handleAddMedia(e, 0, '#4CAF50')} style={{ display: 'none' }} />
      <input type="file" accept="video/*,image/*" ref={pipMediaRef} onChange={(e) => handleAddMedia(e, 1, '#FF9800')} style={{ display: 'none' }} />
      <input type="file" accept="audio/*" ref={audioMediaRef} onChange={(e) => handleAddMedia(e, 2, '#00BCD4')} style={{ display: 'none' }} />

      {/* 1. Viewport (Cleaned up) */}
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
           <div onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
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

      {/* 2. Transport & Playhead Mini-Bar */}
      <div style={{ height: '40px', backgroundColor: '#1A1A1A', display: 'flex', alignItems: 'center', padding: '0 15px', justifyContent: 'center', borderBottom: '1px solid #222' }}>
         <button onClick={() => videoRef.current?.play()} style={{ background: 'none', color: '#fff', border: 'none', fontSize: '20px' }}>▶</button>
      </div>

      {/* 3. Multi-Track Timeline */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', backgroundColor: '#121212', position: 'relative', paddingBottom: '80px' }}>
        <div style={{ overflowX: 'auto', minWidth: `${project.duration * project.zoomLevel + 100}px`, paddingTop: '10px' }}>
          {project.tracks.map(track => (
            <div key={track.id} style={{ display: 'flex', marginBottom: '8px', height: '55px', position: 'relative', backgroundColor: '#1A1A1A' }}>
              
              {/* Professional Track Header with Mute Toggle */}
              <div style={{ position: 'sticky', left: 0, width: '70px', backgroundColor: '#222', borderRight: '1px solid #333', zIndex: 10, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 8px' }}>
                <span style={{ fontSize: '10px', color: '#fff', fontWeight: 'bold' }}>{track.name}</span>
                <button 
                  onClick={() => toggleTrackMute(track.id)}
                  style={{ background: track.muted ? '#E91E63' : '#444', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '8px', padding: '4px', marginTop: '4px' }}
                >
                  {track.muted ? '🔇 MUTED' : '🔊 MUTE'}
                </button>
              </div>

              {/* Clip Track */}
              <div style={{ position: 'relative', flex: 1 }} onClick={(e) => { if (e.target === e.currentTarget) setProject(p => ({ ...p, selectedClipId: null })) }}>
                {track.clips.map(clip => (
                  <div key={clip.id} onClick={(e) => { e.stopPropagation(); setProject(prev => ({ ...prev, selectedClipId: clip.id, activePreviewUrl: clip.url || prev.activePreviewUrl })); }}
                    style={{
                      position: 'absolute', left: `${clip.timelineStartTime * project.zoomLevel}px`, width: `${clip.duration * project.zoomLevel}px`,
                      backgroundColor: clip.color, height: '100%', borderRadius: '4px', border: selectedData?.clip?.id === clip.id ? '2px solid #fff' : '1px solid #000',
                      display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: '10px', color: '#fff', opacity: track.muted ? 0.5 : 1
                    }}
                  >
                    {clip.name} {clip.muted && '🔇'}
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
          /* DEFAULT STATE: Ingestion Tools */
          <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
            <button onClick={() => mainMediaRef.current.click()} style={actionBtnStyle}>+ Main Video</button>
            <button onClick={() => pipMediaRef.current.click()} style={actionBtnStyle}>+ Overlay</button>
            <button onClick={() => audioMediaRef.current.click()} style={actionBtnStyle}>+ Audio</button>
            <button onClick={addCensorBlock} style={{ ...actionBtnStyle, backgroundColor: '#E91E63', border: 'none' }}>+ Censor</button>
            <div style={{ borderLeft: '1px solid #333', margin: '0 10px' }} />
            <button style={{ ...actionBtnStyle, borderColor: '#4CAF50', color: '#4CAF50' }}>Export</button>
          </div>
        ) : (
          /* CLIP SELECTED STATE: Modification Tools */
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

// Styling helpers for the new bottom bar
const actionBtnStyle = {
  backgroundColor: 'transparent', color: '#ECECEC', border: '1px solid #555', borderRadius: '8px', 
  padding: '10px 15px', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', cursor: 'pointer'
};

const toolBtnStyle = {
  backgroundColor: '#222', color: '#ECECEC', border: '1px solid #444', borderRadius: '4px', 
  padding: '6px 12px', fontSize: '11px', cursor: 'pointer'
};
