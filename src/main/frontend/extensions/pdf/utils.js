export const viewportToScaled = (
  rect,
  { width, height }
) => {
  return {
    x1: rect.left,
    y1: rect.top,

    x2: rect.left + rect.width,
    y2: rect.top + rect.height,

    width,
    height,
  }
}

const pdfToViewport = (pdf, viewport) => {
  const [x1, y1, x2, y2] = viewport.convertToViewportRectangle([
    pdf.x1,
    pdf.y1,
    pdf.x2,
    pdf.y2,
  ])

  return {
    left: x1,
    top: y1,

    width: x2 - x1,
    height: y1 - y2,
  }
}

export const scaledToViewport = (
  scaled,
  viewport,
  usePdfCoordinates = false
) => {
  const { width, height } = viewport

  if (usePdfCoordinates) {
    return pdfToViewport(scaled, viewport)
  }

  if (scaled.x1 === undefined) {
    throw new Error('You are using old position format, please update')
  }

  const x1 = (width * scaled.x1) / scaled.width
  const y1 = (height * scaled.y1) / scaled.height

  const x2 = (width * scaled.x2) / scaled.width
  const y2 = (height * scaled.y2) / scaled.height

  return {
    left: x1,
    top: y1,
    width: x2 - x1,
    height: y2 - y1,
  }
}

export const getBoundingRect = (clientRects) => {
  const rects = Array.from(clientRects).map(rect => {
    const { left, top, width, height } = rect

    const X0 = left
    const X1 = left + width

    const Y0 = top
    const Y1 = top + height

    return { X0, X1, Y0, Y1 }
  })

  const optimal = rects.reduce((res, rect) => {
    return {
      X0: Math.min(res.X0, rect.X0),
      X1: Math.max(res.X1, rect.X1),

      Y0: Math.min(res.Y0, rect.Y0),
      Y1: Math.max(res.Y1, rect.Y1),
    }
  }, rects[0])

  const { X0, X1, Y0, Y1 } = optimal

  return {
    left: X0,
    top: Y0,
    width: X1 - X0,
    height: Y1 - Y0,
  }
}
