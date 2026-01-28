class UnrecognizedCats extends HTMLElement {
  constructor() {
    super();
    this.photos = [];
  }

  async connectedCallback() {
    await this.loadUnrecognizedPhotos();
    this.render();
  }

  async loadUnrecognizedPhotos() {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/photos/unrecognized', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        this.photos = await response.json();
      }
    } catch (error) {
      console.error('Error loading unrecognized photos:', error);
    }
  }

  async loadAllCats() {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/cats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error loading cats:', error);
      return [];
    }
  }

  async assignToCat(photoId, catName) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/photos/${photoId}/assign-by-name`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ catName })
      });

      if (response.ok) {
        const modal = document.getElementById('modal');
        await modal.showAlert('Success', 'Photo assigned successfully!');
        this.photos = this.photos.filter(p => p.id !== photoId);
        this.render();
      } else {
        const error = await response.json();
        const modal = document.getElementById('modal');
        await modal.showAlert('Error', error.error || 'Failed to assign photo');
      }
    } catch (error) {
      console.error('Error assigning photo:', error);
      const modal = document.getElementById('modal');
      await modal.showAlert('Error', 'Failed to assign photo. Please try again.');
    }
  }

  async createNewCatFromPhoto(photoId) {
    const cats = await this.loadAllCats();
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; padding: 1rem; overflow-y: auto;';
    
    modal.innerHTML = `
      <div class="card" style="max-width: 700px; margin: 1rem auto; max-height: 95vh; overflow-y: auto;">
        <h3 style="margin-bottom: 1rem;">Create New Cat Profile</h3>
        <form id="new-cat-form-modal">
          <div class="edit-form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div style="grid-column: 1 / -1;">
              <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Cat Name *</label>
              <input type="text" name="name" class="input" required placeholder="e.g., Whiskers">
              <small style="color: var(--text-secondary);">Must be unique</small>
            </div>
            
            <div style="grid-column: 1 / -1;">
              <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Markings & Description</label>
              <textarea name="markings" class="input" rows="3" placeholder="Describe colors, patterns, unique features..."></textarea>
            </div>
            
            <div>
              <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Building/Location</label>
              <input type="text" name="building" class="input" placeholder="e.g., Building A">
            </div>
            
            <div>
              <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Gender</label>
              <select name="gender" class="input">
                <option value="">Unknown</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            
            <div style="grid-column: 1 / -1;">
              <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Vaccinations</label>
              <input type="text" name="vaccinations" class="input" placeholder="e.g., Rabies, FVRCP">
            </div>
            
            <div style="grid-column: 1 / -1;">
              <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Health Notes</label>
              <textarea name="healthNotes" class="input" rows="2" placeholder="Any health concerns..."></textarea>
            </div>
          </div>
          
          <div style="margin: 1rem 0; padding: 1rem; background: var(--background); border-radius: 0.5rem;">
            <label style="display: flex; align-items: center; gap: 0.75rem; cursor: pointer;">
              <input type="checkbox" name="spayNeuter" style="width: 20px; height: 20px;">
              <span style="font-weight: 600;">Spayed/Neutered</span>
            </label>
          </div>
          
          <div style="display: flex; gap: 0.5rem;">
            <button type="submit" class="btn btn-primary" style="flex: 1;">Create Profile</button>
            <button type="button" class="btn btn-outline" id="cancel-modal" style="flex: 1;">Cancel</button>
          </div>
        </form>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('#cancel-modal').addEventListener('click', () => {
      modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
    
    modal.querySelector('#new-cat-form-modal').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/cats', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: formData.get('name'),
            markings: formData.get('markings'),
            building: formData.get('building'),
            gender: formData.get('gender'),
            vaccinations: formData.get('vaccinations'),
            healthNotes: formData.get('healthNotes'),
            spayNeuter: formData.get('spayNeuter') === 'on',
            photoId: photoId
          })
        });
        
        if (response.ok) {
          const modalDialog = document.getElementById('modal');
          await modalDialog.showAlert('Success', 'Cat profile created successfully!');
          modal.remove();
          this.photos = this.photos.filter(p => p.id !== photoId);
          this.render();
        } else {
          const error = await response.json();
          const modalDialog = document.getElementById('modal');
          await modalDialog.showAlert('Error', error.error || 'Failed to create cat profile');
        }
      } catch (error) {
        console.error('Error creating cat:', error);
        const modalDialog = document.getElementById('modal');
        await modalDialog.showAlert('Error', 'Failed to create cat profile. Please try again.');
      }
    });
  }

  async showAssignModal(photoId) {
    const cats = await this.loadAllCats();
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem;';
    
    modal.innerHTML = `
      <div class="card" style="max-width: 500px; width: 100%; margin: 1rem;">
        <h3 style="margin-bottom: 1rem;">Assign to Cat</h3>
        <p style="color: var(--text-secondary); margin-bottom: 1rem;">Search and select a cat to assign this photo to:</p>
        
        <input type="text" id="cat-search" class="input" placeholder="Type cat name to search..." style="margin-bottom: 1rem;">
        
        <div id="cat-list" style="max-height: 300px; overflow-y: auto; margin-bottom: 1rem;">
          ${cats.map(cat => `
            <div class="cat-option" data-cat-name="${cat.name}" style="padding: 0.75rem; border: 1px solid var(--border); border-radius: 0.5rem; margin-bottom: 0.5rem; cursor: pointer; transition: background 0.2s;">
              <strong>${cat.name}</strong>
              ${cat.markings ? `<br><small style="color: var(--text-secondary);">${cat.markings}</small>` : ''}
            </div>
          `).join('')}
        </div>
        
        <button class="btn btn-outline" id="cancel-assign" style="width: 100%;">Cancel</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    const searchInput = modal.querySelector('#cat-search');
    const catList = modal.querySelector('#cat-list');
    const catOptions = modal.querySelectorAll('.cat-option');
    
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      catOptions.forEach(option => {
        const name = option.dataset.catName.toLowerCase();
        option.style.display = name.includes(query) ? 'block' : 'none';
      });
    });
    
    catOptions.forEach(option => {
      option.addEventListener('mouseenter', () => {
        option.style.background = 'var(--background)';
      });
      option.addEventListener('mouseleave', () => {
        option.style.background = 'transparent';
      });
      option.addEventListener('click', async () => {
        const catName = option.dataset.catName;
        modal.remove();
        await this.assignToCat(photoId, catName);
      });
    });
    
    modal.querySelector('#cancel-assign').addEventListener('click', () => {
      modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  render() {
    this.innerHTML = `
      <div>
        <h2 style="margin-bottom: 1.5rem;">Unrecognized Cats (${this.photos.length})</h2>
        
        ${this.photos.length === 0 ? `
          <div class="card" style="text-align: center; padding: 3rem;">
            <p style="font-size: 1.25rem; color: var(--text-secondary);">
              🎉 All photos have been categorized!
            </p>
          </div>
        ` : `
          <div class="grid grid-2">
            ${this.photos.map(photo => this.renderPhotoCard(photo)).join('')}
          </div>
        `}
      </div>
    `;

    this.querySelectorAll('.assign-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const photoId = parseInt(btn.dataset.photoId);
        await this.showAssignModal(photoId);
      });
    });

    this.querySelectorAll('.create-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const photoId = parseInt(btn.dataset.photoId);
        await this.createNewCatFromPhoto(photoId);
      });
    });

    this.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const photoId = parseInt(btn.dataset.photoId);
        const photo = this.photos.find(p => p.id === photoId);
        
        const modal = document.getElementById('modal');
        const confirmed = await modal.showConfirm(
          '🗑️ Delete Photo?',
          `Are you sure you want to delete this unrecognized photo?\n\nUploaded: ${new Date(photo.date).toLocaleDateString()}\nBy: ${photo.uploader || 'Unknown'}\n\nThis action cannot be undone.`,
          { confirmText: 'Delete', cancelText: 'Cancel', danger: true }
        );
        
        if (confirmed) {
          await this.deletePhoto(photoId);
        }
      });
    });
  }

  async deletePhoto(photoId) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/photos/${photoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const modal = document.getElementById('modal');
        await modal.showAlert('Success', 'Photo deleted successfully!');
        this.photos = this.photos.filter(p => p.id !== photoId);
        this.render();
      } else {
        const error = await response.json();
        const modal = document.getElementById('modal');
        await modal.showAlert('Error', `Failed to delete photo: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      const modal = document.getElementById('modal');
      await modal.showAlert('Error', 'Failed to delete photo. Please try again.');
    }
  }

  renderPhotoCard(photo) {
    return `
      <div class="card">
        <img src="${photo.url}" alt="Unrecognized cat" 
             style="width: 100%; height: 250px; object-fit: cover; border-radius: 0.5rem; margin-bottom: 1rem;">
        
        <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
          Uploaded: ${new Date(photo.date).toLocaleDateString()}
        </p>
        
        ${photo.uploader ? `
          <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
            By: ${photo.uploader}
          </p>
        ` : ''}
        
        ${photo.ocrText ? `
          <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 1rem;">
            <strong>Detected text:</strong> ${photo.ocrText}
          </p>
        ` : ''}
        
        <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
          <button class="btn btn-primary assign-btn" data-photo-id="${photo.id}" style="flex: 1;">
            Assign to Cat
          </button>
          <button class="btn btn-secondary create-btn" data-photo-id="${photo.id}" style="flex: 1;">
            Create New Profile
          </button>
        </div>
        <button class="btn btn-outline delete-btn" data-photo-id="${photo.id}" style="width: 100%; color: var(--error); border-color: var(--error);">
          🗑️ Delete Photo
        </button>
      </div>
    `;
  }
}

customElements.define('unrecognized-cats', UnrecognizedCats);
