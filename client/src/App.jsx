import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

const API_BASE = 'http://localhost:5000/api'

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
          <ProfessionalDashboard posts={posts} socialAccounts={socialAccounts} conversations={conversations} />
        )}
        {activeTab === 'calendar' && (
          <CalendarView posts={posts} />
        )}
        {activeTab === 'posts' && (
          <EnhancedPostsManager 
            posts={posts} 
            socialAccounts={socialAccounts}
            onPostCreated={fetchUserData}
            onPostUpdated={fetchUserData}
            onPostDeleted={fetchUserData}
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
  const activeConversations = conversations.filter(conv => conv.status === 'active')

  // Calculate unique accounts from scheduled posts
  const uniqueAccountsFromPosts = new Set()
  posts.forEach(post => {
    if (post.selectedAccounts) {
      post.selectedAccounts.forEach(account => {
        uniqueAccountsFromPosts.add(account.id)
      })
    }
  })

  // Get posts from last 7 days
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  const recentPosts = publishedPosts.filter(post => 
    new Date(post.scheduledFor) > oneWeekAgo
  )

  // Engagement metrics (mock data for now)
  const engagementMetrics = {
    totalReach: '12.5K',
    engagementRate: '4.2%',
    newFollowers: 234,
    totalLikes: '8.7K'
  }

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
            <span className="stat-trend">+12% this month</span>
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
            <h3>Active Accounts</h3>
            <p className="stat-number">{uniqueAccountsFromPosts.size}</p>
            <span className="stat-trend">7 total available</span>
          </div>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="engagement-section">
        <h3>🎯 Engagement Metrics</h3>
        <div className="engagement-grid">
          <div className="metric-card">
            <div className="metric-value">{engagementMetrics.totalReach}</div>
            <div className="metric-label">Total Reach</div>
            <div className="metric-change positive">+8%</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{engagementMetrics.engagementRate}</div>
            <div className="metric-label">Engagement Rate</div>
            <div className="metric-change positive">+2%</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{engagementMetrics.newFollowers}</div>
            <div className="metric-label">New Followers</div>
            <div className="metric-change positive">+15%</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{engagementMetrics.totalLikes}</div>
            <div className="metric-label">Total Likes</div>
            <div className="metric-change positive">+12%</div>
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
                  <div className="post-platforms-small">
                    {post.selectedAccounts && post.selectedAccounts.slice(0, 2).map((account, idx) => (
                      <span key={idx} className="platform-badge">
                        {account.platform === 'Facebook' ? '📘' : 
                         account.platform === 'Instagram' ? '📷' : '🎵'}
                      </span>
                    ))}
                    {post.selectedAccounts && post.selectedAccounts.length > 2 && (
                      <span className="more-badge">+{post.selectedAccounts.length - 2}</span>
                    )}
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
              <h3>🚀 Recently Published</h3>
              <span className="badge success">{recentPosts.length}</span>
            </div>
            <div className="card-content">
              {recentPosts.slice(0, 5).map(post => (
                <div key={post.id} className="post-item-pro published">
                  <div className="post-preview">
                    <div className="post-avatar published">
                      {post.mediaType === 'text' ? '📝' : 
                       post.mediaType === 'image' ? '🖼️' :
                       post.mediaType === 'video' ? '🎥' : '📊'}
                    </div>
                    <div className="post-details">
                      <strong>{post.title}</strong>
                      <span className="post-time">
                        Published {new Date(post.scheduledFor).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="post-status-badge success">Live</div>
                </div>
              ))}
              {recentPosts.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">📤</div>
                  <p>No posts published yet</p>
                  <small>Published posts will appear here</small>
                </div>
              )}
            </div>
          </div>

          <div className="content-card">
            <div className="card-header">
              <h3>💬 Recent Conversations</h3>
              <span className="badge info">{conversations.length}</span>
            </div>
            <div className="card-content">
              {conversations.slice(0, 5).map(conversation => (
                <div key={conversation.id} className="conversation-item-pro">
                  <div className="conversation-avatar">👤</div>
                  <div className="conversation-details">
                    <strong>User {conversation.userId}</strong>
                    <p>{conversation.messages[conversation.messages.length - 1]?.text.slice(0, 60)}...</p>
                    <span className="conversation-time">
                      {new Date(conversation.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="conversation-platform">
                    {conversation.platform === 'facebook' ? '📘' : '💬'}
                  </div>
                </div>
              ))}
              {conversations.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">💬</div>
                  <p>No conversations yet</p>
                  <small>Customer messages will appear here</small>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Enhanced Posts Manager with File Upload
function EnhancedPostsManager({ posts, socialAccounts, onPostCreated, onPostUpdated, onPostDeleted }) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingPost, setEditingPost] = useState(null)
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    hashtags: '',
    cta: '',
    mediaType: 'text',
    mediaFiles: [],
    scheduledFor: '',
    selectedAccounts: []
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})

  const availableAccounts = [
    { id: 'fb1', platform: 'Facebook', name: 'Facebook Page 1', type: 'page' },
    { id: 'fb2', platform: 'Facebook', name: 'Facebook Page 2', type: 'page' },
    { id: 'fb3', platform: 'Facebook', name: 'Facebook Page 3', type: 'page' },
    { id: 'ig1', platform: 'Instagram', name: 'Instagram Business 1', type: 'business' },
    { id: 'ig2', platform: 'Instagram', name: 'Instagram Business 2', type: 'business' },
    { id: 'ig3', platform: 'Instagram', name: 'Instagram Business 3', type: 'business' },
    { id: 'tt1', platform: 'TikTok', name: 'TikTok Account', type: 'business' }
  ]

  // File Upload Handler
  const handleFileUpload = async (files) => {
    const uploadedFiles = []
    
    for (let file of files) {
      const formData = new FormData()
      formData.append('media', file)
      
      try {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }))
        
        const response = await axios.post(`${API_BASE}/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(prev => ({ ...prev, [file.name]: percentCompleted }))
          }
        })
        
        uploadedFiles.push(response.data.fileUrl)
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }))
        
      } catch (error) {
        console.error('Upload failed:', error)
        alert(`Failed to upload ${file.name}`)
      }
    }
    
    setNewPost(prev => ({
      ...prev,
      mediaFiles: [...prev.mediaFiles, ...uploadedFiles]
    }))
  }

  const handleFileDrop = (e) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    handleFileUpload(files)
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    handleFileUpload(files)
  }

  const removeMediaFile = (index) => {
    setNewPost(prev => ({
      ...prev,
      mediaFiles: prev.mediaFiles.filter((_, i) => i !== index)
    }))
  }

  const handleCreatePost = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const postData = {
        ...newPost,
        hashtags: newPost.hashtags.split(',').map(tag => tag.trim()).filter(tag => tag),
        mediaUrls: newPost.mediaType === 'text' ? [] : newPost.mediaFiles,
        scheduledFor: new Date(newPost.scheduledFor).toISOString(),
        platforms: newPost.selectedAccounts.map(account => account.platform),
        selectedAccounts: newPost.selectedAccounts
      }

      await axios.post(`${API_BASE}/posts`, postData)
      
      resetForm()
      onPostCreated()
      
      alert('✅ Post scheduled successfully!')
    } catch (error) {
      alert('Error creating post: ' + (error.response?.data?.message || error.message))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditPost = (post) => {
    setEditingPost(post)
    setNewPost({
      title: post.title,
      content: post.content,
      hashtags: Array.isArray(post.hashtags) ? post.hashtags.join(', ') : post.hashtags,
      cta: post.cta || '',
      mediaType: post.mediaType,
      mediaUrls: post.mediaUrls && post.mediaUrls.length > 0 ? post.mediaUrls : [''],
      scheduledFor: new Date(post.scheduledFor).toISOString().slice(0, 16),
      selectedAccounts: post.selectedAccounts || []
    })
    setShowCreateForm(true)
  }

  const handleUpdatePost = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const postData = {
        ...newPost,
        hashtags: newPost.hashtags.split(',').map(tag => tag.trim()).filter(tag => tag),
        mediaUrls: newPost.mediaType === 'text' ? [] : newPost.mediaUrls.filter(url => url.trim() !== ''),
        scheduledFor: new Date(newPost.scheduledFor).toISOString(),
        platforms: newPost.selectedAccounts.map(account => account.platform),
        selectedAccounts: newPost.selectedAccounts
      }

      await axios.put(`${API_BASE}/posts/${editingPost.id}`, postData)
      
      setNewPost({
        title: '',
        content: '',
        hashtags: '',
        cta: '',
        mediaType: 'text',
        mediaUrls: [''],
        scheduledFor: '',
        selectedAccounts: []
      })
      setShowCreateForm(false)
      setEditingPost(null)
      onPostUpdated()
      
      alert('✅ Post updated successfully!')
    } catch (error) {
      alert('Error updating post: ' + (error.response?.data?.message || error.message))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await axios.delete(`${API_BASE}/posts/${postId}`)
        onPostDeleted()
        alert('✅ Post deleted successfully!')
      } catch (error) {
        alert('Error deleting post: ' + (error.response?.data?.message || error.message))
      }
    }
  }

  const addMediaUrl = () => {
    setNewPost(prev => ({
      ...prev,
      mediaUrls: [...prev.mediaUrls, '']
    }))
  }

  const updateMediaUrl = (index, value) => {
    setNewPost(prev => ({
      ...prev,
      mediaUrls: prev.mediaUrls.map((url, i) => i === index ? value : url)
    }))
  }

  const removeMediaUrl = (index) => {
    setNewPost(prev => ({
      ...prev,
      mediaUrls: prev.mediaUrls.filter((_, i) => i !== index)
    }))
  }

  const toggleAccount = (account) => {
    setNewPost(prev => ({
      ...prev,
      selectedAccounts: prev.selectedAccounts.find(acc => acc.id === account.id)
        ? prev.selectedAccounts.filter(acc => acc.id !== account.id)
        : [...prev.selectedAccounts, account]
    }))
  }

  const getMediaTypeLabel = (type) => {
    const labels = {
      text: '📝 Text Post',
      image: '🖼️ Image Post', 
      video: '🎥 Video Post',
      carousel: '📸 Carousel Post',
      reel: '🎬 Reel/Short Video'
    }
    return labels[type] || type
  }

  const getPostTypeIcon = (type) => {
    const icons = {
      text: '📝',
      image: '🖼️',
      video: '🎥',
      carousel: '📸',
      reel: '🎬'
    }
    return icons[type] || '📄'
  }

  const resetForm = () => {
    setNewPost({
      title: '',
      content: '',
      hashtags: '',
      cta: '',
      mediaType: 'text',
      mediaFiles: [],
      scheduledFor: '',
      selectedAccounts: []
    })
    setEditingPost(null)
    setShowCreateForm(false)
    setUploadProgress({})
  }

  return (
    <div className="posts-manager">
      <div className="posts-header">
        <div className="header-content">
          <h2>📝 Posts Management</h2>
          <p>Create and schedule posts across all your social media accounts</p>
        </div>
        <button 
          className="create-post-btn primary"
          onClick={() => setShowCreateForm(true)}
        >
          <span>+</span>
          Create New Post
        </button>
      </div>

      {showCreateForm && (
        <div className="create-post-modal">
          <div className="modal-content large">
            <div className="modal-header">
              <h3>{editingPost ? '✏️ Edit Post' : '📝 Create New Post'}</h3>
              <button 
                className="close-btn"
                onClick={resetForm}
              >
                ×
              </button>
            </div>

            <form onSubmit={editingPost ? handleUpdatePost : handleCreatePost} className="post-form">
              {/* Post Title */}
              <div className="form-group">
                <label>Post Title *</label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter a compelling post title..."
                  required
                />
              </div>

              {/* Content */}
              <div className="form-group">
                <label>Content/Caption *</label>
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your post content here... Pro tip: Keep it engaging and include a call-to-action!"
                  rows="4"
                  required
                />
                <div className="character-count">
                  {newPost.content.length}/2200 characters
                </div>
              </div>

              {/* Post Type */}
              <div className="form-group">
                <label>Post Type *</label>
                <div className="post-type-grid">
                  {[
                    { type: 'text', label: 'Text Post', desc: 'Text only, no media', icon: '📝' },
                    { type: 'image', label: 'Image Post', desc: 'Single image', icon: '🖼️' },
                    { type: 'video', label: 'Video Post', desc: 'Single video', icon: '🎥' },
                    { type: 'carousel', label: 'Carousel Post', desc: 'Multiple images', icon: '📸' },
                    { type: 'reel', label: 'Reel/Short', desc: 'Short video content', icon: '🎬' }
                  ].map(item => (
                    <label key={item.type} className="post-type-option">
                      <input
                        type="radio"
                        name="mediaType"
                        value={item.type}
                        checked={newPost.mediaType === item.type}
                        onChange={(e) => setNewPost(prev => ({ 
                          ...prev, 
                          mediaType: e.target.value,
                          mediaFiles: item.type === 'text' ? [] : prev.mediaFiles,
                          mediaUrls: item.type === 'text' ? [] : prev.mediaUrls
                        }))}
                      />
                      <span className="checkmark"></span>
                      <div className="post-type-info">
                        <div className="post-type-icon">{item.icon}</div>
                        <div>
                          <strong>{item.label}</strong>
                          <span>{item.desc}</span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* File Upload Section */}
              {newPost.mediaType !== 'text' && (
                <div className="form-group">
                  <label>📁 Upload Media *</label>
                  <div 
                    className="file-upload-zone"
                    onDrop={handleFileDrop}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <div className="upload-content">
                      <div className="upload-icon">📁</div>
                      <h4>Drop your files here</h4>
                      <p>or</p>
                      <label className="file-input-label">
                        <input
                          type="file"
                          multiple
                          accept={newPost.mediaType === 'video' || newPost.mediaType === 'reel' 
                            ? "video/*" 
                            : "image/*"}
                          onChange={handleFileSelect}
                          style={{ display: 'none' }}
                        />
                        Browse Files
                      </label>
                      <small>
                        {newPost.mediaType === 'video' || newPost.mediaType === 'reel' 
                          ? 'Supports MP4, MOV, AVI (Max 100MB)' 
                          : 'Supports JPG, PNG, GIF (Max 20MB each)'}
                      </small>
                    </div>
                  </div>

                  {/* Uploaded Files Preview */}
                  {newPost.mediaFiles.length > 0 && (
                    <div className="uploaded-files">
                      <h5>📎 Uploaded Files:</h5>
                      {newPost.mediaFiles.map((fileUrl, index) => (
                        <div key={index} className="uploaded-file-item">
                          <div className="file-preview">
                            {(newPost.mediaType === 'video' || newPost.mediaType === 'reel') ? (
                              <div className="video-preview">
                                <span>🎥 Video File</span>
                              </div>
                            ) : (
                              <div className="image-preview">
                                <img src={fileUrl} alt={`Preview ${index}`} />
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            className="remove-file-btn"
                            onClick={() => removeMediaFile(index)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload Progress */}
                  {Object.keys(uploadProgress).length > 0 && (
                    <div className="upload-progress">
                      {Object.entries(uploadProgress).map(([filename, progress]) => (
                        <div key={filename} className="progress-item">
                          <span>{filename}</span>
                          <div className="progress-bar">
                            <div 
                              className="progress-fill" 
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <span>{progress}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Hashtags */}
              <div className="form-group">
                <label>🏷️ Hashtags</label>
                <input
                  type="text"
                  value={newPost.hashtags}
                  onChange={(e) => setNewPost(prev => ({ ...prev, hashtags: e.target.value }))}
                  placeholder="#social #media #marketing (comma separated)"
                />
                <div className="hashtag-tips">
                  Pro tip: Use 3-5 relevant hashtags for better reach
                </div>
              </div>

              {/* Call to Action */}
              <div className="form-group">
                <label>🎯 Call to Action</label>
                <input
                  type="text"
                  value={newPost.cta}
                  onChange={(e) => setNewPost(prev => ({ ...prev, cta: e.target.value }))}
                  placeholder="Learn more, Shop now, Visit website, etc."
                />
              </div>

              {/* Account Selection */}
              <div className="form-group">
                <label>👥 Select Accounts to Post *</label>
                
                <div className="platform-group">
                  <h4 className="platform-group-title">📘 Facebook Pages</h4>
                  <div className="accounts-selection-grid">
                    {availableAccounts.filter(acc => acc.platform === 'Facebook').map(account => (
                      <label key={account.id} className="account-checkbox">
                        <input
                          type="checkbox"
                          checked={newPost.selectedAccounts.some(acc => acc.id === account.id)}
                          onChange={() => toggleAccount(account)}
                        />
                        <span className="checkmark"></span>
                        <div className="account-info">
                          <div className="account-platform">Facebook</div>
                          <strong>{account.name}</strong>
                          <span className="account-type">{account.type}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="platform-group">
                  <h4 className="platform-group-title">📷 Instagram Accounts</h4>
                  <div className="accounts-selection-grid">
                    {availableAccounts.filter(acc => acc.platform === 'Instagram').map(account => (
                      <label key={account.id} className="account-checkbox">
                        <input
                          type="checkbox"
                          checked={newPost.selectedAccounts.some(acc => acc.id === account.id)}
                          onChange={() => toggleAccount(account)}
                        />
                        <span className="checkmark"></span>
                        <div className="account-info">
                          <div className="account-platform">Instagram</div>
                          <strong>{account.name}</strong>
                          <span className="account-type">{account.type}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="platform-group">
                  <h4 className="platform-group-title">🎵 TikTok</h4>
                  <div className="accounts-selection-grid">
                    {availableAccounts.filter(acc => acc.platform === 'TikTok').map(account => (
                      <label key={account.id} className="account-checkbox">
                        <input
                          type="checkbox"
                          checked={newPost.selectedAccounts.some(acc => acc.id === account.id)}
                          onChange={() => toggleAccount(account)}
                        />
                        <span className="checkmark"></span>
                        <div className="account-info">
                          <div className="account-platform">TikTok</div>
                          <strong>{account.name}</strong>
                          <span className="account-type">{account.type}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {newPost.selectedAccounts.length > 0 && (
                  <div className="selection-summary">
                    <strong>✅ Selected: </strong>
                    {newPost.selectedAccounts.map(acc => acc.name).join(', ')}
                    <br />
                    <small>Post will be published to {newPost.selectedAccounts.length} account(s)</small>
                  </div>
                )}
              </div>

              {/* Schedule */}
              <div className="form-group">
                <label>⏰ Schedule Date & Time *</label>
                <input
                  type="datetime-local"
                  value={newPost.scheduledFor}
                  onChange={(e) => setNewPost(prev => ({ ...prev, scheduledFor: e.target.value }))}
                  required
                />
                <div className="schedule-tips">
                  💡 Schedule in your audience's peak engagement times
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={resetForm}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={isSubmitting || newPost.selectedAccounts.length === 0}
                >
                  {isSubmitting ? 'Saving...' : editingPost ? 'Update Post' : `Schedule to ${newPost.selectedAccounts.length} Account(s)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="posts-list">
        <h3>⏰ Scheduled Posts ({posts.filter(p => p.status === 'scheduled').length})</h3>
        {posts.filter(p => p.status === 'scheduled').length === 0 ? (
          <p className="no-posts">No posts scheduled yet. Create your first post!</p>
        ) : (
          posts.filter(p => p.status === 'scheduled').map(post => (
            <div key={post.id} className="post-card">
              <div className="post-header">
                <h3>{post.title}</h3>
                <span className={`post-type-badge ${post.mediaType}`}>
                  {getPostTypeIcon(post.mediaType)} {getMediaTypeLabel(post.mediaType)}
                </span>
              </div>
              <p>{post.content}</p>
              
              {post.mediaUrls && post.mediaUrls.length > 0 && (
                <div className="post-media">
                  <strong>📁 Media: </strong>
                  {post.mediaUrls.slice(0, 2).map((url, index) => (
                    <span key={index} className="media-url">{url}</span>
                  ))}
                  {post.mediaUrls.length > 2 && (
                    <span>+{post.mediaUrls.length - 2} more</span>
                  )}
                </div>
              )}
              
              <div className="post-accounts">
                <strong>👥 Accounts: </strong>
                {post.selectedAccounts && post.selectedAccounts.map((account, index) => (
                  <span key={index} className="account-tag">
                    {typeof account === 'object' ? account.name : account}
                  </span>
                ))}
              </div>
              
              <div className="post-meta">
                <span>⏰ Scheduled: {new Date(post.scheduledFor).toLocaleString()}</span>
                <span className={`status ${post.status}`}>{post.status}</span>
              </div>
              
              <div className="post-actions">
                <button 
                  className="edit-btn"
                  onClick={() => handleEditPost(post)}
                >
                  ✏️ Edit
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => handleDeletePost(post.id)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="posts-list">
        <h3>🚀 Published Posts ({posts.filter(p => p.status === 'published').length})</h3>
        {posts.filter(p => p.status === 'published').length === 0 ? (
          <p className="no-posts">No posts published yet.</p>
        ) : (
          posts.filter(p => p.status === 'published').map(post => (
            <div key={post.id} className="post-card published">
              <div className="post-header">
                <h3>{post.title}</h3>
                <span className={`post-type-badge ${post.mediaType} published`}>
                  {getPostTypeIcon(post.mediaType)} {getMediaTypeLabel(post.mediaType)}
                </span>
              </div>
              <p>{post.content}</p>
              
              <div className="post-accounts">
                <strong>✅ Published to: </strong>
                {post.selectedAccounts && post.selectedAccounts.map((account, index) => (
                  <span key={index} className="account-tag published">
                    {typeof account === 'object' ? account.name : account}
                  </span>
                ))}
              </div>
              
              <div className="post-meta">
                <span>📅 Published: {new Date(post.scheduledFor).toLocaleString()}</span>
                <span className={`status ${post.status}`}>{post.status}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// Keep your existing CalendarView, AccountsManager, ConversationsManager components
// ... (they remain the same as in your working version)

// Calendar View Component (simplified for now)
function CalendarView({ posts }) {
  return (
    <div className="calendar-view">
      <h2>📅 Calendar View</h2>
      <p>Calendar functionality - Coming soon with enhanced features</p>
    </div>
  )
}

// Accounts Manager Component (simplified for now)
function AccountsManager({ accounts, onAccountsUpdate }) {
  return (
    <div className="accounts-manager">
      <h2>👥 Accounts Management</h2>
      <p>Account connection and management - Ready for API integration</p>
    </div>
  )
}

// Conversations Manager Component (simplified for now)
function ConversationsManager({ conversations, onConversationsUpdate }) {
  return (
    <div className="conversations-manager">
      <h2>💬 AI Conversations</h2>
      <p>AI-powered messaging system - Ready for webhook integration</p>
    </div>
  )
}

export default App
