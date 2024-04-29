import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

class FFT {
  static fft(inputArray: Float32Array): Float32Array {
    const N = inputArray.length;
    const outputArray = new Float32Array(N * 2); // Complex array (real and imaginary parts interleaved)

    FFT.fftRecursive(inputArray, outputArray, N);

    return outputArray;
  }

  private static fftRecursive(inputArray: Float32Array, outputArray: Float32Array, N: number) {
    if (N <= 1) return;

    // Divide the input array into even and odd parts
    const inputEven = new Float32Array(N / 2);
    const inputOdd = new Float32Array(N / 2);
    for (let i = 0; i < N / 2; i++) {
      inputEven[i] = inputArray[i * 2];
      inputOdd[i] = inputArray[i * 2 + 1];
    }

    // Recursively compute FFT on even and odd parts
    FFT.fftRecursive(inputEven, outputArray, N / 2);
    FFT.fftRecursive(inputOdd, outputArray, N / 2);

    // Combine results
    for (let k = 0; k < N / 2; k++) {
      const theta = -2 * Math.PI * k / N;
      const twiddleReal = Math.cos(theta);
      const twiddleImag = Math.sin(theta);

      const evenReal = outputArray[k * 4];
      const evenImag = outputArray[k * 4 + 1];
      const oddReal = outputArray[(k + N / 2) * 4];
      const oddImag = outputArray[(k + N / 2) * 4 + 1];

      const oddTimesTwiddleReal = oddReal * twiddleReal - oddImag * twiddleImag;
      const oddTimesTwiddleImag = oddReal * twiddleImag + oddImag * twiddleReal;

      outputArray[k * 4] = evenReal + oddTimesTwiddleReal;
      outputArray[k * 4 + 1] = evenImag + oddTimesTwiddleImag;
      outputArray[(k + N / 2) * 4] = evenReal - oddTimesTwiddleReal;
      outputArray[(k + N / 2) * 4 + 1] = evenImag - oddTimesTwiddleImag;
    }
  }
}
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
  audioContext: AudioContext | null = null;
  analyser: AnalyserNode | null = null;
  dataArray: Uint8Array | null = null;
  scene: THREE.Scene = new THREE.Scene(); // Initialize properties
  camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera();
  renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer();
  controls: OrbitControls = new OrbitControls(this.camera, this.renderer.domElement);
  cubes: THREE.Mesh[] = [];
  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
  canvasContext!: CanvasRenderingContext2D;

  ngAfterViewInit() {
    this.canvasContext = this.canvas.nativeElement.getContext('2d') as CanvasRenderingContext2D;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.initAudio();
    this.initThree();
  }

  start() {
    (!this.audioContext) ? this.audioContext = new AudioContext() : this.audioContext.resume().then(() => {
      this.startRecording();
    });
  }
  initAudio() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        this.analyser = this.audioContext!.createAnalyser();
        const microphone = this.audioContext!.createMediaStreamSource(stream);
        microphone.connect(this.analyser!);
        this.analyser!.fftSize = 256;
        const bufferLength = this.analyser!.frequencyBinCount;
        this.dataArray = new Uint8Array(bufferLength);
        this.render();
      })
      .catch(error => {
        console.error('Error accessing microphone:', error);
      });
  }
  initThree() {
    // Create a new canvas element for WebGL rendering
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    // Initialize Three.js components with the new canvas
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    // Set camera position
    this.camera.position.set(0, 0, 50);
    // Add resize listener
    window.addEventListener('resize', () => this.onWindowResize());
    // Create cubes
    this.createCubes();
    // Start rendering loop
    this.render();
  }


  createCubes() {
    const rows = 8;
    const cols = 32;
    const cubeSize = 2;
    const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        cube.position.set(x * cubeSize - (cols * cubeSize) / 2, y * cubeSize - (rows * cubeSize) / 2, 0);
        this.scene.add(cube);
        this.cubes.push(cube);
      }
    }
  }

  render() {
    if (this.analyser && this.dataArray) {
      this.analyser.getByteFrequencyData(this.dataArray);

      const fftData: Float32Array = Float32Array.from(this.dataArray);
      const fftResult = FFT.fft(fftData);
      const fftMagnitude = fftResult.map((value: number) => Math.abs(value));

      for (let i = 0; i < this.cubes.length; i++) {
        const scale = fftMagnitude[i] / 255 * 10; // Adjust scale factor as needed
        this.cubes[i].scale.z = Math.max(scale, 0.1); // Ensure scale is not zero
      }
    }

    // Render the scene
    this.renderer.render(this.scene, this.camera);

    // Request next frame after a delay (e.g., 30 frames per second)
    setTimeout(() => {
      requestAnimationFrame(() => this.render());
    }, 1000 / 30); // Adjust frame rate as needed
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
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
