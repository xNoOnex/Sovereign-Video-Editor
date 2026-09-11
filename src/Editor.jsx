import React, { useState } from 'react';

export default function Editor() {
  const [timeline, setTimeline] = useState({
    videoTracks: [],
    audioTracks: []
  });

  const addMockClip = () => {
    setTimeline(prev => ({
      ...prev,
      videoTracks: [
        ...prev.videoTracks, 
        { id: Date.now(), fileName: 'commission_clip_01.mp4', trimStart: 0, trimEnd: 15, isMuted: false }
      ]
    }));
  };

  const toggleMute = (clipId) => {
    setTimeline(prev => ({
      ...prev,
      videoTracks: prev.videoTracks.map(clip => 
        clip.id === clipId ? { ...clip, isMuted: !clip.isMuted } : clip
      )
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
      <div style={{ height: '30vh', backgroundColor: '#000', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #333' }}>
        <p style={{ color: '#888' }}>[ Video Player Preview Area ]</p>
      </div>

      <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Timeline</h2>
          <button 
            onClick={addMockClip}
            style={{ padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}
          >
            + Add Clip
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {timeline.videoTracks.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic' }}>Timeline is empty. Add a clip to start editing.</p>
          ) : (
            timeline.videoTracks.map(clip => (
              <div key={clip.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: '#2d2d2d', borderRadius: '6px' }}>
                <div>
                  <strong>{clip.fileName}</strong>
                  <div style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '4px' }}>Length: {clip.trimEnd - clip.trimStart}s</div>
                </div>
                <button 
                  onClick={() => toggleMute(clip.id)}
                  style={{ padding: '6px 12px', backgroundColor: clip.isMuted ? '#f44336' : '#2196F3', color: 'white', border: 'none', borderRadius: '4px' }}
                >
                  {clip.isMuted ? 'Unmute' : 'Mute'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
