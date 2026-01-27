import { db } from '../database/init.js';

export function updateDaysNotSeen() {
  try {
    const cats = db.prepare('SELECT id, last_seen_date FROM cats WHERE last_seen_date IS NOT NULL').all();
    
    const today = new Date().toISOString().split('T')[0];
    
    for (const cat of cats) {
      const lastSeenDate = new Date(cat.last_seen_date);
      const todayDate = new Date(today);
      const diffTime = todayDate - lastSeenDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays !== cat.days_not_seen) {
        db.prepare('UPDATE cats SET days_not_seen = ? WHERE id = ?').run(diffDays, cat.id);
      }
    }
  } catch (error) {
    console.error('Error updating days not seen:', error);
  }
}

export function startDailyUpdate() {
  updateDaysNotSeen();
  
  setInterval(() => {
    updateDaysNotSeen();
  }, 24 * 60 * 60 * 1000);
}
