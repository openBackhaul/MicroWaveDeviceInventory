const fs = require("fs");
const path = require("path");

const LOG_FILE = path.join(__dirname, "../alarm-notifications.log");

const MAX_SIZE_BYTES = 200 * 1024 * 1024; // 200 MB
const MAX_DAYS = 10; // reset file if older than 10 days


// Check and reset log file if too big or too old
function resetLogIfNeeded() {
  if (!fs.existsSync(LOG_FILE)) return;

  const stats = fs.statSync(LOG_FILE);
  const now = new Date();

  const tooLarge = stats.size > MAX_SIZE_BYTES;

  const lastModified = new Date(stats.mtime);
  const ageDays = (now - lastModified) / (1000 * 60 * 60 * 24);
  const tooOld = ageDays > MAX_DAYS;

  if (tooLarge || tooOld) {
    // Truncate file (clear content)
    fs.writeFileSync(LOG_FILE, "");
  }
}

function logAlarmNotificationUpdate(message) {
  try {
    resetLogIfNeeded();
    const timestamp = new Date().toISOString();
    fs.appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`);
  } catch (err) {
    console.error("Failed to write alarm notification update log:", err.message);
  }
}

module.exports = { logAlarmNotificationUpdate };
