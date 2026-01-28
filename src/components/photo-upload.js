class PhotoUpload extends HTMLElement {
  constructor() {
    super();
    this.selectedFile = null;
    this.recognitionResult = null;
  }

  connectedCallback() {
    this.render();
    // Note: render() calls attachEventListeners() automatically
  }

  attachEventListeners() {
    console.log('=== ATTACH EVENT LISTENERS CALLED ===');
    const fileInput = this.querySelector('#photo-input');
    const uploadBtn = this.querySelector('#upload-btn');
    const form = this.querySelector('#upload-form');
    
    console.log('Elements found:', {
      fileInput: !!fileInput,
      uploadBtn: !!uploadBtn,
      form: !!form
    });

    fileInput?.addEventListener('change', (e) => {
      this.selectedFile = e.target.files[0];
      console.log('File selected:', this.selectedFile?.name, this.selectedFile?.size);
      
      if (this.selectedFile) {
        this.previewImage(this.selectedFile);
      }
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('=== FORM SUBMIT EVENT FIRED ===');
      console.log('Form submitted, selected file:', this.selectedFile);
      console.log('File details:', {
        name: this.selectedFile?.name,
        size: this.selectedFile?.size,
        type: this.selectedFile?.type
      });
      
      if (!this.selectedFile) {
        const modal = document.getElementById('modal');
        await modal.showAlert('No Photo Selected', 'Please select a photo before uploading.');
        return;
      }
      
      console.log('Calling uploadPhoto()...');
      await this.uploadPhoto();
      console.log('uploadPhoto() completed');
    });
  }

  previewImage(file) {
    const preview = this.querySelector('#preview');
    
    // Check if file is HEIC/HEIF (browsers can't preview these)
    const isHEIC = /\.(heic|heif)$/i.test(file.name) || 
                   file.type === 'image/heic' || 
                   file.type === 'image/heif';
    
    if (isHEIC) {
      preview.innerHTML = `
        <div style="padding: 2rem; background: var(--background); border-radius: 0.5rem; text-align: center;">
          <div style="font-size: 4rem; margin-bottom: 1rem;">📸</div>
          <p style="font-weight: 600; margin-bottom: 0.5rem;">${file.name}</p>
          <p style="color: var(--text-secondary); font-size: 0.875rem;">HEIC image selected (${(file.size / 1024 / 1024).toFixed(2)} MB)</p>
          <p style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.5rem;">
            ⚠️ Preview not available for HEIC format<br>
            Click "Upload & Analyze" - the server will convert it to JPG automatically
          </p>
        </div>
      `;
      return;
    }
    
    // For other image formats, show normal preview
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.innerHTML = `
        <img src="${e.target.result}" alt="Preview" 
             style="max-width: 100%; height: auto; max-height: 400px; border-radius: 0.5rem; display: block; margin: 0 auto; object-fit: contain;">
      `;
    };
    reader.readAsDataURL(file);
  }

  async uploadPhoto() {
    console.log('=== UPLOAD PHOTO FUNCTION STARTED ===');
    console.log('1. Selected file:', this.selectedFile);
    
    if (!this.selectedFile) {
      console.error('ERROR: No file selected');
      this.showError('No file selected', 'Please select a photo before uploading.');
      return;
    }

    console.log('2. Creating FormData...');
    const formData = new FormData();
    formData.append('photo', this.selectedFile);
    console.log('3. FormData created, file appended');

    const statusDiv = this.querySelector('#upload-status');
    console.log('4. Status div found:', !!statusDiv);
    statusDiv.innerHTML = '<div class="loading"><div class="spinner"></div><p>Uploading and analyzing...</p></div>';
    console.log('5. Loading indicator shown');

    try {
      const token = localStorage.getItem('authToken');
      console.log('6. Token retrieved:', !!token, token?.substring(0, 20) + '...');
      
      console.log('7. Sending fetch request to /api/photos/upload...');
      const response = await fetch('/api/photos/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      console.log('8. Response received! Status:', response.status, response.statusText);
      console.log('8a. Response headers:', {
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length')
      });
      
      console.log('9. Parsing JSON response...');
      let result;
      try {
        const responseText = await response.text();
        console.log('9a. Raw response text:', responseText.substring(0, 200));
        result = JSON.parse(responseText);
        console.log('10. Response data:', result);
      } catch (parseError) {
        console.error('JSON PARSE ERROR:', parseError);
        throw new Error('Server returned invalid JSON: ' + parseError.message);
      }

      if (response.ok) {
        console.log('11. Response OK! Showing recognition result...');
        this.recognitionResult = result;
        this.showRecognitionResult(result);
      } else {
        console.error('12. Response NOT OK! Status:', response.status);
        this.showError(
          `Upload Failed (Error ${response.status})`,
          result.error || 'Unknown error occurred',
          {
            fileName: this.selectedFile.name,
            fileSize: this.selectedFile.size,
            fileType: this.selectedFile.type,
            statusCode: response.status
          }
        );
      }
    } catch (error) {
      console.error('13. EXCEPTION CAUGHT:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      this.showError(
        'Upload Failed - Network Error',
        error.message,
        {
          fileName: this.selectedFile.name,
          fileSize: this.selectedFile.size,
          fileType: this.selectedFile.type,
          errorType: error.name
        }
      );
    }
    console.log('=== UPLOAD PHOTO FUNCTION ENDED ===');
  }

  showError(title, message, details = null) {
    const statusDiv = this.querySelector('#upload-status');
    const errorId = `ERR-${Date.now()}`;
    
    let detailsHtml = '';
    if (details) {
      detailsHtml = `
        <div style="margin-top: 1rem; padding: 1rem; background: var(--background); border-radius: 0.5rem; font-size: 0.875rem;">
          <p style="font-weight: 600; margin-bottom: 0.5rem;">Error Details (for reporting):</p>
          <p style="margin: 0.25rem 0;"><strong>Error ID:</strong> ${errorId}</p>
          ${details.fileName ? `<p style="margin: 0.25rem 0;"><strong>File:</strong> ${details.fileName}</p>` : ''}
          ${details.fileSize ? `<p style="margin: 0.25rem 0;"><strong>Size:</strong> ${(details.fileSize / 1024 / 1024).toFixed(2)} MB</p>` : ''}
          ${details.fileType ? `<p style="margin: 0.25rem 0;"><strong>Type:</strong> ${details.fileType}</p>` : ''}
          ${details.statusCode ? `<p style="margin: 0.25rem 0;"><strong>Status Code:</strong> ${details.statusCode}</p>` : ''}
          ${details.errorType ? `<p style="margin: 0.25rem 0;"><strong>Error Type:</strong> ${details.errorType}</p>` : ''}
          <p style="margin: 0.25rem 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
      `;
    }
    
    statusDiv.innerHTML = `
      <div class="card" style="background: #fee2e2; border: 2px solid var(--error);">
        <h3 style="color: var(--error); margin-bottom: 0.5rem;">❌ ${title}</h3>
        <p style="margin-bottom: 1rem;">${message}</p>
        
        ${detailsHtml}
        
        <div style="margin-top: 1rem; padding: 1rem; background: white; border-radius: 0.5rem; border-left: 4px solid var(--warning);">
          <p style="font-weight: 600; margin-bottom: 0.5rem;">📋 How to Report This Issue:</p>
          <ol style="margin: 0.5rem 0 0 1.25rem; line-height: 1.8;">
            <li>Take a screenshot of this error message</li>
            <li>Note the Error ID: <code style="background: var(--background); padding: 0.125rem 0.375rem; border-radius: 0.25rem;">${errorId}</code></li>
            <li>Contact your administrator with the screenshot and error details</li>
          </ol>
        </div>
        
        <button class="btn btn-primary" onclick="this.closest('.card').parentElement.innerHTML = ''" style="width: 100%; margin-top: 1rem;">
          Try Again
        </button>
      </div>
    `;
    
    console.error('Error displayed to user:', { errorId, title, message, details });
  }

  showRecognitionResult(result) {
    const statusDiv = this.querySelector('#upload-status');
    
    if (result.recognized && result.matches && result.matches.length > 0) {
      statusDiv.innerHTML = `
        <div class="card" style="background: #f0fdf4; border: 2px solid var(--success);">
          <h3 style="color: var(--success); margin-bottom: 1rem;">Cat Recognized!</h3>
          
          ${result.photoUrl ? `
            <div style="margin-bottom: 1rem; text-align: center;">
              <img src="${result.photoUrl}" alt="Uploaded photo" 
                   style="max-width: 100%; height: auto; max-height: 300px; border-radius: 0.5rem; object-fit: contain;">
              <p style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.5rem;">Your uploaded photo</p>
            </div>
          ` : ''}
          
          <p style="margin-bottom: 1rem;">We found ${result.matches.length} possible match(es). Please confirm:</p>
          
          <div style="display: grid; gap: 1rem;">
            ${result.matches.map(cat => `
              <div class="card" style="cursor: pointer; border: 2px solid var(--border);" 
                   data-cat-id="${cat.id}" class="match-option">
                <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
                  ${cat.photos && cat.photos[0] ? `
                    <img src="${cat.photos[0].url}" alt="${cat.name}" 
                         style="width: 80px; height: 80px; min-width: 80px; object-fit: cover; border-radius: 0.5rem;">
                  ` : '<div style="width: 80px; height: 80px; min-width: 80px; background: var(--border); border-radius: 0.5rem; display: flex; align-items: center; justify-content: center;">🐱</div>'}
                  <div style="flex: 1; min-width: 150px;">
                    <h4 style="margin: 0 0 0.25rem 0;">${cat.name}</h4>
                    <p style="color: var(--text-secondary); font-size: 0.875rem; margin: 0.25rem 0;">${cat.markings || 'No description'}</p>
                    <p style="color: var(--text-secondary); font-size: 0.875rem; margin: 0.25rem 0;">Confidence: ${(cat.confidence * 100).toFixed(0)}%</p>
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
        const modal = document.getElementById('modal');
        await modal.showAlert('Success', 'Photo assigned successfully!');
        this.reset();
      }
    } catch (error) {
      console.error('Error assigning photo:', error);
    }
  }

  showNewCatForm() {
    const statusDiv = this.querySelector('#upload-status');
    const photoUrl = this.recognitionResult?.photoUrl;
    
    statusDiv.innerHTML = `
      <div class="card" style="background: #fef3c7; border: 2px solid var(--warning); max-height: 80vh; overflow-y: auto;">
        <h3 style="color: var(--warning); margin-bottom: 1rem;">Create New Cat Profile</h3>
        
        ${photoUrl ? `
          <div style="margin-bottom: 1rem; text-align: center;">
            <img src="${photoUrl}" alt="Uploaded photo" 
                 style="max-width: 100%; height: auto; max-height: 250px; border-radius: 0.5rem; object-fit: contain;">
            <p style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.5rem;">Your uploaded photo - use this to fill out the profile</p>
          </div>
        ` : ''}
        
        <p style="color: var(--text-secondary); margin-bottom: 1.5rem; font-size: 0.875rem;">
          Fill in as much information as you know. You can always edit this later.
        </p>
        
        <form id="new-cat-form">
          <div class="edit-form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
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
    const modal = document.getElementById('modal');
    await modal.showAlert('Photo Saved', 'Photo saved as unrecognized. You can categorize it later from the Unrecognized tab.');
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
        const modal = document.getElementById('modal');
        await modal.showAlert('Success', 'New cat profile created successfully!');
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
    // Note: render() now calls attachEventListeners() automatically
  }

  render() {
    console.log('=== RENDER CALLED ===');
    this.innerHTML = `
      <div class="card">
        <h2 style="margin-bottom: 1.5rem;">Upload Cat Photo</h2>
        
        <form id="upload-form">
          <div style="border: 2px dashed var(--border); border-radius: 0.75rem; padding: 2rem; text-align: center; margin-bottom: 1rem;">
            <input type="file" id="photo-input" accept="image/*,image/heic,image/heif,.heic,.heif" capture="environment" 
                   style="display: none;">
            <label for="photo-input" class="btn btn-primary" style="cursor: pointer;">
              📷 Choose Photo
            </label>
            <p style="margin-top: 1rem; color: var(--text-secondary);">
              Take a photo or select from gallery (JPG, PNG, HEIC supported)
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
    
    console.log('HTML rendered, attaching event listeners...');
    this.attachEventListeners();
    console.log('Event listeners attached');
  }
}

customElements.define('photo-upload', PhotoUpload);
