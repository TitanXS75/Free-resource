import React, { useRef, useState } from 'react';
import { useFaceRecognition } from './useFaceRecognition';

export const FaceRegistrationModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [name, setName] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const { isLoaded, startCamera, registerFace } = useFaceRecognition({ modelsPath: '/models' });

  const handleStart = () => {
    if (videoRef.current) {
      startCamera(videoRef.current);
    }
  };

  const handleCapture = async () => {
    if (!name.trim()) {
      setStatus('Please enter user name.');
      return;
    }
    setStatus('Capturing face vectors...');
    const success = await registerFace(name.trim());
    if (success) {
      setStatus(`Success! Face registered for ${name}.`);
      setTimeout(onClose, 1500);
    } else {
      setStatus('Failed: No clear face detected. Look directly at camera.');
    }
  };

  return (
    <div style={{ background: '#1e293b', color: '#fff', padding: 24, borderRadius: 12, maxWidth: 500 }}>
      <h3>Face Registration</h3>
      <p style={{ fontSize: 13, color: '#94a3b8' }}>
        {isLoaded ? 'Neural nets ready. Start camera to capture.' : 'Loading AI models...'}
      </p>

      <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', background: '#000', margin: '16px 0', borderRadius: 8, overflow: 'hidden' }}>
        <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={handleStart} style={{ padding: '8px 16px', background: '#334155', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          Start Camera
        </button>
        <input
          type="text"
          placeholder="User ID / Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ flex: 1, padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: 6 }}
        />
      </div>

      <button
        onClick={handleCapture}
        style={{ width: '100%', padding: '12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}
      >
        📸 Register Face
      </button>

      {status && <p style={{ marginTop: 12, fontSize: 13, textAlign: 'center' }}>{status}</p>}
    </div>
  );
};
