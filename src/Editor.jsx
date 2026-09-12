import React, { useState, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export default function Editor() {
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  // Initialize the offline FFmpeg engine
  const ffmpegRef = useRef(new FFmpeg());
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const [project, setProject] = useState({
    duration: 30, zoomLevel: 10, selectedClipId: null, activePreviewUrl: null,
    tracks: [
      { id: 't-main', type: 'main_video', name: 'Primary Reel', clips: [] },
      { id: 't-pip', type: 'overlay', name: 'PIP / Overlays', clips: [] }
    ]
  });

  const [censorRenderPos, setCensorRenderPos] = useState({ x: 50, y: 50 });
  const isDragging = useRef(false);

  // --- NATIVE EXPORT ENGINE ---
  const handleExport = async () => {
    if (!project.activePreviewUrl) return alert("Please add a video first!");
    
    setIsExporting(true);
    const ffmpeg = ffmpegRef.current;

    // Load the engine into the phone's memory if it isn't already
    if (!ffmpeg.loaded) {
      await ffmpeg.load();
    }

    // Hook into the progress to update the UI
    ffmpeg.on('progress', ({ progress }) => {
      setExportProgress(Math.round(progress * 100));
    });

    // 1. Load the selected video from the phone into the offline engine
    await ffmpeg.writeFile('input.mp4', await fetchFile(project.activePreviewUrl));

    // 2. Run a basic FFmpeg command (For now, let's just copy it to prove the pipeline works)
    // We will inject the complex motion-tracking math here later
    await ffmpeg.exec(['-i', 'input.mp4', '-c', 'copy', 'output.mp4']);

    // 3. Pull the finished file out of the engine
    const data = await ffmpeg.readFile('output.mp4');
    
    // 4. Trigger an immediate native download to the phone's gallery/downloads
    const exportUrl = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
    const a = document.createElement('a');
    a.href = exportUrl;
    a.download = 'Sovereign_Export.mp4';
    a.click();

    setIsExporting(false);
    setExportProgress(0);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fileUrl = URL.createObjectURL(file);
    const newClipId = 'c-' + Math.random().toString(36).substr(2, 9);

    setProject(prev => {
      const newTracks = [...prev.tracks];
      newTracks[0].clips.push({ id: newClipId, name: file.name, timelineStartTime: 0, duration: 15, color: '#4CAF50', url: fileUrl });
      return { ...prev, tracks: newTracks, activePreviewUrl: fileUrl };
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#0A0A0A', color: '#ECECEC', fontFamily: 'sans-serif' }}>
      
      {/* 1. Video Preview Canvas */}
      <div ref={containerRef} style={{ flex: '0 0 40%', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        {project.activePreviewUrl ? (
          <video ref={videoRef} src={project.activePreviewUrl} onTimeUpdate={handleTimeUpdate} style={{ width: '100%', height: '100%', objectFit: 'contain' }} playsInline />
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
      </div>

      {/* 2. Transport Controls & Export */}
      <div style={{ height: '50px', backgroundColor: '#141414', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 15px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => videoRef.current?.play()} style={{ background: '#fff', color: '#000', border: 'none', borderRadius: '50%', width: '30px', height: '30px' }}>▶</button>
          <button onClick={addCensorBlock} style={{ backgroundColor: '#E91E63', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>+ Add Censor</button>
          <input type="file" accept="video/*" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} />
          <button onClick={() => fileInputRef.current.click()} style={{ backgroundColor: '#2196F3', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>+ Media</button>
        </div>

        {/* The FFmpeg Export Button */}
        <button onClick={handleExport} disabled={isExporting} style={{ backgroundColor: isExporting ? '#555' : '#4CAF50', color: '#fff', border: 'none', padding: '6px 15px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
          {isExporting ? `Exporting... ${exportProgress}%` : '💾 Export'}
        </button>
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
                    {clip.name} {clip.keyframes && `(${clip.keyframes.length} pts)`}
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
