import type { StrokePoint } from 'perfect-freehand'

export class SvgPathUtils {
  static getCurvedPathForPolygon(points: number[][]) {
    if (points.length < 3) {
      return `M -4, 0
      a 4,4 0 1,0 8,0
      a 4,4 0 1,0 -8,0`
    }

    const d = ['M', ...points[0].slice(0, 2), 'Q']
    const len = points.length
    for (let i = 1; i < len; i++) {
      const [x0, y0] = points[i]
      const [x1, y1] = points[(i + 1) % len]
      d.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
    }
    d.push('Z')
    return d.join(' ')
  }

  static getCurvedPathForPoints(points: number[][]) {
    if (points.length < 3) {
      return `M -4, 0
      a 4,4 0 1,0 8,0
      a 4,4 0 1,0 -8,0`
    }

    const d = ['M', ...points[0].slice(0, 2), 'Q']
    const len = points.length
    for (let i = 1; i < len - 1; i++) {
      const [x0, y0] = points[i]
      const [x1, y1] = points[i + 1]
      d.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
    }
    return d.join(' ')
  }

  // Regex to trim numbers to 2 decimal places
  static TRIM_NUMBERS = /(\s?[A-Z]?,?-?[0-9]*\.[0-9]{0,2})(([0-9]|e|-)*)/g

  /**
   * Turn an array of points into a path of quadradic curves.
   *
   * @param stroke ;
   */
  static getSvgPathFromStroke(points: number[][], closed = true): string {
    const len = points.length

    if (len < 4) {
      return ``
    }

    let a = points[0]
    let b = points[1]
    const c = points[2]

    let result = `M${a[0].toFixed(2)},${a[1].toFixed(2)} Q${b[0].toFixed(2)},${b[1].toFixed(
      2
    )} ${average(b[0], c[0]).toFixed(2)},${average(b[1], c[1]).toFixed(2)} T`

    for (let i = 2, max = len - 1; i < max; i++) {
      a = points[i]
      b = points[i + 1]
      result += `${average(a[0], b[0]).toFixed(2)},${average(a[1], b[1]).toFixed(2)} `
    }

    if (closed) {
      result += 'Z'
    }

    return result
  }

  /**
   * Turn an array of stroke points into a path of quadradic curves.
   *
   * @param points - The stroke points returned from perfect-freehand
   */
  static getSvgPathFromStrokePoints(points: StrokePoint[], closed = false): string {
    const len = points.length

    if (len < 4) {
      return ``
    }

    let a = points[0].point
    let b = points[1].point
    const c = points[2].point

    let result = `M${a[0].toFixed(2)},${a[1].toFixed(2)} Q${b[0].toFixed(2)},${b[1].toFixed(
      2
    )} ${average(b[0], c[0]).toFixed(2)},${average(b[1], c[1]).toFixed(2)} T`

    for (let i = 2, max = len - 1; i < max; i++) {
      a = points[i].point
      b = points[i + 1].point
      result += `${average(a[0], b[0]).toFixed(2)},${average(a[1], b[1]).toFixed(2)} `
    }

    if (closed) {
      result += 'Z'
    }

    return result
  }
}

function average(a: number, b: number): number {
  return (a + b) / 2
}
