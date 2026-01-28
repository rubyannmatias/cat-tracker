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
    if (confirm('New content available. Reload?')) {
      updateSW(true);
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
