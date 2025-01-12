export default class QueueEvent extends Event {
  constructor(type, detail) {
    super(type)
    this.detail = detail
  }
}
