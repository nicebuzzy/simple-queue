# Simple Queue

## Overview

Simple Queue manages job queues in Node.js and browsers, supporting both automatic and manual modes with event emission.

---

## Installation

### Node

```bash
npm i @nicebuzzy/simple-queue
```

### Browser

```html
<script type="module">
  import Queue from 'https://esm.run/@nicebuzzy/simple-queue'
</script>
```

---

## Usage

### Define Jobs

Jobs are functions that perform tasks:

```js
const jobs = [
  () => Promise.resolve('Job done.'),
  () => Promise.reject('Job failed.')
]
```

### Auto Mode

In auto mode, the queue automatically processes jobs as they are added:

```js
const queue = new Queue()

queue.add(...jobs)
```

### Manual Mode

In manual mode, processing of each job is handled directly:

```js
const queue = new Queue({ auto: false })

queue.add(...jobs)

while (queue.size > 0) {
  try {
    const { result } = await queue.next()
  } catch (error) {
    console.error(error)
  }
}
```

If the `throw` option is set to `false`, the queue will return an object containing an `error` property.

```js
while (queue.size > 0) {
  const { result, error } = await queue.next()

  if (error) {
    console.error(error)
  }
}
```

---

## Events

### Event Types

- `add` - A job has been added.
- `clear` - The queue has been cleared.
- `done` - A job has been completed.
- `end` - The queue has finished processing.
- `execute` - A job execution has started.
- `fail` - A job has failed.
- `info` - Informational message emitted.
- `next` - The next job has started.
- `pause` - The queue has been paused.
- `start` - The queue has started.
- `wait` - The queue is waiting for jobs.

### Event Properties

Each event provides the following properties:

| Property | Description |
| --- | --- |
| `id` | Queue identifier. |
| `type` | Event name. |

Additional properties for specific events:

| Event    | Property                     |
| ---      | ---                          |
| `add`    | `count` (number of jobs added) |
| `clear`  | `count` (number of jobs removed) |
| `done`   | `name`, `result`             |
| `execute`| `name`                       |
| `fail`   | `name`, `error`              |
| `info`   | `message`                    |
| `start`  | `count` (total jobs to process) |

### Example

```js
queue.on(Queue.EVENTS.ADD, ({ count }) => {
  console.log(`Added ${count} jobs to the queue.`)
})

queue.on(Queue.EVENTS.CLEAR, ({ id, count }) => {
  console.log(`Queue ${id} has been cleared. ${count} jobs removed.`)
})

queue.on(Queue.EVENTS.DONE, ({ name, result }) => {
  console.log(`Job ${name} completed successfully. Result: ${result}`)
})

queue.on(Queue.EVENTS.FAIL, ({ name, error }) => {
  console.error(`Job ${name} failed with error: ${error.message}`)
})
```

---

## API Reference

### Constructor

Create a new queue with optional settings:

```js
const queue = new Queue({ delay: 100 })
```

| Option  | Type    | Default | Description                          |
| ---     | ---     | ---     | ---                                  |
| `auto`  | boolean | `true`  | Automatically start job processing. |
| `delay` | number  | `0`     | Delay between jobs in milliseconds. |
| `events`| array   | `[]`    | Initial set of event listeners.         |
| `id`    | string  | `Queue` | Unique queue identifier.            |
| `jobs`  | array   | `[]`    | Initial set of jobs.                |
| `throw` | boolean | `true` | In manual mode, errors are thrown by default on failed jobs. When `throw` is set to `false`, an object with an `error` property is returned. |


### Methods

#### `queue.add(...jobs)`

Adds jobs to the end of the queue:

```js
queue.add(() => Promise.resolve('Job done.'))
```

#### `queue.back()`

Moves the current job to the front of the queue.

#### `queue.clear()`

Clears all jobs and stops the queue (if in auto mode).

#### `queue.event(type, detail)`

Emits an event:

```js
queue.event('event', { message: 'Event triggered.' })
```

#### `queue.next()`

Executes the next job and returns a Promise resolved with a `result` or `error` property. If `throw` is set to `true`, an error is thrown on failure.

#### `queue.on(type, listener)`

Adds an event listener:

```js
queue.on('done', ({ name, result }) => {
  console.log(`Job ${name} completed successfully. Result: ${result}`)
})
```

#### `queue.pause()`

Pauses job processing.

#### `queue.start()`

Starts or resumes job processing.

#### `queue.take()`

Takes the first job from the queue.

### Properties

#### `queue.isEmpty`

`true` if the queue is empty.

#### `queue.isPaused`

`true` if the queue is paused.

#### `queue.isRunning`

`true` if the queue is currently processing jobs.

#### `queue.isWaiting`

`true` if the queue is waiting for jobs.

#### `queue.size`

The number of jobs in the queue.

#### `queue.state`

The current queue state.

#### `queue.timeout`

The time in milliseconds until the next job is executed.

---
