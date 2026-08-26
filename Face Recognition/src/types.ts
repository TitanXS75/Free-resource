/**
 * Face Recognition Engine - Types and Interfaces
 */

export interface FaceQualityMetrics {
  score: number; // 0 to 100
  canCapture: boolean;
  message: string;
  details: {
    size: 'too_small' | 'optimal' | 'too_large';
    position: 'centered' | 'off_center';
    lighting: 'too_dark' | 'optimal' | 'too_bright';
    clarity: 'blurry' | 'sharp';
    angle: 'facing_forward' | 'tilted';
  };
}

export interface StoredFaceRecord {
  id: string;
  label: string; // Name or Employee ID
  displayName?: string;
  descriptors: number[][]; // Array of 128-float arrays serialized
  registeredAt: string; // ISO Date String
  metadata?: Record<string, unknown>;
}

export interface RecognitionResult {
  isMatch: boolean;
  label: string;
  displayName: string;
  distance: number; // Euclidean distance (0 = identical, >0.6 = different person)
  confidence: number; // 0 to 1 (calculated from distance)
}

export interface FaceDetectionConfig {
  matchThreshold: number; // Default: 0.45 (lower = stricter match)
  highConfidenceThreshold: number; // Default: 0.60
  inputSize: 160 | 224 | 320 | 416 | 512 | 608; // Default: 416
  scoreThreshold: number; // Face detector minimum score (default: 0.5)
}

export interface CameraOptions {
  width?: number;
  height?: number;
  facingMode?: 'user' | 'environment';
}
