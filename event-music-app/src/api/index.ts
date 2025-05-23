import axios from 'axios'

// Create axios instance
const api = axios.create({
  // 在开发环境中使用代理，在生产环境中使用完整 URL
  baseURL: import.meta.env.DEV ? '/api' : 'https://kpop-events.uk/api',
  timeout: 10000
})

// Request interceptor
api.interceptors.request.use(
  config => {
    // Get token from localStorage
    const token = localStorage.getItem('token')
    
    // Add token to headers if it exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    // Handle errors
    if (error.response) {
      // Server responded with an error status
      console.error('API Error:', error.response.data)
      
      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        // Clear authentication and redirect to login
        localStorage.removeItem('user')
        localStorage.removeItem('isAuthenticated')
        window.location.href = '/login'
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('API Error: No response received', error.request)
    } else {
      // Something else happened
      console.error('API Error:', error.message)
    }
    
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (username: string, password: string) => {
    return api.post('/organizer/login', { username, password })
  },
  
  logout: () => {
    return api.post('/organizer/logout')
  }
}

// Events API
export const eventsAPI = {
  getEvents: () => {
    return api.get('/events')
  },
  
  getEvent: (id: string) => {
    return api.get(`/events/${id}`)
  },
  
  createEvent: (eventData: any) => {
    return api.post('/events', eventData)
  },
  
  updateEvent: (id: string, eventData: any) => {
    return api.put(`/events/${id}`, eventData)
  },
  
  deleteEvent: (id: string) => {
    return api.delete(`/events/${id}`)
  }
}

export default api