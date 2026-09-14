import React, { useState, useRef, useEffect } from 'react';
import imglyRemoveBackground from '@imgly/background-removal';

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
  Done: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>,
  Text: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M5 4v3h5.5v12h3V7H19V4H5z"/></svg>,
  Mic: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/></svg>,
  Stop: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v12H6z"/></svg>,
  Save: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>,
  Load: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6zm-4 10c0-1.66-1.34-3-3-3s-3 1.34-3 3 1.34 3 3 3 3-1.34 3-3zm-6-2.5V21h10v-4.5l-5-5-5 5zM5 19v-2h4v2H5zm0-4v-2h8v2H5zm0-4V9h14v2H5z"/></svg>,
  GreenScreen: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.71 5.63l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-3.12 3.12-1.93-1.91-1.41 1.41 1.42 1.42L3 16.25V21h4.75l8.92-8.92 1.42 1.42 1.41-1.41-1.92-1.92 3.12-3.12c.4-.4.4-1.03.01-1.42zM6.92 19L5 17.08l8.06-8.06 1.92 1.92L6.92 19z"/></svg>,
  Wand: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7.5 5.6L10 7 8.6 4.5 10 2 7.5 3.4 5 2l1.4 2.5L5 7zm12 9.8L17 14l1.4 2.5L17 19l2.5-1.4L22 19l-1.4-2.5L22 14zM22 2l-2.5 1.4L17 2l1.4 2.5L17 7l2.5-1.4L22 7l-1.4-2.5zm-7.63 5.29c-.39-.39-1.02-.39-1.41 0L1.29 18.96c-.39.39-.39 1.02 0 1.41l2.34 2.34c.39.39 1.02.39 1.41 0L16.7 11.05c.39-.39.39-1.02 0-1.41l-2.33-2.35zm-1.03 5.49l-2.12-2.12 2.44-2.44 2.12 2.12-2.44 2.44z"/></svg>,
  Settings: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.73,8.87C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.06,0.94l-2.03,1.58c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54C9.77,21.83,9.97,22,10.21,22h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg>,
  Cutout: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 9h-2V7h-2v5H6v2h2v5h2v-5h2v-2z"/></svg>,
  Sticker: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
};

