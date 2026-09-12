import React, { useState, useRef, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export default function Editor() {
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const ffmpegRef = useRef(new FFmpeg());

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportAsGif, setExportAsGif] = useState(false); // GIF Toggle State

  const [project, setProject] = useState({
    duration: 30, zoomLevel: 10, selectedClipId: null, selectedTrackId: null, activePreviewUrl: null,
    tracks: [
      { id: 't-main', type: 'main_video', name: 'Primary Reel', clips: [] },
      { id: 't-pip', type: 'overlay', name: 'PIP / Overlays', clips: [] }
    ]
  });

  const [censorRenderPos, setCensorRenderPos] = useState({ x: 50, y: 50 });
  const isDragging = useRef(false);

  // Helper to find the currently selected clip's data
  const getSelectedClip = () => {
    if (!project.selectedClipId) return null;
    for (const track of project.tracks) {
      const clip = track.clips.find(c => c.id === project.selectedClipId);
      if (clip) return { clip, trackId: track.id };
    }
    return null;
  };

  const selectedData = getSelectedClip();

  // Apply real-time playback speed when the selected clip changes or its speed changes
  useEffect(() => {
    if (videoRef.current && selectedData?.clip) {
      videoRef.current.playbackRate = selectedData.clip.speed || 1.0;
    }
  }, [selectedData?.clip?.speed]);

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

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fileUrl = URL.createObjectURL(file);
    const newClipId = 'c-' + Math.random().toString(36).substr(2, 9);

    setProject(prev => {
      const newTracks = [...prev.tracks];
      // Inject zoom and speed into the new clip's state
      newTracks[0].clips.push({ id: newClipId, name: file.name, timelineStartTime: 0, duration: 15, color: '#4CAF50', url: fileUrl, zoom: 1.0, speed: 1.0 });
      return { ...prev, tracks: newTracks, activePreviewUrl: fileUrl, selectedClipId: newClipId };
    });
  };

  const addCensorBlock = () => {
    const newClipId = 'c-' + Math.random().toString(36).substr(2, 9);
    setProject(prev => {
      const newTracks = [...prev.tracks];
      newTracks[1].clips.push({ id: newClipId, name: 'Censor Box', timelineStartTime: 0, duration: 15, color: '#E91E63', keyframes: [] });
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

  const handleExport = async () => { /* Export logic placeholder */ };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#0A0A0A', color: '#ECECEC', fontFamily: 'sans-serif' }}>
      
      {/* 1. Video Preview Canvas */}
      <div ref={containerRef} style={{ flex: '0 0 45%', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        {project.activePreviewUrl ? (
          <div style={{ width: '100%', height: '100%', transform: `scale(${selectedData?.trackId === 't-main' ? selectedData.clip.zoom : 1.0})`, transition: 'transform 0.1s ease-out' }}>
            <video ref={videoRef} src={project.activePreviewUrl} onTimeUpdate={handleTimeUpdate} style={{ width: '100%', height: '100%', objectFit: 'contain' }} playsInline />
          </div>
        ) : (
          <p style={{ color: '#555' }}>[ No Media Selected ]</p>
        )}
        
        {project.tracks[1].clips.length > 0 && (
           <div onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
             style={{ 
               position: 'absolute', top: `${censorRenderPos.y}%`, left: `${censorRenderPos.x}%`, transform: 'translate(-50%, -50%)',
               width: '80px', height: '80px', backgroundColor: 'rgba(233, 30, 99, 0.8)', border: '2px solid #fff', borderRadius: '8px', 
               display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px', fontWeight: 'bold', zIndex: 20
             }}>
             DRAG ME
           </div>
        )}

        {/* Dynamic Contextual Toolbar for Zoom & Speed */}
        {selectedData?.trackId === 't-main' && (
          <div style={{ position: 'absolute', bottom: '10px', width: '90%', backgroundColor: 'rgba(30, 30, 30, 0.9)', padding: '10px', borderRadius: '8px', border: '1px solid #444', zIndex: 30 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#aaa', marginBottom: '5px' }}>
              <span>Zoom ({selectedData.clip.zoom.toFixed(1)}x)</span>
            </div>
            <input type="range" min="1" max="3" step="0.1" value={selectedData.clip.zoom} onChange={(e) => updateSelectedClip('zoom', parseFloat(e.target.value))} style={{ width: '100%', marginBottom: '10px' }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#aaa', marginBottom: '5px' }}>
              <span>Speed ({selectedData.clip.speed.toFixed(2)}x)</span>
            </div>
            <input type="range" min="0.25" max="2" step="0.25" value={selectedData.clip.speed} onChange={(e) => updateSelectedClip('speed', parseFloat(e.target.value))} style={{ width: '100%' }} />
          </div>
        )}
      </div>

      {/* 2. Transport Controls & Export */}
      <div style={{ height: '60px', backgroundColor: '#141414', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 15px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={() => videoRef.current?.play()} style={{ background: '#fff', color: '#000', border: 'none', borderRadius: '50%', width: '30px', height: '30px' }}>▶</button>
          <button onClick={addCensorBlock} style={{ backgroundColor: '#E91E63', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>+ Censor</button>
          <input type="file" accept="video/*" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} />
          <button onClick={() => fileInputRef.current.click()} style={{ backgroundColor: '#2196F3', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>+ Media</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '10px', color: '#aaa', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input type="checkbox" checked={exportAsGif} onChange={(e) => setExportAsGif(e.target.checked)} />
            GIF
          </label>
          <button onClick={handleExport} disabled={isExporting} style={{ backgroundColor: isExporting ? '#555' : '#4CAF50', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
            {isExporting ? `Exporting... ${exportProgress}%` : '💾 Export'}
          </button>
        </div>
      </div>

      {/* 3. Explicit Multi-Track Layering UI */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '10px 0', backgroundColor: '#121212', position: 'relative' }}>
        <div style={{ overflowX: 'auto', paddingLeft: '20px', minWidth: `${project.duration * project.zoomLevel + 100}px` }}>
          {project.tracks.map(track => (
            <div key={track.id} style={{ display: 'flex', marginBottom: '10px', height: '50px', position: 'relative', backgroundColor: '#1A1A1A', borderRadius: '4px' }}>
              <div style={{ position: 'sticky', left: 0, width: '80px', backgroundColor: '#1A1A1A', borderRight: '1px solid #333', zIndex: 10, display: 'flex', alignItems: 'center', padding: '0 5px', fontSize: '10px', color: '#888' }}>
                {track.name}
              </div>
              <div style={{ position: 'relative', flex: 1 }}>
                {track.clips.map(clip => (
                  <div key={clip.id} onClick={() => setProject(prev => ({ ...prev, selectedClipId: prev.selectedClipId === clip.id ? null : clip.id }))}
                    style={{
                      position: 'absolute', left: `${clip.timelineStartTime * project.zoomLevel}px`, width: `${clip.duration * project.zoomLevel}px`,
                      backgroundColor: clip.color, height: '100%', borderRadius: '4px', display: 'flex', alignItems: 'center', padding: '0 8px',
                      fontSize: '10px', color: '#fff', boxShadow: project.selectedClipId === clip.id ? '0 0 0 2px #fff' : 'none'
                    }}
                  >
                    {clip.name}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
