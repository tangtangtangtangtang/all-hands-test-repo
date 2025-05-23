import { defineStore } from 'pinia'
import { authAPI } from '../api'

interface User {
  username: string
  token: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    isAuthenticated: false,
    loading: false,
    error: null as string | null
  }),
  
  actions: {
    async login(username: string, password: string) {
      this.loading = true
      this.error = null
      
      try {
        // Call the login API
        const response = await authAPI.login(username, password)
        
        // Check if login was successful (status 200)
        if (response && response.status === 200) {
          // Create user object from response
          const user = {
            username: username,
            token: response.token || 'demo-token-' + Math.random().toString(36).substring(2)
          }
          
          this.user = user
          this.isAuthenticated = true
          
          // Store authentication state in localStorage for persistence
          localStorage.setItem('user', JSON.stringify(user))
          localStorage.setItem('isAuthenticated', 'true')
          
          this.loading = false
          return true
        } else {
          throw new Error('Login failed')
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Login failed'
        this.loading = false
        return false
      }
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