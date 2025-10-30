import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// API Base URL
const API_BASE = 'https://social-media-manager-2.onrender.com/api';

function App() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [posts, setPosts] = useState<any[]>([]);
  const [socialAccounts, setSocialAccounts] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  /* ------------------------------------------------------------------ */
  /*  AUTH & DATA FETCHING                                              */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserData();
    }
  }, [token]);

  const fetchUserData = async () => {
    try {
      const [pRes, aRes, cRes] = await Promise.all([
        axios.get(`${API_BASE}/posts`),
        axios.get(`${API_BASE}/social-accounts`),
        axios.get(`${API_BASE}/conversations`),
      ]);
      setPosts(pRes.data.posts || []);
      setSocialAccounts(aRes.data.accounts || []);
      setConversations(cRes.data.conversations || []);
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 401) handleLogout();
    }
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      const { data } = await axios.post(`${API_BASE}/auth/login`, { email, password });
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
    } catch (err: any) {
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
          <ConversationsManager
            conversations={conversations}
            onConversationsUpdate={fetchUserData}
          />
        )}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  LOGIN PAGE                                                        */
/* ------------------------------------------------------------------ */
function LoginPage({ onLogin }: { onLogin: (e: string, p: string) => void }) {
  const [email, setEmail] = useState('admin@test.com');
  const [password, setPassword] = useState('password123');

  const handleSubmit = (e: React.FormEvent) => {
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

/* ------------------------------------------------------------------ */
/*  HEADER                                                            */
/* ------------------------------------------------------------------ */
function Header({ user, onLogout }: { user: any; onLogout: () => void }) {
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

/* ------------------------------------------------------------------ */
/*  NAVIGATION – WITH EMOJIS                                          */
/* ------------------------------------------------------------------ */
function Navigation({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: (t: string) => void;
}) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: 'BarChart' },
    { id: 'calendar', label: 'Calendar', icon: 'Calendar' },
    { id: 'posts', label: 'Posts', icon: 'FileText' },
    { id: 'accounts', label: 'Accounts', icon: 'Users' },
    { id: 'conversations', label: 'Messages', icon: 'MessageSquare' },
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

/* ------------------------------------------------------------------ */
/*  PROFESSIONAL DASHBOARD – WITH EMOJIS                              */
/* ------------------------------------------------------------------ */
function ProfessionalDashboard({
  posts,
  socialAccounts,
  conversations,
}: {
  posts: any[];
  socialAccounts: any[];
  conversations: any[];
}) {
  const scheduled = posts.filter(p => p.status === 'scheduled').length;
  const published = posts.filter(p => p.status === 'published').length;
  const activeAccounts = new Set(
    posts.flatMap(p => p.selectedAccounts?.map((a: any) => a.id) || [])
  ).size;

  return (
    <section className="professional-dashboard">
      <div className="dashboard-header">
        <h2>Dashboard Overview</h2>
        <div className="date-range">Last 30 Days</div>
      </div>

      <div className="stats-grid-pro">
        <StatCardPro
          icon="FileText"
          label="Total Posts"
          value={posts.length}
          trend="+12%"
          type="primary"
        />
        <StatCardPro
          icon="Clock"
          label="Scheduled"
          value={scheduled}
          trend="+5%"
          type="warning"
        />
        <StatCardPro
          icon="CheckCircle"
          label="Published"
          value={published}
          trend="+18%"
          type="success"
        />
        <StatCardPro
          icon="Users"
          label="Active Accounts"
          value={activeAccounts}
          trend="+3"
          type="info"
        />
      </div>

      <div className="dashboard-content-pro">
        <div className="content-column">
          <div className="content-card">
            <div className="card-header">
              <h3>Recent Posts</h3>
              <span className="badge success">Live</span>
            </div>
            <div className="card-content">
              {posts.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">FileText</div>
                  <p>No posts yet</p>
                </div>
              ) : (
                posts.slice(0, 3).map(p => (
                  <div key={p.id} className="post-item-pro">
                    <div className="post-preview">
                      <div className="post-avatar published">CheckCircle</div>
                      <div className="post-details">
                        <strong>{p.title}</strong>
                        <div className="post-time">
                          {new Date(p.scheduledFor).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <span className="post-status-badge success">Published</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="content-column">
          <div className="content-card">
            <div className="card-header">
              <h3>Recent Conversations</h3>
              <span className="badge info">Active</span>
            </div>
            <div className="card-content">
              {conversations.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">MessageSquare</div>
                  <p>No messages</p>
                </div>
              ) : (
                conversations.slice(0, 3).map(c => (
                  <div key={c.id} className="conversation-item-pro">
                    <div className="conversation-avatar">User</div>
                    <div className="conversation-details">
                      <strong>{c.from}</strong>
                      <p>{c.lastMessage}</p>
                    </div>
                    <div className="conversation-time">
                      {new Date(c.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  STAT CARD PRO                                                     */
/* ------------------------------------------------------------------ */
function StatCardPro({
  icon,
  label,
  value,
  trend,
  type,
}: {
  icon: string;
  label: string;
  value: number | string;
  trend?: string;
  type: 'primary' | 'success' | 'warning' | 'info';
}) {
  return (
    <div className={`stat-card-pro ${type}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <h3>{label}</h3>
        <div className="stat-number">{value}</div>
        {trend && <div className="stat-trend">{trend}</div>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ENHANCED POSTS MANAGER – WITH FILE UPLOAD & EMOJIS                */
/* ------------------------------------------------------------------ */
function EnhancedPostsManager({
  posts,
  socialAccounts,
  onPostCreated,
}: {
  posts: any[];
  socialAccounts: any[];
  onPostCreated: () => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    content: '',
    mediaType: 'text',
    mediaFiles: [] as File[],
    scheduledFor: '',
    selectedAccounts: [] as string[],
  });

  const accounts = [
    { id: 'fb1', platform: 'Facebook', name: 'Page 1' },
    { id: 'ig1', platform: 'Instagram', name: 'Business 1' },
    { id: 'wa1', platform: 'WhatsApp', name: 'Business' },
    { id: 'tt1', platform: 'TikTok', name: 'Account' },
  ];

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setForm(f => ({ ...f, mediaFiles: [...f.mediaFiles, ...files] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('content', form.content);
    formData.append('mediaType', form.mediaType);
    formData.append('scheduledFor', new Date(form.scheduledFor).toISOString());
    form.selectedAccounts.forEach(id => formData.append('accountIds', id));
    form.mediaFiles.forEach(file => formData.append('media', file));

    try {
      await axios.post(`${API_BASE}/posts`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setShowModal(false);
      setForm({
        title: '',
        content: '',
        mediaType: 'text',
        mediaFiles: [],
        scheduledFor: '',
        selectedAccounts: [],
      });
      onPostCreated();
    } catch (err: any) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="posts-manager">
      <div className="posts-header">
        <div className="header-content">
          <h2>Posts Manager</h2>
          <p>Schedule and publish across all platforms</p>
        </div>
        <button className="create-post-btn primary" onClick={() => setShowModal(true)}>
          Create Post
        </button>
      </div>

      {showModal && (
        <div className="create-post-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create New Post</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="post-form">
              <div className="form-group">
                <label>Title</label>
                <input
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Content</label>
                <textarea
                  rows={4}
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  required
                />
                <div className="character-count">{form.content.length}/280</div>
              </div>

              <div className="form-group">
                <label>Post Type</label>
                <div className="post-type-grid">
                  {['text', 'image', 'video', 'carousel', 'reel'].map(type => (
                    <label key={type} className="post-type-option">
                      <input
                        type="radio"
                        name="mediaType"
                        value={type}
                        checked={form.mediaType === type}
                        onChange={e => setForm({ ...form, mediaType: e.target.value })}
                      />
                      <div className="post-type-info">
                        <span className="post-type-icon">
                          {type === 'text' ? 'Text' : type === 'image' ? 'Image' : type === 'video' ? 'Video' : type === 'carousel' ? 'Carousel' : 'Reel'}
                        </span>
                        <div>
                          <strong>{type.charAt(0).toUpperCase() + type.slice(1)}</strong>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {form.mediaType !== 'text' && (
                <div className="form-group">
                  <label>Upload Media</label>
                  <div
                    className="file-upload-zone"
                    onDrop={handleFileDrop}
                    onDragOver={e => e.preventDefault()}
                  >
                    <div className="upload-content">
                      <div className="upload-icon">Upload</div>
                      <h4>Drop files here</h4>
                      <p>or click to browse</p>
                      <label className="file-input-label">
                        Choose Files
                        <input
                          type="file"
                          multiple
                          hidden
                          onChange={e => {
                            if (e.target.files) {
                              setForm(f => ({
                                ...f,
                                mediaFiles: [...f.mediaFiles, ...Array.from(e.target.files!)],
                              }));
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                  {form.mediaFiles.length > 0 && (
                    <div className="uploaded-files">
                      {form.mediaFiles.map((file, i) => (
                        <div key={i} className="uploaded-file-item">
                          <div className="file-preview">
                            <span>{file.name}</span>
                          </div>
                          <button
                            type="button"
                            className="remove-file-btn"
                            onClick={() =>
                              setForm(f => ({
                                ...f,
                                mediaFiles: f.mediaFiles.filter((_, idx) => idx !== i),
                              }))
                            }
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="form-group">
                <label>Schedule Date & Time</label>
                <input
                  type="datetime-local"
                  value={form.scheduledFor}
                  onChange={e => setForm({ ...form, scheduledFor: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Select Accounts</label>
                {accounts.map(acc => (
                  <label key={acc.id} className="account-checkbox">
                    <input
                      type="checkbox"
                      checked={form.selectedAccounts.includes(acc.id)}
                      onChange={() => {
                        setForm(f => ({
                          ...f,
                          selectedAccounts: f.selectedAccounts.includes(acc.id)
                            ? f.selectedAccounts.filter(id => id !== acc.id)
                            : [...f.selectedAccounts, acc.id],
                        }));
                      }}
                    />
                    <div className="account-info">
                      <span className="account-platform">{acc.platform}</span>
                      <strong>{acc.name}</strong>
                    </div>
                  </label>
                ))}
                {form.selectedAccounts.length > 0 && (
                  <div className="selection-summary">
                    <strong>{form.selectedAccounts.length} account(s) selected</strong>
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Schedule Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="posts-list">
        {posts.length === 0 ? (
          <div className="no-data">No posts scheduled</div>
        ) : (
          posts.map(p => (
            <div key={p.id} className={`post-card ${p.status}`}>
              <div className="post-header">
                <h3>{p.title}</h3>
                <span className={`post-type-badge ${p.mediaType}`}>
                  {p.mediaType}
                </span>
              </div>
              <p>{p.content}</p>
              <div className="post-meta">
                <span>{new Date(p.scheduledFor).toLocaleString()}</span>
                <span className={`status ${p.status}`}>{p.status}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ACCOUNTS MANAGER – PENDING                                        */
/* ------------------------------------------------------------------ */
function AccountsManager() {
  return (
    <div className="accounts-manager">
      <h2>Connected Accounts</h2>
      <div className="pending-verification">
        <div className="pending-icon">Lock</div>
        <h3>Meta Business Verification Required</h3>
        <p>Your app is under review. Accounts will appear here after approval.</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CONVERSATIONS MANAGER – EMPTY                                     */
/* ------------------------------------------------------------------ */
function ConversationsManager() {
  return (
    <div className="conversations-manager">
      <div className="conversations-header">
        <h2>Messages</h2>
      </div>
      <div className="empty-chat">
        <div className="empty-icon">MessageCircle</div>
        <p>No conversations yet. Connect accounts to start chatting.</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CALENDAR VIEW – SIMPLE GRID                                       */
/* ------------------------------------------------------------------ */
function CalendarView({ posts }: { posts: any[] }) {
  const today = new Date();
  const month = today.getMonth();
  const year = today.getFullYear();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  return (
    <div className="calendar-view">
      <div className="calendar-header">
        <h2>{today.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
      </div>
      <div className="calendar-grid-header">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="day-header">
            {d}
          </div>
        ))}
      </div>
      <div className="calendar-grid">
        {Array.from({ length: firstDay }, (_, i) => (
          <div key={`empty-${i}`} className="calendar-day empty" />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const hasPosts = posts.some(p => new Date(p.scheduledFor).getDate() === day);
          return (
            <div key={day} className={`calendar-day ${hasPosts ? 'has-posts' : ''}`}>
              <span className="day-number">{day}</span>
              {hasPosts && <div className="post-indicator">{posts.filter(p => new Date(p.scheduledFor).getDate() === day).length}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
