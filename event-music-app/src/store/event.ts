import { defineStore } from 'pinia'

export interface Event {
  id: string
  organizer: string
  location: {
    name: string
    lat: number
    lng: number
  }
  date: string
  time: string
  content: string
  poster: string
}

export const useEventStore = defineStore('event', {
  state: () => ({
    events: [] as Event[]
  }),
  
  actions: {
    addEvent(event: Omit<Event, 'id'>) {
      const newEvent = {
        ...event,
        id: Date.now().toString()
      }
      
      this.events.push(newEvent)
      
      // Save to localStorage
      this.saveEvents()
      
      return newEvent
    },
    
    updateEvent(id: string, eventData: Partial<Event>) {
      const index = this.events.findIndex(event => event.id === id)
      
      if (index !== -1) {
        this.events[index] = {
          ...this.events[index],
          ...eventData
        }
        
        // Save to localStorage
        this.saveEvents()
        
        return true
      }
      
      return false
    },
    
    deleteEvent(id: string) {
      const index = this.events.findIndex(event => event.id === id)
      
      if (index !== -1) {
        this.events.splice(index, 1)
        
        // Save to localStorage
        this.saveEvents()
        
        return true
      }
      
      return false
    },
    
    loadEvents() {
      const storedEvents = localStorage.getItem('events')
      
      if (storedEvents) {
        this.events = JSON.parse(storedEvents)
      }
    },
    
    saveEvents() {
      localStorage.setItem('events', JSON.stringify(this.events))
    }
  }
})