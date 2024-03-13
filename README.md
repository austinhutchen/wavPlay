# WavPlay
https://wavplay.vercel.app/
<br/>
![Screenshot 2024-03-13 at 1 25 35 PM](https://github.com/austinhutchen/wavPlay/assets/93489691/47532616-4cc4-454a-9610-7a3dc2085008)

<h2> This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.0.5.
 </h2>
<hr/>
<ul>
  <li>
    The program uses the navigator.mediaDevices.getUserMedia method to get access to the user’s microphone.
  </li>
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
