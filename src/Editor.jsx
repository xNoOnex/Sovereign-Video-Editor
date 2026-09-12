import React, { useState, useRef, useEffect } from 'react';

// --- PRO ICONS ---
const Icons = {
  Play: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>,
  Pause: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>,
  Delete: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>,
  Export: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>,
  Mute: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>,
  Unmute: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>,
  AddVideo: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4zM14 13h-3v3H9v-3H6v-2h3V8h2v3h3v2z"/></svg>,
  AddAudio: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
};

export default function Editor() {
  const mainMediaRef = useRef(null);
  const pipMediaRef = useRef(null);
  const audioMediaRef = useRef(null);
  const containerRef = useRef(null);

  const [project, setProject] = useState({
    duration: 30, zoomLevel: 15, selectedClipId: null,
    tracks: [
      { id: 't-main', type: 'main_video', name: 'Primary', muted: false, clips: [] },
      { id: 't-audio', type: 'audio', name: 'Audio/SFX', muted: false, clips: [] }
    ]
  });

  const [currentTime, setCurrentTime] = useState(0);
  const timeRef = useRef(0); 
  const [isPlaying, setIsPlaying] = useState(false);
  const [livePos, setLivePos] = useState({ x: 50, y: 50 });
  const isDraggingOverlay = useRef(false);
  const activeDragClip = useRef(null); 
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

  // --- CORE ENGINE (Clock, Media Sync, etc) ---
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

  // --- ASSET ROUTER ---
  const handleAddMedia = (e, targetType, defaultColor) => {
    const file = e.target.files[0];
    if (!file) return;
    const fileUrl = URL.createObjectURL(file);
    const isImage = file.type.startsWith('image/');
    const isAudio = file.type.startsWith('audio/');
    const newClipId = 'c-' + Math.random().toString(36).substr(2, 9);

    // Pro Clip Color Palette
    let color = '#2196F3'; // Blue for Video
    if (isImage) color = '#FF9800'; // Orange for Images
    if (isAudio) color = '#00BCD4'; // Teal for Audio

    const newClip = { 
      id: newClipId, name: file.name, type: isAudio ? 'audio' : (isImage ? 'image' : 'video'),
      timelineStartTime: currentTime, duration: isImage || isAudio ? 5 : 15, color: color, url: fileUrl, 
      zoom: 1.0, speed: 1.0, muted: false, keyframes: [], zoomKeyframes: [], baseX: 50, baseY: 50
    };

    setProject(prev => {
      const newTracks = [...prev.tracks];
      if (targetType === 'main_video' || targetType === 'audio') {
        const trackIndex = newTracks.findIndex(t => t.type === targetType);
        newTracks[trackIndex].clips.push(newClip);
      } else if (targetType === 'overlay') {
        const overlayCount = newTracks.filter(t => t.type === 'overlay').length + 1;
        const newTrack = { id: `t-pip-${overlayCount}`, type: 'overlay', name: `Layer ${overlayCount}`, muted: false, clips: [newClip] };
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
        clips: [{ id: newClipId, name: 'Censor Matrix', type: 'censor', timelineStartTime: currentTime, duration: 15, color: '#E91E63', keyframes: [] }] 
      };
      const audioIndex = newTracks.findIndex(t => t.type === 'audio');
      newTracks.splice(audioIndex, 0, newTrack);
      return { ...prev, tracks: newTracks, selectedClipId: newClipId };
    });
  };

  // --- LIVE MULTI-TOUCH ENGINE ---
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
    if (selectedData && e.touches.length === 2 && selectedData.trackId === 't-main') {
      e.preventDefault();
      pinchRef.current = { active: true, startDist: getPinchDistance(e.touches), startZoom: selectedData.clip.zoom || 1 };
    }
  };

  const handleOverlayTouchStart = (e, clipId, trackId) => {
    e.stopPropagation();
    activeDragClip.current = { clipId, trackId };
    isDraggingOverlay.current = true;
    setProject(prev => ({ ...prev, selectedClipId: clipId }));
  };

  const handleViewportTouchMove = (e) => {
    if (!containerRef.current) return;
    if (pinchRef.current.active && e.touches.length === 2 && selectedData?.trackId === 't-main') {
      const scaleMultiplier = getPinchDistance(e.touches) / pinchRef.current.startDist;
      handleZoomChange(Math.max(0.5, Math.min(5.0, pinchRef.current.startZoom * scaleMultiplier)));
    } else if (isDraggingOverlay.current && activeDragClip.current) {
      const rect = containerRef.current.getBoundingClientRect();
      let newX = Math.max(0, Math.min(100, ((e.touches[0].clientX - rect.left) / rect.width) * 100));
      let newY = Math.max(0, Math.min(100, ((e.touches[0].clientY - rect.top) / rect.height) * 100));
      setLivePos({ x: newX, y: newY }); 

      setProject(prev => {
        const newTracks = [...prev.tracks];
        const tIndex = newTracks.findIndex(t => t.id === activeDragClip.current.trackId);
        if (tIndex === -1) return prev;
        const cIndex = newTracks[tIndex].clips.findIndex(c => c.id === activeDragClip.current.clipId);
        if (cIndex === -1) return prev;
        const clip = { ...newTracks[tIndex].clips[cIndex] };
        
        if (isPlaying) {
          if (!clip.keyframes) clip.keyframes = [];
          clip.keyframes.push({ time: timeRef.current, x: newX, y: newY });
        } else {
          clip.baseX = newX; clip.baseY = newY;
        }
        newTracks[tIndex].clips[cIndex] = clip;
        return { ...prev, tracks: newTracks };
      });
    }
  };

  const handleViewportTouchEnd = () => { 
    pinchRef.current.active = false; isDraggingOverlay.current = false; activeDragClip.current = null;
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
            let newStart = c.timelineStartTime; let newDuration = c.duration;
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

  // --- COMPOSITOR MATRICES ---
  const activeMainClips = project.tracks.find(t => t.type === 'main_video')?.clips.filter(c => currentTime >= c.timelineStartTime && currentTime <= c.timelineStartTime + c.duration) || [];
  const overlayTracks = project.tracks.filter(t => t.type === 'overlay');
  const activeAudioClips = project.tracks.find(t => t.type === 'audio')?.clips.filter(c => currentTime >= c.timelineStartTime && currentTime <= c.timelineStartTime + c.duration) || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#0A0A0A', color: '#ECECEC', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* Custom Global Styles for Sliders & Scrollbars */}
      <style>{`
        .hide-scroll::-webkit-scrollbar { display: none; }
        .pro-slider { -webkit-appearance: none; width: 100%; height: 4px; background: #333; border-radius: 2px; outline: none; }
        .pro-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; background: #FFF; border-radius: 50%; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.5); }
      `}</style>

      <input type="file" accept="*/*" ref={mainMediaRef} onChange={(e) => handleAddMedia(e, 'main_video')} style={{ display: 'none' }} />
      <input type="file" accept="*/*" ref={pipMediaRef} onChange={(e) => handleAddMedia(e, 'overlay')} style={{ display: 'none' }} />
      <input type="file" accept="audio/*" ref={audioMediaRef} onChange={(e) => handleAddMedia(e, 'audio')} style={{ display: 'none' }} />

      {/* 1. VIEWPORT */}
      <div ref={containerRef} onTouchStart={handleViewportTouchStart} onTouchMove={handleViewportTouchMove} onTouchEnd={handleViewportTouchEnd} style={{ flex: '0 0 38%', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        
        {activeMainClips.map(clip => {
          let renderZoom = clip.zoom || 1.0;
          if (clip.zoomKeyframes?.length > 0 && (!isPlaying || project.selectedClipId !== clip.id)) {
            const pastKf = clip.zoomKeyframes.filter(kf => kf.time <= currentTime);
            if (pastKf.length > 0) renderZoom = pastKf[pastKf.length - 1].zoom;
          }
          return (
            <div key={clip.id} style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 1, transform: `scale(${renderZoom})`, opacity: project.tracks.find(t=>t.type==='main_video').muted ? 0.5 : 1 }}>
              {clip.type === 'image' ? <img src={clip.url} style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} alt="main" /> : <video className="compositor-media" autoPlay={isPlaying} src={clip.url} style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} playsInline muted={clip.muted || project.tracks.find(t=>t.type==='main_video').muted} />}
            </div>
          );
        })}

        {overlayTracks.map((track, trackIndex) => {
          const activeClips = track.clips.filter(c => currentTime >= c.timelineStartTime && currentTime <= c.timelineStartTime + c.duration);
          return activeClips.map(clip => {
            let posX = clip.baseX ?? 50; let posY = clip.baseY ?? 50; 
            if (clip.keyframes?.length > 0 && (!isDraggingOverlay.current || activeDragClip.current?.clipId !== clip.id)) {
              const pastKf = clip.keyframes.filter(kf => kf.time <= currentTime);
              if (pastKf.length > 0) { posX = pastKf[pastKf.length - 1].x; posY = pastKf[pastKf.length - 1].y; }
            } else if (isDraggingOverlay.current && activeDragClip.current?.clipId === clip.id) {
              posX = livePos.x; posY = livePos.y;
            }

            if (clip.type === 'censor') {
               return (
                <div key={clip.id} onTouchStart={(e) => handleOverlayTouchStart(e, clip.id, track.id)}
                  style={{ position: 'absolute', top: `${posY}%`, left: `${posX}%`, transform: 'translate(-50%, -50%)', width: '25%', height: '25%', backdropFilter: 'blur(15px)', backgroundColor: 'rgba(255,255,255,0.1)', border: project.selectedClipId === clip.id ? '2px solid #FFF' : '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 + trackIndex, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                  <Icons.Play style={{ opacity: 0 }} /> {/* Just for a little structure */}
                </div>
              );
            }

            return (
              <div key={clip.id} onTouchStart={(e) => handleOverlayTouchStart(e, clip.id, track.id)}
                style={{ position: 'absolute', top: `${posY}%`, left: `${posX}%`, transform: 'translate(-50%, -50%)', width: '35%', height: '35%', zIndex: 10 + trackIndex, border: project.selectedClipId === clip.id ? '2px solid #FFF' : 'none', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                {clip.type === 'image' ? <img src={clip.url} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} alt="pip" /> : <video className="compositor-media" autoPlay={isPlaying} src={clip.url} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} playsInline muted={clip.muted || track.muted} />}
              </div>
            );
          });
        })}
        {activeAudioClips.map(clip => <audio key={clip.id} className="compositor-media" autoPlay={isPlaying} src={clip.url} muted={clip.muted || project.tracks.find(t=>t.type==='audio').muted} />)}
      </div>

      {/* 2. PRO TRANSPORT BAR */}
      <div style={{ height: '45px', backgroundColor: '#141414', display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between', borderBottom: '1px solid #222' }}>
         <span style={{ fontSize: '13px', color: '#AAA', fontWeight: '500', fontVariantNumeric: 'tabular-nums' }}>{currentTime.toFixed(1)}s</span>
         <button onClick={togglePlayback} style={{ background: 'none', color: '#FFF', border: 'none', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {isPlaying ? <Icons.Pause /> : <Icons.Play />}
         </button>
         <button style={{ backgroundColor: '#FFF', color: '#000', border: 'none', borderRadius: '20px', padding: '6px 14px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}><Icons.Export /> Export</button>
      </div>

      {/* 3. MULTI-TRACK TIMELINE (With Pro Styling) */}
      <div onTouchMove={handleTimelineTouchMove} onTouchEnd={handleTimelineTouchEnd} className="hide-scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', backgroundColor: '#0A0A0A', position: 'relative', paddingBottom: '90px' }}>
        
        <div style={{ position: 'relative', minWidth: `${project.duration * project.zoomLevel + 100}px`, paddingTop: '30px' }}>
          
          {/* Pro Time Ruler */}
          <div style={{ position: 'absolute', top: 0, left: '70px', right: 0, height: '20px', borderBottom: '1px solid #333', display: 'flex' }}>
            {Array.from({ length: Math.ceil(project.duration) }).map((_, i) => (
              <div key={i} style={{ position: 'absolute', left: `${i * project.zoomLevel}px`, height: '100%', borderLeft: '1px solid #333', paddingLeft: '4px', fontSize: '9px', color: '#666' }}>{i}s</div>
            ))}
          </div>

          {/* Pro Playhead */}
          <div onTouchStart={(e) => startInteraction(e, 'scrub', { initialStart: currentTime })}
            style={{ position: 'absolute', left: `${currentTime * project.zoomLevel + 70}px`, top: '10px', bottom: 0, width: '2px', backgroundColor: '#FFF', zIndex: 50 }}>
            <div style={{ position: 'absolute', top: 0, left: '-5px', width: '12px', height: '16px', backgroundColor: '#FFF', borderRadius: '2px 2px 6px 6px', boxShadow: '0 2px 5px rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center' }}>
               <div style={{ width: '2px', height: '8px', backgroundColor: '#000', marginTop: '2px', borderRadius: '1px' }} />
            </div>
          </div>

          {project.tracks.map(track => (
            <div key={track.id} style={{ display: 'flex', marginBottom: '4px', height: '60px', position: 'relative', backgroundColor: 'transparent' }}>
              
              {/* Pro Track Header */}
              <div style={{ position: 'sticky', left: 0, width: '70px', backgroundColor: '#141414', borderRight: '1px solid #222', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                <span style={{ fontSize: '10px', color: '#AAA', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', width: '100%', textAlign: 'center', marginBottom: '4px' }}>{track.name}</span>
                <button onClick={() => toggleTrackMute(track.id)} style={{ background: 'transparent', color: track.muted ? '#E91E63' : '#666', border: 'none', padding: '4px' }}>
                  {track.muted ? <Icons.Mute /> : <Icons.Unmute />}
                </button>
              </div>

              {/* Clip Track */}
              <div style={{ position: 'relative', flex: 1, backgroundColor: '#111', borderRadius: '4px', overflow: 'hidden', margin: '0 5px' }} onClick={(e) => { if (e.target === e.currentTarget) setProject(p => ({ ...p, selectedClipId: null })) }}>
                {track.clips.map(clip => (
                  <div key={clip.id} onTouchStart={(e) => startInteraction(e, 'move', { clipId: clip.id, trackId: track.id, initialStart: clip.timelineStartTime })}
                    style={{
                      position: 'absolute', left: `${clip.timelineStartTime * project.zoomLevel}px`, width: `${clip.duration * project.zoomLevel}px`,
                      height: '100%', borderRadius: '6px', 
                      background: `linear-gradient(180deg, ${clip.color}DD 0%, ${clip.color} 100%)`, 
                      border: selectedData?.clip?.id === clip.id ? '2px solid #FFF' : '1px solid rgba(0,0,0,0.5)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '600', color: '#FFF', textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                      opacity: track.muted ? 0.4 : 1, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.5)'
                    }}>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', padding: '0 10px', pointerEvents: 'none' }}>{clip.name}</span>

                    {/* Pro Trim Handles */}
                    {selectedData?.clip?.id === clip.id && (
                      <>
                        <div onTouchStart={(e) => startInteraction(e, 'trim', { clipId: clip.id, trackId: track.id, edge: 'left', initialStart: clip.timelineStartTime, initialDuration: clip.duration })} style={{ position: 'absolute', left: '-2px', top: 0, bottom: 0, width: '24px', backgroundColor: '#FFF', borderRadius: '6px 0 0 6px', zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '2px 0 5px rgba(0,0,0,0.3)' }}>
                           <div style={{ width: '4px', height: '20px', borderLeft: '1px solid #CCC', borderRight: '1px solid #CCC' }} />
                        </div>
                        <div onTouchStart={(e) => startInteraction(e, 'trim', { clipId: clip.id, trackId: track.id, edge: 'right', initialStart: clip.timelineStartTime, initialDuration: clip.duration })} style={{ position: 'absolute', right: '-2px', top: 0, bottom: 0, width: '24px', backgroundColor: '#FFF', borderRadius: '0 6px 6px 0', zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '-2px 0 5px rgba(0,0,0,0.3)' }}>
                           <div style={{ width: '4px', height: '20px', borderLeft: '1px solid #CCC', borderRight: '1px solid #CCC' }} />
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

      {/* 4. PRO TOOL CAROUSEL */}
      <div className="hide-scroll" style={{ height: '80px', backgroundColor: '#141414', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', overflowX: 'auto', padding: '0 15px', position: 'fixed', bottom: 0, width: '100%', zIndex: 50, gap: '15px' }}>
        {!selectedData ? (
          <>
            <button onClick={() => mainMediaRef.current.click()} style={toolIconBtn}><Icons.AddVideo /> <span style={toolLabel}>Video</span></button>
            <button onClick={() => pipMediaRef.current.click()} style={toolIconBtn}><Icons.AddVideo /> <span style={toolLabel}>Overlay</span></button>
            <button onClick={() => audioMediaRef.current.click()} style={toolIconBtn}><Icons.AddAudio /> <span style={toolLabel}>Audio</span></button>
            <div style={{ height: '30px', borderLeft: '1px solid #333' }} />
            <button onClick={addCensorBlock} style={{ ...toolIconBtn, color: '#E91E63' }}><Icons.AddVideo /> <span style={{...toolLabel, color: '#E91E63'}}>Censor</span></button>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', paddingRight: '15px', borderRight: '1px solid #333' }}>
               <span style={{ fontSize: '13px', color: '#FFF', fontWeight: 'bold', maxWidth: '100px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedData.clip.name}</span>
               <span style={{ fontSize: '10px', color: '#888' }}>{selectedData.clip.type.toUpperCase()}</span>
            </div>
            
            <button onClick={() => updateSelectedClip('muted', !selectedData.clip.muted)} style={toolIconBtn}>
              {selectedData.clip.muted ? <Icons.Mute /> : <Icons.Unmute />} <span style={toolLabel}>{selectedData.clip.muted ? 'Unmute' : 'Mute'}</span>
            </button>
            
            {selectedData.trackId === 't-main' && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '100px' }}>
                  <span style={{ fontSize: '10px', color: '#AAA', display: 'flex', justifyContent: 'space-between' }}>Speed <span>{selectedData.clip.speed.toFixed(1)}x</span></span>
                  <input type="range" className="pro-slider" min="0.25" max="2" step="0.25" value={selectedData.clip.speed} onChange={(e) => updateSelectedClip('speed', parseFloat(e.target.value))} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '100px', marginLeft: '10px' }}>
                  <span style={{ fontSize: '10px', color: '#E91E63', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>Live Zoom <span>{selectedData.clip.zoom.toFixed(1)}x</span></span>
                  <input type="range" className="pro-slider" min="1" max="3" step="0.1" value={selectedData.clip.zoom} onChange={(e) => handleZoomChange(parseFloat(e.target.value))} />
                </div>
              </>
            )}
            
            <button onClick={() => setProject(prev => { const newTracks = prev.tracks.map(t => ({ ...t, clips: t.clips.filter(c => c.id !== selectedData.clip.id) })); return { ...prev, tracks: newTracks, selectedClipId: null }; })} 
              style={{ ...toolIconBtn, color: '#f44336', marginLeft: 'auto' }}>
              <Icons.Delete /> <span style={{...toolLabel, color: '#f44336'}}>Delete</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// Pro Styling Helpers
const toolIconBtn = { backgroundColor: 'transparent', color: '#ECECEC', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer', minWidth: '50px' };
const toolLabel = { fontSize: '10px', fontWeight: '500', color: '#AAA' };
