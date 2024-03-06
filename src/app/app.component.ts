// app.component.ts
import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
@ViewChild('canvas') canvas!: ElementRef;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  title = 'Audio Recorder';
chunks: Blob[] = [];
  mediaRecorder: any;
audioContext: AudioContext = new AudioContext();
analyser: AnalyserNode = this.audioContext.createAnalyser();
dataArray: Uint8Array = new Uint8Array(this.analyser.frequencyBinCount);
canvasContext: CanvasRenderingContext2D;

  @ViewChild('canvas') canvas: ElementRef;
  canvasContext: CanvasRenderingContext2D;
ngAfterViewInit() {
  this.canvasContext = this.canvas.nativeElement.getContext('2d') as CanvasRenderingContext2D;
}

  startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        this.audioContext = new AudioContext();
        const source = this.audioContext.createMediaStreamSource(stream);
        this.analyser = this.audioContext.createAnalyser();
        source.connect(this.analyser);
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.draw();

        this.mediaRecorder = new MediaRecorder(stream);
        this.mediaRecorder.start();

this.mediaRecorder.ondataavailable = (e: BlobEvent) => {
  this.chunks.push(e.data);
};

        this.mediaRecorder.onstop = e => {
          let blob = new Blob(this.chunks, { 'type' : 'audio/ogg; codecs=opus' });
          let audioURL = window.URL.createObjectURL(blob);
          let audio = new Audio(audioURL);
          audio.play();
        };
      });
  }

  draw() {
    requestAnimationFrame(() => this.draw());

    this.analyser.getByteTimeDomainData(this.dataArray);

    this.canvasContext.fillStyle = 'rgb(200, 200, 200)';
    this.canvasContext.fillRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);

    this.canvasContext.lineWidth = 2;
    this.canvasContext.strokeStyle = 'rgb(0, 0, 0)';

    this.canvasContext.beginPath();

    var sliceWidth = this.canvas.nativeElement.width * 1.0 / this.analyser.frequencyBinCount;
    var x = 0;

    for(var i = 0; i < this.analyser.frequencyBinCount; i++) {
      var v = this.dataArray[i] / 128.0;
      var y = v * this.canvas.nativeElement.height/2;

      if(i === 0) {
        this.canvasContext.moveTo(x, y);
      } else {
        this.canvasContext.lineTo(x, y);
      }

      x += sliceWidth;
    }

    this.canvasContext.lineTo(this.canvas.nativeElement.width, this.canvas.nativeElement.height/2);
    this.canvasContext.stroke();
  }

  stopRecording() {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
    }
  }
}

