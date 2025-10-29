import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

// FIXED: Use the correct production backend URL
const API_BASE = 'https://social-media-manager-2.onrender.com/api'

function App() {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [posts, setPosts] = useState([])
  const [socialAccounts, setSocialAccounts] = useState([])
  const [conversations, setConversations] = useState([])
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchUserData()
    }
  }, [token])

  const fetchUserData = async () => {
    try {
      const postsResponse = await axios.get(`${API_BASE}/posts`)
      setPosts(postsResponse.data.posts)

      const accountsResponse = await axios.get(`${API_BASE}/social-accounts`)
      setSocialAccounts(accountsResponse.data.accounts)

      const conversationsResponse = await axios.get(`${API_BASE}/conversations`)
      setConversations(conversationsResponse.data.conversations)
    } catch (error) {
      console.error('Error fetching data:', error)
      if (error.response?.status === 401) {
        handleLogout()
      }
    }
  }

  const handleLogin = async (email, password) => {
    try {
      console.log('🔄 Attempting login to:', API_BASE)
      const response = await axios.post(`${API_BASE}/auth/login`, {
        email,
        password
      })
      
      setToken(response.data.token)
      setUser(response.data.user)
      localStorage.setItem('token', response.data.token)
      console.log('✅ Login successful')
    } catch (error) {
      console.error('❌ Login failed:', error)
      alert('Login failed: ' + (error.response?.data?.message || error.message))
    }
  }

  const handleLogout = () => {
    setUser(null)
    setToken(null)
    setPosts([])
    setSocialAccounts([])
    setConversations([])
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <div className="app">
      <Header user={user} onLogout={handleLogout} />
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="main-content">
        {activeTab === 'dashboard' && (
          <div className="dashboard-placeholder">
            <h2>📊 Dashboard</h2>
            <p>Dashboard will load after successful login</p>
          </div>
        )}
        {activeTab === 'calendar' && (
          <div className="calendar-placeholder">
            <h2>📅 Calendar View</h2>
            <p>Calendar functionality - Coming soon</p>
          </div>
        )}
        {activeTab === 'posts' && (
          <div className="posts-placeholder">
            <h2>📝 Posts Management</h2>
            <p>Post management will load after successful login</p>
          </div>
        )}
        {activeTab === 'accounts' && (
          <div className="accounts-placeholder">
            <h2>👥 Accounts Management</h2>
            <p>Account management will load after successful login</p>
          </div>
        )}
        {activeTab === 'conversations' && (
          <div className="conversations-placeholder">
            <h2>💬 AI Conversations</h2>
            <p>Conversations will load after successful login</p>
          </div>
        )}
      </main>
    </div>
  )
}

// Login Component - ONLY ONE VERSION
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('admin@test.com')
  const [password, setPassword] = useState('password123')

  const handleSubmit = (e) => {
    e.preventDefault()
    onLogin(email, password)
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Social Media Manager</h1>
        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Login</button>
        </form>
        <p className="demo-credentials">
          Demo: admin@test.com / password123
        </p>
      </div>
    </div>
  )
}

// Header Component
function Header({ user, onLogout }) {
  return (
    <header className="header">
      <div className="header-content">
        <h1>🚀 Social Media Manager</h1>
        <div className="user-info">
          <span>Welcome, {user.username}</span>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </div>
    </header>
  )
}

// Navigation Component
function Navigation({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'calendar', label: '📅 Calendar' },
    { id: 'posts', label: '📝 Posts' },
    { id: 'accounts', label: '👥 Accounts' },
    { id: 'conversations', label: '💬 Messages' }
  ]

  return (
    <nav className="navigation">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}

export default App
