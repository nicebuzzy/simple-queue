import { beforeAll, describe, expect, test, vi } from "vitest"
import Queue from "./src/Queue.js"

describe('Auto is true', () => {
  const firedEvents = []

  const queue = new Queue({
    auto: true
  })

  beforeAll(() => {
    queue.on(Queue.EVENTS.WAIT, (e) => {
      firedEvents.push(e.detail.type)
    })

    queue.on(Queue.EVENTS.START, (e) => {
      firedEvents.push(e.detail.type)
    })

    queue.on(Queue.EVENTS.ADD, (e) => {
      firedEvents.push(e.detail.type)
    })

    queue.on(Queue.EVENTS.NEXT, (e) => {
      firedEvents.push(e.detail.type)
    })

    queue.on(Queue.EVENTS.DONE, (e) => {
      firedEvents.push(e.detail.type)
    })

    queue.on(Queue.EVENTS.FAIL, (e) => {
      firedEvents.push(e.detail.type)
    })

    queue.on(Queue.EVENTS.END, (e) => {
      firedEvents.push(e.detail.type)
    })

    queue.add(
      () => { return Promise.resolve('Job done') },
      () => { return Promise.reject('Job failed') }
    )
  })

  test('State is running', async () => {
    expect(queue.state).toBe(Queue.STATES.RUNNING)
  })

  test('Events are fired in the correct order', async () => {
    await vi.waitUntil(() => queue.state === Queue.STATES.WAITING)

    expect(firedEvents).toEqual([
      Queue.EVENTS.ADD,
      Queue.EVENTS.START,
      Queue.EVENTS.NEXT,
      Queue.EVENTS.DONE,
      Queue.EVENTS.NEXT,
      Queue.EVENTS.FAIL,
      Queue.EVENTS.END,
      Queue.EVENTS.WAIT
    ])
  })
})

describe('Auto is false', () => {
  const queue = new Queue({ auto: false, throw: true })

  test('State is waiting', () => {
    expect(queue.state).toBe(Queue.STATES.WAITING)
  })

  test('Add jobs by one', () => {
    queue.add(() => { return 1 })
    expect(queue.size).toBe(1)

    queue.add(() => { return 2 })
    expect(queue.size).toBe(2)
  })

  test('Add multiple jobs', () => {
    queue.add(() => { return 3 }, () => { return 4 }, () => { return 5 })
    expect(queue.size).toBe(5)
  })

  test('Loop through jobs', async () => {
    let index = 0

    while (queue.size > 0) {
      const { result } = await queue.next()
      expect(result).toBe(++index)
    }

    expect(queue.size).toBe(0)
  })

  test('Job resolve', async () => {
    queue.add(() => Promise.resolve('Job done'))
    const { result } = await queue.next()
    expect(result).toBe('Job done')
  })

  test('Job reject, throw is true', async () => {
    queue.throw = true
    queue.add(() => Promise.reject(new Error('Job failed')))

    try {
      await queue.next()
    } catch (error) {
      expect(error.message).toBe('Job failed')
    }
  })

  test('Job reject, throw is false', async () => {
    queue.throw = false
    queue.add(async () => Promise.reject('Job failed'))

    const { error } = await queue.next()
    expect(error).toBe('Job failed')
  })
})
