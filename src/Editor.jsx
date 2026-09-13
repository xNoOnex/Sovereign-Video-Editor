import React, { useState, useRef, useEffect } from 'react';

const Icons = {
  Play: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>,
  Pause: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>,
  Rewind: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/></svg>,
  Delete: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>,
  Split: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm4-4H7v-2h9v2zm0-4H7V7h9v2z"/></svg>,
  Export: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>,
  Mute: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>,
  Unmute: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>,
  AddVideo: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4zM14 13h-3v3H9v-3H6v-2h3V8h2v3h3v2z"/></svg>,
  AddAudio: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>,
  Done: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>
};

export default function Editor() {
  const mainMediaRef = useRef(null);
  const pipMediaRef = useRef(null);
  const audioMediaRef = useRef(null);
  const containerRef = useRef(null);

  const [project, setProject] = useState({
    duration: 30, zoomLevel: 15, selectedClipId: null,
    tracks: [{ id: 't-audio-1', type: 'audio', name: 'Audio/SFX', muted: false, clips: [] }]
  });

  const [currentTime, setCurrentTime] = useState(0);
  const timeRef = useRef(0); 
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [liveTransform, setLiveTransform] = useState({ posX: 50, posY: 50, panX: 0, panY: 0, zoom: 1, originX: 50, originY: 50, opacity: 1 });
  
  const dragOffset = useRef({ x: 0, y: 0 });
  const isDraggingOverlay = useRef(false);
  const activeDragClip = useRef(null); 
  const pinchRef = useRef({ active: false, startDist: 0, startZoom: 1, originX: 50, originY: 50, clipId: null, trackId: null });
  const panRef = useRef({ active: false, startX: 0, startY: 0, startPanX: 0, startPanY: 0, clipId: null, trackId: null }); 
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
  const handleRewind = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    timeRef.current = 0;
    document.querySelectorAll('.compositor-media').forEach(media => { if (media.readyState >= 1) media.currentTime = 0.001; });
  };

  const toggleTrackMute = (trackId) => setProject(prev => ({ ...prev, tracks: prev.tracks.map(t => t.id === trackId ? { ...t, muted: !t.muted } : t) }));

  const handleSplitClip = () => {
    if (!selectedData) return;
    const { clip, trackId } = selectedData;
    const localTime = currentTime - clip.timelineStartTime;

    if (localTime > 0.2 && localTime < clip.duration - 0.2) {
      setProject(prev => {
        const newTracks = prev.tracks.map(t => {
          if (t.id !== trackId) return t;
          const cIndex = t.clips.findIndex(c => c.id === clip.id);
          const oldClip = t.clips[cIndex];
          const clipA = { ...oldClip, duration: localTime };
          const clipB = { ...oldClip, id: 'c-' + Math.random().toString(36).substr(2, 9), timelineStartTime: currentTime, duration: oldClip.duration - localTime };
          const newClips = [...t.clips];
          newClips.splice(cIndex, 1, clipA, clipB);
          return { ...t, clips: newClips };
        });
        return { ...prev, tracks: newTracks, selectedClipId: null };
      });
    }
  };

  const handleAddMedia = (e, targetType) => {
    const file = e.target.files[0];
    if (!file) return;
    const fileUrl = URL.createObjectURL(file);
    const isImage = file.type.startsWith('image/');
    const isAudio = file.type.startsWith('audio/');
    const duration = isImage || isAudio ? 5 : 15;
    let color = '#2196F3'; if (isImage) color = '#FF9800'; if (isAudio) color = '#00BCD4'; 

    setProject(prev => {
      const newTracks = [...prev.tracks];
      const newClip = { 
        id: 'c-' + Math.random().toString(36).substr(2, 9), name: file.name, type: isAudio ? 'audio' : (isImage ? 'image' : 'video'), 
        timelineStartTime: currentTime, duration, color, url: fileUrl, 
        zoom: 1.0, panX: 0, panY: 0, posX: 50, posY: 50, originX: 50, originY: 50, opacity: 1.0, speed: 1.0, muted: false, transformKeyframes: [] 
      };

      if (targetType === 'audio') {
        const audioTrack = newTracks.find(t => t.type === 'audio');
        if (audioTrack) audioTrack.clips.push(newClip);
      } else {
        const prefix = targetType === 'main_video' ? 'V' : 'Layer ';
        const count = newTracks.filter(t => t.type === targetType).length + 1;
        const newTrack = { id: `t-${targetType}-${count}`, type: targetType, name: `${prefix}${count}`, muted: false, clips: [newClip] };
        let insertIndex = newTracks.length;
        if (targetType === 'main_video') {
          const idx = newTracks.findIndex(t => t.type === 'overlay' || t.type === 'audio');
          if (idx !== -1) insertIndex = idx;
        } else if (targetType === 'overlay') {
          const idx = newTracks.findIndex(t => t.type === 'audio');
          if (idx !== -1) insertIndex = idx;
        }
        newTracks.splice(insertIndex, 0, newTrack);
      }
      return { ...prev, duration: Math.max(prev.duration, currentTime + duration + 5), tracks: newTracks, selectedClipId: newClip.id };
    });
    e.target.value = ''; 
  };

  // NEW: Bulletproof Immutable Keyframing Engine
  const saveTransform = (clipId, trackId, updates) => {
    setProject(prev => {
      const newTracks = prev.tracks.map(t => {
        if (t.id !== trackId) return t;
        return { ...t, clips: t.clips.map(c => {
            if (c.id !== clipId) return c;
            const updatedClip = { ...c, ...updates };
            if (isPlaying) {
              updatedClip.transformKeyframes = [
                ...(c.transformKeyframes || []), 
                { 
                  time: timeRef.current, 
                  zoom: updatedClip.zoom, 
                  x: updatedClip.posX, y: updatedClip.posY, 
                  originX: updatedClip.originX, originY: updatedClip.originY, 
                  opacity: updatedClip.opacity 
                }
              ];
            }
            return updatedClip;
          })
        };
      });
      return { ...prev, tracks: newTracks };
    });
  };

  const handleOpacityChange = (newOpacity) => {
    if (!selectedData) return;
    setLiveTransform(prev => ({ ...prev, opacity: newOpacity }));
    saveTransform(selectedData.clip.id, selectedData.trackId, { opacity: newOpacity });
  };

  const getPinchDistance = (touches) => Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
  const getPinchCenter = (touches, rect) => ({
    x: (((touches[0].clientX + touches[1].clientX) / 2 - rect.left) / rect.width) * 100,
    y: (((touches[0].clientY + touches[1].clientY) / 2 - rect.top) / rect.height) * 100
  });

  const handleViewportTouchStart = (e) => {
    if (!selectedData || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    if (e.touches.length === 2 && selectedData.track.type === 'main_video') {
      const center = getPinchCenter(e.touches, rect);
      pinchRef.current = { active: true, startDist: getPinchDistance(e.touches), startZoom: selectedData.clip.zoom || 1, originX: center.x, originY: center.y, clipId: selectedData.clip.id, trackId: selectedData.trackId };
      setLiveTransform(prev => ({ ...prev, originX: center.x, originY: center.y }));
    } 
    else if (e.touches.length === 1 && selectedData.track.type === 'main_video') {
      panRef.current = { active: true, startX: e.touches[0].clientX, startY: e.touches[0].clientY, startPanX: selectedData.clip.panX || 0, startPanY: selectedData.clip.panY || 0, clipId: selectedData.clip.id, trackId: selectedData.trackId };
    }
  };

  // NEW: Smart Overlay Touch Routing (Intercepts 2 fingers for zooming)
  const handleOverlayTouchStart = (e, clipId, trackId, currentZoom) => {
    e.stopPropagation();
    setProject(prev => ({ ...prev, selectedClipId: clipId }));

    if (e.touches.length >= 2) {
      // Route to Pinch Engine
      const rect = containerRef.current.getBoundingClientRect();
      const center = getPinchCenter(e.touches, rect);
      pinchRef.current = { active: true, startDist: getPinchDistance(e.touches), startZoom: currentZoom || 1, originX: center.x, originY: center.y, clipId, trackId };
      setLiveTransform(prev => ({ ...prev, originX: center.x, originY: center.y }));
    } else {
      // Route to Drag Engine
      const rect = e.currentTarget.getBoundingClientRect();
      const centerX = rect.left + (rect.width / 2);
      const centerY = rect.top + (rect.height / 2);
      dragOffset.current = { x: e.touches[0].clientX - centerX, y: e.touches[0].clientY - centerY };
      activeDragClip.current = { clipId, trackId };
      isDraggingOverlay.current = true;
    }
  };

  const handleViewportTouchMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    // 1. Process Pinch (Works for Overlays AND Main Video now)
    if (pinchRef.current.active && e.touches.length === 2) {
      const scaleMultiplier = getPinchDistance(e.touches) / pinchRef.current.startDist;
      const newZoom = Math.max(0.2, Math.min(5.0, pinchRef.current.startZoom * scaleMultiplier));
      setLiveTransform(prev => ({ ...prev, zoom: newZoom })); 
      saveTransform(pinchRef.current.clipId, pinchRef.current.trackId, { zoom: newZoom, originX: pinchRef.current.originX, originY: pinchRef.current.originY });
    } 
    // 2. Process Main Video Pan
    else if (panRef.current.active && e.touches.length === 1) {
      const deltaX = e.touches[0].clientX - panRef.current.startX;
      const deltaY = e.touches[0].clientY - panRef.current.startY;
      const newPanX = panRef.current.startPanX + deltaX;
      const newPanY = panRef.current.startPanY + deltaY;
      setLiveTransform(prev => ({ ...prev, panX: newPanX, panY: newPanY }));
      saveTransform(panRef.current.clipId, panRef.current.trackId, { panX: newPanX, panY: newPanY });
    }
    // 3. Process Overlay Drag
    else if (isDraggingOverlay.current && activeDragClip.current && e.touches.length === 1) {
      const targetX = e.touches[0].clientX - dragOffset.current.x;
      const targetY = e.touches[0].clientY - dragOffset.current.y;
      const newX = Math.max(0, Math.min(100, ((targetX - rect.left) / rect.width) * 100));
      const newY = Math.max(0, Math.min(100, ((targetY - rect.top) / rect.height) * 100));
      setLiveTransform(prev => ({ ...prev, posX: newX, posY: newY }));
      saveTransform(activeDragClip.current.clipId, activeDragClip.current.trackId, { posX: newX, posY: newY });
    }
  };

  const handleViewportTouchEnd = () => { pinchRef.current.active = false; panRef.current.active = false; isDraggingOverlay.current = false; activeDragClip.current = null; };

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
      timeRef.current = Math.max(0, initialStart + deltaSeconds);
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

  const mainTracks = project.tracks.filter(t => t.type === 'main_video');
  const overlayTracks = project.tracks.filter(t => t.type === 'overlay');
  const activeAudioClips = project.tracks.find(t => t.type === 'audio')?.clips.filter(c => currentTime >= c.timelineStartTime && currentTime <= c.timelineStartTime + c.duration) || [];

  const isActivelyTouched = (clipId) => 
    (pinchRef.current.active && pinchRef.current.clipId === clipId) || 
    (panRef.current.active && panRef.current.clipId === clipId) || 
    (isDraggingOverlay.current && activeDragClip.current?.clipId === clipId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#0A0A0A', color: '#ECECEC', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      <style>{`
        .hide-scroll::-webkit-scrollbar { display: none; }
        .pro-slider { -webkit-appearance: none; width: 100%; height: 4px; background: #333; border-radius: 2px; outline: none; }
        .pro-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; background: #FFF; border-radius: 50%; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.5); }
        video { object-fit: contain; background-color: #000; }
      `}</style>

      <input type="file" accept="*/*" ref={mainMediaRef} onChange={(e) => handleAddMedia(e, 'main_video')} style={{ display: 'none' }} />
      <input type="file" accept="*/*" ref={pipMediaRef} onChange={(e) => handleAddMedia(e, 'overlay')} style={{ display: 'none' }} />
      <input type="file" accept="audio/*" ref={audioMediaRef} onChange={(e) => handleAddMedia(e, 'audio')} style={{ display: 'none' }} />

      {/* 1. VIEWPORT: touchAction 'none' physically prevents browser scrolling logic */}
      <div 
        ref={containerRef} 
        onTouchStart={handleViewportTouchStart} 
        onTouchMove={handleViewportTouchMove} 
        onTouchEnd={handleViewportTouchEnd} 
        onClick={() => setProject(p => ({ ...p, selectedClipId: null }))}
        style={{ flex: '0 0 38%', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', touchAction: 'none' }}
      >
        
        {/* Primary Videos */}
        {mainTracks.map((track, trackIndex) => {
          const activeClips = track.clips.filter(c => currentTime >= c.timelineStartTime && currentTime <= c.timelineStartTime + c.duration);
          return activeClips.map(clip => {
            let renderZoom = clip.zoom || 1.0; let renderPanX = clip.panX || 0; let renderPanY = clip.panY || 0; 
            let originX = clip.originX || 50; let originY = clip.originY || 50; let renderOpacity = clip.opacity ?? 1.0;

            if (clip.transformKeyframes?.length > 0 && !isActivelyTouched(clip.id)) {
              const pastKf = clip.transformKeyframes.filter(kf => kf.time <= currentTime);
              if (pastKf.length > 0) {
                 renderZoom = pastKf[pastKf.length - 1].zoom; renderPanX = pastKf[pastKf.length - 1].x; renderPanY = pastKf[pastKf.length - 1].y;
                 originX = pastKf[pastKf.length - 1].originX || 50; originY = pastKf[pastKf.length - 1].originY || 50;
                 renderOpacity = pastKf[pastKf.length - 1].opacity ?? renderOpacity;
              }
            } else if (isActivelyTouched(clip.id)) {
               renderZoom = liveTransform.zoom || renderZoom; renderPanX = liveTransform.panX || renderPanX; renderPanY = liveTransform.panY || renderPanY;
               originX = liveTransform.originX || originX; originY = liveTransform.originY || originY;
               renderOpacity = liveTransform.opacity ?? renderOpacity;
            }

            return (
              <div key={clip.id} onClick={(e) => { e.stopPropagation(); setProject(p => ({ ...p, selectedClipId: clip.id })); setLiveTransform(prev => ({...prev, opacity: clip.opacity ?? 1})); }} 
                   style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 1 + trackIndex, 
                            transformOrigin: `${originX}% ${originY}%`, 
                            transform: `translate(${renderPanX}px, ${renderPanY}px) scale(${renderZoom})`, 
                            opacity: renderOpacity }}>
                {clip.type === 'image' ? <img src={clip.url} style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} alt="main" /> : 
                <video className="compositor-media" autoPlay={isPlaying} preload="auto" src={clip.url} style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} playsInline muted={clip.muted || track.muted} onLoadedData={(e) => { e.target.currentTime = 0.001; }} />}
              </div>
            );
          });
        })}

        {/* Overlays */}
        {overlayTracks.map((track, trackIndex) => {
          const activeClips = track.clips.filter(c => currentTime >= c.timelineStartTime && currentTime <= c.timelineStartTime + c.duration);
          return activeClips.map(clip => {
            let posX = clip.posX ?? 50; let posY = clip.posY ?? 50; let renderZoom = clip.zoom || 1.0;
            let originX = clip.originX || 50; let originY = clip.originY || 50; let renderOpacity = clip.opacity ?? 1.0;

            if (clip.transformKeyframes?.length > 0 && !isActivelyTouched(clip.id)) {
              const pastKf = clip.transformKeyframes.filter(kf => kf.time <= currentTime);
              if (pastKf.length > 0) { 
                posX = pastKf[pastKf.length - 1].x; posY = pastKf[pastKf.length - 1].y; renderZoom = pastKf[pastKf.length - 1].zoom; 
                originX = pastKf[pastKf.length - 1].originX || 50; originY = pastKf[pastKf.length - 1].originY || 50; renderOpacity = pastKf[pastKf.length - 1].opacity ?? renderOpacity;
              }
            } else if (isActivelyTouched(clip.id)) {
              posX = liveTransform.posX || posX; posY = liveTransform.posY || posY; renderZoom = liveTransform.zoom || renderZoom;
              originX = liveTransform.originX || originX; originY = liveTransform.originY || originY; renderOpacity = liveTransform.opacity ?? renderOpacity;
            }

            return (
              <div 
                key={clip.id} 
                onTouchStart={(e) => handleOverlayTouchStart(e, clip.id, track.id, renderZoom)}
                onClick={(e) => { e.stopPropagation(); setProject(p => ({ ...p, selectedClipId: clip.id })); setLiveTransform(prev => ({...prev, opacity: clip.opacity ?? 1})); }}
                style={{ 
                  position: 'absolute', top: `${posY}%`, left: `${posX}%`, 
                  transformOrigin: `${originX}% ${originY}%`, 
                  transform: `translate(-50%, -50%) scale(${renderZoom})`, 
                  width: '35%', height: '35%', zIndex: 50 + trackIndex, 
                  border: project.selectedClipId === clip.id ? '2px solid #FFF' : '1px dashed rgba(255,255,255,0.4)', 
                  borderRadius: '8px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', cursor: 'pointer',
                  opacity: renderOpacity
                }}
              >
                {clip.type === 'image' ? (
                  <img src={clip.url} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} alt="pip" />
                ) : (
                  <video className="compositor-media" autoPlay={isPlaying} preload="auto" src={clip.url} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} playsInline muted={clip.muted || track.muted} onLoadedData={(e) => { e.target.currentTime = 0.001; }} />
                )}
              </div>
            );
          });
        })}
        {activeAudioClips.map(clip => <audio key={clip.id} className="compositor-media" autoPlay={isPlaying} src={clip.url} muted={clip.muted || project.tracks.find(t=>t.type==='audio').muted} />)}
      </div>

      {/* 2. PRO TRANSPORT BAR */}
      <div style={{ height: '45px', backgroundColor: '#141414', display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between', borderBottom: '1px solid #222' }}>
         <span style={{ fontSize: '13px', color: '#AAA', fontWeight: '500', fontVariantNumeric: 'tabular-nums' }}>{currentTime.toFixed(1)}s</span>
         <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
           <button onClick={handleRewind} style={{ background: 'none', color: '#FFF', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
             <Icons.Rewind />
           </button>
           <button onClick={togglePlayback} style={{ background: 'none', color: '#FFF', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              {isPlaying ? <Icons.Pause /> : <Icons.Play />}
           </button>
         </div>
         <button style={{ backgroundColor: '#FFF', color: '#000', border: 'none', borderRadius: '20px', padding: '6px 14px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}><Icons.Export /> Export</button>
      </div>

      {/* 3. MULTI-TRACK TIMELINE */}
      <div onTouchMove={handleTimelineTouchMove} onTouchEnd={handleTimelineTouchEnd} className="hide-scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', backgroundColor: '#0A0A0A', position: 'relative', paddingBottom: '90px' }}>
        <div style={{ position: 'relative', minWidth: `${project.duration * project.zoomLevel + 100}px`, paddingTop: '30px', minHeight: '100%' }} onClick={() => setProject(p => ({ ...p, selectedClipId: null }))}>
          
          <div style={{ position: 'absolute', top: 0, left: '70px', right: 0, height: '20px', borderBottom: '1px solid #333', display: 'flex', pointerEvents: 'none' }}>
            {Array.from({ length: Math.ceil(project.duration) }).map((_, i) => (
              <div key={i} style={{ position: 'absolute', left: `${i * project.zoomLevel}px`, height: '100%', borderLeft: '1px solid #333', paddingLeft: '4px', fontSize: '9px', color: '#666' }}>{i}s</div>
            ))}
          </div>

          <div onTouchStart={(e) => startInteraction(e, 'scrub', { initialStart: currentTime })} style={{ position: 'absolute', left: `${currentTime * project.zoomLevel + 70}px`, top: '10px', bottom: 0, width: '2px', backgroundColor: '#FFF', zIndex: 50 }}>
            <div style={{ position: 'absolute', top: 0, left: '-5px', width: '12px', height: '16px', backgroundColor: '#FFF', borderRadius: '2px 2px 6px 6px', boxShadow: '0 2px 5px rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center' }}>
               <div style={{ width: '2px', height: '8px', backgroundColor: '#000', marginTop: '2px', borderRadius: '1px' }} />
            </div>
          </div>

          {project.tracks.map(track => (
            <div key={track.id} style={{ display: 'flex', marginBottom: '4px', height: '60px', position: 'relative', backgroundColor: 'transparent' }}>
              <div style={{ position: 'sticky', left: 0, width: '70px', backgroundColor: '#141414', borderRight: '1px solid #222', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                <span style={{ fontSize: '10px', color: '#AAA', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', width: '100%', textAlign: 'center', marginBottom: '4px' }}>{track.name}</span>
                <button onClick={() => toggleTrackMute(track.id)} style={{ background: 'transparent', color: track.muted ? '#E91E63' : '#666', border: 'none', padding: '4px' }}>{track.muted ? <Icons.Mute /> : <Icons.Unmute />}</button>
              </div>

              <div style={{ position: 'relative', flex: 1, backgroundColor: '#111', borderRadius: '4px', overflow: 'hidden', margin: '0 5px' }}>
                {track.clips.map(clip => (
                  <div 
                    key={clip.id} 
                    onClick={(e) => { e.stopPropagation(); setProject(p => ({ ...p, selectedClipId: clip.id })); setLiveTransform(prev => ({...prev, opacity: clip.opacity ?? 1})); }}
                    onTouchStart={(e) => startInteraction(e, 'move', { clipId: clip.id, trackId: track.id, initialStart: clip.timelineStartTime })}
                    style={{
                      position: 'absolute', left: `${clip.timelineStartTime * project.zoomLevel}px`, width: `${clip.duration * project.zoomLevel}px`,
                      height: '100%', borderRadius: '6px', background: `linear-gradient(180deg, ${clip.color}DD 0%, ${clip.color} 100%)`, 
                      border: selectedData?.clip?.id === clip.id ? '2px solid #FFF' : '1px solid rgba(0,0,0,0.5)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '600', color: '#FFF', opacity: track.muted ? 0.4 : 1, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)'
                    }}
                  >
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', padding: '0 10px', pointerEvents: 'none' }}>{clip.name}</span>
                    {selectedData?.clip?.id === clip.id && (
                      <>
                        <div onTouchStart={(e) => startInteraction(e, 'trim', { clipId: clip.id, trackId: track.id, edge: 'left', initialStart: clip.timelineStartTime, initialDuration: clip.duration })} style={{ position: 'absolute', left: '-2px', top: 0, bottom: 0, width: '24px', backgroundColor: '#FFF', borderRadius: '6px 0 0 6px', zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '2px 0 5px rgba(0,0,0,0.3)' }}><div style={{ width: '4px', height: '20px', borderLeft: '1px solid #CCC', borderRight: '1px solid #CCC' }} /></div>
                        <div onTouchStart={(e) => startInteraction(e, 'trim', { clipId: clip.id, trackId: track.id, edge: 'right', initialStart: clip.timelineStartTime, initialDuration: clip.duration })} style={{ position: 'absolute', right: '-2px', top: 0, bottom: 0, width: '24px', backgroundColor: '#FFF', borderRadius: '0 6px 6px 0', zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '-2px 0 5px rgba(0,0,0,0.3)' }}><div style={{ width: '4px', height: '20px', borderLeft: '1px solid #CCC', borderRight: '1px solid #CCC' }} /></div>
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
            <button onClick={() => mainMediaRef.current.click()} style={toolIconBtn}><Icons.AddVideo /> <span style={toolLabel}>Primary</span></button>
            <div style={{ height: '30px', borderLeft: '1px solid #333' }} />
            <button onClick={() => pipMediaRef.current.click()} style={{ ...toolIconBtn, color: '#FF9800' }}><Icons.AddVideo /> <span style={{...toolLabel, color: '#FF9800'}}>Overlay</span></button>
            <div style={{ height: '30px', borderLeft: '1px solid #333' }} />
            <button onClick={() => audioMediaRef.current.click()} style={toolIconBtn}><Icons.AddAudio /> <span style={toolLabel}>Audio</span></button>
          </>
        ) : (
          <>
            <button onClick={() => setProject(prev => ({...prev, selectedClipId: null}))} style={{...toolIconBtn, color: '#4CAF50'}}><Icons.Done /> <span style={{...toolLabel, color: '#4CAF50'}}>Done</span></button>
            <div style={{ height: '30px', borderLeft: '1px solid #333' }} />
            
            <button onClick={handleSplitClip} style={toolIconBtn}><Icons.Split /> <span style={toolLabel}>Split</span></button>
            <div style={{ height: '30px', borderLeft: '1px solid #333' }} />

            {selectedData.track.type !== 'audio' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '80px', marginLeft: '10px' }}>
                <span style={{ fontSize: '10px', color: '#00BCD4', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>Fade <span>{Math.round((selectedData.clip.opacity ?? 1) * 100)}%</span></span>
                <input type="range" className="pro-slider" min="0" max="1" step="0.05" value={selectedData.clip.opacity ?? 1} onChange={(e) => handleOpacityChange(parseFloat(e.target.value))} />
              </div>
            )}
            
            <button onClick={() => setProject(prev => { const newTracks = prev.tracks.map(t => ({ ...t, clips: t.clips.filter(c => c.id !== selectedData.clip.id) })); return { ...prev, tracks: newTracks, selectedClipId: null }; })} style={{ ...toolIconBtn, color: '#f44336', marginLeft: 'auto' }}><Icons.Delete /> <span style={{...toolLabel, color: '#f44336'}}>Delete</span></button>
          </>
        )}
      </div>
    </div>
  );
}

const toolIconBtn = { backgroundColor: 'transparent', color: '#ECECEC', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer', minWidth: '50px' };
const toolLabel = { fontSize: '10px', fontWeight: '500', color: '#AAA' };
