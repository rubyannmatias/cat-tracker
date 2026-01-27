class CatTrackerApp extends HTMLElement {
  constructor() {
    super();
    this.currentView = 'login';
    this.currentUser = null;
  }

  connectedCallback() {
    this.checkAuth();
    this.render();
    this.attachEventListeners();
  }

  checkAuth() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('currentUser');
    if (token && user) {
      this.currentUser = JSON.parse(user);
      this.currentView = 'cats';
    }
  }

  attachEventListeners() {
    this.addEventListener('login-success', (e) => {
      this.currentUser = e.detail.user;
      localStorage.setItem('authToken', e.detail.token);
      localStorage.setItem('currentUser', JSON.stringify(e.detail.user));
      this.currentView = 'cats';
      this.render();
    });

    this.addEventListener('logout', () => {
      this.currentUser = null;
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      this.currentView = 'login';
      this.render();
    });

    this.addEventListener('view-change', (e) => {
      this.currentView = e.detail.view;
      this.render();
    });
  }

  render() {
    if (!this.currentUser) {
      this.innerHTML = `
        <div class="container">
          <volunteer-login></volunteer-login>
        </div>
      `;
      return;
    }

    this.innerHTML = `
      <header style="background: var(--primary-color); color: white; padding: 1rem 0; margin-bottom: 2rem;">
        <div class="container" style="display: flex; justify-content: space-between; align-items: center;">
          <h1 style="font-size: 1.5rem;">🐱 Cat Care Community</h1>
          <div style="display: flex; gap: 1rem; align-items: center;">
            <span>Welcome, ${this.currentUser.name}</span>
            <button class="btn btn-outline" id="logout-btn" style="color: white; border-color: white;">Logout</button>
          </div>
        </div>
      </header>
      
      <div class="container">
        <nav style="display: flex; gap: 1rem; margin-bottom: 2rem; border-bottom: 2px solid var(--border); padding-bottom: 1rem;">
          <button class="nav-btn ${this.currentView === 'cats' ? 'active' : ''}" data-view="cats">All Cats</button>
          <button class="nav-btn ${this.currentView === 'upload' ? 'active' : ''}" data-view="upload">Upload Photo</button>
          <button class="nav-btn ${this.currentView === 'unrecognized' ? 'active' : ''}" data-view="unrecognized">Unrecognized</button>
        </nav>
        
        <div id="view-content">
          ${this.renderView()}
        </div>
      </div>
      
      <style>
        .nav-btn {
          padding: 0.5rem 1rem;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 500;
          color: var(--text-secondary);
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }
        
        .nav-btn:hover {
          color: var(--primary-color);
        }
        
        .nav-btn.active {
          color: var(--primary-color);
          border-bottom-color: var(--primary-color);
        }
      </style>
    `;

    this.querySelector('#logout-btn')?.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('logout'));
    });

    this.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.currentView = e.target.dataset.view;
        this.render();
      });
    });
  }

  renderView() {
    switch (this.currentView) {
      case 'cats':
        return '<cat-list></cat-list>';
      case 'upload':
        return '<photo-upload></photo-upload>';
      case 'unrecognized':
        return '<unrecognized-cats></unrecognized-cats>';
      default:
        return '<cat-list></cat-list>';
    }
  }
}

customElements.define('cat-tracker-app', CatTrackerApp);
