import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true
})
export class AppComponent implements AfterViewInit {
  isPaused: boolean = false;
  title = 'Audio Recorder';
  chunks: Blob[] = [];
  mediaRecorder: any;
  audioContext: AudioContext | null = null; // Initialize audioContext as null
  analyser: AnalyserNode | null = null; // Initialize analyser as null
  dataArray: Uint8Array | null = null; // Initialize dataArray as null
  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
  canvasContext!: CanvasRenderingContext2D;

  ngAfterViewInit() {
    this.canvasContext = this.canvas.nativeElement.getContext('2d') as CanvasRenderingContext2D;
  }

  start() {
    (!this.audioContext) ? this.audioContext = new AudioContext() : this.audioContext.resume().then(() => {
      this.startRecording();
    });
  }

  startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        if (!this.audioContext) {
          this.audioContext = new AudioContext();
        }
        const source = this.audioContext.createMediaStreamSource(stream);
        this.analyser = this.audioContext.createAnalyser();
        source.connect(this.analyser);
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

        this.mediaRecorder = new MediaRecorder(stream);
        this.mediaRecorder.start(1000);

        this.mediaRecorder.ondataavailable = (e: BlobEvent) => {
          this.chunks.push(e.data);
        };

        // Call draw method after the audio context is fully initialized
        this.draw();
      })
      .catch(error => {
        console.error('Error accessing microphone:', error);
      });
  }

  playBack() {
    let blob = new Blob(this.chunks, { 'type': 'audio/ogg; codecs=opus' });
    let audioURL = window.URL.createObjectURL(blob);
    let audio = new Audio(audioURL);
    audio.play();
  }

  draw() {
    if (this.analyser && this.audioContext && this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      requestAnimationFrame(() => this.draw());
      this.analyser.getByteTimeDomainData(this.dataArray!);
      this.canvasContext.fillStyle = 'rgb(100, 150, 200)';
      this.canvasContext.fillRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
      this.canvasContext.lineWidth = 2;
      this.canvasContext.strokeStyle = 'rgb(0, 0, 0)';
      this.canvasContext.beginPath();
      var sliceWidth = this.canvas.nativeElement.width * 1.0 / this.analyser.frequencyBinCount;
      var x = 0;
      for (var i = 0; i < this.analyser.frequencyBinCount; i++) {
        var v = this.dataArray![i] / 128.0;
        var y = v * this.canvas.nativeElement.height / 2;
        if (i === 0) {
          this.canvasContext.moveTo(x, y);
        } else {
          this.canvasContext.lineTo(x, y);
        }
        x += sliceWidth;
      }
      this.canvasContext.lineTo(this.canvas.nativeElement.width, this.canvas.nativeElement.height / 2);
      this.canvasContext.stroke();
    }
  }

  pause() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      this.isPaused = true;
    }
  }
}
