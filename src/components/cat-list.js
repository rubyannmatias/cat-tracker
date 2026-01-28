class CatList extends HTMLElement {
  constructor() {
    super();
    this.cats = [];
    this.selectedCat = null;
    this.viewMode = localStorage.getItem('catListViewMode') || 'grid';
  }

  async connectedCallback() {
    await this.loadCats();
    this.render();
  }

  async loadCats() {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/cats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        this.cats = await response.json();
      }
    } catch (error) {
      console.error('Error loading cats:', error);
    }
  }

  showCatProfile(cat) {
    this.selectedCat = cat;
    this.render();
  }

  render() {
    if (this.selectedCat) {
      this.innerHTML = `
        <button class="btn btn-outline" id="back-btn" style="margin-bottom: 1rem;">← Back to List</button>
        <cat-profile cat-id="${this.selectedCat.id}"></cat-profile>
      `;
      
      this.querySelector('#back-btn').addEventListener('click', () => {
        this.selectedCat = null;
        this.render();
      });
      return;
    }

    this.innerHTML = `
      <div style="margin-bottom: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem;">
          <h2 style="margin: 0;">All Cats (${this.cats.length})</h2>
          <div style="display: flex; gap: 0.5rem; background: var(--surface); border-radius: 0.5rem; padding: 0.25rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
            <button class="view-toggle ${this.viewMode === 'grid' ? 'active' : ''}" data-view="grid" style="padding: 0.625rem 1rem; border: none; background: ${this.viewMode === 'grid' ? 'var(--primary-color)' : 'transparent'}; color: ${this.viewMode === 'grid' ? 'white' : 'var(--text-primary)'}; border-radius: 0.25rem; cursor: pointer; font-weight: 500; min-height: 44px; touch-action: manipulation; -webkit-tap-highlight-color: transparent; transition: all 0.2s;">
              📱 Grid
            </button>
            <button class="view-toggle ${this.viewMode === 'table' ? 'active' : ''}" data-view="table" style="padding: 0.625rem 1rem; border: none; background: ${this.viewMode === 'table' ? 'var(--primary-color)' : 'transparent'}; color: ${this.viewMode === 'table' ? 'white' : 'var(--text-primary)'}; border-radius: 0.25rem; cursor: pointer; font-weight: 500; min-height: 44px; touch-action: manipulation; -webkit-tap-highlight-color: transparent; transition: all 0.2s;">
              📊 Table
            </button>
          </div>
        </div>
        <input type="text" id="search" class="input" placeholder="Search cats..." style="margin: 0; width: 100%;">
      </div>
      
      <div id="cats-container">
        ${this.cats.length === 0 ? 
          '<p style="text-align: center; color: var(--text-secondary); padding: 3rem;">No cats found. Upload a photo to get started!</p>' :
          this.viewMode === 'grid' ? this.renderGridView() : this.renderTableView()
        }
      </div>
    `;

    this.querySelectorAll('.view-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.viewMode = e.target.dataset.view;
        localStorage.setItem('catListViewMode', this.viewMode);
        this.render();
      });
    });

    this.querySelectorAll('.cat-card, .table-row').forEach(card => {
      card.addEventListener('click', () => {
        const catId = card.dataset.catId;
        const cat = this.cats.find(c => c.id === parseInt(catId));
        if (cat) this.showCatProfile(cat);
      });
    });

    const searchInput = this.querySelector('#search');
    searchInput?.addEventListener('input', (e) => {
      this.filterCats(e.target.value);
    });
  }

  renderGridView() {
    return `
      <div class="grid grid-2">
        ${this.cats.map(cat => this.renderCatCard(cat)).join('')}
      </div>
    `;
  }

  renderTableView() {
    return `
      <div style="overflow-x: auto; -webkit-overflow-scrolling: touch; width: 100%;">
        <!-- Feeding Time Legend -->
        <div style="background: var(--surface); border-radius: 0.5rem; padding: 1rem; margin-bottom: 1rem; display: flex; gap: 1rem; flex-wrap: wrap; font-size: 0.875rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="color: #d97706; font-weight: 600;">🌅 AM Feeding</span>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="color: #3b82f6; font-weight: 600;">🌆 PM Feeding</span>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="color: var(--text-secondary);">No feeding record</span>
          </div>
        </div>
        
        <table style="width: 100%; min-width: 800px; border-collapse: collapse; background: var(--surface); border-radius: 0.5rem; overflow: hidden;">
          <thead>
            <tr style="background: var(--primary-color); color: white;">
              <th style="padding: 1rem; text-align: left; font-weight: 600; white-space: nowrap;">Name</th>
              <th style="padding: 1rem; text-align: left; font-weight: 600; white-space: nowrap;">Markings</th>
              <th style="padding: 1rem; text-align: left; font-weight: 600; white-space: nowrap;">Gender</th>
              <th style="padding: 1rem; text-align: left; font-weight: 600; white-space: nowrap;">Building</th>
              <th style="padding: 1rem; text-align: left; font-weight: 600; white-space: nowrap;">Spay/Neuter</th>
              <th style="padding: 1rem; text-align: left; font-weight: 600; white-space: nowrap;">Last Fed</th>
              <th style="padding: 1rem; text-align: left; font-weight: 600; white-space: nowrap;">Last Seen</th>
              <th style="padding: 1rem; text-align: left; font-weight: 600; white-space: nowrap;">Days Not Seen</th>
              <th style="padding: 1rem; text-align: left; font-weight: 600; white-space: nowrap;">Photos</th>
            </tr>
          </thead>
          <tbody>
            ${this.cats.map(cat => this.renderTableRow(cat)).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  renderTableRow(cat) {
    const daysNotSeen = cat.daysNotSeen || 0;
    const statusColor = daysNotSeen === 0 ? 'var(--success)' : daysNotSeen < 3 ? 'var(--warning)' : 'var(--error)';
    
    // Parse feeding time for color coding
    const getFeedingDisplay = (lastFed) => {
      if (!lastFed) return { text: '-', color: 'var(--text-secondary)' };
      
      const fedTime = lastFed.toLowerCase();
      let color = 'var(--text-secondary)';
      let displayText = lastFed;
      
      if (fedTime.includes('am')) {
        color = '#d97706'; // Darker amber for better readability
        displayText = `🌅 ${lastFed}`;
      } else if (fedTime.includes('pm')) {
        color = '#3b82f6'; // Blue for PM  
        displayText = `🌆 ${lastFed}`;
      }
      
      return { text: displayText, color };
    };
    
    const feedingDisplay = getFeedingDisplay(cat.last_fed);
    
    return `
      <tr class="table-row" data-cat-id="${cat.id}" style="border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.2s;">
        <td style="padding: 1rem; font-weight: 600;">${cat.name}</td>
        <td style="padding: 1rem; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${cat.markings || '-'}</td>
        <td style="padding: 1rem;">${cat.gender || '-'}</td>
        <td style="padding: 1rem;">${cat.building || '-'}</td>
        <td style="padding: 1rem;">${cat.spayNeuter ? '✓ Yes' : '✗ No'}</td>
        <td style="padding: 1rem; color: ${feedingDisplay.color}; font-weight: 600; white-space: nowrap;">${feedingDisplay.text}</td>
        <td style="padding: 1rem;">${cat.last_seen_by || '-'}</td>
        <td style="padding: 1rem; color: ${statusColor}; font-weight: 600;">${daysNotSeen}</td>
        <td style="padding: 1rem;">${cat.photo_count || 0}</td>
      </tr>
    `;
  }

  filterCats(query) {
    const filtered = this.cats.filter(cat => 
      cat.name.toLowerCase().includes(query.toLowerCase()) ||
      cat.markings?.toLowerCase().includes(query.toLowerCase()) ||
      cat.building?.toLowerCase().includes(query.toLowerCase()) ||
      cat.gender?.toLowerCase().includes(query.toLowerCase())
    );
    
    const container = this.querySelector('#cats-container');
    if (this.viewMode === 'grid') {
      container.innerHTML = filtered.length === 0 
        ? '<p style="text-align: center; color: var(--text-secondary); padding: 3rem;">No cats match your search.</p>'
        : `<div class="grid grid-2">${filtered.map(cat => this.renderCatCard(cat)).join('')}</div>`;
    } else {
      container.innerHTML = filtered.length === 0
        ? '<p style="text-align: center; color: var(--text-secondary); padding: 3rem;">No cats match your search.</p>'
        : this.renderTableViewFiltered(filtered);
    }
    
    this.querySelectorAll('.cat-card, .table-row').forEach(card => {
      card.addEventListener('click', () => {
        const catId = card.dataset.catId;
        const cat = this.cats.find(c => c.id === parseInt(catId));
        if (cat) this.showCatProfile(cat);
      });
    });
  }

  renderTableViewFiltered(cats) {
    return `
      <div style="overflow-x: auto; -webkit-overflow-scrolling: touch; width: 100%;">
        <!-- Feeding Time Legend -->
        <div style="background: var(--surface); border-radius: 0.5rem; padding: 1rem; margin-bottom: 1rem; display: flex; gap: 1rem; flex-wrap: wrap; font-size: 0.875rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="color: #d97706; font-weight: 600;">🌅 AM Feeding</span>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="color: #3b82f6; font-weight: 600;">🌆 PM Feeding</span>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="color: var(--text-secondary);">No feeding record</span>
          </div>
        </div>
        
        <table style="width: 100%; min-width: 800px; border-collapse: collapse; background: var(--surface); border-radius: 0.5rem; overflow: hidden;">
          <thead>
            <tr style="background: var(--primary-color); color: white;">
              <th style="padding: 1rem; text-align: left; font-weight: 600; white-space: nowrap;">Name</th>
              <th style="padding: 1rem; text-align: left; font-weight: 600; white-space: nowrap;">Markings</th>
              <th style="padding: 1rem; text-align: left; font-weight: 600; white-space: nowrap;">Gender</th>
              <th style="padding: 1rem; text-align: left; font-weight: 600; white-space: nowrap;">Building</th>
              <th style="padding: 1rem; text-align: left; font-weight: 600; white-space: nowrap;">Spay/Neuter</th>
              <th style="padding: 1rem; text-align: left; font-weight: 600; white-space: nowrap;">Last Fed</th>
              <th style="padding: 1rem; text-align: left; font-weight: 600; white-space: nowrap;">Last Seen</th>
              <th style="padding: 1rem; text-align: left; font-weight: 600; white-space: nowrap;">Days Not Seen</th>
              <th style="padding: 1rem; text-align: left; font-weight: 600; white-space: nowrap;">Photos</th>
            </tr>
          </thead>
          <tbody>
            ${cats.map(cat => this.renderTableRow(cat)).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  renderCatCard(cat) {
    const daysNotSeen = cat.daysNotSeen || 0;
    const statusBadge = daysNotSeen === 0 ? 'badge-success' : daysNotSeen < 3 ? 'badge-warning' : 'badge-error';
    // Show primary photo first, or fallback to latest (first in array)
    let primaryPhoto = null;
    if (cat.photos && cat.photos.length > 0) {
      console.log('=== DEBUGGING PRIMARY PHOTO ===');
      console.log(`Cat "${cat.name}" (ID: ${cat.id}) has ${cat.photos.length} photos`);
      console.log('Full cat object:', cat);
      cat.photos.forEach((photo, index) => {
        console.log(`Photo ${index}: id=${photo.id}, is_primary=${photo.is_primary} (${typeof photo.is_primary})`);
      });
      
      // Use explicit for loop instead of find() method
      for (let i = 0; i < cat.photos.length; i++) {
        const photo = cat.photos[i];
        console.log(`Checking photo ${i}: is_primary=${photo.is_primary}, comparison result: ${photo.is_primary === 1}`);
        if (photo.is_primary === 1) {
          primaryPhoto = photo;
          console.log('Found primary photo at index', i, 'Setting primaryPhoto:', primaryPhoto);
          break;
        }
      }
      
      console.log('Primary photo loop result:', primaryPhoto);
      
      // If no primary photo found, use the latest photo (first in array since ordered by date DESC)
      if (!primaryPhoto) {
        primaryPhoto = cat.photos[0]; // Latest photo
        console.log('No primary photo found, using latest photo');
      }
    }
    const lastPhoto = primaryPhoto || null;
    
    console.log('Final result: using photo', lastPhoto ? `id: ${lastPhoto.id}` : 'none');

    return `
      <div class="card cat-card" data-cat-id="${cat.id}" style="cursor: pointer; transition: transform 0.2s;">
        ${lastPhoto ? `
          <img src="${lastPhoto.url}" alt="${cat.name}" 
               style="width: 100%; height: 200px; object-fit: cover; border-radius: 0.5rem; margin-bottom: 1rem;">
        ` : `
          <div style="width: 100%; height: 200px; background: var(--border); border-radius: 0.5rem; margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; font-size: 3rem;">
            🐱
          </div>
        `}
        
        <h3 style="margin-bottom: 0.5rem;">${cat.name}</h3>
        
        <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
          <span class="badge ${statusBadge}">
            ${daysNotSeen === 0 ? 'Seen Today' : `${daysNotSeen} days ago`}
          </span>
          ${cat.spayNeuter ? '<span class="badge badge-success">Spayed/Neutered</span>' : ''}
        </div>
        
        <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem;">
          ${cat.markings || 'No markings description'}
        </p>
        
        ${cat.building ? `
          <p style="color: var(--text-secondary); font-size: 0.875rem;">
            📍 ${cat.building}
          </p>
        ` : ''}
        
        ${cat.lastSeenBy ? `
          <p style="color: var(--text-secondary); font-size: 0.875rem;">
            Last seen by: ${cat.lastSeenBy}
          </p>
        ` : ''}
      </div>
    `;
  }
}

customElements.define('cat-list', CatList);
