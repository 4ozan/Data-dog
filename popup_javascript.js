// popup.js - Popup interface logic

let dailyLimit = 1000; // Default 1GB daily limit in MB
let weeklyLimit = 5000; // Default 5GB weekly limit in MB
let monthlyLimit = 20000; // Default 20GB monthly limit in MB

document.addEventListener('DOMContentLoaded', function() {
  loadUsageData();
  loadLimits();
  updateConnectionStatus();
  
  // Set up event listeners
  document.getElementById('setLimitBtn').addEventListener('click', showLimitDialog);
  document.getElementById('resetBtn').addEventListener('click', resetUsage);
  document.getElementById('historyBtn').addEventListener('click', toggleHistory);
  
  // Listen for real-time updates from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'usageUpdate') {
      const daily = message.data.dailyUsage / (1024 * 1024);
      const weekly = message.data.weeklyUsage / (1024 * 1024);
      const monthly = message.data.monthlyUsage / (1024 * 1024);
      
      updateDisplay('daily', daily, dailyLimit);
      updateDisplay('weekly', weekly, weeklyLimit);
      updateDisplay('monthly', monthly, monthlyLimit);
      
      checkLimits(daily, weekly, monthly);
      
      // Update connection status
      document.getElementById('connectionStatus').innerHTML = '🟢 Live Tracking';
    }
  });
  
  // Update display every 2 seconds as backup
  setInterval(loadUsageData, 2000);
});

function loadUsageData() {
  chrome.storage.local.get(['dailyUsage', 'weeklyUsage', 'monthlyUsage'], function(result) {
    if (chrome.runtime.lastError) {
      console.error('Error loading usage data:', chrome.runtime.lastError);
      document.getElementById('connectionStatus').innerHTML = '🔴 Storage Error';
      return;
    }
    
    const daily = (result.dailyUsage || 0) / (1024 * 1024); // Convert to MB
    const weekly = (result.weeklyUsage || 0) / (1024 * 1024);
    const monthly = (result.monthlyUsage || 0) / (1024 * 1024);
    
    updateDisplay('daily', daily, dailyLimit);
    updateDisplay('weekly', weekly, weeklyLimit);
    updateDisplay('monthly', monthly, monthlyLimit);
    
    checkLimits(daily, weekly, monthly);
    
    // Update connection status to show data is loading
    if (daily > 0 || weekly > 0 || monthly > 0) {
      document.getElementById('connectionStatus').innerHTML = '🟢 Data Loaded';
    }
  });
}

function loadLimits() {
  chrome.storage.local.get(['dailyLimit', 'weeklyLimit', 'monthlyLimit'], function(result) {
    dailyLimit = result.dailyLimit || 1000;
    weeklyLimit = result.weeklyLimit || 5000;
    monthlyLimit = result.monthlyLimit || 20000;
  });
}

function updateConnectionStatus() {
  // Test connection to background script
  chrome.runtime.sendMessage({type: 'ping'}, (response) => {
    if (chrome.runtime.lastError) {
      document.getElementById('connectionStatus').innerHTML = '🔴 Disconnected';
    } else {
      document.getElementById('connectionStatus').innerHTML = '🟡 Connected';
    }
  });
}

function updateDisplay(period, usage, limit) {
  const usageElement = document.getElementById(period + 'Usage');
  const progressElement = document.getElementById(period + 'Progress');
  
  // Format usage display
  let displayUsage;
  if (usage >= 1024) {
    displayUsage = (usage / 1024).toFixed(2) + ' GB';
  } else {
    displayUsage = usage.toFixed(1) + ' MB';
  }
  
  usageElement.textContent = displayUsage;
  
  // Update progress bar
  const percentage = Math.min((usage / limit) * 100, 100);
  progressElement.style.width = percentage + '%';
  
  // Change color based on usage
  if (percentage > 90) {
    progressElement.style.background = 'linear-gradient(90deg, #f44336, #d32f2f)';
  } else if (percentage > 70) {
    progressElement.style.background = 'linear-gradient(90deg, #ff9800, #f57c00)';
  } else {
    progressElement.style.background = 'linear-gradient(90deg, #4CAF50, #8BC34A)';
  }
}

function checkLimits(daily, weekly, monthly) {
  const alertContainer = document.getElementById('alertContainer');
  alertContainer.innerHTML = '';
  
  const alerts = [];
  
  if (daily > dailyLimit * 0.9) {
    alerts.push(`Daily limit almost reached: ${(daily/dailyLimit*100).toFixed(0)}%`);
  }
  
  if (weekly > weeklyLimit * 0.9) {
    alerts.push(`Weekly limit almost reached: ${(weekly/weeklyLimit*100).toFixed(0)}%`);
  }
  
  if (monthly > monthlyLimit * 0.9) {
    alerts.push(`Monthly limit almost reached: ${(monthly/monthlyLimit*100).toFixed(0)}%`);
  }
  
  alerts.forEach(alert => {
    const alertElement = document.createElement('div');
    alertElement.className = 'alert';
    alertElement.textContent = alert;
    alertContainer.appendChild(alertElement);
  });
}

function showLimitDialog() {
  const dailyInput = prompt('Set daily limit (MB):', dailyLimit);
  if (dailyInput !== null) {
    const newDailyLimit = parseInt(dailyInput);
    if (!isNaN(newDailyLimit) && newDailyLimit > 0) {
      dailyLimit = newDailyLimit;
    }
  }
  
  const weeklyInput = prompt('Set weekly limit (MB):', weeklyLimit);
  if (weeklyInput !== null) {
    const newWeeklyLimit = parseInt(weeklyInput);
    if (!isNaN(newWeeklyLimit) && newWeeklyLimit > 0) {
      weeklyLimit = newWeeklyLimit;
    }
  }
  
  const monthlyInput = prompt('Set monthly limit (MB):', monthlyLimit);
  if (monthlyInput !== null) {
    const newMonthlyLimit = parseInt(monthlyInput);
    if (!isNaN(newMonthlyLimit) && newMonthlyLimit > 0) {
      monthlyLimit = newMonthlyLimit;
    }
  }
  
  // Save limits
  chrome.storage.local.set({
    dailyLimit: dailyLimit,
    weeklyLimit: weeklyLimit,
    monthlyLimit: monthlyLimit
  });
  
  // Refresh display
  loadUsageData();
}

function resetUsage() {
  if (confirm('Are you sure you want to reset all usage data?')) {
    chrome.storage.local.set({
      dailyUsage: 0,
      weeklyUsage: 0,
      monthlyUsage: 0,
      lastResetDate: new Date().toDateString()
    });
    
    loadUsageData();
  }
}

function toggleHistory() {
  const historyContainer = document.getElementById('historyContainer');
  const historyList = document.getElementById('historyList');
  
  if (historyContainer.style.display === 'none') {
    chrome.storage.local.get(['usageHistory'], function(result) {
      const history = result.usageHistory || [];
      
      historyList.innerHTML = '';
      
      if (history.length === 0) {
        historyList.innerHTML = '<div style="text-align: center; opacity: 0.7;">No history available</div>';
      } else {
        history.slice(-10).reverse().forEach(entry => {
          const historyItem = document.createElement('div');
          historyItem.className = 'history-item';
          
          const usage = (entry.usage / (1024 * 1024)).toFixed(1);
          historyItem.innerHTML = `
            <span>${entry.date}</span>
            <span>${usage} MB</span>
          `;
          
          historyList.appendChild(historyItem);
        });
      }
      
      historyContainer.style.display = 'block';
    });
  } else {
    historyContainer.style.display = 'none';
  }
}