export default function Editor() {
  const mainMediaRef = useRef(null);
  const pipMediaRef = useRef(null);
  const audioMediaRef = useRef(null);
  const loadProjectRef = useRef(null);
  const containerRef = useRef(null);

  const [appSettings, setAppSettings] = useState({ showGrid: false, autoPause: false, exportRes: '1080p' });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showStickerModal, setShowStickerModal] = useState(false);
  const [stickerVault, setStickerVault] = useState([]);
  
  // NEW: State to trigger the loading spinner while the WASM model boots up
  const [isProcessingAI, setIsProcessingAI] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sovereign_stickers');
    if (saved) { try { setStickerVault(JSON.parse(saved)); } catch (e) { } }
  }, []);

  const [project, setProject] = useState({ duration: 30, zoomLevel: 15, selectedClipId: null, tracks: [{ id: 't-audio-1', type: 'audio', name: 'Audio/SFX', muted: false, clips: [] }] });
  const [currentTime, setCurrentTime] = useState(0);
  const timeRef = useRef(0); 
  const [isPlaying, setIsPlaying] = useState(false);
  const [liveTransform, setLiveTransform] = useState({ posX: 50, posY: 50, panX: 0, panY: 0, zoom: 1, originX: 50, originY: 50, opacity: 1 });
  
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordStartTime = useRef(0);

  const [showExportModal, setShowExportModal] = useState(false);
  const [ffmpegScript, setFfmpegScript] = useState("");
  const [embedPayload, setEmbedPayload] = useState(false);
  const steganographyFileRef = useRef(null);

  const dragOffset = useRef({ x: 0, y: 0 });
  const isDraggingOverlay = useRef(false);
  const activeDragClip = useRef(null); 
  const pinchRef = useRef({ active: false, startDist: 0, startZoom: 1, originX: 50, originY: 50, clipId: null, trackId: null });
  const panRef = useRef({ active: false, startX: 0, startY: 0, startPanX: 0, startPanY: 0, clipId: null, trackId: null }); 
  const interaction = useRef({ type: null, targetId: null, trackId: null, edge: null, startX: 0, initialStart: 0, initialDuration: 0 });

  const getSelectedData = () => {
    if (!project.selectedClipId) return null;
    for (const track of project.tracks) { const clip = track.clips.find(c => c.id === project.selectedClipId); if (clip) return { clip, trackId: track.id, track }; }
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
          if (nextTime === 0) { setIsPlaying(false); if (isRecording) stopRecording(); }
          return nextTime;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isPlaying, project.duration, isRecording]);

  useEffect(() => {
    document.querySelectorAll('.compositor-media').forEach(media => {
      if (isPlaying && media.paused) media.play().catch(() => {});
      if (!isPlaying && !media.paused) media.pause();
    });
  }, [isPlaying, currentTime]);

  const togglePlayback = () => setIsPlaying(!isPlaying);
  const handleRewind = () => {
    if (isRecording) stopRecording();
    setIsPlaying(false); setCurrentTime(0); timeRef.current = 0;
    document.querySelectorAll('.compositor-media').forEach(media => { if (media.readyState >= 1) media.currentTime = 0.001; });
  };

  const handleSaveProject = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(project));
    const a = document.createElement('a'); a.setAttribute("href", dataStr); a.setAttribute("download", "sovereign_project.json"); document.body.appendChild(a); a.click(); a.remove();
  };

  const handleLoadProject = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => { try { setProject(JSON.parse(event.target.result)); } catch (e) { alert("Invalid project file."); } };
    reader.readAsText(file); e.target.value = '';
  };

  // THE OFFLINE-LOCKED WEBASSEMBLY EXECUTION
  const executeWasmCutout = async () => {
    if (!selectedData || selectedData.clip.type === 'text') return;
    if (selectedData.clip.type === 'video') {
      alert("AI cutout isolates subjects in images/gifs. Use the Chroma Key tool for video backgrounds!");
      return;
    }

    setIsProcessingAI(true);
    try {
      // We calculate the exact local path whether it's running in an APK or GH Pages
      const basePath = window.location.href.split('?')[0].replace(/\/[^\/]*$/, '/');
      const config = {
        publicPath: basePath + 'assets/imgly/', // Strict local routing
        model: 'small', // 40MB Quantized Model fits inside the APK and GitHub Pages easily
        progress: (key, current, total) => {
          console.log(`Loading ${key}: ${current} of ${total}`);
        }
      };
      
      const imageBlob = await imglyRemoveBackground(selectedData.clip.url, config);
      const newUrl = URL.createObjectURL(imageBlob);
      
      setProject(prev => {
        const newTracks = prev.tracks.map(t => {
          if (t.id !== selectedData.trackId) return t;
          return { ...t, clips: t.clips.map(c => c.id === selectedData.clip.id ? { ...c, url: newUrl, name: `Cutout_${c.id}.png`, magicCutout: true } : c) };
        });
        return { ...prev, tracks: newTracks };
      });
    } catch (error) {
      alert("AI Processing Failed. Ensure your browser allows WebAssembly.");
      console.error(error);
    }
    setIsProcessingAI(false);
  };

  const handleSaveSticker = () => {
    if (!selectedData) return;
    const newVault = [...stickerVault, selectedData.clip];
    setStickerVault(newVault);
    localStorage.setItem('sovereign_stickers', JSON.stringify(newVault));
    
    if (selectedData.clip.magicCutout) {
      const a = document.createElement('a');
      a.href = selectedData.clip.url;
      a.download = selectedData.clip.name;
      document.body.appendChild(a); a.click(); a.remove();
    }
    alert("Sticker Saved! If it was an AI Cutout, the transparent PNG has been downloaded so Termux can map it during export.");
  };

  const handleDropSticker = (stickerClip) => {
    setProject(prev => {
      const newTracks = [...prev.tracks];
      const spawnClip = { ...stickerClip, id: 'c-' + Math.random().toString(36).substr(2, 9), timelineStartTime: currentTime };
      const overlayCount = newTracks.filter(t => t.type === 'overlay').length + 1;
      const newTrack = { id: `t-pip-${overlayCount}`, type: 'overlay', name: `Sticker`, muted: false, clips: [spawnClip] };
      const audioIndex = newTracks.findIndex(t => t.type === 'audio');
      newTracks.splice(audioIndex !== -1 ? audioIndex : newTracks.length, 0, newTrack);
      return { ...prev, duration: Math.max(prev.duration, currentTime + spawnClip.duration + 5), tracks: newTracks, selectedClipId: spawnClip.id };
    });
    setShowStickerModal(false);
  };

  const handleAutoCaptions = () => {
    const audioTrack = project.tracks.find(t => t.type === 'audio');
    if (!audioTrack || audioTrack.clips.length === 0) { alert("Add an audio or voiceover track first."); return; }
    const targetAudio = audioTrack.clips[0];
    setProject(prev => {
      const newTracks = [...prev.tracks]; const newClips = [];
      for(let i=0; i < targetAudio.duration; i+=2) {
         newClips.push({ id: 'c-' + Math.random().toString(36).substr(2, 9), name: `Caption ${i}`, type: 'text', text: `Caption [${i}s]`, timelineStartTime: targetAudio.timelineStartTime + i, duration: 2, color: '#E91E63', url: null, zoom: 1.5, panX: 0, panY: 0, posX: 50, posY: 90, originX: 50, originY: 50, opacity: 1.0, speed: 1.0, muted: false, transformKeyframes: [] });
      }
      const overlayCount = newTracks.filter(t => t.type === 'overlay').length + 1;
      newTracks.splice(newTracks.findIndex(t => t.type === 'audio'), 0, { id: `t-pip-${overlayCount}`, type: 'overlay', name: `Captions`, muted: false, clips: newClips });
      return { ...prev, tracks: newTracks, selectedClipId: newClips[0].id };
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder; audioChunksRef.current = []; recordStartTime.current = currentTime;
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        insertMediaDirectly('audio', URL.createObjectURL(audioBlob), `Voiceover_${Math.floor(recordStartTime.current)}s`, timeRef.current - recordStartTime.current, '#E91E63', recordStartTime.current);
        stream.getTracks().forEach(track => track.stop()); 
      };
      mediaRecorder.start(); setIsRecording(true); setIsPlaying(true); 
    } catch (err) { alert("Microphone permission denied."); }
  };
  const stopRecording = () => { setIsRecording(false); setIsPlaying(false); if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") mediaRecorderRef.current.stop(); };

  const insertMediaDirectly = (targetType, fileUrl, fileName, duration, defaultColor, forceStartTime = null, explicitType = null) => {
    const newClipId = 'c-' + Math.random().toString(36).substr(2, 9);
    const spawnTime = forceStartTime !== null ? forceStartTime : currentTime;
    setProject(prev => {
      const newTracks = [...prev.tracks];
      const newClip = { 
        id: newClipId, name: fileName, type: explicitType || targetType, 
        timelineStartTime: spawnTime, duration, color: defaultColor, url: fileUrl, chromaKey: false, magicCutout: false, audioDucking: false,
        zoom: 1.0, panX: 0, panY: 0, posX: 50, posY: 50, originX: 50, originY: 50, opacity: 1.0, speed: 1.0, muted: false, transformKeyframes: [] 
      };
      if (targetType === 'audio') {
        const audioTrack = newTracks.find(t => t.type === 'audio'); if (audioTrack) audioTrack.clips.push(newClip);
      } else {
        const prefix = targetType === 'main_video' ? 'V' : 'Layer ';
        const count = newTracks.filter(t => t.type === targetType).length + 1;
        const newTrack = { id: `t-${targetType}-${count}`, type: targetType, name: `${prefix}${count}`, muted: false, clips: [newClip] };
        let insertIndex = newTracks.length;
        if (targetType === 'main_video') { const idx = newTracks.findIndex(t => t.type === 'overlay' || t.type === 'audio'); if (idx !== -1) insertIndex = idx; } 
        else if (targetType === 'overlay') { const idx = newTracks.findIndex(t => t.type === 'audio'); if (idx !== -1) insertIndex = idx; }
        newTracks.splice(insertIndex, 0, newTrack);
      }
      return { ...prev, duration: Math.max(prev.duration, spawnTime + duration + 5), tracks: newTracks, selectedClipId: newClipId };
    });
  };

  const handleAddMedia = (e, targetType) => {
    const file = e.target.files[0]; if (!file) return;
    const isImage = file.type.startsWith('image/'); const isAudio = file.type.startsWith('audio/'); const isVideo = file.type.startsWith('video/');
    let color = '#2196F3'; if (isImage) color = '#FF9800'; if (isAudio) color = '#00BCD4'; 
    let finalType = isImage ? 'image' : (isVideo ? 'video' : 'audio');
    insertMediaDirectly(targetType, URL.createObjectURL(file), file.name, isImage || isAudio ? 5 : 15, color, null, finalType); e.target.value = ''; 
  };

  const handleAddText = () => {
    const textInput = window.prompt("Enter Text or Emoji:"); if (!textInput) return;
    setProject(prev => {
      const newTracks = [...prev.tracks];
      const newClip = { 
        id: 'c-' + Math.random().toString(36).substr(2, 9), name: textInput, type: 'text', text: textInput, timelineStartTime: currentTime, duration: 5, color: '#E91E63', url: null, 
        zoom: 1.0, panX: 0, panY: 0, posX: 50, posY: 50, originX: 50, originY: 50, opacity: 1.0, speed: 1.0, muted: false, transformKeyframes: [] 
      };
      const overlayCount = newTracks.filter(t => t.type === 'overlay').length + 1;
      const newTrack = { id: `t-pip-${overlayCount}`, type: 'overlay', name: `Text ${overlayCount}`, muted: false, clips: [newClip] };
      const audioIndex = newTracks.findIndex(t => t.type === 'audio'); newTracks.splice(audioIndex !== -1 ? audioIndex : newTracks.length, 0, newTrack);
      return { ...prev, duration: Math.max(prev.duration, currentTime + 10), tracks: newTracks, selectedClipId: newClip.id };
    });
  };

  const compileFFmpegScript = () => {
    let script = "# Sovereign FFmpeg Export Script\nffmpeg \\\n";
    let inputCount = 0;
    project.tracks.forEach(track => { track.clips.forEach(clip => { if (clip.type !== 'text') { script += `  -i "${clip.name}" \\\n`; inputCount++; } }); });
    if (embedPayload && steganographyFileRef.current?.files[0]) { script += `  -attach "${steganographyFileRef.current.files[0].name}" \\\n  -metadata:s:t mimetype=application/octet-stream \\\n`; }
    const scaleMap = { '1080p': '1920:1080', '4K': '3840:2160' };
    script += `  -filter_complex "\\\n    [0:v]scale=${scaleMap[appSettings.exportRes]}[bg]; \\\n`;
    
    let overlayIndex = 1;
    project.tracks.filter(t => t.type === 'overlay').forEach(track => {
      track.clips.forEach(clip => {
        let fx = '';
        if (clip.chromaKey) fx = `colorkey=0x00FF00:0.3:0.2`;
        if (fx) {
          script += `    [${overlayIndex}:v]${fx}[ck${overlayIndex}]; \\\n    [bg][ck${overlayIndex}]overlay=${clip.posX * 19.2}:${clip.posY * 10.8}:enable='between(t,${clip.timelineStartTime},${clip.timelineStartTime + clip.duration})'[out${overlayIndex}]; \\\n`;
        } else {
          script += `    [bg][${overlayIndex}:v]overlay=${clip.posX * 19.2}:${clip.posY * 10.8}:enable='between(t,${clip.timelineStartTime},${clip.timelineStartTime + clip.duration})'[out${overlayIndex}]; \\\n`;
        }
        overlayIndex++;
      });
    });
    
    const duckingAudio = project.tracks.find(t => t.type === 'audio')?.clips.find(c => c.audioDucking);
    if (duckingAudio) { script += `    [0:a][${overlayIndex}:a]amix=inputs=2:duration=longest:dropout_transition=2[aud]; \\\n`; }
    script += `  " \\\n  -map "[out${overlayIndex - 1 || 'bg'}]" ${duckingAudio ? '-map "[aud]"' : '-map 0:a?'} \\\n  output_sovereign.mkv`;
    setFfmpegScript(script); setShowExportModal(true);
  };

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
          const newClips = [...t.clips]; newClips.splice(cIndex, 1, clipA, clipB);
          return { ...t, clips: newClips };
        });
        return { ...prev, tracks: newTracks, selectedClipId: null };
      });
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
  
  const saveTransform = (clipId, trackId, updates) => {
    setProject(prev => {
      const newTracks = prev.tracks.map(t => {
        if (t.id !== trackId) return t;
        return { ...t, clips: t.clips.map(c => {
            if (c.id !== clipId) return c;
            const updatedClip = { ...c, ...updates };
            if (isPlaying) { updatedClip.transformKeyframes = [...(c.transformKeyframes || []), { time: timeRef.current, zoom: updatedClip.zoom, x: t.type === 'overlay' ? updatedClip.posX : updatedClip.panX, y: t.type === 'overlay' ? updatedClip.posY : updatedClip.panY, originX: updatedClip.originX, originY: updatedClip.originY, opacity: updatedClip.opacity }]; }
            return updatedClip;
          })
        };
      });
      return { ...prev, tracks: newTracks };
    });
  };

  const handleOpacityChange = (newOpacity) => { if (!selectedData) return; setLiveTransform(prev => ({ ...prev, opacity: newOpacity })); saveTransform(selectedData.clip.id, selectedData.trackId, { opacity: newOpacity }); };
  const getPinchDistance = (touches) => Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
  const getPinchCenter = (touches, rect) => ({ x: (((touches[0].clientX + touches[1].clientX) / 2 - rect.left) / rect.width) * 100, y: (((touches[0].clientY + touches[1].clientY) / 2 - rect.top) / rect.height) * 100 });

  const handleViewportTouchStart = (e) => {
    if (!selectedData || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (e.touches.length === 2 && selectedData.track.type === 'main_video') {
      const center = getPinchCenter(e.touches, rect);
      pinchRef.current = { active: true, startDist: getPinchDistance(e.touches), startZoom: selectedData.clip.zoom || 1, originX: center.x, originY: center.y, clipId: selectedData.clip.id, trackId: selectedData.trackId };
      setLiveTransform({ posX: selectedData.clip.posX || 50, posY: selectedData.clip.posY || 50, panX: selectedData.clip.panX || 0, panY: selectedData.clip.panY || 0, zoom: selectedData.clip.zoom || 1, originX: center.x, originY: center.y, opacity: selectedData.clip.opacity ?? 1 });
    } else if (e.touches.length === 1 && selectedData.track.type === 'main_video') {
      panRef.current = { active: true, startX: e.touches[0].clientX, startY: e.touches[0].clientY, startPanX: selectedData.clip.panX || 0, startPanY: selectedData.clip.panY || 0, clipId: selectedData.clip.id, trackId: selectedData.trackId };
      setLiveTransform({ posX: selectedData.clip.posX || 50, posY: selectedData.clip.posY || 50, panX: selectedData.clip.panX || 0, panY: selectedData.clip.panY || 0, zoom: selectedData.clip.zoom || 1, originX: selectedData.clip.originX || 50, originY: selectedData.clip.originY || 50, opacity: selectedData.clip.opacity ?? 1 });
    }
  };

  const handleOverlayTouchStart = (e, clipId, trackId, clipData) => {
    e.stopPropagation(); setProject(prev => ({ ...prev, selectedClipId: clipId }));
    setLiveTransform({ posX: clipData.posX || 50, posY: clipData.posY || 50, panX: clipData.panX || 0, panY: clipData.panY || 0, zoom: clipData.zoom || 1, originX: clipData.originX || 50, originY: clipData.originY || 50, opacity: clipData.opacity ?? 1 });
    if (e.touches.length >= 2) {
      const rect = containerRef.current.getBoundingClientRect(); const center = getPinchCenter(e.touches, rect);
      pinchRef.current = { active: true, startDist: getPinchDistance(e.touches), startZoom: clipData.zoom || 1, originX: center.x, originY: center.y, clipId, trackId };
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      dragOffset.current = { x: e.touches[0].clientX - (rect.left + rect.width / 2), y: e.touches[0].clientY - (rect.top + rect.height / 2) };
      activeDragClip.current = { clipId, trackId }; isDraggingOverlay.current = true;
    }
  };

  const handleViewportTouchMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (pinchRef.current.active && e.touches.length === 2) {
      const newZoom = Math.max(0.05, Math.min(15.0, pinchRef.current.startZoom * (getPinchDistance(e.touches) / pinchRef.current.startDist)));
      setLiveTransform(prev => ({ ...prev, zoom: newZoom })); saveTransform(pinchRef.current.clipId, pinchRef.current.trackId, { zoom: newZoom, originX: pinchRef.current.originX, originY: pinchRef.current.originY });
    } else if (panRef.current.active && e.touches.length === 1) {
      const newPanX = panRef.current.startPanX + (e.touches[0].clientX - panRef.current.startX); const newPanY = panRef.current.startPanY + (e.touches[0].clientY - panRef.current.startY);
      setLiveTransform(prev => ({ ...prev, panX: newPanX, panY: newPanY })); saveTransform(panRef.current.clipId, panRef.current.trackId, { panX: newPanX, panY: newPanY });
    } else if (isDraggingOverlay.current && activeDragClip.current && e.touches.length === 1) {
      const newX = Math.max(0, Math.min(100, (((e.touches[0].clientX - dragOffset.current.x) - rect.left) / rect.width) * 100));
      const newY = Math.max(0, Math.min(100, (((e.touches[0].clientY - dragOffset.current.y) - rect.top) / rect.height) * 100));
      setLiveTransform(prev => ({ ...prev, posX: newX, posY: newY })); saveTransform(activeDragClip.current.clipId, activeDragClip.current.trackId, { posX: newX, posY: newY });
    }
  };

  const handleViewportTouchEnd = () => { 
    pinchRef.current.active = false; panRef.current.active = false; isDraggingOverlay.current = false; activeDragClip.current = null; 
    if (appSettings.autoPause && isPlaying) setIsPlaying(false);
  };

  const startInteraction = (e, type, payload) => { e.stopPropagation(); interaction.current = { type, startX: e.touches[0].clientX, ...payload }; if (type === 'trim' || type === 'move') { setProject(prev => ({ ...prev, selectedClipId: payload.clipId })); setLiveTransform({ posX: payload.clipData.posX || 50, posY: payload.clipData.posY || 50, panX: payload.clipData.panX || 0, panY: payload.clipData.panY || 0, zoom: payload.clipData.zoom || 1, originX: payload.clipData.originX || 50, originY: payload.clipData.originY || 50, opacity: payload.clipData.opacity ?? 1 }); } };
  
  const handleTimelineTouchMove = (e) => {
    const { type, edge, startX, initialStart, initialDuration, trackId, clipId } = interaction.current;
    if (!type) return;
    const deltaSeconds = (e.touches[0].clientX - startX) / project.zoomLevel;
    if (type === 'scrub') { setCurrentTime(Math.max(0, initialStart + deltaSeconds)); timeRef.current = Math.max(0, initialStart + deltaSeconds); return; }
    setProject(prev => {
      const newTracks = prev.tracks.map(track => {
        if (track.id !== trackId) return track;
        return { ...track, clips: track.clips.map(c => {
            if (c.id !== clipId) return c;
            let newStart = c.timelineStartTime; let newDuration = c.duration;
            if (type === 'move') newStart = Math.max(0, initialStart + deltaSeconds);
            else if (type === 'trim') {
              if (edge === 'left') { newStart = Math.max(0, initialStart + deltaSeconds); newDuration = Math.max(0.5, initialDuration - (newStart - initialStart)); } 
              else if (edge === 'right') newDuration = Math.max(0.5, initialDuration + deltaSeconds);
            }
            return { ...c, timelineStartTime: newStart, duration: newDuration };
          })
        };
      });
      return { ...prev, tracks: newTracks };
    });
  };
  const handleTimelineTouchEnd = () => { interaction.current.type = null; };

  const mainTracks = project.tracks.filter(t => t.type === 'main_video'); const overlayTracks = project.tracks.filter(t => t.type === 'overlay');
  const activeAudioClips = project.tracks.find(t => t.type === 'audio')?.clips.filter(c => currentTime >= c.timelineStartTime && currentTime <= c.timelineStartTime + c.duration) || [];
  const isActivelyTouched = (clipId) => (pinchRef.current.active && pinchRef.current.clipId === clipId) || (panRef.current.active && panRef.current.clipId === clipId) || (isDraggingOverlay.current && activeDragClip.current?.clipId === clipId);
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', backgroundColor: '#0A0A0A', color: '#ECECEC', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', overflow: 'hidden' }}>
      
      {showExportModal && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#141414', border: '1px solid #333', borderRadius: '12px', padding: '20px', width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', color: '#4CAF50' }}>Sovereign FFmpeg Compiler</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="checkbox" id="steg" checked={embedPayload} onChange={(e) => setEmbedPayload(e.target.checked)} />
              <label htmlFor="steg" style={{ fontSize: '12px', color: '#E91E63', fontWeight: 'bold' }}>Embed Ghost Payload</label>
            </div>
            {embedPayload && <input type="file" ref={steganographyFileRef} style={{ fontSize: '12px', color: '#FFF' }} />}
            <textarea readOnly value={ffmpegScript} style={{ width: '100%', height: '200px', backgroundColor: '#000', color: '#00BCD4', border: '1px solid #333', borderRadius: '8px', padding: '10px', fontFamily: 'monospace', fontSize: '10px' }} />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowExportModal(false)} style={{ backgroundColor: 'transparent', color: '#FFF', border: 'none', padding: '10px', cursor: 'pointer' }}>Close</button>
              <button onClick={compileFFmpegScript} style={{ backgroundColor: '#4CAF50', color: '#000', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold', cursor: 'pointer' }}>Update Logic</button>
            </div>
          </div>
        </div>
      )}

      {showSettingsModal && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#141414', border: '1px solid #333', borderRadius: '12px', padding: '20px', width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', color: '#FFF' }}>Workspace Settings</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#CCC' }}>Rule of Thirds Grid</span>
                <input type="checkbox" checked={appSettings.showGrid} onChange={(e) => setAppSettings(p => ({...p, showGrid: e.target.checked}))} style={{ transform: 'scale(1.5)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#CCC' }}>Auto-Pause on Touch Release</span>
                <input type="checkbox" checked={appSettings.autoPause} onChange={(e) => setAppSettings(p => ({...p, autoPause: e.target.checked}))} style={{ transform: 'scale(1.5)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#CCC' }}>Export Target Resolution</span>
                <select value={appSettings.exportRes} onChange={(e) => setAppSettings(p => ({...p, exportRes: e.target.value}))} style={{ backgroundColor: '#333', color: '#FFF', border: 'none', padding: '8px', borderRadius: '4px' }}>
                  <option value="1080p">1080p (FHD)</option>
                  <option value="4K">4K (UHD)</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowSettingsModal(false)} style={{ backgroundColor: '#4CAF50', color: '#000', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold', cursor: 'pointer' }}>Save Settings</button>
            </div>
          </div>
        </div>
      )}

      {showStickerModal && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#141414', borderTop: '1px solid #333', borderRadius: '20px 20px 0 0', padding: '20px', width: '100%', height: '60%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#FF9800' }}>Sticker Vault</h2>
              <button onClick={() => setShowStickerModal(false)} style={{ background: 'none', color: '#FFF', border: 'none', fontSize: '14px', fontWeight: 'bold' }}>Close</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', overflowY: 'auto', flex: 1 }}>
              {stickerVault.length === 0 ? <p style={{ color: '#888', fontSize: '12px' }}>Your vault is empty. Cut out an object and tap "Save Sticker" to add it here.</p> : 
                stickerVault.map((s, i) => (
                  <div key={i} onClick={() => handleDropSticker(s)} style={{ width: '80px', height: '80px', backgroundColor: '#222', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer', border: '1px solid #444' }}>
                     {s.type === 'text' ? <span style={{ fontSize: '30px' }}>{s.text}</span> : <span style={{ fontSize: '10px', color: '#AAA', textAlign: 'center', wordBreak: 'break-all' }}>{s.name}</span>}
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}

      <style>{` .hide-scroll::-webkit-scrollbar { display: none; } .pro-slider { -webkit-appearance: none; width: 100%; height: 4px; background: #333; border-radius: 2px; outline: none; } .pro-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; background: #FFF; border-radius: 50%; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.5); } video { object-fit: contain; background-color: #000; } @keyframes spin { 100% { transform: rotate(360deg); } } `}</style>

      <input type="file" accept=".json" ref={loadProjectRef} onChange={handleLoadProject} style={{ display: 'none' }} />
      <input type="file" accept="*/*" ref={mainMediaRef} onChange={(e) => handleAddMedia(e, 'main_video')} style={{ display: 'none' }} />
      <input type="file" accept="*/*" ref={pipMediaRef} onChange={(e) => handleAddMedia(e, 'overlay')} style={{ display: 'none' }} />
      <input type="file" accept="audio/*" ref={audioMediaRef} onChange={(e) => handleAddMedia(e, 'audio')} style={{ display: 'none' }} />

      <div 
        ref={containerRef} onTouchStart={handleViewportTouchStart} onTouchMove={handleViewportTouchMove} onTouchEnd={handleViewportTouchEnd} onClick={() => setProject(p => ({ ...p, selectedClipId: null }))}
        style={{ flex: '0 0 38%', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', touchAction: 'none' }}
      >
        {appSettings.showGrid && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 90, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr 1fr' }}>
            <div style={{ borderRight: '1px solid rgba(255,255,255,0.3)', borderBottom: '1px solid rgba(255,255,255,0.3)' }} /><div style={{ borderRight: '1px solid rgba(255,255,255,0.3)', borderBottom: '1px solid rgba(255,255,255,0.3)' }} /><div style={{ borderBottom: '1px solid rgba(255,255,255,0.3)' }} />
            <div style={{ borderRight: '1px solid rgba(255,255,255,0.3)', borderBottom: '1px solid rgba(255,255,255,0.3)' }} /><div style={{ borderRight: '1px solid rgba(255,255,255,0.3)', borderBottom: '1px solid rgba(255,255,255,0.3)' }} /><div style={{ borderBottom: '1px solid rgba(255,255,255,0.3)' }} />
            <div style={{ borderRight: '1px solid rgba(255,255,255,0.3)' }} /><div style={{ borderRight: '1px solid rgba(255,255,255,0.3)' }} /><div />
          </div>
        )}
        {isRecording && <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 100, color: 'red', fontWeight: 'bold', fontSize: '12px', animation: 'blink 1s infinite' }}>● RECORDING</div>}

        {mainTracks.map((track, trackIndex) => {
          const activeClips = track.clips.filter(c => currentTime >= c.timelineStartTime && currentTime <= c.timelineStartTime + c.duration);
          return activeClips.map(clip => {
            let renderZoom = clip.zoom || 1.0; let renderPanX = clip.panX || 0; let renderPanY = clip.panY || 0; let originX = clip.originX || 50; let originY = clip.originY || 50; let renderOpacity = clip.opacity ?? 1.0;
            if (clip.transformKeyframes?.length > 0 && !isActivelyTouched(clip.id)) {
              const pastKf = clip.transformKeyframes.filter(kf => kf.time <= currentTime);
              if (pastKf.length > 0) { renderZoom = pastKf[pastKf.length - 1].zoom; renderPanX = pastKf[pastKf.length - 1].x; renderPanY = pastKf[pastKf.length - 1].y; originX = pastKf[pastKf.length - 1].originX || 50; originY = pastKf[pastKf.length - 1].originY || 50; renderOpacity = pastKf[pastKf.length - 1].opacity ?? renderOpacity; }
            } else if (isActivelyTouched(clip.id)) { renderZoom = liveTransform.zoom; renderPanX = liveTransform.panX; renderPanY = liveTransform.panY; originX = liveTransform.originX; originY = liveTransform.originY; renderOpacity = liveTransform.opacity; }

            return (
              <div key={clip.id} onClick={(e) => { e.stopPropagation(); setProject(p => ({ ...p, selectedClipId: clip.id })); setLiveTransform({ posX: clip.posX || 50, posY: clip.posY || 50, panX: clip.panX || 0, panY: clip.panY || 0, zoom: clip.zoom || 1, originX: clip.originX || 50, originY: clip.originY || 50, opacity: clip.opacity ?? 1 }); }} 
                   style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 1 + trackIndex, transformOrigin: `${originX}% ${originY}%`, transform: `translate(${renderPanX}px, ${renderPanY}px) scale(${renderZoom})`, opacity: renderOpacity }}>
                {clip.type === 'image' ? <img src={clip.url} style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} alt="main" /> : <video className="compositor-media" autoPlay={isPlaying} preload="auto" src={clip.url} style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} playsInline muted={clip.muted || track.muted} onLoadedData={(e) => { e.target.currentTime = 0.001; }} />}
              </div>
            );
          });
        })}

        {overlayTracks.map((track, trackIndex) => {
          const activeClips = track.clips.filter(c => currentTime >= c.timelineStartTime && currentTime <= c.timelineStartTime + c.duration);
          return activeClips.map(clip => {
            let posX = clip.posX ?? 50; let posY = clip.posY ?? 50; let renderZoom = clip.zoom || 1.0; let originX = clip.originX || 50; let originY = clip.originY || 50; let renderOpacity = clip.opacity ?? 1.0;
            if (clip.transformKeyframes?.length > 0 && !isActivelyTouched(clip.id)) {
              const pastKf = clip.transformKeyframes.filter(kf => kf.time <= currentTime);
              if (pastKf.length > 0) { posX = pastKf[pastKf.length - 1].x; posY = pastKf[pastKf.length - 1].y; renderZoom = pastKf[pastKf.length - 1].zoom; originX = pastKf[pastKf.length - 1].originX || 50; originY = pastKf[pastKf.length - 1].originY || 50; renderOpacity = pastKf[pastKf.length - 1].opacity ?? renderOpacity; }
            } else if (isActivelyTouched(clip.id)) { posX = liveTransform.posX; posY = liveTransform.posY; renderZoom = liveTransform.zoom; originX = liveTransform.originX; originY = liveTransform.originY; renderOpacity = liveTransform.opacity; }

            return (
              <div key={clip.id} onTouchStart={(e) => handleOverlayTouchStart(e, clip.id, track.id, clip)} onClick={(e) => { e.stopPropagation(); setProject(p => ({ ...p, selectedClipId: clip.id })); setLiveTransform({ posX: clip.posX || 50, posY: clip.posY || 50, panX: clip.panX || 0, panY: clip.panY || 0, zoom: clip.zoom || 1, originX: clip.originX || 50, originY: clip.originY || 50, opacity: clip.opacity ?? 1 }); }}
                style={{ position: 'absolute', top: `${posY}%`, left: `${posX}%`, transformOrigin: `${originX}% ${originY}%`, transform: `translate(-50%, -50%) scale(${renderZoom})`, width: clip.type === 'text' ? 'auto' : '35%', height: clip.type === 'text' ? 'auto' : '35%', zIndex: 50 + trackIndex, border: project.selectedClipId === clip.id ? '2px solid #FFF' : (clip.type === 'text' ? 'none' : '1px dashed rgba(255,255,255,0.4)'), borderRadius: '8px', overflow: clip.type === 'text' ? 'visible' : 'hidden', boxShadow: clip.type === 'text' ? 'none' : '0 10px 30px rgba(0,0,0,0.5)', cursor: 'pointer', opacity: renderOpacity }}
              >
                {clip.type === 'text' ? <div style={{ fontSize: '40px', padding: '5px', pointerEvents: 'none', whiteSpace: 'nowrap', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>{clip.text}</div> : clip.type === 'image' ? <img src={clip.url} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} alt="pip" /> : <video className="compositor-media" autoPlay={isPlaying} preload="auto" src={clip.url} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} playsInline muted={clip.muted || track.muted} onLoadedData={(e) => { e.target.currentTime = 0.001; }} />}
              </div>
            );
          });
        })}
        {activeAudioClips.map(clip => <audio key={clip.id} className="compositor-media" autoPlay={isPlaying} src={clip.url} muted={clip.muted || project.tracks.find(t=>t.type==='audio').muted} />)}
      </div>

      <div style={{ height: '45px', flexShrink: 0, backgroundColor: '#141414', display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between', borderBottom: '1px solid #222' }}>
         <span style={{ fontSize: '13px', color: '#AAA', fontWeight: '500', fontVariantNumeric: 'tabular-nums' }}>{currentTime.toFixed(1)}s</span>
         <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
           <button onClick={handleRewind} style={{ background: 'none', color: '#FFF', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Icons.Rewind /></button>
           <button onClick={togglePlayback} style={{ background: 'none', color: '#FFF', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>{isPlaying ? <Icons.Pause /> : <Icons.Play />}</button>
         </div>
         <div style={{ display: 'flex', gap: '8px' }}>
           <button onClick={() => setShowSettingsModal(true)} style={{ backgroundColor: '#333', color: '#FFF', border: 'none', borderRadius: '20px', padding: '6px 14px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}><Icons.Settings /></button>
           <button onClick={() => loadProjectRef.current.click()} style={{ backgroundColor: '#333', color: '#FFF', border: 'none', borderRadius: '20px', padding: '6px 14px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}><Icons.Load /></button>
           <button onClick={handleSaveProject} style={{ backgroundColor: '#333', color: '#FFF', border: 'none', borderRadius: '20px', padding: '6px 14px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}><Icons.Save /></button>
           <button onClick={compileFFmpegScript} style={{ backgroundColor: '#FFF', color: '#000', border: 'none', borderRadius: '20px', padding: '6px 14px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}><Icons.Export /> Export</button>
         </div>
      </div>

      <div onTouchMove={handleTimelineTouchMove} onTouchEnd={handleTimelineTouchEnd} className="hide-scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', backgroundColor: '#0A0A0A', position: 'relative', paddingBottom: '20px' }}>
        <div style={{ position: 'relative', minWidth: `${project.duration * project.zoomLevel + 100}px`, paddingTop: '30px', minHeight: '100%' }} onClick={() => setProject(p => ({ ...p, selectedClipId: null }))}>
          <div style={{ position: 'absolute', top: 0, left: '70px', right: 0, height: '20px', borderBottom: '1px solid #333', display: 'flex', pointerEvents: 'none' }}>
            {Array.from({ length: Math.ceil(project.duration) }).map((_, i) => (<div key={i} style={{ position: 'absolute', left: `${i * project.zoomLevel}px`, height: '100%', borderLeft: '1px solid #333', paddingLeft: '4px', fontSize: '9px', color: '#666' }}>{i}s</div>))}
          </div>
          <div onTouchStart={(e) => startInteraction(e, 'scrub', { initialStart: currentTime })} style={{ position: 'absolute', left: `${currentTime * project.zoomLevel + 70}px`, top: '10px', bottom: 0, width: '2px', backgroundColor: '#FFF', zIndex: 50 }}>
            <div style={{ position: 'absolute', top: 0, left: '-5px', width: '12px', height: '16px', backgroundColor: '#FFF', borderRadius: '2px 2px 6px 6px', boxShadow: '0 2px 5px rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center' }}><div style={{ width: '2px', height: '8px', backgroundColor: '#000', marginTop: '2px', borderRadius: '1px' }} /></div>
          </div>
          {project.tracks.map(track => (
            <div key={track.id} style={{ display: 'flex', marginBottom: '4px', height: '60px', position: 'relative', backgroundColor: 'transparent' }}>
              <div style={{ position: 'sticky', left: 0, width: '70px', backgroundColor: '#141414', borderRight: '1px solid #222', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                <span style={{ fontSize: '10px', color: '#AAA', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', width: '100%', textAlign: 'center', marginBottom: '4px' }}>{track.name}</span>
                <button onClick={() => toggleTrackMute(track.id)} style={{ background: 'transparent', color: track.muted ? '#E91E63' : '#666', border: 'none', padding: '4px' }}>{track.muted ? <Icons.Mute /> : <Icons.Unmute />}</button>
              </div>
              <div style={{ position: 'relative', flex: 1, backgroundColor: '#111', borderRadius: '4px', overflow: 'hidden', margin: '0 5px' }}>
                {track.clips.map(clip => (
                  <div key={clip.id} onClick={(e) => { e.stopPropagation(); setProject(p => ({ ...p, selectedClipId: clip.id })); setLiveTransform({ posX: clip.posX || 50, posY: clip.posY || 50, panX: clip.panX || 0, panY: clip.panY || 0, zoom: clip.zoom || 1, originX: clip.originX || 50, originY: clip.originY || 50, opacity: clip.opacity ?? 1 }); }} onTouchStart={(e) => startInteraction(e, 'move', { clipId: clip.id, trackId: track.id, initialStart: clip.timelineStartTime, clipData: clip })}
                    style={{ position: 'absolute', left: `${clip.timelineStartTime * project.zoomLevel}px`, width: `${clip.duration * project.zoomLevel}px`, height: '100%', borderRadius: '6px', background: `linear-gradient(180deg, ${clip.color}DD 0%, ${clip.color} 100%)`, border: selectedData?.clip?.id === clip.id ? '2px solid #FFF' : '1px solid rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '600', color: '#FFF', opacity: track.muted ? 0.4 : 1, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)' }}>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', padding: '0 10px', pointerEvents: 'none' }}>{clip.name}</span>
                    {selectedData?.clip?.id === clip.id && (
                      <>
                        <div onTouchStart={(e) => startInteraction(e, 'trim', { clipId: clip.id, trackId: track.id, edge: 'left', initialStart: clip.timelineStartTime, initialDuration: clip.duration, clipData: clip })} style={{ position: 'absolute', left: '-2px', top: 0, bottom: 0, width: '24px', backgroundColor: '#FFF', borderRadius: '6px 0 0 6px', zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '2px 0 5px rgba(0,0,0,0.3)' }}><div style={{ width: '4px', height: '20px', borderLeft: '1px solid #CCC', borderRight: '1px solid #CCC' }} /></div>
                        <div onTouchStart={(e) => startInteraction(e, 'trim', { clipId: clip.id, trackId: track.id, edge: 'right', initialStart: clip.timelineStartTime, initialDuration: clip.duration, clipData: clip })} style={{ position: 'absolute', right: '-2px', top: 0, bottom: 0, width: '24px', backgroundColor: '#FFF', borderRadius: '0 6px 6px 0', zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '-2px 0 5px rgba(0,0,0,0.3)' }}><div style={{ width: '4px', height: '20px', borderLeft: '1px solid #CCC', borderRight: '1px solid #CCC' }} /></div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="hide-scroll" style={{ height: '80px', flexShrink: 0, backgroundColor: '#141414', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', overflowX: 'auto', padding: '0 15px', width: '100%', gap: '15px' }}>
        {!selectedData ? (
          <>
            <button onClick={() => mainMediaRef.current.click()} style={toolIconBtn}><Icons.AddVideo /> <span style={toolLabel}>Primary</span></button>
            <div style={{ height: '30px', borderLeft: '1px solid #333' }} />
            <button onClick={() => pipMediaRef.current.click()} style={{ ...toolIconBtn, color: '#FF9800' }}><Icons.AddVideo /> <span style={{...toolLabel, color: '#FF9800'}}>Overlay</span></button>
            <button onClick={handleAddText} style={{ ...toolIconBtn, color: '#E91E63' }}><Icons.Text /> <span style={{...toolLabel, color: '#E91E63'}}>Text</span></button>
            <button onClick={() => setShowStickerModal(true)} style={{ ...toolIconBtn, color: '#FFC107' }}><Icons.Sticker /> <span style={{...toolLabel, color: '#FFC107'}}>Stickers</span></button>
            <button onClick={handleAutoCaptions} style={{ ...toolIconBtn, color: '#9C27B0' }}><Icons.Wand /> <span style={{...toolLabel, color: '#9C27B0'}}>Captions</span></button>
            <div style={{ height: '30px', borderLeft: '1px solid #333' }} />
            {isRecording ? (
              <button onClick={stopRecording} style={{ ...toolIconBtn, color: '#f44336' }}><Icons.Stop /> <span style={{...toolLabel, color: '#f44336', animation: 'blink 1s infinite'}}>Recording...</span></button>
            ) : (
              <button onClick={startRecording} style={{ ...toolIconBtn, color: '#4CAF50' }}><Icons.Mic /> <span style={{...toolLabel, color: '#4CAF50'}}>Voiceover</span></button>
            )}
            <button onClick={() => audioMediaRef.current.click()} style={toolIconBtn}><Icons.AddAudio /> <span style={toolLabel}>Audio</span></button>
          </>
        ) : (
          <>
            <button onClick={() => setProject(prev => ({...prev, selectedClipId: null}))} style={{...toolIconBtn, color: '#4CAF50'}}><Icons.Done /> <span style={{...toolLabel, color: '#4CAF50'}}>Done</span></button>
            <div style={{ height: '30px', borderLeft: '1px solid #333' }} />
            <button onClick={handleSplitClip} style={toolIconBtn}><Icons.Split /> <span style={toolLabel}>Split</span></button>
            
            {selectedData.track.type === 'overlay' && selectedData.clip.type !== 'text' && (
              <>
                <button onClick={executeWasmCutout} disabled={isProcessingAI} style={{ ...toolIconBtn, color: selectedData.clip.magicCutout ? '#FF9800' : '#ECECEC' }}>
                  {isProcessingAI ? <div style={{width: 16, height: 16, border: '2px solid #FF9800', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite'}} /> : <Icons.Cutout />}
                  <span style={{...toolLabel, color: selectedData.clip.magicCutout ? '#FF9800' : '#AAA'}}>{isProcessingAI ? 'Masking...' : 'Cutout'}</span>
                </button>
                
                <button onClick={handleSaveSticker} style={{ ...toolIconBtn, color: '#FFC107' }}><Icons.Sticker /> <span style={{...toolLabel, color: '#FFC107'}}>Save</span></button>
              </>
            )}
            {selectedData.track.type === 'audio' && (
              <button onClick={() => updateSelectedClip('audioDucking', !selectedData.clip.audioDucking)} style={{ ...toolIconBtn, color: selectedData.clip.audioDucking ? '#4CAF50' : '#ECECEC' }}><Icons.Mic /> <span style={{...toolLabel, color: selectedData.clip.audioDucking ? '#4CAF50' : '#AAA'}}>Ducking</span></button>
            )}

            <div style={{ height: '30px', borderLeft: '1px solid #333' }} />
            {selectedData.track.type !== 'audio' && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '80px', marginLeft: '10px' }}>
                  <span style={{ fontSize: '10px', color: '#00BCD4', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>Fade <span>{Math.round((selectedData.clip.opacity ?? 1) * 100)}%</span></span>
                  <input type="range" className="pro-slider" min="0" max="1" step="0.05" value={selectedData.clip.opacity ?? 1} onChange={(e) => handleOpacityChange(parseFloat(e.target.value))} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '80px', marginLeft: '10px', paddingLeft: '10px', borderLeft: '1px solid #333' }}>
                  <span style={{ fontSize: '10px', color: '#FF9800', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>Scale <span>{Math.round((selectedData.clip.zoom || 1) * 100)}%</span></span>
                  <input type="range" className="pro-slider" min="0.05" max="5" step="0.05" value={selectedData.clip.zoom || 1} onChange={(e) => {
                    const val = parseFloat(e.target.value); setLiveTransform(prev => ({ ...prev, zoom: val })); saveTransform(selectedData.clip.id, selectedData.trackId, { zoom: val, originX: selectedData.clip.originX || 50, originY: selectedData.clip.originY || 50 });
                  }} />
                </div>
              </>
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
