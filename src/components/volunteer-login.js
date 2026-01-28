class VolunteerLogin extends HTMLElement {
  connectedCallback() {
    this.render();
    this.attachEventListeners();
  }

  attachEventListeners() {
    const loginForm = this.querySelector('#login-form');
    const registerForm = this.querySelector('#register-form');
    const showRegisterBtn = this.querySelector('#show-register');
    const showLoginBtn = this.querySelector('#show-login');

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleLogin(e.target);
    });

    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleRegister(e.target);
    });

    showRegisterBtn.addEventListener('click', () => {
      loginForm.style.display = 'none';
      registerForm.style.display = 'block';
      showRegisterBtn.style.display = 'none';
      showLoginBtn.style.display = 'block';
    });

    showLoginBtn.addEventListener('click', () => {
      loginForm.style.display = 'block';
      registerForm.style.display = 'none';
      showRegisterBtn.style.display = 'block';
      showLoginBtn.style.display = 'none';
    });
  }

  async handleLogin(form) {
    const formData = new FormData(form);
    const username = formData.get('username');
    const password = formData.get('password');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError);
        // If JSON parsing fails, create a basic error object
        data = { error: 'Login failed - server response error' };
      }
      
      console.log('Login response status:', response.status);
      console.log('Login response ok:', response.ok);
      console.log('Login response data:', data);
      
      if (response.ok) {
        this.dispatchEvent(new CustomEvent('login-success', {
          detail: { user: data.user, token: data.token },
          bubbles: true,
          composed: true
        }));
      } else {
        const modal = document.getElementById('modal');
        const errorMessage = data.error || 'Invalid username or password';
        console.log('Showing login error:', errorMessage);
        await modal.showAlert('Login Failed', errorMessage);
      }
    } catch (error) {
      console.error('Login network error:', error);
      const modal = document.getElementById('modal');
      
      // Try to extract error message from the error if possible
      let errorMessage = 'Network error. Please try again.';
      if (error.message && error.message.includes('Failed to fetch')) {
        errorMessage = 'Unable to connect to server. Please check your connection.';
      }
      
      await modal.showAlert('Login Failed', errorMessage);
    }
  }

  async handleRegister(form) {
    const formData = new FormData(form);
    const username = formData.get('username');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirm-password');
    const name = formData.get('name');
    const email = formData.get('email');

    if (password !== confirmPassword) {
      const modal = document.getElementById('modal');
      await modal.showAlert('Registration Failed', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      const modal = document.getElementById('modal');
      await modal.showAlert('Registration Failed', 'Password must be at least 6 characters');
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, name, email: email || null })
      });

      const data = await response.json();
      
      if (response.ok) {
        this.dispatchEvent(new CustomEvent('login-success', {
          detail: { user: data.user, token: data.token },
          bubbles: true,
          composed: true
        }));
      } else {
        const modal = document.getElementById('modal');
        await modal.showAlert('Registration Failed', data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      const modal = document.getElementById('modal');
      await modal.showAlert('Registration Failed', 'Network error. Please try again.');
    }
  }

  render() {
    this.innerHTML = `
      <div style="max-width: 400px; margin: 4rem auto;">
        <div class="card">
          <h2 style="text-align: center; margin-bottom: 2rem; color: var(--primary-color);">
            🐱 Cat Care Community
          </h2>
          
          <!-- Login Form -->
          <form id="login-form">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Username</label>
            <input type="text" name="username" class="input" placeholder="Choose a username" required>
            
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Password</label>
            <input type="password" name="password" class="input" placeholder="Enter your password" required>
            
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              Login
            </button>
          </form>
          
          <!-- Registration Form -->
          <form id="register-form" style="display: none;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Username *</label>
            <input type="text" name="username" class="input" placeholder="Choose a unique username" required>
            
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Name *</label>
            <input type="text" name="name" class="input" placeholder="Your full name" required>
            
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Password *</label>
            <input type="password" name="password" class="input" placeholder="Min 6 characters" required minlength="6">
            
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Confirm Password *</label>
            <input type="password" name="confirm-password" class="input" placeholder="Re-enter password" required minlength="6">
            
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Email (optional)</label>
            <input type="email" name="email" class="input" placeholder="your@email.com">
            
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              Create Account
            </button>
          </form>
          
          <div style="text-align: center; margin-top: 1.5rem;">
            <button type="button" id="show-register" class="btn btn-outline" style="font-size: 0.875rem; width: 100%;">
              Need an account? Register
            </button>
            <button type="button" id="show-login" class="btn btn-outline" style="font-size: 0.875rem; width: 100%; display: none;">
              Already have an account? Login
            </button>
          </div>
          
          <p style="text-align: center; margin-top: 1rem; color: var(--text-secondary); font-size: 0.875rem;">
            Secure login with username and password
          </p>
        </div>
      </div>
    `;
  }
}

customElements.define('volunteer-login', VolunteerLogin);
