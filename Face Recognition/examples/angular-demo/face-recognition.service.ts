import { Injectable } from '@angular/core';
import * as faceapi from 'face-api.js';

@Injectable({
  providedIn: 'root',
})
export class FaceRecognitionService {
  private modelsLoaded = false;
  private labeledDescriptors: faceapi.LabeledFaceDescriptors[] = [];
  private matcher: faceapi.FaceMatcher | null = null;

  async loadModels(modelsUrl: string = '/assets/models'): Promise<void> {
    if (this.modelsLoaded) return;
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(modelsUrl),
      faceapi.nets.faceLandmark68Net.loadFromUri(modelsUrl),
      faceapi.nets.faceRecognitionNet.loadFromUri(modelsUrl),
    ]);
    this.modelsLoaded = true;
  }

  async extractDescriptor(video: HTMLVideoElement): Promise<Float32Array | null> {
    const detection = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    return detection ? detection.descriptor : null;
  }

  registerFace(label: string, descriptor: Float32Array): void {
    const newLd = new faceapi.LabeledFaceDescriptors(label, [descriptor]);
    this.labeledDescriptors.push(newLd);
    this.matcher = new faceapi.FaceMatcher(this.labeledDescriptors, 0.45);
  }

  recognize(descriptor: Float32Array): { label: string; confidence: number; isMatch: boolean } {
    if (!this.matcher) return { label: 'unknown', confidence: 0, isMatch: false };
    const match = this.matcher.findBestMatch(descriptor);
    return {
      label: match.label,
      confidence: Math.round((1 - match.distance) * 100),
      isMatch: match.label !== 'unknown' && match.distance <= 0.45,
    };
  }
}
