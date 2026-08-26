import { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';

export interface UseFaceRecognitionProps {
  modelsPath?: string;
  onMatch?: (label: string, confidence: number) => void;
}

export function useFaceRecognition({
  modelsPath = '/models',
  onMatch,
}: UseFaceRecognitionProps = {}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [registeredFaces, setRegisteredFaces] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const matcherRef = useRef<faceapi.FaceMatcher | null>(null);
  const labeledDescriptorsRef = useRef<faceapi.LabeledFaceDescriptors[]>([]);

  // 1. Load Models on Mount
  useEffect(() => {
    async function load() {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(modelsPath),
        faceapi.nets.faceLandmark68Net.loadFromUri(modelsPath),
        faceapi.nets.faceRecognitionNet.loadFromUri(modelsPath),
      ]);
      setIsLoaded(true);
    }
    load().catch(console.error);
  }, [modelsPath]);

  // 2. Start Camera Stream
  const startCamera = useCallback(async (videoElement: HTMLVideoElement) => {
    videoRef.current = videoElement;
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: 'user' },
      audio: false,
    });
    videoElement.srcObject = stream;
    await videoElement.play();
    setIsCameraActive(true);
  }, []);

  // 3. Register Face
  const registerFace = useCallback(
    async (label: string) => {
      if (!videoRef.current || !isLoaded) return false;

      const detection = await faceapi
        .detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 })
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) return false;

      const newLd = new faceapi.LabeledFaceDescriptors(label, [detection.descriptor]);
      labeledDescriptorsRef.current.push(newLd);
      matcherRef.current = new faceapi.FaceMatcher(labeledDescriptorsRef.current, 0.45);
      setRegisteredFaces(labeledDescriptorsRef.current.map((ld) => ld.label));

      // Save to localStorage or API
      const serializable = labeledDescriptorsRef.current.map((ld) => ({
        label: ld.label,
        descriptors: ld.descriptors.map((d) => Array.from(d)),
      }));
      localStorage.setItem('REACT_FACE_DB', JSON.stringify(serializable));

      return true;
    },
    [isLoaded]
  );

  return {
    isLoaded,
    isCameraActive,
    registeredFaces,
    startCamera,
    registerFace,
    videoRef,
    canvasRef,
  };
}
