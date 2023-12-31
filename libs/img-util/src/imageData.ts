import { clamp } from '@genshin-optimizer/util'

export function cropCanvas(
  srcCanvas: HTMLCanvasElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  canvas.width = w
  canvas.height = h
  ctx.drawImage(srcCanvas, x, y, w, h, 0, 0, w, h)
  return canvas
}

type CropOptions = {
  x1?: number
  x2?: number
  y1?: number
  y2?: number
}
export function crop(srcCanvas: HTMLCanvasElement, options: CropOptions) {
  const width = srcCanvas.width
  const height = srcCanvas.height
  let { x1 = 0, x2 = width, y1 = 0, y2 = height } = options
  x1 = clamp(x1, 0, width)
  x2 = clamp(x2, 0, width)
  y1 = clamp(y1, 0, height)
  y2 = clamp(y2, 0, height)
  if (y1 >= y2) {
    console.warn(
      `trying to crop with y1:${y1} y2:${y2}, with src height ${height}.`
    )
    y1 = 0
    y2 = height
  }
  if (x1 >= x2) {
    console.warn(
      `trying to crop with x1:${x1} x2:${x2}, with src width ${width}.`
    )
    x1 = 0
    x2 = width
  }
  const ctx = srcCanvas.getContext('2d', { willReadFrequently: true })!
  return ctx.getImageData(x1, y1, x2 - x1, y2 - y1)
}

function interpolate_bilinear(
  image: ImageData,
  x: number,
  y: number,
  i: number
) {
  const x1 = x === image.width ? x - 1 : Math.floor(x),
    x2 = x1 + 1
  const y1 = y === image.height ? y - 1 : Math.floor(y),
    y2 = y1 + 1
  const ch = 4
  const _x = ch,
    _y = image.width * ch

  const q11 = (x2 - x) * (y2 - y) * image.data[i + _x * x1 + _y * y1]
  const q21 = (x - x1) * (y2 - y) * image.data[i + _x * x2 + _y * y1]
  const q12 = (x2 - x) * (y - y1) * image.data[i + _x * x1 + _y * y2]
  const q22 = (x - x1) * (y - y1) * image.data[i + _x * x2 + _y * y2]
  return q11 + q21 + q12 + q22
}
export function resize(
  imageData: ImageData,
  options: { width?: number; height?: number }
): ImageData {
  const { width = imageData.width, height = imageData.height } = options

  const dataBuffer = new Uint8ClampedArray(width * height * 4)
  const sx = (width - 1) / (imageData.width - 1)
  const sy = (height - 1) / (imageData.height - 1)
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      for (let i = 0; i < 4; i++) {
        dataBuffer[x * 4 + y * width * 4 + i] = interpolate_bilinear(
          imageData,
          x / sx,
          y / sy,
          i
        )
      }
    }
  }

  const resized = new ImageData(dataBuffer, width, height)
  return resized
}
export function invert(imageData: ImageData) {
  const width = imageData.width,
    height = imageData.height

  const invDataBuffer = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < width * height * 4; i++) {
    if (i % 4 == 3) {
      invDataBuffer[i] = imageData.data[i]
      continue
    }
    invDataBuffer[i] = 255 - imageData.data[i]
  }

  return new ImageData(invDataBuffer, width, height)
}

export const fileToURL = (file: File): Promise<string> =>
  new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = ({ target }) => resolve(target!.result as string)
    reader.readAsDataURL(file)
  })
export const urlToImageData = (urlFile: string): Promise<ImageData> =>
  new Promise((resolve) => {
    const img = new Image()
    img.onload = ({ target }) =>
      resolve(imageToImageData(target as HTMLImageElement))
    img.src = urlFile
  })

function imageToImageData(image: HTMLImageElement): ImageData {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  canvas.width = image.width
  canvas.height = image.height
  ctx.drawImage(image, 0, 0, image.width, image.height)
  return ctx.getImageData(0, 0, image.width, image.height)
}

export function imageDataToCanvas(imageData: ImageData): HTMLCanvasElement {
  // create off-screen canvas element
  const canvas = document.createElement('canvas')
  canvas.width = imageData.width
  canvas.height = imageData.height

  // update canvas with new data
  canvas.getContext('2d')!.putImageData(imageData, 0, 0)
  return canvas // produces a PNG file
}
