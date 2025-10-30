// src/App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE = 'https://social-media-manager-2.onrender.com/api';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [posts, setPosts] = useState([]);
  const [socialAccounts, setSocialAccounts] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserData();
    }
  }, [token]);

  const fetchUserData = async () => {
    try {
      const [p, a, c] = await Promise.all([
        axios.get(`${API_BASE}/posts`),
        axios.get(`${API_BASE}/social-accounts`),
        axios.get(`${API_BASE}/conversations`),
      ]);
      setPosts(p.data.posts || []);
      setSocialAccounts(a.data.accounts || []);
      setConversations(c.data.conversations || []);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) handleLogout();
    }
  };

  const handleLogin = async (email, password) => {
    try {
      const { data } = await axios.post(`${API_BASE}/auth/login`, { email, password });
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
    } catch (err) {
      alert('Login failed: ' + (err.response?.data?.message || err.message));
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

  if (!user) return <LoginPage onLogin={handleLogin} />;

  return (
    <div className="app">
      <Header user={user} onLogout={handleLogout} />
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="main-content">
        {activeTab === 'dashboard' && (
          <ProfessionalDashboard posts={posts} socialAccounts={socialAccounts} conversations={conversations} />
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
   LOGIN, HEADER, NAVIGATION
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
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit">Login</button>
        </form>
        <p className="demo-credentials">Demo: admin@test.com / password123</p>
      </div>
    </div>
  );
}

function Header({ user, onLogout }) {
  return (
    <header className="header">
      <div className="header-content">
        <h1>Social Media Manager</h1>
        <div className="user-info">
          <span>Welcome, {user.username}</span>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </div>
    </header>
  );
}

function Navigation({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: 'Chart' },
    { id: 'calendar', label: 'Calendar', icon: 'Calendar' },
    { id: 'posts', label: 'Posts', icon: 'Document' },
    { id: 'accounts', label: 'Accounts', icon: 'Users' },
    { id: 'conversations', label: 'Messages', icon: 'Message' },
  ];

  return (
    <nav className="navigation">
      {tabs.map(t => (
        <button
          key={t.id}
          className={`nav-btn ${activeTab === t.id ? 'active' : ''}`}
          onClick={() => setActiveTab(t.id)}
        >
          <span className="nav-icon">{t.icon}</span>
          {t.label}
        </button>
      ))}
    </nav>
  );
}

/* -------------------------------------------------
   DASHBOARD (unchanged from previous version)
   ------------------------------------------------- */
// ... (ProfessionalDashboard, KpiCard, MetricCard, RecentCard) – copy from previous response

/* -------------------------------------------------
   ENHANCED POSTS MANAGER – PROFESSIONAL UI
   ------------------------------------------------- */
function EnhancedPostsManager({ posts, socialAccounts, onPostCreated, onPostUpdated, onPostDeleted }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [newPost, setNewPost] = useState({
    title: '', content: '', hashtags: '', cta: '', mediaType: 'text',
    mediaFiles: [], scheduledFor: '', selectedAccounts: []
  });
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState({});

  const availableAccounts = [
    { id: 'fb1', platform: 'Facebook', name: 'Facebook Page 1', type: 'page' },
    { id: 'fb2', platform: 'Facebook', name: 'Facebook Page 2', type: 'page' },
    { id: 'fb3', platform: 'Facebook', name: 'Facebook Page 3', type: 'page' },
    { id: 'ig1', platform: 'Instagram', name: 'Instagram Business 1', type: 'business' },
    { id: 'ig2', platform: 'Instagram', name: 'Instagram Business 2', type: 'business' },
    { id: 'ig3', platform: 'Instagram', name: 'Instagram Business 3', type: 'business' },
    { id: 'wa1', platform: 'WhatsApp', name: 'WhatsApp Business', type: 'business' },
    { id: 'tt1', platform: 'TikTok', name: 'TikTok Account', type: 'business' },
  ];

  const handleFileUpload = async files => {
    const uploaded = [];
    for (const f of files) {
      const fd = new FormData(); fd.append('media', f);
      setProgress(p => ({ ...p, [f.name]: 0 }));
      try {
        const { data } = await axios.post(`${API_BASE}/upload`, fd, {
          onUploadProgress: e => {
            const pct = Math.round((e.loaded * 100) / e.total);
            setProgress(p => ({ ...p, [f.name]: pct }));
          }
        });
        uploaded.push(data.fileUrl);
      } catch { alert(`Upload failed: ${f.name}`); }
    }
    setNewPost(p => ({ ...p, mediaFiles: [...p.mediaFiles, ...uploaded] }));
  };

  const handleCreate = async e => {
    e.preventDefault(); setSubmitting(true);
    try {
      await axios.post(`${API_BASE}/posts`, {
        ...newPost,
        hashtags: newPost.hashtags.split(',').map(t => t.trim()).filter(Boolean),
        mediaUrls: newPost.mediaType === 'text' ? [] : newPost.mediaFiles,
        scheduledFor: new Date(newPost.scheduledFor).toISOString(),
        selectedAccounts: newPost.selectedAccounts,
      });
      resetForm(); onPostCreated(); alert('Post scheduled!');
    } catch (err) { alert(err.response?.data?.message || err.message); }
    finally { setSubmitting(false); }
  };

  const resetForm = () => {
    setNewPost({ title: '', content: '', hashtags: '', cta: '', mediaType: 'text', mediaFiles: [], scheduledFor: '', selectedAccounts: [] });
    setEditing(null); setShowForm(false); setProgress({});
  };

  const toggleAccount = acc => {
    setNewPost(p => ({
      ...p,
      selectedAccounts: p.selectedAccounts.find(a => a.id === acc.id)
        ? p.selectedAccounts.filter(a => a.id !== acc.id)
        : [...p.selectedAccounts, acc],
    }));
  };

  const getPlatformIcon = p => {
    const icons = { Facebook: 'Facebook', Instagram: 'Instagram', WhatsApp: 'WhatsApp', TikTok: 'TikTok' };
    return icons[p] || 'Link';
  };

  return (
    <div className="posts-manager-pro">
      <div className="posts-header-pro">
        <div>
          <h2>Posts Management</h2>
          <p>Create and schedule posts across all your social media accounts</p>
        </div>
        <button className="create-post-btn" onClick={() => setShowForm(true)}>
          + Create New Post
        </button>
      </div>

      {/* CREATE FORM */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create New Post</h3>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>
            <form onSubmit={handleCreate} className="post-form-pro">
              {/* Title */}
              <div className="form-group">
                <label>Post Title *</label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))}
                  placeholder="Enter a compelling post title..."
                  required
                />
              </div>

              {/* Content */}
              <div className="form-group">
                <label>Content/Caption *</label>
                <textarea
                  value={newPost.content}
                  onChange={e => setNewPost(p => ({ ...p, content: e.target.value }))}
                  placeholder="Write your post content here... Pro tip: Keep it engaging and include a call-to-action!"
                  rows="4"
                  required
                />
                <div className="char-count">{newPost.content.length}/2200 characters</div>
              </div>

              {/* Post Type */}
              <div className="form-group">
                <label>Post Type *</label>
                <div className="post-type-grid">
                  {[
                    { type: 'text', icon: 'Document', label: 'Text Post', desc: 'Text only, no media' },
                    { type: 'image', icon: 'Image', label: 'Image Post', desc: 'Single image' },
                    { type: 'video', icon: 'Video', label: 'Video Post', desc: 'Single video' },
                    { type: 'carousel', icon: 'Carousel', label: 'Carousel Post', desc: 'Multiple images' },
                    { type: 'reel', icon: 'Reel', label: 'Reel/Short', desc: 'Short video content' },
                  ].map(item => (
                    <label key={item.type} className="post-type-option">
                      <input
                        type="radio"
                        name="mediaType"
                        value={item.type}
                        checked={newPost.mediaType === item.type}
                        onChange={e => setNewPost(p => ({
                          ...p, mediaType: e.target.value, mediaFiles: e.target.value === 'text' ? [] : p.mediaFiles
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

              {/* File Upload */}
              {newPost.mediaType !== 'text' && (
                <div className="form-group">
                  <label>Upload Media *</label>
                  <div
                    className="file-drop-zone"
                    onDrop={e => { e.preventDefault(); handleFileUpload(Array.from(e.dataTransfer.files)); }}
                    onDragOver={e => e.preventDefault()}
                  >
                    <div className="drop-content">
                      <div className="upload-icon">Folder</div>
                      <h4>Drop files here</h4>
                      <p>or</p>
                      <label className="file-label">
                        <input
                          type="file"
                          multiple
                          accept={newPost.mediaType === 'video' || newPost.mediaType === 'reel' ? 'video/*' : 'image/*'}
                          onChange={e => handleFileUpload(Array.from(e.target.files))}
                          style={{ display: 'none' }}
                        />
                        Browse Files
                      </label>
                    </div>
                  </div>
                  {newPost.mediaFiles.length > 0 && (
                    <div className="uploaded-files">
                      {newPost.mediaFiles.map((url, i) => (
                        <div key={i} className="file-item">
                          <img src={url} alt="preview" />
                          <button type="button" onClick={() => setNewPost(p => ({ ...p, mediaFiles: p.mediaFiles.filter((_, idx) => idx !== i) }))}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Hashtags */}
              <div className="form-group">
                <label>Hashtags</label>
                <input
                  type="text"
                  value={newPost.hashtags}
                  onChange={e => setNewPost(p => ({ ...p, hashtags: e.target.value }))}
                  placeholder="#social #media #marketing (comma separated)"
                />
                <div className="tip">Pro tip: Use 3-5 relevant hashtags for better reach</div>
              </div>

              {/* CTA */}
              <div className="form-group">
                <label>Call to Action</label>
                <input
                  type="text"
                  value={newPost.cta}
                  onChange={e => setNewPost(p => ({ ...p, cta: e.target.value }))}
                  placeholder="Learn more, Shop now, Visit website, etc."
                />
              </div>

              {/* Accounts */}
              <div className="form-group">
                <label>Select Accounts to Post *</label>
                {['Facebook', 'Instagram', 'WhatsApp', 'TikTok'].map(platform => (
                  <div key={platform} className="platform-group">
                    <h4 className="platform-title">{getPlatformIcon(platform)} {platform} {platform === 'Facebook' ? 'Pages' : 'Accounts'}</h4>
                    <div className="accounts-grid">
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
                              <div className="platform-badge">{acc.platform}</div>
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
                    Selected: {newPost.selectedAccounts.map(a => a.name).join(', ')}
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
                <div className="tip">Schedule in your audience's peak engagement times</div>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={resetForm}>Cancel</button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={submitting || newPost.selectedAccounts.length === 0}
                >
                  {submitting ? 'Scheduling...' : `Schedule to ${newPost.selectedAccounts.length} Account(s)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POSTS LIST */}
      <div className="posts-list-pro">
        <h3>Scheduled Posts ({posts.filter(p => p.status === 'scheduled').length})</h3>
        {posts.filter(p => p.status === 'scheduled').length === 0 ? (
          <p className="empty-state">No posts scheduled yet. Create your first post!</p>
        ) : (
          posts.filter(p => p.status === 'scheduled').map(post => (
            <div key={post.id} className="post-card-pro">
              <h4>{post.title}</h4>
              <p>{post.content}</p>
              <div className="post-meta">
                <span>{new Date(post.scheduledFor).toLocaleString()}</span>
                <span className="status scheduled">Scheduled</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="posts-list-pro">
        <h3>Published Posts ({posts.filter(p => p.status === 'published').length})</h3>
        {posts.filter(p => p.status === 'published').length === 0 ? (
          <p className="empty-state">No posts published yet.</p>
        ) : (
          posts.filter(p => p.status === 'published').map(post => (
            <div key={post.id} className="post-card-pro published">
              <h4>{post.title}</h4>
              <p>{post.content}</p>
              <div className="post-meta">
                <span>{new Date(post.scheduledFor).toLocaleString()}</span>
                <span className="status published">Published</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------
   ACCOUNTS MANAGER – PENDING VERIFICATION
   ------------------------------------------------- */
function AccountsManager({ accounts }) {
  const allAccounts = [
    { id: 'fb1', platform: 'Facebook', name: 'Facebook Page 1', type: 'page' },
    { id: 'fb2', platform: 'Facebook', name: 'Facebook Page 2', type: 'page' },
    { id: 'fb3', platform: 'Facebook', name: 'Facebook Page 3', type: 'page' },
    { id: 'ig1', platform: 'Instagram', name: 'Instagram Business 1', type: 'business' },
    { id: 'ig2', platform: 'Instagram', name: 'Instagram Business 2', type: 'business' },
    { id: 'ig3', platform: 'Instagram', name: 'Instagram Business 3', type: 'business' },
    { id: 'wa1', platform: 'WhatsApp', name: 'WhatsApp Business', type: 'business' },
    { id: 'tt1', platform: 'TikTok', name: 'TikTok Account', type: 'business' },
  ];

  const connected = accounts.map(a => a.id);
  const isPending = !connected.length;

  return (
    <div className="accounts-manager-pro">
      <h2>Connected Accounts</h2>
      {isPending ? (
        <div className="pending-verification">
          <div className="pending-icon">Lock</div>
          <h3>Waiting for Meta Business Verification</h3>
          <p>Your app is under review. Once approved, your accounts will be connected automatically.</p>
        </div>
      ) : (
        <div className="account-grid">
          {allAccounts.map(acc => (
            <div key={acc.id} className={`account-card ${connected.includes(acc.id) ? 'connected' : 'pending'}`}>
              <div className="platform-icon">{acc.platform}</div>
              <strong>{acc.name}</strong>
              <span className="account-type">{acc.type}</span>
              <span className="status-badge">
                {connected.includes(acc.id) ? 'Connected' : 'Pending Integration'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------
   CONVERSATIONS MANAGER – PROFESSIONAL CHAT UI
   ------------------------------------------------- */
function ConversationsManager({ conversations }) {
  return (
    <div className="conversations-manager-pro">
      <div className="conversations-header">
        <h2>Messages</h2>
        <button className="new-chat-btn">+ New Message</button>
      </div>

      {conversations.length === 0 ? (
        <div className="empty-chat">
          <div className="empty-icon">Message</div>
          <p>No conversations yet</p>
          <small>Customer messages will appear here once connected</small>
        </div>
      ) : (
        <div className="chat-list">
          {conversations.map(conv => (
            <div key={conv.id} className="chat-item">
              <div className="chat-avatar">User</div>
              <div className="chat-info">
                <strong>User {conv.userId}</strong>
                <p>{conv.messages[conv.messages.length - 1]?.text?.slice(0, 60)}...</p>
                <span className="chat-time">{new Date(conv.updatedAt).toLocaleString()}</span>
              </div>
              <div className="chat-platform">{conv.platform}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------
   CALENDAR VIEW (from previous pro version)
   ------------------------------------------------- */
// ... (copy CalendarView from previous response)

export default App;
