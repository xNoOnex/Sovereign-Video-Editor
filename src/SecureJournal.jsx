import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Trash2, Mic, Lock, ShieldCheck } from 'lucide-react';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { App as CapApp } from '@capacitor/app';

export default function SecureJournal({ goHome }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [entryText, setEntryText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [mood, setMood] = useState('😊');
  const [bgColor, setBgColor] = useState('#222222');
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  
  const originalTextRef = useRef('');

  const CORRECT_PIN = '1995'; // Secure default PIN

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setDateStr(now.toLocaleDateString());
      setTimeStr(now.toLocaleTimeString());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Native hardware back button support
  useEffect(() => {
    const listener = CapApp.addListener('backButton', () => {
      if (goHome) goHome();
    });
    return () => { listener.remove(); };
  }, [goHome]);

  const handlePinTap = (num) => {
    const updated = passcode + num;
    if (updated.length <= 4) {
      setPasscode(updated);
      if (updated.length === 4) {
        if (updated === CORRECT_PIN) {
          setIsUnlocked(true);
        } else {
          alert("Incorrect Passcode. Try '1995'");
          setPasscode('');
        }
      }
    }
  };

  const toggleDictation = async () => {
    if (isListening) {
      await SpeechRecognition.stop();
      setIsListening(false);
      return;
    }

    try {
      const { speechRecognition } = await SpeechRecognition.requestPermissions();
      if (speechRecognition !== 'granted') {
        alert("Microphone permission is required.");
        return;
      }

      originalTextRef.current = entryText;
      setIsListening(true);
      
      SpeechRecognition.removeAllListeners();
      SpeechRecognition.addListener("partialResults", (data) => {
        if (data.matches && data.matches.length > 0) {
          setEntryText((originalTextRef.current + ' ' + data.matches[0]).trim());
        }
      });

      await SpeechRecognition.start({
        language: "en-US",
        partialResults: true,
        popup: false
      });
    } catch (e) {
      console.error("Dictation error:", e);
      setIsListening(false);
    }
  };

  // --- 1. THE SECURE LOCK SCREEN ---
  if (!isUnlocked) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', alignItems: 'center', paddingBottom: '24px' }}>
        <button onClick={goHome} style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#333', padding: '12px 20px', borderRadius: '16px', color: '#FFF', fontSize: '20px', fontWeight: 'bold', border: 'none' }}>
          <ArrowLeft size={24} /> Back
        </button>

        <div style={{ backgroundColor: 'var(--surface)', border: '3px solid var(--accent)', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '360px', textAlign: 'center' }}>
          <Lock size={64} color="var(--accent)" style={{ marginBottom: '16px' }} />
          <h2 style={{ color: '#FFF', fontSize: '28px', marginBottom: '8px' }}>Private Journal</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '18px', marginBottom: '24px' }}>Enter 4-digit PIN (Default: 1995)</p>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '32px' }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: i < passcode.length ? 'var(--accent)' : '#444', border: '2px solid #666' }} />
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button key={num} onClick={() => handlePinTap(num.toString())} style={{ height: '70px', fontSize: '32px', backgroundColor: '#333', color: '#FFF', borderRadius: '16px', border: 'none' }}>
                {num}
              </button>
            ))}
            <button onClick={() => setPasscode('')} style={{ height: '70px', fontSize: '18px', backgroundColor: 'var(--error)', color: '#000', borderRadius: '16px', border: 'none', fontWeight: 'bold' }}>
              Clear
            </button>
            <button onClick={() => handlePinTap('0')} style={{ height: '70px', fontSize: '32px', backgroundColor: '#333', color: '#FFF', borderRadius: '16px', border: 'none' }}>
              0
            </button>
            <button onClick={() => { if (passcode === CORRECT_PIN) setIsUnlocked(true); }} style={{ height: '70px', backgroundColor: 'var(--accent)', color: '#000', borderRadius: '16px', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <ShieldCheck size={32} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- 2. THE OPEN JOURNAL ENTRY ---
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: '24px', paddingTop: '12px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={goHome} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#333', padding: '14px 20px', borderRadius: '16px', color: '#FFF', fontSize: '22px', fontWeight: 'bold', border: 'none' }}>
          <ArrowLeft size={24} /> Back
        </button>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: 'var(--accent)', fontSize: '18px', fontWeight: 'bold' }}>{dateStr}</div>
          <div style={{ color: '#AAA', fontSize: '14px' }}>{timeStr}</div>
        </div>
      </div>

      <div style={{ border: '2px dashed var(--accent)', borderRadius: '16px', padding: '16px', textAlign: 'center', marginBottom: '20px' }}>
        <p style={{ color: 'var(--accent)', fontSize: '20px', fontStyle: 'italic', margin: 0 }}>"Your words matter. Take your time."</p>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
        {['😊', '😌', '😢', '😠', '💖'].map(m => (
          <button key={m} onClick={() => setMood(m)} style={{ flex: 1, height: '60px', fontSize: '32px', backgroundColor: mood === m ? 'var(--accent)' : '#222', borderRadius: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', border: 'none' }}>
            {m}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {['#222222', '#3B2F2F', '#1B3B2B', '#1B2A4A', '#3B1B38'].map(c => (
          <button key={c} onClick={() => setBgColor(c)} style={{ flex: 1, height: '50px', backgroundColor: c, borderRadius: '14px', border: bgColor === c ? '3px solid var(--accent)' : '2px solid #444' }} />
        ))}
      </div>

      <textarea 
        value={entryText}
        onChange={(e) => setEntryText(e.target.value)}
        placeholder="Tap to type, or hit Dictate to speak your mind..."
        style={{ flexGrow: 1, width: '100%', minHeight: '180px', backgroundColor: bgColor, color: '#FFF', fontSize: '24px', padding: '20px', borderRadius: '20px', border: '2px solid #555', resize: 'none', marginBottom: '20px', transition: 'background-color 0.3s' }}
      />

      <div style={{ display: 'flex', gap: '12px' }}>
        <button onClick={toggleDictation} style={{ flex: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', backgroundColor: isListening ? 'var(--accent)' : '#333', border: '2px solid var(--accent)', borderRadius: '16px', padding: '20px', color: isListening ? '#000' : '#FFF', fontSize: '24px', fontWeight: 'bold' }}>
          <Mic size={28} color={isListening ? '#000' : 'var(--accent)'} />
          {isListening ? 'Listening...' : 'Tap to Dictate'}
        </button>
        <button onClick={() => setEntryText('')} style={{ flex: 1, backgroundColor: 'transparent', border: '2px solid var(--error)', borderRadius: '16px', color: 'var(--error)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Trash2 size={28} />
        </button>
      </div>

    </div>
  );
}
