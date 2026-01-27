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
      }
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  }

  async deletePhoto(photoId) {
    if (!confirm('Delete this photo?')) return;

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
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
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
             style="width: 100%; height: 300px; object-fit: cover; border-radius: 0.5rem;">
        
        <div style="position: absolute; top: 0.5rem; right: 0.5rem; background: rgba(0,0,0,0.7); color: white; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem;">
          ${this.currentIndex + 1} / ${this.photos.length}
        </div>
        
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
        
        <button class="btn btn-outline" id="delete-btn" style="margin-top: 0.5rem; color: var(--error); border-color: var(--error);">
          🗑️ Delete Photo
        </button>
      </div>
    `;

    this.querySelector('#prev-btn')?.addEventListener('click', () => this.prevPhoto());
    this.querySelector('#next-btn')?.addEventListener('click', () => this.nextPhoto());
    this.querySelector('#delete-btn')?.addEventListener('click', () => this.deletePhoto(currentPhoto.id));
  }
}

customElements.define('photo-swiper', PhotoSwiper);
