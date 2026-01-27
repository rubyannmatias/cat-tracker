class VolunteerLogin extends HTMLElement {
  connectedCallback() {
    this.render();
    this.attachEventListeners();
  }

  attachEventListeners() {
    const form = this.querySelector('#login-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const name = formData.get('name');
      const email = formData.get('email');

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email })
        });

        const data = await response.json();
        
        if (response.ok) {
          this.dispatchEvent(new CustomEvent('login-success', {
            detail: { user: data.user, token: data.token },
            bubbles: true,
            composed: true
          }));
        } else {
          alert(data.error || 'Login failed');
        }
      } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
      }
    });
  }

  render() {
    this.innerHTML = `
      <div style="max-width: 400px; margin: 4rem auto;">
        <div class="card">
          <h2 style="text-align: center; margin-bottom: 2rem; color: var(--primary-color);">
            🐱 Cat Care Community
          </h2>
          <form id="login-form">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Name</label>
            <input type="text" name="name" class="input" placeholder="Your name" required>
            
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Email</label>
            <input type="email" name="email" class="input" placeholder="your@email.com" required>
            
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              Login / Register
            </button>
          </form>
          
          <p style="text-align: center; margin-top: 1rem; color: var(--text-secondary); font-size: 0.875rem;">
            Join our community to help track and care for local cats
          </p>
        </div>
      </div>
    `;
  }
}

customElements.define('volunteer-login', VolunteerLogin);
