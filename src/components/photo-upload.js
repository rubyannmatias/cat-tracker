class PhotoUpload extends HTMLElement {
  constructor() {
    super();
    this.selectedFile = null;
    this.recognitionResult = null;
  }

  connectedCallback() {
    this.render();
    this.attachEventListeners();
  }

  attachEventListeners() {
    const fileInput = this.querySelector('#photo-input');
    const uploadBtn = this.querySelector('#upload-btn');
    const form = this.querySelector('#upload-form');

    fileInput?.addEventListener('change', (e) => {
      this.selectedFile = e.target.files[0];
      if (this.selectedFile) {
        this.previewImage(this.selectedFile);
      }
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!this.selectedFile) {
        alert('Please select a photo');
        return;
      }
      await this.uploadPhoto();
    });
  }

  previewImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = this.querySelector('#preview');
      preview.innerHTML = `
        <img src="${e.target.result}" alt="Preview" 
             style="max-width: 100%; max-height: 400px; border-radius: 0.5rem;">
      `;
    };
    reader.readAsDataURL(file);
  }

  async uploadPhoto() {
    const formData = new FormData();
    formData.append('photo', this.selectedFile);

    const statusDiv = this.querySelector('#upload-status');
    statusDiv.innerHTML = '<div class="loading"><div class="spinner"></div><p>Uploading and analyzing...</p></div>';

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/photos/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        this.recognitionResult = result;
        this.showRecognitionResult(result);
      } else {
        statusDiv.innerHTML = `<p style="color: var(--error);">Upload failed: ${result.error}</p>`;
      }
    } catch (error) {
      console.error('Upload error:', error);
      statusDiv.innerHTML = '<p style="color: var(--error);">Upload failed. Please try again.</p>';
    }
  }

  showRecognitionResult(result) {
    const statusDiv = this.querySelector('#upload-status');
    
    if (result.recognized && result.matches && result.matches.length > 0) {
      statusDiv.innerHTML = `
        <div class="card" style="background: #f0fdf4; border: 2px solid var(--success);">
          <h3 style="color: var(--success); margin-bottom: 1rem;">Cat Recognized!</h3>
          <p style="margin-bottom: 1rem;">We found ${result.matches.length} possible match(es). Please confirm:</p>
          
          <div style="display: grid; gap: 1rem;">
            ${result.matches.map(cat => `
              <div class="card" style="cursor: pointer; border: 2px solid var(--border);" 
                   data-cat-id="${cat.id}" class="match-option">
                <div style="display: flex; gap: 1rem; align-items: center;">
                  ${cat.photos && cat.photos[0] ? `
                    <img src="${cat.photos[0].url}" alt="${cat.name}" 
                         style="width: 80px; height: 80px; object-fit: cover; border-radius: 0.5rem;">
                  ` : '<div style="width: 80px; height: 80px; background: var(--border); border-radius: 0.5rem; display: flex; align-items: center; justify-content: center;">🐱</div>'}
                  <div>
                    <h4>${cat.name}</h4>
                    <p style="color: var(--text-secondary); font-size: 0.875rem;">${cat.markings || 'No description'}</p>
                    <p style="color: var(--text-secondary); font-size: 0.875rem;">Confidence: ${(cat.confidence * 100).toFixed(0)}%</p>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
          
          <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
            <button class="btn btn-outline" id="new-cat-btn" style="flex: 1;">
              Create New Cat
            </button>
            <button class="btn btn-secondary" id="save-unrecognized-btn" style="flex: 1;">
              Save as Unrecognized
            </button>
          </div>
        </div>
      `;

      this.querySelectorAll('.match-option').forEach(option => {
        option.addEventListener('click', async () => {
          const catId = option.dataset.catId;
          await this.assignPhotoToCat(catId);
        });
      });

      this.querySelector('#new-cat-btn')?.addEventListener('click', () => {
        this.showNewCatForm();
      });

      this.querySelector('#save-unrecognized-btn')?.addEventListener('click', async () => {
        await this.saveAsUnrecognized();
      });
    } else {
      this.showNewCatForm();
    }
  }

  async assignPhotoToCat(catId) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/photos/${this.recognitionResult.photoId}/assign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ catId })
      });

      if (response.ok) {
        alert('Photo assigned successfully!');
        this.reset();
      }
    } catch (error) {
      console.error('Error assigning photo:', error);
    }
  }

  showNewCatForm() {
    const statusDiv = this.querySelector('#upload-status');
    statusDiv.innerHTML = `
      <div class="card" style="background: #fef3c7; border: 2px solid var(--warning); max-height: 80vh; overflow-y: auto;">
        <h3 style="color: var(--warning); margin-bottom: 1rem;">Create New Cat Profile</h3>
        <p style="color: var(--text-secondary); margin-bottom: 1.5rem; font-size: 0.875rem;">
          Fill in as much information as you know. You can always edit this later.
        </p>
        
        <form id="new-cat-form">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div style="grid-column: 1 / -1;">
              <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Cat Name *</label>
              <input type="text" name="name" class="input" required placeholder="e.g., Whiskers, Orange Tabby">
            </div>
            
            <div style="grid-column: 1 / -1;">
              <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Markings & Description</label>
              <textarea name="markings" class="input" rows="3" placeholder="Describe colors, patterns, unique features..."></textarea>
              <small style="color: var(--text-secondary);">Help others identify this cat</small>
            </div>
            
            <div>
              <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Building/Location</label>
              <input type="text" name="building" class="input" placeholder="e.g., Building A, Park Area">
            </div>
            
            <div>
              <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Gender (if known)</label>
              <select name="gender" class="input">
                <option value="">Unknown</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            
            <div style="grid-column: 1 / -1;">
              <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Vaccinations</label>
              <input type="text" name="vaccinations" class="input" placeholder="e.g., Rabies, FVRCP">
              <small style="color: var(--text-secondary);">List any known vaccinations</small>
            </div>
            
            <div style="grid-column: 1 / -1;">
              <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Health Notes</label>
              <textarea name="healthNotes" class="input" rows="2" placeholder="Any health concerns, injuries, or special needs..."></textarea>
            </div>
          </div>
          
          <div style="margin: 1.5rem 0; padding: 1rem; background: white; border-radius: 0.5rem;">
            <label style="display: flex; align-items: center; gap: 0.75rem; cursor: pointer;">
              <input type="checkbox" name="spayNeuter" style="width: 20px; height: 20px;">
              <span style="font-weight: 600;">Spayed/Neutered</span>
            </label>
          </div>
          
          <div style="display: flex; gap: 0.5rem;">
            <button type="submit" class="btn btn-primary" style="flex: 1;">✓ Create Cat Profile</button>
            <button type="button" class="btn btn-secondary" id="save-unrecognized-btn-form" style="flex: 1;">Save as Unrecognized</button>
          </div>
        </form>
      </div>
    `;

    this.querySelector('#new-cat-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      await this.createNewCat({
        name: formData.get('name'),
        markings: formData.get('markings'),
        building: formData.get('building'),
        gender: formData.get('gender'),
        vaccinations: formData.get('vaccinations'),
        healthNotes: formData.get('healthNotes'),
        spayNeuter: formData.get('spayNeuter') === 'on',
        photoId: this.recognitionResult.photoId
      });
    });

    this.querySelector('#save-unrecognized-btn-form')?.addEventListener('click', async () => {
      await this.saveAsUnrecognized();
    });
  }

  async saveAsUnrecognized() {
    alert('Photo saved as unrecognized. You can categorize it later from the Unrecognized tab.');
    this.reset();
  }

  async createNewCat(catData) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/cats', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(catData)
      });

      if (response.ok) {
        alert('New cat profile created successfully!');
        this.reset();
      }
    } catch (error) {
      console.error('Error creating cat:', error);
    }
  }

  reset() {
    this.selectedFile = null;
    this.recognitionResult = null;
    this.render();
    this.attachEventListeners();
  }

  render() {
    this.innerHTML = `
      <div class="card">
        <h2 style="margin-bottom: 1.5rem;">Upload Cat Photo</h2>
        
        <form id="upload-form">
          <div style="border: 2px dashed var(--border); border-radius: 0.75rem; padding: 2rem; text-align: center; margin-bottom: 1rem;">
            <input type="file" id="photo-input" accept="image/*" capture="environment" 
                   style="display: none;">
            <label for="photo-input" class="btn btn-primary" style="cursor: pointer;">
              📷 Choose Photo
            </label>
            <p style="margin-top: 1rem; color: var(--text-secondary);">
              Take a photo or select from gallery
            </p>
          </div>
          
          <div id="preview" style="margin-bottom: 1rem; text-align: center;"></div>
          
          <button type="submit" class="btn btn-primary" style="width: 100%;" id="upload-btn">
            Upload & Analyze
          </button>
        </form>
        
        <div id="upload-status" style="margin-top: 1.5rem;"></div>
      </div>
    `;
  }
}

customElements.define('photo-upload', PhotoUpload);
