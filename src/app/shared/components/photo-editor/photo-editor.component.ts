import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ImageCropperComponent,
  ImageCroppedEvent,
  ImageTransform,
  LoadedImage
} from 'ngx-image-cropper';

@Component({
  selector: 'app-photo-editor',
  standalone: true,
  imports: [CommonModule, ImageCropperComponent],
  templateUrl: './photo-editor.component.html',
  styleUrl: './photo-editor.component.css'
})
export class PhotoEditorComponent {
  @Input() imageFile: File | null = null;
  @Input() aspectRatio = 1;
  @Input() roundCropper = false;

  @Output() imageCropped = new EventEmitter<Blob>();
  @Output() cancelled = new EventEmitter<void>();

  protected zoom = signal(1);
  protected rotation = signal(0);
  protected transform: ImageTransform = {};

  private croppedBlob: Blob | null = null;

  imageLoaded(_: LoadedImage): void {}

  imageCroppedEvent(event: ImageCroppedEvent): void {
    if (event.blob) this.croppedBlob = event.blob;
  }

  loadImageFailed(): void {
    console.error('Falha ao carregar imagem para edição.');
  }

  zoomIn(): void {
    this.zoom.update(z => Math.min(z + 0.1, 3));
    this.updateTransform();
  }

  zoomOut(): void {
    this.zoom.update(z => Math.max(z - 0.1, 0.5));
    this.updateTransform();
  }

  rotateLeft(): void {
    this.rotation.update(r => r - 90);
    this.updateTransform();
  }

  rotateRight(): void {
    this.rotation.update(r => r + 90);
    this.updateTransform();
  }

  private updateTransform(): void {
    this.transform = { ...this.transform, scale: this.zoom(), rotate: this.rotation() };
  }

  confirm(): void {
    if (this.croppedBlob) this.imageCropped.emit(this.croppedBlob);
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
