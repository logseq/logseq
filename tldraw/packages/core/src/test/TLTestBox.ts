import { TLShape } from '~lib'

export class TLTestBox extends TLShape {
  static id = 'box'
  getBounds = () => ({
    minX: this.props.point[0],
    minY: this.props.point[1],
    maxX: this.props.point[0] + 100,
    maxY: this.props.point[1] + 100,
    width: 100,
    height: 100,
  })
}
