const seed = window.seed

let audio = 'https://ordinals.com/content/' + seed

const params = window.params

import * as fflate from 'https://ordinals.com/content/f815bd5c566c6e46de5cdb6ccb3a7043c63deeba61f4234baea84b602b0d4440i0'

const b64data = await (await fetch('http://ordinals.com/content/255ce0c5a0d8aca39510da72e604ef8837519028827ba7b7f723b7489f3ec3a4i0')).text()
const code = fflate.strFromU8(
  fflate.decompressSync(
    fflate.strToU8(
      atob(b64data), true
    )
  )
)
const script = document.createElement('script')
script.innerHTML = code
document.head.appendChild(script)

const loading = document.querySelector('div#loading')
const clickToPlay = document.querySelector('div#play')

const audioSetup = () => {
  const audioCtx = new AudioContext()
  const analyser = audioCtx.createAnalyser()
  const audioElement = new Audio(audio)
  audioElement.crossOrigin = "anonymous"
  audioElement.type = 'audio/mp3'
  audioElement.loop = false
  const sourceNode = audioCtx.createMediaElementSource(audioElement)
  
  sourceNode.connect(analyser)
  analyser.connect(audioCtx.destination)

  analyser.fftSize = 2048
  analyser.smoothingTimeConstant = 0.5
  let frequencyData = new Uint8Array(analyser.frequencyBinCount)
  let timeDomainData = new Uint8Array(analyser.frequencyBinCount)
  let bufferLength = analyser.frequencyBinCount
  let frequencyBinWidth = audioCtx.sampleRate / analyser.fftSize

  return [audioElement, audioCtx, analyser, frequencyData, timeDomainData, bufferLength, frequencyBinWidth]
}

let audioElement, audioCtx, analyser, frequencyData, timeDomainData, bufferLength, frequencyBinWidth, amplitude

let particles, addnParticles
let minWalk = 0.005

const colorWheel16 = (initialAngle) => {
  const nColors = 16
  const degree = params.HSBFactor / nColors
  let colors = []
  colorMode(HSB, params.HSBFactor)
  for (let i = 0; i < nColors; i++) {
    let c = color(initialAngle + i*degree, params.saturation, params.brightness)
    colors.push(c)
  }
  return colors
}

const pi = Math.PI

let spectrum = []

let colors = []

const cymatics = (x, y, m, n) => {
  return params.a() * Math.cos(pi*n*(x-.5)) * Math.cos(pi*m*(y-.5)) + params.b() * Math.cos(pi*m*(x-.5)) * Math.cos(pi*n*(y-.5))
}

const complementaries = (c) => {
  let wholeAngle = params.HSBFactor
  let angle = Math.floor(wholeAngle / 6)
  let h = hue(c)
  let colors = [
    color(h, params.saturation, params.brightness),
    color((h+angle)%wholeAngle, params.saturation, params.brightness),
    color((h+angle*2)%wholeAngle, params.saturation, params.brightness)
  ]
  colors.map(c => c.setAlpha(params.particleAlpha))
  return colors
}

const bark = (f) => {
  return 13 * Math.atan(0.00076*f) + 3.5 * atan(Math.pow((f/7500), 2))
}

const mel = (f) => {
  return 2595 * Math.log10(1 + f / 700)
}

const centroid = (frequencyData) => {
  const sum = frequencyData.reduce((acc, value) => acc + value, 0)
  const weightedSum = frequencyData.reduce((acc, value, index) => acc + value * index, 0)
  return (sum === 0) ? 0 : weightedSum / sum
}

const barkCentroid = (frequencyData, frequencyBinWidth) => {
  const sum = frequencyData.reduce((acc, value) => acc + value, 0)
  const weightedSum = frequencyData.reduce((acc, value, index) => acc + value * index * bark(index*frequencyBinWidth), 0)
  return (sum === 0) ? 0 : weightedSum / sum
}

