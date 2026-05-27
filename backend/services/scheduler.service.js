const { pool } = require('../config/db');
const campaignsService = require('./campaigns.service');

function convertToUTC(dateStr, timeStr, timezone) {
  if (!dateStr || !timeStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  
  // Date created in UTC
  let date = new Date(Date.UTC(year, month - 1, day, hour, minute));
  
  // Adjust for timezone offsets
  if (timezone === 'IST') {
    // UTC+5:30. Subtract 330 minutes to get UTC.
    date.setMinutes(date.getMinutes() - 330);
  } else if (timezone === 'EST') {
    // UTC-5. Add 5 hours.
    date.setHours(date.getHours() + 5);
  } else if (timezone === 'PST') {
    // UTC-8. Add 8 hours.
    date.setHours(date.getHours() + 8);
  }
  return date;
}

function startScheduler() {
  console.log('Campaign background scheduler initialized.');
  
  setInterval(async () => {
    try {
      // Find all campaigns that are 'Scheduled'
      const [campaigns] = await pool.execute(
        `SELECT id, name, subject, body, template_id, scheduled_at, timezone, recipient_ids
         FROM campaigns
         WHERE status = 'Scheduled'`
      );

      const now = new Date();

      for (const campaign of campaigns) {
        if (!campaign.scheduled_at) continue;

        const scheduledTime = new Date(campaign.scheduled_at);
        
        // If the scheduled time is in the past, trigger it!
        if (scheduledTime <= now) {
          console.log(`Scheduler: Triggering scheduled campaign ${campaign.id} ("${campaign.name}")`);
          
          let visitorIds = [];
          if (campaign.recipient_ids) {
            try {
              visitorIds = JSON.parse(campaign.recipient_ids);
            } catch (e) {
              visitorIds = campaign.recipient_ids.split(',').map(Number).filter(n => !isNaN(n));
            }
          }

          if (visitorIds.length === 0) {
            // Mark as Failed if no recipients
            await pool.execute(
              `UPDATE campaigns SET status = 'Failed' WHERE id = ?`,
              [campaign.id]
            );
            continue;
          }

          // Set status to 'Sending' so it doesn't get picked up again
          await pool.execute(
            `UPDATE campaigns SET status = 'Sending', trigger_type = 'scheduled' WHERE id = ?`,
            [campaign.id]
          );

          // Execute trigger in background
          campaignsService.sendCampaignBackground(campaign, visitorIds).catch(err => {
            console.error(`Scheduler background send failed for campaign ${campaign.id}:`, err);
          });
        }
      }
    } catch (err) {
      console.error('Scheduler interval processing error:', err);
    }
  }, 30000); // run every 30 seconds
}

module.exports = {
  startScheduler,
  convertToUTC
};
