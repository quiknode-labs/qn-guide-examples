import { EventEmitter } from 'events'

let lastActivityTime: Date | null = null

export const activityEmitter = new EventEmitter()
activityEmitter.setMaxListeners(100)

activityEmitter.on('activity', () => {
  lastActivityTime = new Date()
})

export function getLastActivityTime(): Date | null {
  return lastActivityTime
}
