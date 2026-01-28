class PhotoSwiper extends HTMLElement {
  constructor() {
    super();
    this.photos = [];
    this.currentIndex = 0;
  }

  async connectedCallback() {
    const catId = this.getAttribute('cat-id');
    await this.loadPhotos(catId);
    this.render();
  }

  async loadPhotos(catId) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/cats/${catId}/photos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        this.photos = await response.json();
        
        // Find primary photo and set it as current index
        const primaryPhotoIndex = this.photos.findIndex(p => p.is_primary === 1 || p.is_primary === true);
        if (primaryPhotoIndex !== -1) {
          this.currentIndex = primaryPhotoIndex;
          console.log(`Found primary photo at index ${primaryPhotoIndex}`);
        } else {
          this.currentIndex = 0; // Default to first photo if no primary found
          console.log('No primary photo found, using first photo');
        }
      }
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  }

  async deletePhoto(photoId) {
    const modal = document.getElementById('modal');
    const result = await modal.showConfirm(
      'Delete Photo',
      'Are you sure you want to delete this photo? This action cannot be undone.',
      'Delete',
      'danger'
    );
    
    if (!result) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/photos/${photoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        this.photos = this.photos.filter(p => p.id !== photoId);
        if (this.currentIndex >= this.photos.length) {
          this.currentIndex = Math.max(0, this.photos.length - 1);
        }
        this.render();
      } else {
        const errorData = await response.json().catch(() => ({}));
        await modal.showAlert('Delete Failed', errorData.error || 'Failed to delete photo');
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      await modal.showAlert('Delete Failed', 'Network error occurred while deleting photo');
    }
  }

  async setPrimaryPhoto(photoId) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/photos/${photoId}/set-primary`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        // Update all photos to reflect new primary status
        this.photos = this.photos.map(p => ({
          ...p,
          is_primary: p.id === photoId ? 1 : 0
        }));
        this.render();
      }
    } catch (error) {
      console.error('Error setting primary photo:', error);
    }
  }

  nextPhoto() {
    if (this.currentIndex < this.photos.length - 1) {
      this.currentIndex++;
      this.render();
    }
  }

  prevPhoto() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.render();
    }
  }

  render() {
    if (this.photos.length === 0) {
      this.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No photos yet</p>';
      return;
    }

    const currentPhoto = this.photos[this.currentIndex];

    this.innerHTML = `
      <div style="position: relative;">
        <img src="${currentPhoto.url}" alt="Cat photo" 
             style="width: 100%; height: 300px; object-fit: cover; border-radius: 0.5rem; cursor: pointer;"
             id="main-photo">
        
        <div style="position: absolute; top: 0.5rem; right: 0.5rem; background: rgba(0,0,0,0.7); color: white; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem;">
          ${this.currentIndex + 1} / ${this.photos.length}
        </div>
        
        ${currentPhoto.is_primary ? `
          <div style="position: absolute; top: 0.5rem; left: 0.5rem; background: var(--primary-color); color: white; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 600;">
            ⭐ Primary
          </div>
        ` : ''}
        
        ${this.photos.length > 1 ? `
          <button style="position: absolute; left: 0.5rem; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.7); color: white; border: none; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; font-size: 1.5rem;" 
                  id="prev-btn" ${this.currentIndex === 0 ? 'disabled' : ''}>
            ‹
          </button>
          
          <button style="position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.7); color: white; border: none; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; font-size: 1.5rem;" 
                  id="next-btn" ${this.currentIndex === this.photos.length - 1 ? 'disabled' : ''}>
            ›
          </button>
        ` : ''}
        
        <button style="position: absolute; bottom: 0.5rem; right: 0.5rem; background: rgba(0,0,0,0.7); color: white; border: none; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; font-size: 1.2rem;" 
                id="fullscreen-btn" title="View full size">
          ⛶
        </button>
      </div>
      
      <div style="margin-top: 1rem;">
        <p style="font-size: 0.875rem; color: var(--text-secondary);">
          Uploaded: ${new Date(currentPhoto.date).toLocaleDateString()}
        </p>
        ${currentPhoto.uploader ? `
          <p style="font-size: 0.875rem; color: var(--text-secondary);">
            By: ${currentPhoto.uploader}
          </p>
        ` : ''}
        ${currentPhoto.ocrText ? `
          <p style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.5rem;">
            <strong>Detected text:</strong> ${currentPhoto.ocrText}
          </p>
        ` : ''}
        
        <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
          ${!currentPhoto.is_primary ? `
            <button class="btn btn-primary" id="set-primary-btn" style="flex: 1;">
              ⭐ Set as Primary
            </button>
          ` : ''}
          <button class="btn btn-outline" id="delete-btn" style="flex: 1; color: var(--error); border-color: var(--error);">
            🗑️ Delete Photo
          </button>
        </div>
      </div>
    `;

    this.querySelector('#prev-btn')?.addEventListener('click', () => this.prevPhoto());
    this.querySelector('#next-btn')?.addEventListener('click', () => this.nextPhoto());
    this.querySelector('#delete-btn')?.addEventListener('click', () => this.deletePhoto(currentPhoto.id));
    this.querySelector('#set-primary-btn')?.addEventListener('click', () => this.setPrimaryPhoto(currentPhoto.id));
    this.querySelector('#fullscreen-btn')?.addEventListener('click', () => this.showFullscreen(currentPhoto));
    this.querySelector('#main-photo')?.addEventListener('click', () => this.showFullscreen(currentPhoto));
  }

  showFullscreen(photo) {
    const fullscreenDiv = document.createElement('div');
    fullscreenDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.95);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      cursor: pointer;
    `;
    
    fullscreenDiv.innerHTML = `
      <div style="position: relative; max-width: 90vw; max-height: 90vh;">
        <img src="${photo.url}" alt="Full size cat photo" 
             style="max-width: 100%; max-height: 90vh; object-fit: contain; border-radius: 0.5rem;">
        
        <button style="position: absolute; top: 1rem; right: 1rem; background: rgba(0,0,0,0.7); color: white; border: none; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; font-size: 1.5rem;"
                onclick="this.parentElement.parentElement.remove()">
          ✕
        </button>
        
        <div style="position: absolute; bottom: 1rem; left: 1rem; background: rgba(0,0,0,0.7); color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.875rem;">
          ${photo.is_primary ? '⭐ Primary Photo' : 'Photo ' + (this.currentIndex + 1) + ' of ' + this.photos.length}
        </div>
      </div>
    `;
    
    fullscreenDiv.addEventListener('click', (e) => {
      if (e.target === fullscreenDiv) {
        fullscreenDiv.remove();
      }
    });
    
    document.body.appendChild(fullscreenDiv);
  }
}

customElements.define('photo-swiper', PhotoSwiper);
