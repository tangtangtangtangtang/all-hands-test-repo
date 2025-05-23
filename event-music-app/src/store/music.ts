import { defineStore } from 'pinia'

export interface Song {
  id: string
  name: string
  file: File | null
  url: string
}

export const useMusicStore = defineStore('music', {
  state: () => ({
    songs: [] as Song[],
    currentSong: null as Song | null,
    isPlaying: false,
    shuffleMode: true,
    transitionSong: null as Song | null,
    playQueue: [] as Song[]
  }),
  
  actions: {
    addSong(file: File) {
      const url = URL.createObjectURL(file)
      const newSong = {
        id: Date.now().toString(),
        name: file.name,
        file,
        url
      }
      
      this.songs.push(newSong)
      
      // If this is the first song, set it as current
      if (this.songs.length === 1) {
        this.currentSong = newSong
      }
      
      // Update play queue
      this.generatePlayQueue()
      
      return newSong
    },
    
    removeSong(id: string) {
      const index = this.songs.findIndex(song => song.id === id)
      
      if (index !== -1) {
        // If removing current song, set next song as current
        if (this.currentSong && this.currentSong.id === id) {
          this.playNext()
        }
        
        // Revoke object URL to free memory
        URL.revokeObjectURL(this.songs[index].url)
        
        this.songs.splice(index, 1)
        
        // Update play queue
        this.generatePlayQueue()
        
        return true
      }
      
      return false
    },
    
    setTransitionSong(song: Song | null) {
      this.transitionSong = song
    },
    
    play() {
      this.isPlaying = true
    },
    
    pause() {
      this.isPlaying = false
    },
    
    playNext() {
      if (this.playQueue.length === 0) {
        this.generatePlayQueue()
      }
      
      if (this.playQueue.length > 0) {
        // Play transition song first if set
        if (this.transitionSong) {
          const nextSong = this.playQueue.shift()
          if (nextSong) {
            // Save the next song to play after transition
            const tempQueue = [...this.playQueue]
            
            // Clear queue and add transition + next song
            this.playQueue = []
            this.currentSong = this.transitionSong
            this.play()
            
            // After transition, play the next song and restore queue
            setTimeout(() => {
              this.currentSong = nextSong
              this.playQueue = tempQueue
            }, 0) // In a real app, this would be the duration of the transition song
          }
        } else {
          // Play next song directly
          const nextSong = this.playQueue.shift()
          if (nextSong) {
            this.currentSong = nextSong
            this.play()
          }
        }
      }
    },
    
    generatePlayQueue() {
      // Create a copy of songs array
      const queue = [...this.songs]
      
      // Remove current song from queue if it exists
      if (this.currentSong) {
        const currentIndex = queue.findIndex(song => song.id === this.currentSong?.id)
        if (currentIndex !== -1) {
          queue.splice(currentIndex, 1)
        }
      }
      
      // Shuffle the queue if shuffle mode is on
      if (this.shuffleMode) {
        for (let i = queue.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[queue[i], queue[j]] = [queue[j], queue[i]]
        }
      }
      
      this.playQueue = queue
    },
    
    toggleShuffle() {
      this.shuffleMode = !this.shuffleMode
      this.generatePlayQueue()
    },
    
    clearSongs() {
      // Revoke all object URLs to free memory
      this.songs.forEach(song => {
        URL.revokeObjectURL(song.url)
      })
      
      this.songs = []
      this.currentSong = null
      this.isPlaying = false
      this.playQueue = []
    }
  }
})