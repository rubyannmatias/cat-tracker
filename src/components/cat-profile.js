class CatProfile extends HTMLElement {
  constructor() {
    super();
    this.cat = null;
  }

  async connectedCallback() {
    const catId = this.getAttribute('cat-id');
    await this.loadCat(catId);
    this.render();
  }

  async loadCat(catId) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/cats/${catId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        this.cat = await response.json();
      }
    } catch (error) {
      console.error('Error loading cat:', error);
    }
  }

  async updateCat(updates) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/cats/${this.cat.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        this.cat = await response.json();
        this.render();
      }
    } catch (error) {
      console.error('Error updating cat:', error);
    }
  }

  async markFed(period) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    await this.updateCat({
      lastFed: `${new Date().toISOString().split('T')[0]} ${period}`,
      lastSeenBy: user.name,
      daysNotSeen: 0
    });
  }

  renderFeedingStatus() {
    const today = new Date().toISOString().split('T')[0];
    const lastFed = this.cat.last_fed || '';
    
    const fedToday = lastFed.startsWith(today);
    const fedAM = lastFed.includes('AM');
    const fedPM = lastFed.includes('PM');
    
    if (!lastFed) {
      return `
        <p style="color: var(--error); font-weight: 500;">⚠️ Never fed - needs feeding!</p>
        <p style="font-size: 0.875rem; color: var(--text-secondary);">Click AM or PM after feeding</p>
      `;
    }
    
    if (fedToday) {
      const status = [];
      if (fedAM) status.push('AM ✓');
      if (fedPM) status.push('PM ✓');
      
      return `
        <p style="color: var(--success); font-weight: 500;">✓ Fed today: ${status.join(', ')}</p>
        <p style="font-size: 0.875rem; color: var(--text-secondary);">
          ${!fedAM ? 'Still needs AM feeding' : !fedPM ? 'Still needs PM feeding' : 'All fed for today!'}
        </p>
      `;
    }
    
    return `
      <p style="color: var(--warning); font-weight: 500;">⚠️ Not fed today</p>
      <p style="font-size: 0.875rem; color: var(--text-secondary);">Last fed: ${lastFed}</p>
    `;
  }

  render() {
    if (!this.cat) {
      this.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
      return;
    }

    this.innerHTML = `
      <div class="card">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
          <div>
            <h2 style="margin-bottom: 1rem;">${this.cat.name}</h2>
            
            <div style="margin-bottom: 1.5rem;">
              <h3 style="font-size: 1rem; margin-bottom: 0.5rem;">Details</h3>
              <p><strong>Markings:</strong> ${this.cat.markings || 'Not specified'}</p>
              ${this.cat.gender ? `<p><strong>Gender:</strong> ${this.cat.gender}</p>` : ''}
              <p><strong>Building:</strong> ${this.cat.building || 'Not specified'}</p>
              <p><strong>Spayed/Neutered:</strong> ${this.cat.spayNeuter ? 'Yes' : 'No'}</p>
              <p><strong>Vaccinations:</strong> ${this.cat.vaccinations || 'None recorded'}</p>
              <p><strong>Last Seen By:</strong> ${this.cat.last_seen_by || 'Unknown'}</p>
              <p><strong>Days Not Seen:</strong> ${this.cat.days_not_seen || 0}</p>
            </div>
            
            ${this.cat.health_notes ? `
              <div style="background: #fef3c7; border-left: 4px solid var(--warning); padding: 1rem; border-radius: 0.5rem; margin-bottom: 1.5rem;">
                <h3 style="font-size: 1rem; margin-bottom: 0.5rem; color: var(--warning);">⚕️ Health Notes</h3>
                <p style="margin: 0; white-space: pre-wrap;">${this.cat.health_notes}</p>
              </div>
            ` : ''}
            
            <div style="background: var(--background); padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
              <h3 style="font-size: 1rem; margin-bottom: 0.75rem;">🍽️ Feeding Status</h3>
              ${this.renderFeedingStatus()}
              <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
                <button class="btn btn-primary" id="feed-am" style="flex: 1;">✓ Fed AM</button>
                <button class="btn btn-primary" id="feed-pm" style="flex: 1;">✓ Fed PM</button>
              </div>
            </div>
            
            <button class="btn btn-outline" id="edit-btn">Edit Profile</button>
          </div>
          
          <div>
            <h3 style="font-size: 1rem; margin-bottom: 1rem;">Photos (${this.cat.photos?.length || 0})</h3>
            <photo-swiper cat-id="${this.cat.id}"></photo-swiper>
          </div>
        </div>
      </div>
      
      <div id="edit-modal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; padding: 1rem; overflow-y: auto;">
        <div class="card" style="max-width: 700px; margin: 2rem auto; max-height: 90vh; overflow-y: auto;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h3 style="margin: 0;">Edit Cat Metadata</h3>
            <button type="button" id="close-modal" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-secondary);">×</button>
          </div>
          
          <form id="edit-form">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div style="grid-column: 1 / -1;">
                <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Cat Name *</label>
                <input type="text" name="name" class="input" value="${this.cat.name}" required placeholder="e.g., Whiskers">
              </div>
              
              <div style="grid-column: 1 / -1;">
                <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Markings & Description</label>
                <textarea name="markings" class="input" rows="3" placeholder="Describe unique features, colors, patterns...">${this.cat.markings || ''}</textarea>
                <small style="color: var(--text-secondary);">Help volunteers identify this cat</small>
              </div>
              
              <div>
                <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Building/Location</label>
                <input type="text" name="building" class="input" value="${this.cat.building || ''}" placeholder="e.g., Building A">
              </div>
              
              <div>
                <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Gender</label>
                <select name="gender" class="input">
                  <option value="" ${!this.cat.gender ? 'selected' : ''}>Unknown</option>
                  <option value="Male" ${this.cat.gender === 'Male' ? 'selected' : ''}>Male</option>
                  <option value="Female" ${this.cat.gender === 'Female' ? 'selected' : ''}>Female</option>
                </select>
              </div>
              
              <div style="grid-column: 1 / -1;">
                <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Last Fed</label>
                <input type="text" name="lastFed" class="input" value="${this.cat.lastFed || ''}" placeholder="e.g., 2024-01-28 AM">
                <small style="color: var(--text-secondary);">Or use Fed buttons above</small>
              </div>
              
              <div style="grid-column: 1 / -1;">
                <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Vaccinations</label>
                <input type="text" name="vaccinations" class="input" value="${this.cat.vaccinations || ''}" placeholder="e.g., Rabies, FVRCP">
                <small style="color: var(--text-secondary);">List all vaccinations received</small>
              </div>
              
              <div style="grid-column: 1 / -1;">
                <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Health Status & Notes</label>
                <textarea name="healthNotes" class="input" rows="2" placeholder="Any health concerns, injuries, or special notes...">${this.cat.healthNotes || ''}</textarea>
              </div>
            </div>
            
            <div style="margin: 1.5rem 0; padding: 1rem; background: var(--background); border-radius: 0.5rem;">
              <label style="display: flex; align-items: center; gap: 0.75rem; cursor: pointer;">
                <input type="checkbox" name="spayNeuter" ${this.cat.spayNeuter ? 'checked' : ''} style="width: 20px; height: 20px;">
                <span style="font-weight: 600;">Spayed/Neutered</span>
              </label>
            </div>
            
            <div style="border-top: 1px solid var(--border); padding-top: 1rem; margin-top: 1rem;">
              <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 1rem;">
                <strong>Last seen by:</strong> ${this.cat.lastSeenBy || 'Unknown'}<br>
                <strong>Days not seen:</strong> ${this.cat.daysNotSeen || 0}
              </p>
            </div>
            
            <div style="display: flex; gap: 0.5rem; margin-top: 1.5rem;">
              <button type="submit" class="btn btn-primary" style="flex: 1;">💾 Save Changes</button>
              <button type="button" class="btn btn-outline" id="cancel-btn" style="flex: 1;">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.querySelector('#feed-am')?.addEventListener('click', () => this.markFed('AM'));
    this.querySelector('#feed-pm')?.addEventListener('click', () => this.markFed('PM'));
    
    const editBtn = this.querySelector('#edit-btn');
    const modal = this.querySelector('#edit-modal');
    const cancelBtn = this.querySelector('#cancel-btn');
    const closeBtn = this.querySelector('#close-modal');
    const editForm = this.querySelector('#edit-form');
    
    editBtn?.addEventListener('click', () => {
      modal.style.display = 'block';
    });
    
    const closeModal = () => {
      modal.style.display = 'none';
    };
    
    cancelBtn?.addEventListener('click', closeModal);
    closeBtn?.addEventListener('click', closeModal);
    
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    
    editForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(editForm);
      
      const updates = {
        name: formData.get('name'),
        markings: formData.get('markings'),
        building: formData.get('building'),
        gender: formData.get('gender'),
        vaccinations: formData.get('vaccinations'),
        spayNeuter: formData.get('spayNeuter') === 'on',
        lastFed: formData.get('lastFed'),
        healthNotes: formData.get('healthNotes')
      };
      
      await this.updateCat(updates);
      closeModal();
      
      const successMsg = document.createElement('div');
      successMsg.style.cssText = 'position: fixed; top: 20px; right: 20px; background: var(--success); color: white; padding: 1rem 1.5rem; border-radius: 0.5rem; z-index: 2000; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
      successMsg.textContent = '✓ Cat profile updated successfully!';
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 3000);
    });
  }
}

customElements.define('cat-profile', CatProfile);
