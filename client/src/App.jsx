// App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

/* -------------------------------------------------
   API CONFIGURATION (from Code 2 – works on any host)
   ------------------------------------------------- */
const API_BASE = 'https://social-media-manager-2.onrender.com/api';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [posts, setPosts] = useState([]);
  const [socialAccounts, setSocialAccounts] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  /* -------------------------------------------------
     AUTH & DATA FETCHING (merged from Code 1 + Code 2)
     ------------------------------------------------- */
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserData();
    }
  }, [token]);

  const fetchUserData = async () => {
    try {
      const [postsRes, accountsRes, convRes] = await Promise.all([
        axios.get(`${API_BASE}/posts`),
        axios.get(`${API_BASE}/social-accounts`),
        axios.get(`${API_BASE}/conversations`),
      ]);

      setPosts(postsRes.data.posts || []);
      setSocialAccounts(accountsRes.data.accounts || []);
      setConversations(convRes.data.conversations || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 401) handleLogout();
    }
  };

  const handleLogin = async (email, password) => {
    try {
      const { data } = await axios.post(`${API_BASE}/auth/login`, { email, password });
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
    } catch (error) {
      alert('Login failed: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setPosts([]);
    setSocialAccounts([]);
    setConversations([]);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  /* -------------------------------------------------
     RENDER
     ------------------------------------------------- */
  if (!user) return <LoginPage onLogin={handleLogin} />;

  return (
    <div className="app">
      <Header user={user} onLogout={handleLogout} />
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="main-content">
        {activeTab === 'dashboard' && (
          <ProfessionalDashboard
            posts={posts}
            socialAccounts={socialAccounts}
            conversations={conversations}
          />
        )}
        {activeTab === 'calendar' && <CalendarView posts={posts} />}
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
          <AccountsManager accounts={socialAccounts} onAccountsUpdate={fetchUserData} />
        )}
        {activeTab === 'conversations' && (
          <ConversationsManager conversations={conversations} onConversationsUpdate={fetchUserData} />
        )}
      </main>
    </div>
  );
}

/* -------------------------------------------------
   LOGIN PAGE (unchanged from Code 1)
   ------------------------------------------------- */
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('admin@test.com');
  const [password, setPassword] = useState('password123');

  const handleSubmit = e => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Social Media Manager</h1>
        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button type="submit">Login</button>
        </form>
        <p className="demo-credentials">Demo: admin@test.com / password123</p>
      </div>
    </div>
  );
}

/* -------------------------------------------------
   HEADER & NAVIGATION (unchanged from Code 1)
   ------------------------------------------------- */
