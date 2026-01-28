import './style.css';
import './components/app.js';
import './components/cat-list.js';
import './components/cat-profile.js';
import './components/photo-upload.js';
import './components/photo-swiper.js';
import './components/volunteer-login.js';
import './components/unrecognized-cats.js';
import './components/modal-dialog.js';
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  onNeedRefresh() {
    // Use custom modal for service worker update
    const modal = document.getElementById('modal');
    if (modal) {
      modal.showConfirm(
        'App Update Available',
        'A new version of the app is available. Would you like to reload to get the latest features?',
        'Reload Now'
      ).then((result) => {
        if (result) {
          updateSW(true);
        }
      });
    } else {
      // Fallback to native confirm if modal not available
      if (confirm('New content available. Reload?')) {
        updateSW(true);
      }
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