const melCentroid = (frequencyData, frequencyBinWidth) => {
  const sum = frequencyData.reduce((acc, value) => acc + value, 0)
  const weightedSum = frequencyData.reduce((acc, value, index) => acc + value * mel(index*frequencyBinWidth), 0)
  return (sum === 0) ? 0 : weightedSum / sum
}

const handleEdge = (n) => {
  if (n>=1) return 1
  if (n<=0) return 0
  return n
}

const initParticles = () => {
  particles = []
  for (let i = 0; i < params.nParticles; i++){
    particles[i] = new Particle()
  }
  addnParticles = []
  for (let j = 0; j < params.addnParticles; j++) {
    addnParticles[j] = new Particle()
  }
}

const initDOM = () => {
  let canvas = createCanvas(...params.canvasSize())
  canvas.parent('plasmatics')
}

class Particle {

  constructor(){
    this.x = random(0, 1)
    this.y = random(0, 1)
    this.oscillation
    this.type = Math.floor(random(0, params.particleVariationL))
    this.distance

    this.updateOffsets()
  }

  move() {
    this.distance = Math.abs( cymatics(this.x, this.y, params[`m${this.type}`], params.n()) )
    this.oscillation = params.v * this.distance
    if (this.oscillation <= minWalk) this.oscillation = minWalk
    this.x += (Math.random() * (this.oscillation*2) - this.oscillation) * params.noiseL
    this.y += (Math.random() * (this.oscillation*2) - this.oscillation) * params.noiseL
    this.updateOffsets()
  }

  updateOffsets(){
    this.x = handleEdge(this.x)
    this.y = handleEdge(this.y)
    this.xScaled = width * this.x
    this.yScaled = height * this.y
  }

  draw(){
    if (params.isColor) {
      stroke(colors[this.type])
      strokeWeight((1-this.distance*.5)*params.particleSizeFactor())
    } else {
      stroke('white')
      strokeWeight((1-this.distance*.5)*2)
    }
    point(this.xScaled, this.yScaled)
  }
}

const resonate = () => {
  analyser.getByteFrequencyData(frequencyData)
  analyser.getByteTimeDomainData(timeDomainData)
  amplitude = timeDomainData.reduce((sum, value) => sum + value, 0) / bufferLength
  minWalk = amplitude * params.ampFactor
  let barkConstant = (barkCentroid(frequencyData, frequencyBinWidth)*params.shapeConstant) + params.shapeBaseConstant
  let melConstant = (melCentroid(frequencyData, frequencyBinWidth)*params.shapeConstant) + params.shapeBaseConstant
  let centroidConstant = (centroid(frequencyData)*params.shapeConstant) + params.shapeBaseConstant
  params.m0 = barkConstant
  params.m1 = melConstant
  params.m2 = centroidConstant
  particles.map( p => {
    p.move()
    p.draw()
  })
  if (!params.isColor) {
    addnParticles.map( p => {
      p.move()
      p.draw()
    })
  }
}

const resetCanvas = () => {
  background('black')
}

window.setup = () => {
  [audioElement, audioCtx, analyser, frequencyData, timeDomainData, bufferLength, frequencyBinWidth] = audioSetup()
  initDOM()
  initParticles()
  colorMode(HSB, 255)
  noiseSeed(params.noiseSeed)
  spectrum = colorWheel16(params.HSBInitialAngle)
  colors = complementaries(spectrum[params.colorSeed()])
  audioElement.addEventListener('canplaythrough', () => {
    loading.style.display = 'none'
  }, false)

  audioElement.addEventListener('ended', () => {
    window.setTimeout(() => {
      audioElement.play()
    }, params.waitingPeriod)
  }, false)
}

window.draw = () => {
  resetCanvas()
  resonate()
}

clickToPlay.addEventListener('click', () => {
  audioCtx.resume()
  audioElement.play()
  clickToPlay.style.display = 'none'
}, false)