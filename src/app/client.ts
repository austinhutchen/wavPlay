import * as THREE from 'three'
import { MeshBasicMaterial } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module'

const scene = new THREE.Scene()

const light = new THREE.AmbientLight()
scene.add(light)

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
)
camera.position.x = 7
camera.position.y = 0.75
camera.position.z = 10

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

new OrbitControls(camera, renderer.domElement)

const canvas = document.createElement('canvas') as HTMLCanvasElement
canvas.width = 256
canvas.height = 512

const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

const texture = new THREE.Texture(canvas)
texture.minFilter = THREE.LinearFilter
texture.magFilter = THREE.LinearFilter

const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20, 256, 256),
    new THREE.MeshPhongMaterial({
        wireframe: true,
        color: new THREE.Color(0x00ff00),
        displacementMap: texture,
        displacementScale: 10,
    })
)
plane.rotateX(-Math.PI / 2)
scene.add(plane)

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}

let context: AudioContext
let analyser: AnalyserNode
let mediaSource
let imageData

function getUserMedia(
    dictionary: MediaStreamConstraints,
    callback: NavigatorUserMediaSuccessCallback
) {
    try {
        navigator.getUserMedia =
            navigator.getUserMedia ||
            (navigator as any).webkitGetUserMedia ||
            (navigator as any).mozGetUserMedia
        navigator.getUserMedia(dictionary, callback, (e) => {
            console.dir(e)
        })
    } catch (e) {
        alert('getUserMedia threw exception :' + e)
    }
}

function connectAudioAPI() {
    try {
        context = new AudioContext()
        analyser = context.createAnalyser()
        analyser.fftSize = 2048

        navigator.mediaDevices
            .getUserMedia({ audio: true, video: false })
            .then(function (stream) {
                mediaSource = context.createMediaStreamSource(stream)
                mediaSource.connect(analyser)
                animate()
                context.resume()
            })
            .catch(function (err) {
                alert(err)
            })
    } catch (e) {
        alert(e)
    }
}

function updateFFT() {
    let timeData = new Uint8Array(analyser.frequencyBinCount)

    analyser.getByteFrequencyData(timeData)

    imageData = ctx.getImageData(0, 1, 256, 511)
    ctx.putImageData(imageData, 0, 0, 0, 0, 256, 512)

    for (let x = 0; x < 256; x++) {
        ctx.fillStyle = 'rgb(' + timeData[x] + ', 0, 0) '
        ctx.fillRect(x, 510, 2, 2)
    }

    texture.needsUpdate = true
}

const stats = new Stats()
document.body.appendChild(stats.domElement)

function animate() {
    requestAnimationFrame(animate)

    updateFFT()

    render()

    stats.update()
}

function render() {
    renderer.render(scene, camera)
}

window.onload = function () {
    connectAudioAPI()
}
