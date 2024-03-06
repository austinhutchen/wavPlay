# WavPlay
https://wavplay.vercel.app/
<br/>
This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.0.5.It uses the navigator.mediaDevices.getUserMedia method to get access to the user’s microphone.
<ul>
<li>
It creates an AudioContext and a MediaStreamSource from the user’s microphone stream.  
</li>
<li>
  It connects the MediaStreamSource to an AnalyserNode to get audio data.
</li>
<li>
  It uses the requestAnimationFrame method to continuously update a canvas with the audio data.
</li>
<li>
  It uses the MediaRecorder API to record the audio from the user’s microphone.
</li>
<li>
  When the recording is stopped, it creates a Blob from the recorded audio data, creates a URL for the Blob, and plays the audio.
</li>
</ul>
