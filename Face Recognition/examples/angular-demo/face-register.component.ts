import { Component, ElementRef, OnInit, viewChild, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FaceRecognitionService } from './face-recognition.service';

@Component({
  selector: 'app-face-register',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="register-container">
      <h2>Face Registration</h2>
      <video #video autoplay muted playsinline class="video-preview"></video>
      <input [(ngModel)]="personName" placeholder="Enter Name/ID" class="name-input" />
      <button (click)="captureAndRegister()" [disabled]="!isReady()" class="btn-capture">
        📸 Capture & Register
      </button>
      @if (statusMessage()) {
        <p class="status-text">{{ statusMessage() }}</p>
      }
    </div>
  `,
  styles: [`
    .register-container { display: flex; flex-direction: column; gap: 12px; max-width: 420px; }
    .video-preview { width: 100%; aspect-ratio: 4/3; background: #000; border-radius: 8px; transform: scaleX(-1); }
    .name-input { padding: 10px; border-radius: 6px; border: 1px solid #ccc; font-size: 14px; }
    .btn-capture { padding: 12px; background: #0052FF; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; }
    .btn-capture:disabled { opacity: 0.5; }
    .status-text { font-size: 13px; color: #10b981; }
  `]
})
export class FaceRegisterComponent implements OnInit {
  private readonly faceService = inject(FaceRecognitionService);
  readonly videoEl = viewChild.required<ElementRef<HTMLVideoElement>>('video');

  readonly isReady = signal(false);
  readonly statusMessage = signal('');
  personName = '';

  async ngOnInit() {
    await this.faceService.loadModels('/assets/models');
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    this.videoEl().nativeElement.srcObject = stream;
    this.isReady.set(true);
  }

  async captureAndRegister() {
    if (!this.personName.trim()) return;
    this.statusMessage.set('Extracting biometric vectors...');
    const descriptor = await this.faceService.extractDescriptor(this.videoEl().nativeElement);
    if (descriptor) {
      this.faceService.registerFace(this.personName.trim(), descriptor);
      this.statusMessage.set(`Successfully registered face for ${this.personName}!`);
      this.personName = '';
    } else {
      this.statusMessage.set('No clear face detected. Try again.');
    }
  }
}