function Header({ user, onLogout }) {
  return (
    <header className="header">
      <div className="header-content">
        <h1>Social Media Manager</h1>
        <div className="user-info">
          <span>Welcome, {user.username}</span>
          <button onClick={onLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

function Navigation({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'calendar', label: 'Calendar' },
    { id: 'posts', label: 'Posts' },
    { id: 'accounts', label: 'Accounts' },
    { id: 'conversations', label: 'Messages' },
  ];

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
  );
}

/* -------------------------------------------------
   PROFESSIONAL DASHBOARD (from Code 1 – unchanged)
   ------------------------------------------------- */
function ProfessionalDashboard({ posts, socialAccounts, conversations }) {
  const scheduledPosts = posts.filter(p => p.status === 'scheduled');
  const publishedPosts = posts.filter(p => p.status === 'published');

  const uniqueAccountsFromPosts = new Set();
  posts.forEach(p => {
    if (p.selectedAccounts) p.selectedAccounts.forEach(a => uniqueAccountsFromPosts.add(a.id));
  });

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const recentPosts = publishedPosts.filter(p => new Date(p.scheduledFor) > oneWeekAgo);

  const engagementMetrics = {
    totalReach: '12.5K',
    engagementRate: '4.2%',
    newFollowers: 234,
    totalLikes: '8.7K',
  };

  return (
    <div className="professional-dashboard">
      <div className="dashboard-header">
        <h2>Dashboard Overview</h2>
        <div className="date-range"><span>Last 30 Days</span></div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid-pro">
        <div className="stat-card-pro primary">
          <div className="stat-icon">Chart</div>
          <div className="stat-content">
            <h3>Total Posts</h3>
            <p className="stat-number">{posts.length}</p>
            <span className="stat-trend">+12% this month</span>
          </div>
        </div>

        <div className="stat-card-pro success">
          <div className="stat-icon">Clock</div>
          <div className="stat-content">
            <h3>Scheduled</h3>
            <p className="stat-number">{scheduledPosts.length}</p>
            <span className="stat-trend">Ready to publish</span>
          </div>
        </div>

        <div className="stat-card-pro warning">
          <div className="stat-icon">Growth</div>
          <div className="stat-content">
            <h3>Published</h3>
            <p className="stat-number">{publishedPosts.length}</p>
            <span className="stat-trend">Live across platforms</span>
          </div>
        </div>

        <div className="stat-card-pro info">
          <div className="stat-icon">Users</div>
          <div className="stat-content">
            <h3>Active Accounts</h3>
            <p className="stat-number">{uniqueAccountsFromPosts.size}</p>
            <span className="stat-trend">7 total available</span>
          </div>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="engagement-section">
        <h3>Engagement Metrics</h3>
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

      {/* Recent Content */}
      <div className="dashboard-content-pro">
        <div className="content-column">
          <div className="content-card">
            <div className="card-header">
              <h3>Recent Scheduled Posts</h3>
              <span className="badge">{scheduledPosts.length}</span>
            </div>
            <div className="card-content">
              {scheduledPosts.slice(0, 5).map(post => (
                <div key={post.id} className="post-item-pro">
                  <div className="post-preview">
                    <div className="post-avatar">
                      {post.mediaType === 'text' ? 'Text' : post.mediaType === 'image' ? 'Image' : post.mediaType === 'video' ? 'Video' : 'Carousel'}
                    </div>
                    <div className="post-details">
                      <strong>{post.title}</strong>
                      <span className="post-time">
                        {new Date(post.scheduledFor).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="content-column">
          <div className="content-card">
            <div className="card-header">
              <h3>Recently Published</h3>
              <span className="badge success">{recentPosts.length}</span>
            </div>
            <div className="card-content">
              {recentPosts.slice(0, 5).map(post => (
                <div key={post.id} className="post-item-pro published">
                  <div className="post-preview">
                    <div className="post-avatar published">
                      {post.mediaType === 'text' ? 'Text' : post.mediaType === 'image' ? 'Image' : post.mediaType === 'video' ? 'Video' : 'Carousel'}
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
            </div>
          </div>

          <div className="content-card">
            <div className="card-header">
              <h3>Recent Conversations</h3>
              <span className="badge info">{conversations.length}</span>
            </div>
            <div className="card-content">
              {conversations.slice(0, 5).map(c => (
                <div key={c.id} className="conversation-item-pro">
                  <div className="conversation-avatar">User</div>
                  <div className="conversation-details">
                    <strong>User {c.userId}</strong>
                    <p>{c.messages?.[c.messages.length - 1]?.text?.slice(0, 60)}...</p>
                    <span className="conversation-time">
                      {new Date(c.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------
   ENHANCED POSTS MANAGER (full version from Code 1)
   ------------------------------------------------- */
function EnhancedPostsManager({
  posts,
  socialAccounts,
  onPostCreated,
  onPostUpdated,
  onPostDeleted,
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    hashtags: '',
    cta: '',
    mediaType: 'text',
    mediaFiles: [],
    scheduledFor: '',
    selectedAccounts: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  // Mock accounts (replace with real data from API if needed)
  const availableAccounts = [
    { id: 'fb1', platform: 'Facebook', name: 'Facebook Page 1', type: 'page' },
    { id: 'fb2', platform: 'Facebook', name: 'Facebook Page 2', type: 'page' },
    { id: 'ig1', platform: 'Instagram', name: 'Instagram Business 1', type: 'business' },
    { id: 'ig2', platform: 'Instagram', name: 'Instagram Business 2', type: 'business' },
    { id: 'tt1', platform: 'TikTok', name: 'TikTok Account', type: 'business' },
  ];

  /* ---------- FILE UPLOAD ---------- */
  const handleFileUpload = async files => {
    const uploaded = [];
    for (const file of files) {
      const form = new FormData();
      form.append('media', file);
      setUploadProgress(p => ({ ...p, [file.name]: 0 }));

      try {
        const { data } = await axios.post(`${API_BASE}/upload`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: e => {
            const percent = Math.round((e.loaded * 100) / e.total);
            setUploadProgress(p => ({ ...p, [file.name]: percent }));
          },
        });
        uploaded.push(data.fileUrl);
      } catch (err) {
        alert(`Failed to upload ${file.name}`);
      }
    }
    setNewPost(p => ({ ...p, mediaFiles: [...p.mediaFiles, ...uploaded] }));
  };

  const handleFileDrop = e => {
    e.preventDefault();
    handleFileUpload(Array.from(e.dataTransfer.files));
  };

  const handleFileSelect = e => handleFileUpload(Array.from(e.target.files));

  const removeMediaFile = idx =>
    setNewPost(p => ({ ...p, mediaFiles: p.mediaFiles.filter((_, i) => i !== idx) }));

  /* ---------- CRUD ---------- */
  const handleCreatePost = async e => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...newPost,
        hashtags: newPost.hashtags.split(',').map(t => t.trim()).filter(Boolean),
        mediaUrls: newPost.mediaType === 'text' ? [] : newPost.mediaFiles,
        scheduledFor: new Date(newPost.scheduledFor).toISOString(),
        selectedAccounts: newPost.selectedAccounts,
      };
      await axios.post(`${API_BASE}/posts`, payload);
      resetForm();
      onPostCreated();
      alert('Post scheduled successfully!');
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPost = post => {
    setEditingPost(post);
    setNewPost({
      title: post.title,
      content: post.content,
      hashtags: post.hashtags?.join(', ') ?? '',
      cta: post.cta ?? '',
      mediaType: post.mediaType,
      mediaFiles: post.mediaUrls ?? [],
      scheduledFor: new Date(post.scheduledFor).toISOString().slice(0, 16),
      selectedAccounts: post.selectedAccounts ?? [],
    });
    setShowCreateForm(true);
  };

  const handleUpdatePost = async e => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...newPost,
        hashtags: newPost.hashtags.split(',').map(t => t.trim()).filter(Boolean),
        mediaUrls: newPost.mediaType === 'text' ? [] : newPost.mediaFiles,
        scheduledFor: new Date(newPost.scheduledFor).toISOString(),
        selectedAccounts: newPost.selectedAccounts,
      };
      await axios.put(`${API_BASE}/posts/${editingPost.id}`, payload);
      resetForm();
      onPostUpdated();
      alert('Post updated!');
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async id => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await axios.delete(`${API_BASE}/posts/${id}`);
      onPostDeleted();
      alert('Post deleted');
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const toggleAccount = acc =>
    setNewPost(p => ({
      ...p,
      selectedAccounts: p.selectedAccounts.find(a => a.id === acc.id)
        ? p.selectedAccounts.filter(a => a.id !== acc.id)
        : [...p.selectedAccounts, acc],
    }));

  const resetForm = () => {
    setNewPost({
      title: '',
      content: '',
      hashtags: '',
      cta: '',
      mediaType: 'text',
      mediaFiles: [],
      scheduledFor: '',
      selectedAccounts: [],
    });
    setEditingPost(null);
    setShowCreateForm(false);
    setUploadProgress({});
  };

  const getMediaIcon = type => {
    const map = { text: 'Text', image: 'Image', video: 'Video', carousel: 'Carousel', reel: 'Reel' };
    return map[type] || 'Document';
  };

  /* ---------- RENDER ---------- */
  return (
    <div className="posts-manager">
      <div className="posts-header">
        <div className="header-content">
          <h2>Posts Management</h2>
          <p>Create and schedule posts across all your social media accounts</p>
        </div>
        <button className="create-post-btn primary" onClick={() => setShowCreateForm(true)}>
          + Create New Post
        </button>
      </div>

      {/* CREATE / EDIT FORM (modal) */}
      {showCreateForm && (
        <div className="create-post-modal">
          <div className="modal-content large">
            <div className="modal-header">
              <h3>{editingPost ? 'Edit Post' : 'Create New Post'}</h3>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>
            <form onSubmit={editingPost ? handleUpdatePost : handleCreatePost} className="post-form">
              {/* Title */}
              <div className="form-group">
                <label>Post Title *</label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))}
                  placeholder="Enter a compelling title..."
                  required
                />
              </div>

              {/* Content */}
              <div className="form-group">
                <label>Content/Caption *</label>
                <textarea
                  value={newPost.content}
                  onChange={e => setNewPost(p => ({ ...p, content: e.target.value }))}
                  rows="4"
                  placeholder="Write your post..."
                  required
                />
                <div className="character-count">{newPost.content.length}/2200</div>
              </div>

              {/* Media Type */}
              <div className="form-group">
                <label>Post Type *</label>
                <div className="post-type-grid">
                  {[
                    { type: 'text', label: 'Text Post', icon: 'Text' },
                    { type: 'image', label: 'Image Post', icon: 'Image' },
                    { type: 'video', label: 'Video Post', icon: 'Video' },
                    { type: 'carousel', label: 'Carousel Post', icon: 'Carousel' },
                    { type: 'reel', label: 'Reel/Short', icon: 'Reel' },
                  ].map(item => (
                    <label key={item.type} className="post-type-option">
                      <input
                        type="radio"
                        name="mediaType"
                        value={item.type}
                        checked={newPost.mediaType === item.type}
                        onChange={e =>
                          setNewPost(p => ({
                            ...p,
                            mediaType: e.target.value,
                            mediaFiles: e.target.value === 'text' ? [] : p.mediaFiles,
                          }))
                        }
                      />
                      <span className="checkmark"></span>
                      <div className="post-type-info">
                        <div className="post-type-icon">{item.icon}</div>
                        <div>
                          <strong>{item.label}</strong>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Media Upload */}
              {newPost.mediaType !== 'text' && (
                <div className="form-group">
                  <label>Upload Media *</label>
                  <div
                    className="file-upload-zone"
                    onDrop={handleFileDrop}
                    onDragOver={e => e.preventDefault()}
                  >
                    <div className="upload-content">
                      <div className="upload-icon">Folder</div>
                      <h4>Drop files here</h4>
                      <p>or</p>
                      <label className="file-input-label">
                        <input
                          type="file"
                          multiple
                          accept={newPost.mediaType === 'video' || newPost.mediaType === 'reel' ? 'video/*' : 'image/*'}
                          onChange={handleFileSelect}
                          style={{ display: 'none' }}
                        />
                        Browse Files
                      </label>
                    </div>
                  </div>

                  {/* Uploaded preview */}
                  {newPost.mediaFiles.length > 0 && (
                    <div className="uploaded-files">
                      {newPost.mediaFiles.map((url, i) => (
                        <div key={i} className="uploaded-file-item">
                          <div className="file-preview">
                            {(newPost.mediaType === 'video' || newPost.mediaType === 'reel') ? (
                              <span>Video File</span>
                            ) : (
                              <img src={url} alt={`preview ${i}`} />
                            )}
                          </div>
                          <button type="button" className="remove-file-btn" onClick={() => removeMediaFile(i)}>
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Hashtags & CTA */}
              <div className="form-group">
                <label>Hashtags</label>
                <input
                  type="text"
                  value={newPost.hashtags}
                  onChange={e => setNewPost(p => ({ ...p, hashtags: e.target.value }))}
                  placeholder="#tag1, #tag2"
                />
              </div>
              <div className="form-group">
                <label>Call to Action</label>
                <input
                  type="text"
                  value={newPost.cta}
                  onChange={e => setNewPost(p => ({ ...p, cta: e.target.value }))}
                  placeholder="Learn more, Shop now..."
                />
              </div>

              {/* Account selection */}
              <div className="form-group">
                <label>Select Accounts *</label>
                {['Facebook', 'Instagram', 'TikTok'].map(platform => (
                  <div key={platform} className="platform-group">
                    <h4 className="platform-group-title">{platform}</h4>
                    <div className="accounts-selection-grid">
                      {availableAccounts
                        .filter(a => a.platform === platform)
                        .map(acc => (
                          <label key={acc.id} className="account-checkbox">
                            <input
                              type="checkbox"
                              checked={newPost.selectedAccounts.some(a => a.id === acc.id)}
                              onChange={() => toggleAccount(acc)}
                            />
                            <span className="checkmark"></span>
                            <div className="account-info">
                              <div className="account-platform">{acc.platform}</div>
                              <strong>{acc.name}</strong>
                              <span className="account-type">{acc.type}</span>
                            </div>
                          </label>
                        ))}
                    </div>
                  </div>
                ))}
                {newPost.selectedAccounts.length > 0 && (
                  <div className="selection-summary">
                    <strong>Selected: </strong>
                    {newPost.selectedAccounts.map(a => a.name).join(', ')}
                  </div>
                )}
              </div>

              {/* Schedule */}
              <div className="form-group">
                <label>Schedule Date & Time *</label>
                <input
                  type="datetime-local"
                  value={newPost.scheduledFor}
                  onChange={e => setNewPost(p => ({ ...p, scheduledFor: e.target.value }))}
                  required
                />
              </div>

              {/* Actions */}
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={resetForm}>
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

      {/* SCHEDULED POSTS LIST */}
      <div className="posts-list">
        <h3>Scheduled Posts ({posts.filter(p => p.status === 'scheduled').length})</h3>
        {posts.filter(p => p.status === 'scheduled').map(post => (
          <div key={post.id} className="post-card">
            <div className="post-header">
              <h3>{post.title}</h3>
              <span className={`post-type-badge ${post.mediaType}`}>
                {getMediaIcon(post.mediaType)} {post.mediaType}
              </span>
            </div>
            <p>{post.content}</p>
            <div className="post-meta">
              <span>Scheduled: {new Date(post.scheduledFor).toLocaleString()}</span>
            </div>
            <div className="post-actions">
              <button className="edit-btn" onClick={() => handleEditPost(post)}>Edit</button>
              <button className="delete-btn" onClick={() => handleDeletePost(post.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* PUBLISHED POSTS LIST */}
      <div className="posts-list">
        <h3>Published Posts ({posts.filter(p => p.status === 'published').length})</h3>
        {posts.filter(p => p.status === 'published').map(post => (
          <div key={post.id} className="post-card published">
            <div className="post-header">
              <h3>{post.title}</h3>
              <span className={`post-type-badge ${post.mediaType} published`}>
                {getMediaIcon(post.mediaType)} {post.mediaType}
              </span>
            </div>
            <p>{post.content}</p>
            <div className="post-meta">
              <span>Published: {new Date(post.scheduledFor).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------
   CALENDAR VIEW (full version from Code 3)
   ------------------------------------------------- */
function CalendarView({ posts }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const prevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days = [];

    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(currentYear, currentMonth, d);
      const dayPosts = posts.filter(p => new Date(p.scheduledFor).toDateString() === date.toDateString());
      days.push({
        date,
        day: d,
        hasPosts: dayPosts.length > 0,
        postCount: dayPosts.length,
        posts: dayPosts,
      });
    }
    return days;
  };

  const getPostsForSelectedDate = () =>
    posts.filter(p => new Date(p.scheduledFor).toDateString() === selectedDate.toDateString());

  const calendarDays = generateCalendarDays();
  const selectedDatePosts = getPostsForSelectedDate();
  const monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];

  return (
    <div className="calendar-view">
      <div className="calendar-header">
        <h2>Content Calendar</h2>
        <p>Manage and view your scheduled posts</p>
      </div>

      <div className="calendar-navigation">
        <button onClick={prevMonth} className="nav-btn">Previous</button>
        <h3>{monthNames[currentMonth]} {currentYear}</h3>
        <button onClick={nextMonth} className="nav-btn">Next</button>
      </div>

      <div className="calendar-grid">
        <div className="calendar-weekdays">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} className="weekday-header">{d}</div>
          ))}
        </div>

        <div className="calendar-days">
          {calendarDays.map((info, i) => (
            <div
              key={i}
              className={`calendar-day ${!info ? 'empty' : ''} ${
                info && info.date.toDateString() === selectedDate.toDateString() ? 'selected' : ''
              } ${info && info.hasPosts ? 'has-posts' : ''}`}
              onClick={() => info && setSelectedDate(info.date)}
            >
              {info && (
                <>
                  <span className="day-number">{info.day}</span>
                  {info.hasPosts && (
                    <div className="post-indicator">
                      <span className="post-count">{info.postCount}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="selected-date-posts">
        <h4>Posts for {selectedDate.toLocaleDateString()}</h4>
        {selectedDatePosts.length === 0 ? (
          <p className="no-posts">No posts scheduled for this date</p>
        ) : (
          <div className="posts-list">
            {selectedDatePosts.map(post => (
              <div key={post.id} className="post-item">
                <div className="post-header">
                  <h5>{post.title}</h5>
                  <span className={`post-status ${post.status}`}>{post.status}</span>
                </div>
                <p className="post-content">{post.content}</p>
                <div className="post-meta">
                  <span>{new Date(post.scheduledFor).toLocaleTimeString()}</span>
                  <span>{post.mediaType}</span>
                </div>
                {post.selectedAccounts?.length > 0 && (
                  <div className="post-platforms">
                    <strong>Platforms: </strong>
                    {post.selectedAccounts.map((a, idx) => (
                      <span key={idx} className="platform-tag">
                        {typeof a === 'object' ? a.name : a}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="calendar-stats">
        <div className="stat-card">
          <div className="stat-number">{posts.length}</div>
          <div className="stat-label">Total Posts</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{posts.filter(p => p.status === 'scheduled').length}</div>
          <div className="stat-label">Scheduled</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{posts.filter(p => p.status === 'published').length}</div>
          <div className="stat-label">Published</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {new Set(posts.flatMap(p => p.selectedAccounts || [])).size}
          </div>
          <div className="stat-label">Active Platforms</div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------
   ACCOUNTS & CONVERSATIONS (light versions – ready for API)
   ------------------------------------------------- */
function AccountsManager({ accounts, onAccountsUpdate }) {
  return (
    <div className="accounts-manager">
      <h2>Accounts Management</h2>
      <p>Connected Accounts: {accounts.length}</p>
      {/* Add connect/disconnect UI here */}
    </div>
  );
}

function ConversationsManager({ conversations, onConversationsUpdate }) {
  return (
    <div className="conversations-manager">
      <h2>AI Conversations</h2>
      <p>Total Conversations: {conversations.length}</p>
      {/* Add message list / reply UI here */}
    </div>
  );
}

export default App;
