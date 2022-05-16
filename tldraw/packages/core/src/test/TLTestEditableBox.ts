import { BoxShape } from '~lib/shapes/TLBoxShape/TLBoxShape.test'

export class TLTestEditableBox extends BoxShape {
  static id = 'editable-box'
  canEdit = true
}
