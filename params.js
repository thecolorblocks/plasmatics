const seed = window.seed

const KEY_C = 67
const KEY_S = 83
const KEY_G = 71

let size = (window.innerWidth < window.innerHeight) ? window.innerWidth : window.innerHeight

const getN = () => {
  return parseInt(seed[0], 16) % 8 + 1
}

const getA = () => {
  return parseInt(seed[1], 16) % 4 + 1
}

const getB = () => {
  return parseInt(seed[2], 16) % 4 + 1
}

const getColorSeed = () => {
  return parseInt(seed.slice(4, 6), 16) % 16
}

const getCanvasSize = () => {
  return [size, size]
}

const getParticleSizeFactor = () => {
  return size / 6
}

const params = {
  nParticles: 3000,
  addnParticles: 7000,
  canvasSize: getCanvasSize,
  m0: 0,
  m1: 0,
  m2: 0,
  n: getN,
  a: getA,
  b: getB,
  v: 0.04,
  noiseL: 1.1,
  shapeConstant: 0.006,
  shapeBaseConstant: 0,
  ampFactor: 0.00001,
  particleSizeFactor: getParticleSizeFactor,
  particleVariationL: 3,
  particleAlpha: 10,
  waitingPeriod: 3000,
  isColor: true,
  colorSeed: getColorSeed,
  noiseSeed: 99,
  HSBFactor: 255,
  HSBInitialAngle: -60,
  saturation: 255,
  brightness: 255
}

window.params = params

window.windowResized = () => {
  size = (window.innerWidth < window.innerHeight) ? window.innerWidth : window.innerHeight
  resizeCanvas(...params.canvasSize())
}

window.keyPressed = () => {
  if (keyCode === KEY_C) {
    params.isColor = !params.isColor
  }
  if (keyCode === KEY_S) {
    saveCanvas('capture.png')
  }
  if (keyCode === KEY_G) {
    saveGif('capture', 5)
  }
}