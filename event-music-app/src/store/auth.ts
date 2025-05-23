import { defineStore } from 'pinia'

interface User {
  username: string
  token: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    isAuthenticated: false
  }),
  
  actions: {
    login(username: string, password: string) {
      // In a real app, you would make an API call here
      // For this demo, we'll just simulate a successful login
      if (username && password) {
        const user = {
          username,
          token: 'demo-token-' + Math.random().toString(36).substring(2)
        }
        
        this.user = user
        this.isAuthenticated = true
        
        // Store authentication state in localStorage for persistence
        localStorage.setItem('user', JSON.stringify(user))
        localStorage.setItem('isAuthenticated', 'true')
        
        return true
      }
      return false
    },
    
    logout() {
      this.user = null
      this.isAuthenticated = false
      
      // Clear authentication state from localStorage
      localStorage.removeItem('user')
      localStorage.removeItem('isAuthenticated')
    },
    
    checkAuth() {
      const storedUser = localStorage.getItem('user')
      const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
      
      if (storedUser && isAuthenticated) {
        this.user = JSON.parse(storedUser)
        this.isAuthenticated = true
      }
    }
  }
})