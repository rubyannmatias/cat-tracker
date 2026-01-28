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
      console.log('Loading cat with ID:', catId);
      const token = localStorage.getItem('authToken');
      console.log('Token found for cat loading:', !!token);
      
      const response = await fetch(`/api/cats/${catId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Cat loading response status:', response.status);
      console.log('Cat loading response ok:', response.ok);

      if (response.ok) {
        this.cat = await response.json();
        console.log('Cat loaded successfully:', this.cat);
      } else {
        const error = await response.json();
        console.error('Cat loading failed:', error);
      }
    } catch (error) {
      console.error('Error loading cat:', error);
    }
  }

  async updateCat(updates, showLoading = true) {
    try {
      console.log('Updating cat with:', updates);
      console.log('Cat ID:', this.cat.id);
      
      // Show immediate loading feedback
      if (showLoading) {
        this.showLoadingState();
      }
      
      const token = localStorage.getItem('authToken');
      console.log('Token found:', !!token);
      
      const response = await fetch(`/api/cats/${this.cat.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      
      console.log('Update response status:', response.status);
      console.log('Update response ok:', response.ok);
      
      if (response.ok) {
        this.cat = await response.json();
        console.log('Cat updated successfully:', this.cat);
        // Only re-render what's necessary
        if (updates.lastFed) {
          this.updateFeedingStatus();
        } else {
          this.render();
        }
      } else {
        const error = await response.json();
        console.error('Update failed:', error);
        const modal = document.getElementById('modal');
        await modal.showAlert('Update Failed', error.error || 'Failed to update cat');
      }
    } catch (error) {
      console.error('Error updating cat:', error);
      const modal = document.getElementById('modal');
      await modal.showAlert('Update Failed', 'Network error occurred while updating cat');
    } finally {
      if (showLoading) {
        this.hideLoadingState();
      }
    }
  }

  async markFed(period) {
    console.log('Fed button clicked, period:', period);
    const user = JSON.parse(localStorage.getItem('currentUser'));
    console.log('Current user:', user);
    
    const updates = {
      lastFed: `${new Date().toISOString().split('T')[0]} ${period}`,
      lastSeenBy: user.name,
      daysNotSeen: 0
    };
    console.log('Feeding updates:', updates);
    
    await this.updateCat(updates);
  }

  showLoadingState() {
    const feedButtons = this.querySelectorAll('#feed-am, #feed-pm');
    feedButtons.forEach(btn => {
      btn.disabled = true;
      btn.innerHTML = '<div class="spinner" style="width: 16px; height: 16px; margin: 0 auto;"></div>';
    });
  }

  hideLoadingState() {
    const feedButtons = this.querySelectorAll('#feed-am, #feed-pm');
    feedButtons.forEach(btn => {
      btn.disabled = false;
      btn.innerHTML = btn.id === 'feed-am' ? '✓ Fed AM' : '✓ Fed PM';
    });
  }

  async deleteCat() {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/cats/${this.cat.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Cat deleted successfully:', result);
        
        // Show success message
        const successMsg = document.createElement('div');
        successMsg.style.cssText = 'position: fixed; top: 20px; right: 20px; background: var(--success); color: white; padding: 1rem 1.5rem; border-radius: 0.5rem; z-index: 2000; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
        successMsg.textContent = `✓ ${result.message}`;
        document.body.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 3000);
        
        // Redirect to cats list
        this.dispatchEvent(new CustomEvent('view-change', {
          detail: { view: 'cats' },
          bubbles: true,
          composed: true
        }));
      } else {
        const error = await response.json();
        const modal = document.getElementById('modal');
        await modal.showAlert('Delete Failed', error.error || 'Failed to delete cat');
      }
    } catch (error) {
      console.error('Error deleting cat:', error);
      const modal = document.getElementById('modal');
      await modal.showAlert('Delete Failed', 'Network error occurred while deleting cat');
    }
  }

  updateFeedingStatus() {
    const feedingDiv = this.querySelector('[style*="background: var(--background)"]');
    if (feedingDiv) {
      feedingDiv.innerHTML = `
        <h3 style="font-size: 1rem; margin-bottom: 0.75rem;">🍽️ Feeding Status</h3>
        ${this.renderFeedingStatus()}
        <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
          <button class="btn btn-primary" id="feed-am" style="flex: 1;">✓ Fed AM</button>
          <button class="btn btn-primary" id="feed-pm" style="flex: 1;">✓ Fed PM</button>
        </div>
      `;
      
      // Re-attach event listeners
      this.querySelector('#feed-am')?.addEventListener('click', () => this.markFed('AM'));
      this.querySelector('#feed-pm')?.addEventListener('click', () => this.markFed('PM'));
    }
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
        <div class="cat-profile-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
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
      
      <div id="edit-modal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; padding: 0.5rem; overflow-y: auto;">
        <div class="card" style="max-width: 700px; margin: 1rem auto; max-height: 95vh; overflow-y: auto;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h3 style="margin: 0;">Edit Cat Metadata</h3>
            <button type="button" id="close-modal" style="background: none; border: none; font-size: 2rem; cursor: pointer; color: var(--text-secondary); padding: 0; min-width: 44px; min-height: 44px; touch-action: manipulation;">×</button>
          </div>
          
          <form id="edit-form">
            <div class="edit-form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
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
            
            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border);">
              <button type="button" class="btn btn-danger" id="delete-btn" style="width: 100%;">
                🗑️ Delete Cat Profile
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    const feedAmBtn = this.querySelector('#feed-am');
    const feedPmBtn = this.querySelector('#feed-pm');
    
    console.log('Fed buttons found:', { feedAmBtn: !!feedAmBtn, feedPmBtn: !!feedPmBtn });
    
    feedAmBtn?.addEventListener('click', () => {
      console.log('Fed AM button clicked via event listener');
      this.markFed('AM');
    });
    
    feedPmBtn?.addEventListener('click', () => {
      console.log('Fed PM button clicked via event listener');
      this.markFed('PM');
    });
    
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
    
    const deleteBtn = this.querySelector('#delete-btn');
    deleteBtn?.addEventListener('click', async () => {
      const modal = document.getElementById('modal');
      const confirmed = await modal.showConfirm(
        'Delete Cat Profile',
        `Are you sure you want to delete "${this.cat.name}"? This action cannot be undone and will remove all associated photos and activity logs.`,
        {
          confirmText: 'Delete',
          cancelText: 'Cancel',
          confirmStyle: 'background: var(--danger);'
        }
      );
      
      if (confirmed) {
        await this.deleteCat();
      }
    });
  }
}

customElements.define('cat-profile', CatProfile);
