import { db } from '../database/init.js';

export function updateDaysNotSeen() {
  try {
    console.log('🔄 Running daily update for days not seen...');
    const cats = db.prepare('SELECT id, name, last_seen_date, days_not_seen FROM cats WHERE last_seen_date IS NOT NULL').all();
    
    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Today's date: ${today}`);
    console.log(`🐱 Processing ${cats.length} cats...`);
    
    let updatedCount = 0;
    
    for (const cat of cats) {
      const lastSeenDate = new Date(cat.last_seen_date);
      const todayDate = new Date(today);
      const diffTime = todayDate - lastSeenDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays !== cat.days_not_seen) {
        console.log(`📊 Updating ${cat.name}: ${cat.days_not_seen} → ${diffDays} days`);
        db.prepare('UPDATE cats SET days_not_seen = ? WHERE id = ?').run(diffDays, cat.id);
        updatedCount++;
      }
    }
    
    console.log(`✅ Daily update completed: ${updatedCount} cats updated`);
  } catch (error) {
    console.error('❌ Error updating days not seen:', error);
  }
}

export function startDailyUpdate() {
  console.log('⏰ Starting daily update timer (runs every 24 hours)');
  updateDaysNotSeen();
  
  setInterval(() => {
    console.log('⏰ 24-hour timer triggered - running daily update');
    updateDaysNotSeen();
  }, 24 * 60 * 60 * 1000);
  
  console.log('✅ Daily update timer started successfully');
}
