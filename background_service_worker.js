// background.js - Service Worker for monitoring data usage

let dailyUsage = 0;
let weeklyUsage = 0;
let monthlyUsage = 0;
let lastResetDate = new Date().toDateString();

// Initialize storage on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    dailyUsage: 0,
    weeklyUsage: 0,
    monthlyUsage: 0,
    lastResetDate: new Date().toDateString(),
    usageHistory: []
  });
});

// Load stored data on startup
chrome.storage.local.get(['dailyUsage', 'weeklyUsage', 'monthlyUsage', 'lastResetDate'], (result) => {
  dailyUsage = result.dailyUsage || 0;
  weeklyUsage = result.weeklyUsage || 0;
  monthlyUsage = result.monthlyUsage || 0;
  lastResetDate = result.lastResetDate || new Date().toDateString();
  
  // Check if we need to reset daily/weekly/monthly counters
  checkAndResetCounters();
  
  // Update badge immediately
  updateBadge();
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ping') {
    sendResponse({status: 'pong'});
  }
});

// Monitor web requests to track data usage
chrome.webRequest.onCompleted.addListener(
  (details) => {
    if (details.responseHeaders) {
      // Get content length from response headers
      const contentLengthHeader = details.responseHeaders.find(
        header => header.name.toLowerCase() === 'content-length'
      );
      
      let dataUsed = 0;
      if (contentLengthHeader) {
        dataUsed = parseInt(contentLengthHeader.value) || 0;
      } else {
        // Estimate data usage if content-length is not available
        dataUsed = estimateDataUsage(details.url, details.type);
      }
      
      // Update usage counters
      updateUsage(dataUsed);
    }
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);

// Also monitor outgoing requests
chrome.webRequest.onSendHeaders.addListener(
  (details) => {
    if (details.requestHeaders) {
      // Estimate upload data
      const contentLengthHeader = details.requestHeaders.find(
        header => header.name.toLowerCase() === 'content-length'
      );
      
      let dataUsed = 0;
      if (contentLengthHeader) {
        dataUsed = parseInt(contentLengthHeader.value) || 0;
      }
      
      if (dataUsed > 0) {
        updateUsage(dataUsed);
      }
    }
  },
  { urls: ["<all_urls>"] },
  ["requestHeaders"]
);

function estimateDataUsage(url, type) {
  // Estimate data usage based on resource type
  const estimates = {
    'main_frame': 50000,    // 50KB for HTML pages
    'sub_frame': 10000,     // 10KB for iframes
    'stylesheet': 20000,    // 20KB for CSS
    'script': 30000,        // 30KB for JS
    'image': 100000,        // 100KB for images
    'media': 500000,        // 500KB for media
    'other': 5000           // 5KB for other resources
  };
  
  return estimates[type] || estimates['other'];
}

function updateUsage(bytes) {
  dailyUsage += bytes;
  weeklyUsage += bytes;
  monthlyUsage += bytes;
  
  // Save to storage
  chrome.storage.local.set({
    dailyUsage: dailyUsage,
    weeklyUsage: weeklyUsage,
    monthlyUsage: monthlyUsage
  });
  
  // Update badge with daily usage
  updateBadge();
}

function updateBadge() {
  const dailyMB = (dailyUsage / (1024 * 1024)).toFixed(1);
  let badgeText;
  if (dailyMB >= 1000) {
    badgeText = (dailyMB / 1024).toFixed(1) + 'GB';
  } else {
    badgeText = dailyMB + 'MB';
  }
  
  chrome.action.setBadgeText({ text: badgeText });
  chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
  
  // Notify popup if it's open
  chrome.runtime.sendMessage({
    type: 'usageUpdate',
    data: {
      dailyUsage: dailyUsage,
      weeklyUsage: weeklyUsage,
      monthlyUsage: monthlyUsage
    }
  }).catch(() => {
    // Popup might not be open, ignore error
  });
}

function checkAndResetCounters() {
  const today = new Date();
  const lastReset = new Date(lastResetDate);
  
  // Reset daily counter if it's a new day
  if (today.toDateString() !== lastResetDate) {
    // Save yesterday's usage to history
    chrome.storage.local.get(['usageHistory'], (result) => {
      const history = result.usageHistory || [];
      history.push({
        date: lastResetDate,
        usage: dailyUsage
      });
      
      // Keep only last 30 days
      if (history.length > 30) {
        history.splice(0, history.length - 30);
      }
      
      chrome.storage.local.set({ usageHistory: history });
    });
    
    dailyUsage = 0;
    lastResetDate = today.toDateString();
    
    chrome.storage.local.set({
      dailyUsage: 0,
      lastResetDate: lastResetDate
    });
  }
  
  // Reset weekly counter (every Sunday)
  if (today.getDay() === 0 && today.getDay() !== lastReset.getDay()) {
    weeklyUsage = 0;
    chrome.storage.local.set({ weeklyUsage: 0 });
  }
  
  // Reset monthly counter
  if (today.getMonth() !== lastReset.getMonth()) {
    monthlyUsage = 0;
    chrome.storage.local.set({ monthlyUsage: 0 });
  }
}