import QueueEvent from './QueueEvent.js'

export default class Queue extends EventTarget {
  static EVENTS = {
    ADD: 'add',
    CLEAR: 'clear',
    DONE: 'done',
    END: 'end',
    EXECUTE: 'execute',
    FAIL: 'fail',
    INFO: 'info',
    NEXT: 'next',
    PAUSE: 'pause',
    START: 'start',
    WAIT: 'wait'
  }

  static STATES = {
    PAUSED: 'paused',
    RUNNING: 'running',
    WAITING: 'waiting'
  }

  static ERRORS = {
    EMPTY: 'EMPTY',
    NOTSTART: 'NOTSTART',
    UNNAMED: 'UNNAMED'
  }

  options = {
    auto: true,
    delay: 0,
    events: [],
    id: 'Queue',
    jobs: [],
    throw: true
  }

  constructor(options = {}) {
    super()

    Object.assign(this, this.options, options)
    this.events.forEach(({ type, listener }) => this.on(type, listener))

    this.current = null
    this.last = 0
    this.state = Queue.STATES.WAITING

    queueMicrotask(() => {
      this.isEmpty && this.event(Queue.EVENTS.WAIT)
      this.auto && this.start()
    })
  }

  get isEmpty() {
    return this.size <= 0
  }

  get isPaused() {
    return this.state === Queue.STATES.PAUSED
  }

  get isRunning() {
    return this.state === Queue.STATES.RUNNING
  }

  get isWaiting() {
    return this.state === Queue.STATES.WAITING
  }

  get size() {
    return this.jobs.length
  }

  get timeout() {
    return Math.max(0, this.delay - (Date.now() - this.last))
  }

  event(type, detail = {}) {
    this.dispatchEvent(new QueueEvent(type, {
      ...detail,
      type,
      id: this.id
    }))
  }

  on(type, listener) {
    this.addEventListener(type, listener)
  }

  off(type, listener) {
    this.removeEventListener(type, listener)
  }

  add(...jobs) {
    this.jobs.push(...jobs)
    this.event(Queue.EVENTS.ADD, { count: jobs.length })
    this.auto && this.isWaiting && this.start()
  }

  back() {
    this.current && this.jobs.unshift(this.current)
  }

  clear() {
    const count = this.size

    this.jobs = []
    this.current = null
    this.state = Queue.STATES.WAITING

    this.event(Queue.EVENTS.CLEAR, { count })
  }

  pause() {
    this.state = Queue.STATES.PAUSED
    this.event(Queue.EVENTS.PAUSE)
  }

  take() {
    return this.jobs.shift()
  }

  start() {
    if (this.isRunning || this.isEmpty) {
      this.event(Queue.EVENTS.INFO, { message: Queue.ERRORS.NOTSTART })
      return
    }

    this.event(Queue.EVENTS.START, { count: this.size })
    this.state = Queue.STATES.RUNNING

    queueMicrotask(async () => {
      while (!this.isPaused && !this.isEmpty) {
        await this.next()
      }
    })
  }

  finalize() {
    this.last = Date.now()
    this.current = null

    if (this.isEmpty) {
      this.state = Queue.STATES.WAITING

      this.event(Queue.EVENTS.END)
      this.event(Queue.EVENTS.WAIT)
    }
  }

  next() {
    if (this.isEmpty) {
      this.event(Queue.EVENTS.INFO, { message: Queue.ERRORS.EMPTY })
      return
    }

    this.event(Queue.EVENTS.NEXT)
    this.current = this.take()

    return this.executeWithTimeout(this.current).finally(() => this.finalize())
  }

  executeWithTimeout(job) {
    return new Promise(resolve =>
      setTimeout(() => resolve(this.execute(job)), this.timeout)
    )
  }

  execute(job) {
    const name = job?.name || Queue.ERRORS.UNNAMED
    this.event(Queue.EVENTS.EXECUTE, { name })

    return Promise.try(job)
      .then(result => {
        this.event(Queue.EVENTS.DONE, { name, result })
        return { result }
      })
      .catch(error => {
        this.event(Queue.EVENTS.FAIL, { name, error })
        return !this.auto && this.throw ? Promise.reject(error) : { error }
      })
  }
}
