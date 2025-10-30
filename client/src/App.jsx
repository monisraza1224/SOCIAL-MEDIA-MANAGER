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
          <ProfessionalDashboard posts={posts} socialAccounts={socialAccounts} conversations={conversations} />
        )}
        {activeTab === 'calendar' && (
          <CalendarView posts={posts} />
        )}
        {activeTab === 'posts' && (
          <PostsManager 
            posts={posts} 
            socialAccounts={socialAccounts}
            onPostCreated={fetchUserData}
          />
        )}
        {activeTab === 'accounts' && (
          <AccountsManager 
            accounts={socialAccounts} 
            onAccountsUpdate={fetchUserData} 
          />
        )}
        {activeTab === 'conversations' && (
          <ConversationsManager 
            conversations={conversations} 
            onConversationsUpdate={fetchUserData} 
          />
        )}
      </main>
    </div>
  )
}

// Login Component
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

// Professional Dashboard Component
function ProfessionalDashboard({ posts, socialAccounts, conversations }) {
  const scheduledPosts = posts.filter(post => post.status === 'scheduled')
  const publishedPosts = posts.filter(post => post.status === 'published')

  return (
    <div className="professional-dashboard">
      <div className="dashboard-header">
        <h2>📊 Dashboard Overview</h2>
        <div className="date-range">
          <span>Last 30 Days</span>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="stats-grid-pro">
        <div className="stat-card-pro primary">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Total Posts</h3>
            <p className="stat-number">{posts.length}</p>
            <span className="stat-trend">Ready to schedule</span>
          </div>
        </div>

        <div className="stat-card-pro success">
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <h3>Scheduled</h3>
            <p className="stat-number">{scheduledPosts.length}</p>
            <span className="stat-trend">Ready to publish</span>
          </div>
        </div>

        <div className="stat-card-pro warning">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>Published</h3>
            <p className="stat-number">{publishedPosts.length}</p>
            <span className="stat-trend">Live across platforms</span>
          </div>
        </div>

        <div className="stat-card-pro info">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Social Accounts</h3>
            <p className="stat-number">{socialAccounts.length}</p>
            <span className="stat-trend">Connected platforms</span>
          </div>
        </div>
      </div>

      <div className="dashboard-content-pro">
        <div className="content-column">
          <div className="content-card">
            <div className="card-header">
              <h3>📅 Recent Scheduled Posts</h3>
              <span className="badge">{scheduledPosts.length}</span>
            </div>
            <div className="card-content">
              {scheduledPosts.slice(0, 5).map(post => (
                <div key={post.id} className="post-item-pro">
                  <div className="post-preview">
                    <div className="post-avatar">
                      {post.mediaType === 'text' ? '📝' : 
                       post.mediaType === 'image' ? '🖼️' :
                       post.mediaType === 'video' ? '🎥' : '📊'}
                    </div>
                    <div className="post-details">
                      <strong>{post.title}</strong>
                      <span className="post-time">
                        {new Date(post.scheduledFor).toLocaleDateString()} • 
                        {new Date(post.scheduledFor).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {scheduledPosts.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">📝</div>
                  <p>No scheduled posts yet</p>
                  <small>Create your first post to see it here</small>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="content-column">
          <div className="content-card">
            <div className="card-header">
              <h3>🚀 Quick Actions</h3>
            </div>
            <div className="card-content">
              <div className="quick-actions">
                <button className="action-btn primary">
                  <span>📝</span>
                  Create New Post
                </button>
                <button className="action-btn success">
                  <span>👥</span>
                  Manage Accounts
                </button>
                <button className="action-btn warning">
                  <span>📅</span>
                  View Calendar
                </button>
                <button className="action-btn info">
                  <span>📊</span>
                  View Analytics
                </button>
              </div>
            </div>
          </div>

          <div className="content-card">
            <div className="card-header">
              <h3>💬 Recent Activity</h3>
            </div>
            <div className="card-content">
              <div className="activity-list">
                <div className="activity-item">
                  <div className="activity-icon">✅</div>
                  <div className="activity-details">
                    <strong>Login successful</strong>
                    <span>Just now</span>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-icon">🚀</div>
                  <div className="activity-details">
                    <strong>System ready</strong>
                    <span>All features available</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Posts Manager Component
function PostsManager({ posts, socialAccounts, onPostCreated }) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    mediaType: 'text',
    scheduledFor: ''
  })

  const handleCreatePost = async (e) => {
    e.preventDefault()
    try {
      await axios.post(`${API_BASE}/posts`, newPost)
      setShowCreateForm(false)
      setNewPost({ title: '', content: '', mediaType: 'text', scheduledFor: '' })
      onPostCreated()
      alert('✅ Post created successfully!')
    } catch (error) {
      alert('Error creating post: ' + error.message)
    }
  }

  return (
    <div className="posts-manager">
      <div className="posts-header">
        <h2>📝 Posts Management</h2>
        <button 
          className="create-post-btn"
          onClick={() => setShowCreateForm(true)}
        >
          + Create New Post
        </button>
      </div>

      {showCreateForm && (
        <div className="create-post-modal">
          <div className="modal-content">
            <h3>Create New Post</h3>
            <form onSubmit={handleCreatePost}>
              <input
                type="text"
                placeholder="Post Title"
                value={newPost.title}
                onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                required
              />
              <textarea
                placeholder="Post Content"
                value={newPost.content}
                onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                required
              />
              <input
                type="datetime-local"
                value={newPost.scheduledFor}
                onChange={(e) => setNewPost({...newPost, scheduledFor: e.target.value})}
                required
              />
              <button type="submit">Schedule Post</button>
            </form>
          </div>
        </div>
      )}

      <div className="posts-list">
        <h3>Your Posts ({posts.length})</h3>
        {posts.length === 0 ? (
          <p>No posts yet. Create your first post!</p>
        ) : (
          posts.map(post => (
            <div key={post.id} className="post-card">
              <h4>{post.title}</h4>
              <p>{post.content}</p>
              <span>Scheduled: {new Date(post.scheduledFor).toLocaleString()}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// Other Components (Simplified)
function CalendarView({ posts }) {
  return (
    <div className="calendar-view">
      <h2>📅 Calendar View</h2>
      <p>Calendar functionality - Ready for integration</p>
    </div>
  )
}

function AccountsManager({ accounts, onAccountsUpdate }) {
  return (
    <div className="accounts-manager">
      <h2>👥 Accounts Management</h2>
      <p>Manage your social media accounts - Ready for integration</p>
    </div>
  )
}

function ConversationsManager({ conversations, onConversationsUpdate }) {
  return (
    <div className="conversations-manager">
      <h2>💬 AI Conversations</h2>
      <p>AI-powered messaging system - Ready for integration</p>
    </div>
  )
}

export default App
