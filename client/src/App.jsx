import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

// FIXED: Absolute URL for all networks
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
      const [postsRes, accountsRes, conversationsRes] = await Promise.all([
        axios.get(`${API_BASE}/posts`),
        axios.get(`${API_BASE}/social-accounts`),
        axios.get(`${API_BASE}/conversations`)
      ])
      
      setPosts(postsRes.data.posts || [])
      setSocialAccounts(accountsRes.data.accounts || [])
      setConversations(conversationsRes.data.conversations || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      if (error.response?.status === 401) {
        handleLogout()
      }
    }
  }

  const handleLogin = async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, {
        email,
        password
      })
      
      setToken(response.data.token)
      setUser(response.data.user)
      localStorage.setItem('token', response.data.token)
    } catch (error) {
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
          <Dashboard posts={posts} accounts={socialAccounts} />
        )}
        {activeTab === 'posts' && (
          <PostsManager posts={posts} onUpdate={fetchUserData} />
        )}
        {activeTab === 'accounts' && (
          <AccountsManager accounts={socialAccounts} />
        )}
        {activeTab === 'conversations' && (
          <ConversationsManager conversations={conversations} />
        )}
        {activeTab === 'calendar' && (
          <CalendarView />
        )}
      </main>
    </div>
  )
}

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

function Dashboard({ posts, accounts }) {
  return (
    <div className="dashboard">
      <h2>📊 Dashboard</h2>
      <div className="stats">
        <div className="stat-card">
          <h3>Total Posts</h3>
          <p>{posts.length}</p>
        </div>
        <div className="stat-card">
          <h3>Social Accounts</h3>
          <p>{accounts.length}</p>
        </div>
      </div>
    </div>
  )
}

function PostsManager({ posts, onUpdate }) {
  return (
    <div className="posts-manager">
      <h2>📝 Posts Management</h2>
      <p>Total Posts: {posts.length}</p>
    </div>
  )
}

function AccountsManager({ accounts }) {
  return (
    <div className="accounts-manager">
      <h2>👥 Accounts Management</h2>
      <p>Connected Accounts: {accounts.length}</p>
    </div>
  )
}

function ConversationsManager({ conversations }) {
  return (
    <div className="conversations-manager">
      <h2>💬 AI Conversations</h2>
      <p>Total Conversations: {conversations.length}</p>
    </div>
  )
}

function CalendarView() {
  return (
    <div className="calendar-view">
      <h2>📅 Calendar View</h2>
      <p>Calendar functionality</p>
    </div>
  )
}

export default App
