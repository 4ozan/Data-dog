// Background service worker for Data Dog Chrome extension
// Tracks aggregate network data usage (bytes) and stores counts in chrome.storage.
// Sends live updates to popup via chrome.runtime.sendMessage.

const KB = 1024;
const MB = KB * 1024;

// Initialize counters and reset daily usage if the date changed.
function initCounters() {
  chrome.storage.local.get(
    [
      'dailyUsage',
      'weeklyUsage',
      'monthlyUsage',
      'lastResetDate',
      'usageHistory',
    ],
    (res) => {
      const today = new Date().toDateString();
      let {
        dailyUsage = 0,
        weeklyUsage = 0,
        monthlyUsage = 0,
        lastResetDate = today,
        usageHistory = [],
      } = res;

      // If it's a new day, roll daily usage into history and reset.
      if (lastResetDate !== today) {
        usageHistory.push({ date: lastResetDate, usage: dailyUsage });
        // Keep at most 365 history entries.
        if (usageHistory.length > 365) usageHistory.shift();
        dailyUsage = 0;
        lastResetDate = today;
      }

      chrome.storage.local.set({
        dailyUsage,
        weeklyUsage,
        monthlyUsage,
        lastResetDate,
        usageHistory,
      });
    },
  );
}

initCounters();

// Add the given number of bytes to all counters and broadcast the update.
function addBytes(bytes) {
  if (!bytes || bytes <= 0) return;
  chrome.storage.local.get(
    ['dailyUsage', 'weeklyUsage', 'monthlyUsage'],
    ({ dailyUsage = 0, weeklyUsage = 0, monthlyUsage = 0 }) => {
      const newDaily = dailyUsage + bytes;
      const newWeekly = weeklyUsage + bytes;
      const newMonthly = monthlyUsage + bytes;

      chrome.storage.local.set(
        {
          dailyUsage: newDaily,
          weeklyUsage: newWeekly,
          monthlyUsage: newMonthly,
        },
        () => {
          chrome.runtime.sendMessage({
            type: 'usageUpdate',
            data: {
              dailyUsage: newDaily,
              weeklyUsage: newWeekly,
              monthlyUsage: newMonthly,
            },
          });
        },
      );
    },
  );
}

// Listen for completed requests and try to read the Content-Length header.
chrome.webRequest.onCompleted.addListener(
  (details) => {
    const clHeader = (details.responseHeaders || []).find(
      (h) => h.name.toLowerCase() === 'content-length',
    );
    if (clHeader) {
      const bytes = parseInt(clHeader.value, 10);
      if (!Number.isNaN(bytes)) addBytes(bytes);
    }
  },
  { urls: ['<all_urls>'] },
  ['responseHeaders'],
);

// Respond to ping from popup so it can show connection status.
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === 'ping') {
    sendResponse('pong');
  }
});
