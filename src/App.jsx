import React from 'react';
import Editor from './Editor';

export default function App() {
  return (
    <div style={{ backgroundColor: '#121212', color: 'white', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif' }}>
      <header style={{ padding: '15px 20px', borderBottom: '1px solid #333', backgroundColor: '#1a1a1a' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Sovereign Video Editor</h1>
      </header>
      
      <main style={{ flex: 1, padding: '20px' }}>
        <Editor />
      </main>

      <footer style={{ padding: '15px', textAlign: 'center', fontSize: '0.8rem', color: '#666', borderTop: '1px solid #333' }}>
        Copyright &copy; 2026 all rights reserved.
      </footer>
    </div>
  );
}
