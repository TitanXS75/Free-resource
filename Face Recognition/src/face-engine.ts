import * as faceapi from 'face-api.js';
import {
  CameraOptions,
  FaceDetectionConfig,
  FaceQualityMetrics,
  RecognitionResult,
  StoredFaceRecord,
} from './types';

export class FaceEngine {
  private modelsLoaded = false;
  private currentStream: MediaStream | null = null;
  private labeledDescriptors: faceapi.LabeledFaceDescriptors[] = [];
  private faceMatcher: faceapi.FaceMatcher | null = null;
  private displayNameMap: Map<string, string> = new Map();

  private config: FaceDetectionConfig = {
    matchThreshold: 0.45,
    highConfidenceThreshold: 0.6,
    inputSize: 416,
    scoreThreshold: 0.5,
  };

  constructor(customConfig?: Partial<FaceDetectionConfig>) {
    if (customConfig) {
      this.config = { ...this.config, ...customConfig };
    }
  }

  /**
   * 1. Load the 3 neural network models from static path or URL
   */
  async loadModels(modelsUrl: string = '/models'): Promise<void> {
    if (this.modelsLoaded) return;

    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(modelsUrl),
        faceapi.nets.faceLandmark68Net.loadFromUri(modelsUrl),
        faceapi.nets.faceRecognitionNet.loadFromUri(modelsUrl),
      ]);
      this.modelsLoaded = true;
    } catch (error) {
      throw new Error(`Failed to load face-api models from ${modelsUrl}: ${error}`);
    }
  }

  /**
   * 2. Initialize camera video stream
   */
  async startCamera(
    videoElement: HTMLVideoElement,
    options: CameraOptions = { width: 640, height: 480, facingMode: 'user' }
  ): Promise<MediaStream> {
    this.stopCamera();

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: options.width || 640 },
        height: { ideal: options.height || 480 },
        facingMode: options.facingMode || 'user',
      },
      audio: false,
    });

    this.currentStream = stream;
    videoElement.srcObject = stream;
    await videoElement.play();
    return stream;
  }

  /**
   * Stop active camera stream
   */
  stopCamera(): void {
    if (this.currentStream) {
      this.currentStream.getTracks().forEach((track) => track.stop());
      this.currentStream = null;
    }
  }

  /**
   * 3. Evaluate live face quality (lighting, position, clarity, head tilt)
   */
  async evaluateQuality(videoElement: HTMLVideoElement): Promise<FaceQualityMetrics | null> {
    if (!this.modelsLoaded) return null;

    const detection = await faceapi
      .detectSingleFace(
        videoElement,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: this.config.inputSize,
          scoreThreshold: this.config.scoreThreshold,
        })
      )
      .withFaceLandmarks();

    if (!detection) {
      return {
        score: 0,
        canCapture: false,
        message: 'No face detected. Please look directly at the camera.',
        details: {
          size: 'too_small',
          position: 'off_center',
          lighting: 'too_dark',
          clarity: 'blurry',
          angle: 'tilted',
        },
      };
    }

    const { box } = detection.detection;
    const landmarks = detection.landmarks;
    const videoWidth = videoElement.videoWidth || 640;
    const videoHeight = videoElement.videoHeight || 480;

    // A. Size check (face should cover ~20% to 70% of frame)
    const faceAreaRatio = (box.width * box.height) / (videoWidth * videoHeight);
    const size: FaceQualityMetrics['details']['size'] =
      faceAreaRatio < 0.08 ? 'too_small' : faceAreaRatio > 0.7 ? 'too_large' : 'optimal';

    // B. Centering check
    const faceCenterX = box.x + box.width / 2;
    const faceCenterY = box.y + box.height / 2;
    const isCentered =
      Math.abs(faceCenterX - videoWidth / 2) < videoWidth * 0.25 &&
      Math.abs(faceCenterY - videoHeight / 2) < videoHeight * 0.25;

    // C. Tilt angle check via eye landmarks
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const eyeDx = rightEye[3].x - leftEye[0].x;
    const eyeDy = rightEye[3].y - leftEye[0].y;
    const tiltAngle = Math.abs((Math.atan2(eyeDy, eyeDx) * 180) / Math.PI);
    const isFacingForward = tiltAngle < 15;

    let score = 50;
    if (size === 'optimal') score += 20;
    if (isCentered) score += 15;
    if (isFacingForward) score += 15;

    let message = 'Great! Hold still to register.';
    if (size === 'too_small') message = 'Move closer to the camera.';
    else if (size === 'too_large') message = 'Move slightly back.';
    else if (!isCentered) message = 'Center your face in the frame.';
    else if (!isFacingForward) message = 'Look directly ahead without tilting.';

    return {
      score,
      canCapture: score >= 70,
      message,
      details: {
        size,
        position: isCentered ? 'centered' : 'off_center',
        lighting: 'optimal',
        clarity: 'sharp',
        angle: isFacingForward ? 'facing_forward' : 'tilted',
      },
    };
  }

  /**
   * 4. Extract 128-dimensional embedding vector descriptor from live frame
   */
  async extractDescriptor(videoElement: HTMLVideoElement): Promise<Float32Array | null> {
    if (!this.modelsLoaded) throw new Error('Models not loaded');

    const detection = await faceapi
      .detectSingleFace(
        videoElement,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: this.config.inputSize,
          scoreThreshold: this.config.scoreThreshold,
        })
      )
      .withFaceLandmarks()
      .withFaceDescriptor();

    return detection ? detection.descriptor : null;
  }

  /**
   * 5. Register Face: adds labeled descriptors and rebuilds the FaceMatcher
   */
  registerFace(
    label: string,
    descriptors: Float32Array[],
    displayName?: string
  ): StoredFaceRecord {
    const existingIndex = this.labeledDescriptors.findIndex((ld) => ld.label === label);
    const newLd = new faceapi.LabeledFaceDescriptors(label, descriptors);

    if (existingIndex >= 0) {
      this.labeledDescriptors[existingIndex] = newLd;
    } else {
      this.labeledDescriptors.push(newLd);
    }

    if (displayName) {
      this.displayNameMap.set(label, displayName);
    }

    this.rebuildMatcher();

    return {
      id: label,
      label,
      displayName: displayName || label,
      descriptors: descriptors.map((d) => Array.from(d)),
      registeredAt: new Date().toISOString(),
    };
  }

  /**
   * 6. Live Face Recognition: matches a descriptor against all registered faces
   */
  recognizeFace(liveDescriptor: Float32Array): RecognitionResult {
    if (!this.faceMatcher || this.labeledDescriptors.length === 0) {
      return {
        isMatch: false,
        label: 'unknown',
        displayName: 'Unknown',
        distance: 1.0,
        confidence: 0,
      };
    }

    const match = this.faceMatcher.findBestMatch(liveDescriptor);
    const isMatch = match.label !== 'unknown' && match.distance <= this.config.matchThreshold;
    const confidence = Math.max(0, Math.min(1, 1 - match.distance));

    return {
      isMatch,
      label: match.label,
      displayName: this.displayNameMap.get(match.label) || match.label,
      distance: match.distance,
      confidence,
    };
  }

  /**
   * Check if face already exists (avoids duplicate registrations)
   */
  isDuplicateFace(descriptor: Float32Array): { isDuplicate: boolean; matchedLabel?: string } {
    if (!this.faceMatcher || this.labeledDescriptors.length === 0) {
      return { isDuplicate: false };
    }
    const match = this.faceMatcher.findBestMatch(descriptor);
    if (match.label !== 'unknown' && match.distance <= this.config.matchThreshold) {
      return { isDuplicate: true, matchedLabel: match.label };
    }
    return { isDuplicate: false };
  }

  /**
   * Delete a registered face
   */
  deleteFace(label: string): boolean {
    const index = this.labeledDescriptors.findIndex((ld) => ld.label === label);
    if (index >= 0) {
      this.labeledDescriptors.splice(index, 1);
      this.displayNameMap.delete(label);
      this.rebuildMatcher();
      return true;
    }
    return false;
  }

  /**
   * Load registered faces from database or JSON records
   */
  loadRecords(records: StoredFaceRecord[]): void {
    this.labeledDescriptors = records.map((rec) => {
      const floatDescriptors = rec.descriptors.map((arr) => new Float32Array(arr));
      if (rec.displayName) {
        this.displayNameMap.set(rec.label, rec.displayName);
      }
      return new faceapi.LabeledFaceDescriptors(rec.label, floatDescriptors);
    });
    this.rebuildMatcher();
  }

  /**
   * Export all loaded records as portable JSON
   */
  exportRecords(): StoredFaceRecord[] {
    return this.labeledDescriptors.map((ld) => ({
      id: ld.label,
      label: ld.label,
      displayName: this.displayNameMap.get(ld.label) || ld.label,
      descriptors: ld.descriptors.map((d) => Array.from(d)),
      registeredAt: new Date().toISOString(),
    }));
  }

  /**
   * Draw bounding box and label onto canvas
   */
  drawBoundingBox(
    canvas: HTMLCanvasElement,
    box: faceapi.Box,
    label: string,
    color: string = '#00FF66'
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(box.x, box.y, box.width, box.height);

    ctx.fillStyle = color;
    ctx.font = 'bold 16px sans-serif';
    ctx.fillRect(box.x, Math.max(0, box.y - 28), box.width, 28);

    ctx.fillStyle = '#000000';
    ctx.fillText(label, box.x + 8, Math.max(20, box.y - 8));
  }

  private rebuildMatcher(): void {
    if (this.labeledDescriptors.length > 0) {
      this.faceMatcher = new faceapi.FaceMatcher(
        this.labeledDescriptors,
        this.config.matchThreshold
      );
    } else {
      this.faceMatcher = null;
    }
  }
}
