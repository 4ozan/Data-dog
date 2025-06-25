
import { useEffect, useState } from 'react'
import './Popup.css'

// Some chrome.* APIs don't have official types; declare minimal fallback
declare const chrome: any

const MB_DIVISOR = 1024 * 1024

type HistoryEntry = {
  date: string
  usage: number // bytes
}

export default function Popup() {
  // Usage (in MB)
  const [dailyUsage, setDailyUsage] = useState(0)
  const [weeklyUsage, setWeeklyUsage] = useState(0)
  const [monthlyUsage, setMonthlyUsage] = useState(0)

  // Limits (in MB)
  const [dailyLimit, setDailyLimit] = useState(1000)
  const [weeklyLimit, setWeeklyLimit] = useState(5000)
  const [monthlyLimit, setMonthlyLimit] = useState(20000)

  const [alerts, setAlerts] = useState<string[]>([])
  const [status, setStatus] = useState('🔴 Connecting...')

  const [historyVisible, setHistoryVisible] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>([])

  // Helper formatters
  const formatUsage = (u: number) =>
    u >= 1024 ? `${(u / 1024).toFixed(2)} GB` : `${u.toFixed(1)} MB`
  const pct = (u: number, limit: number) => Math.min((u / limit) * 100, 100)

  const computeAlerts = (
    daily: number,
    weekly: number,
    monthly: number,
    dLimit = dailyLimit,
    wLimit = weeklyLimit,
    mLimit = monthlyLimit,
  ) => {
    const arr: string[] = []
    if (daily > dLimit * 0.9)
      arr.push(`Daily limit almost reached: ${((daily / dLimit) * 100).toFixed(0)}%`)
    if (weekly > wLimit * 0.9)
      arr.push(`Weekly limit almost reached: ${((weekly / wLimit) * 100).toFixed(0)}%`)
    if (monthly > mLimit * 0.9)
      arr.push(`Monthly limit almost reached: ${((monthly / mLimit) * 100).toFixed(0)}%`)
    setAlerts(arr)
  }

  const refreshUsage = () => {
    chrome.storage.local.get(['dailyUsage', 'weeklyUsage', 'monthlyUsage'], (res: any) => {
      const d = (res.dailyUsage || 0) / MB_DIVISOR
      const w = (res.weeklyUsage || 0) / MB_DIVISOR
      const m = (res.monthlyUsage || 0) / MB_DIVISOR
      setDailyUsage(d)
      setWeeklyUsage(w)
      setMonthlyUsage(m)
      computeAlerts(d, w, m)
    })
  }

  const loadLimits = () => {
    chrome.storage.local.get(['dailyLimit', 'weeklyLimit', 'monthlyLimit'], (res: any) => {
      setDailyLimit(res.dailyLimit || 1000)
      setWeeklyLimit(res.weeklyLimit || 5000)
      setMonthlyLimit(res.monthlyLimit || 20000)
    })
  }

  const showLimitDialog = () => {
    const d = prompt('Set daily limit (MB):', dailyLimit.toString())
    if (d !== null) {
      const v = parseInt(d)
      if (!isNaN(v) && v > 0) setDailyLimit(v)
    }

    const w = prompt('Set weekly limit (MB):', weeklyLimit.toString())
    if (w !== null) {
      const v = parseInt(w)
      if (!isNaN(v) && v > 0) setWeeklyLimit(v)
    }

    const m = prompt('Set monthly limit (MB):', monthlyLimit.toString())
    if (m !== null) {
      const v = parseInt(m)
      if (!isNaN(v) && v > 0) setMonthlyLimit(v)
    }

    chrome.storage.local.set({
      dailyLimit,
      weeklyLimit,
      monthlyLimit,
    })
    refreshUsage()
  }

  const resetUsage = () => {
    if (confirm('Are you sure you want to reset all usage data?')) {
      chrome.storage.local.set({
        dailyUsage: 0,
        weeklyUsage: 0,
        monthlyUsage: 0,
        lastResetDate: new Date().toDateString(),
      })
      refreshUsage()
    }
  }

  const toggleHistory = () => {
    if (!historyVisible) {
      chrome.storage.local.get(['usageHistory'], (res: any) => {
        setHistory((res.usageHistory || []) as HistoryEntry[])
        setHistoryVisible(true)
      })
    } else {
      setHistoryVisible(false)
    }
  }

  useEffect(() => {
    refreshUsage()
    loadLimits()

    // Connection status
    chrome.runtime.sendMessage({ type: 'ping' }, () => {
      if (chrome.runtime.lastError) setStatus('🔴 Disconnected')
      else setStatus('🟡 Connected')
    })

    const listener = (msg: any) => {
      if (msg.type === 'usageUpdate') {
        const d = msg.data.dailyUsage / MB_DIVISOR
        const w = msg.data.weeklyUsage / MB_DIVISOR
        const m = msg.data.monthlyUsage / MB_DIVISOR
        setDailyUsage(d)
        setWeeklyUsage(w)
        setMonthlyUsage(m)
        computeAlerts(d, w, m)
        setStatus('🟢 Live Tracking')
      }
    }
    chrome.runtime.onMessage.addListener(listener)

    const id = setInterval(refreshUsage, 2000)
    return () => {
      chrome.runtime.onMessage.removeListener(listener)
      clearInterval(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="popup-root">
      <div className="header">
        <h1>Data Dog</h1>
        <p>Track your browser data usage in real-time</p>
        <div style={{ fontSize: 10, opacity: 0.7, marginTop: 5 }}>
          <span>{status}</span>
        </div>
      </div>

      {[
        { id: 'daily', label: 'Today', usage: dailyUsage, limit: dailyLimit },
        { id: 'weekly', label: 'This Week', usage: weeklyUsage, limit: weeklyLimit },
        { id: 'monthly', label: 'This Month', usage: monthlyUsage, limit: monthlyLimit },
      ].map(({ id, label, usage, limit }) => (
        <div className="usage-card" key={id}>
          <div className="usage-item">
            <span className="usage-label">{label}</span>
            <span className="usage-value">{formatUsage(usage)}</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct(usage, limit)}%` }} />
          </div>
        </div>
      ))}

      <div className="controls">
        <button className="btn btn-primary" onClick={showLimitDialog}>
          Set Limit
        </button>
        <button className="btn btn-secondary" onClick={resetUsage}>
          Reset
        </button>
        <button className="btn btn-secondary" onClick={toggleHistory}>
          History
        </button>
      </div>

      {/* Alerts */}
      {alerts.map((a) => (
        <div className="alert" key={a}>
          {a}
        </div>
      ))}

      {/* History */}
      {historyVisible && (
        <div id="historyContainer">
          <div className="usage-card">
            <h3 style={{ marginTop: 0 }}>Usage History</h3>
            <div className="history">
              {history.length === 0 ? (
                <div style={{ textAlign: 'center', opacity: 0.7 }}>No history available</div>
              ) : (
                history
                  .slice(-10)
                  .reverse()
                  .map((h, idx) => (
                    <div className="history-item" key={idx}>
                      <span>{h.date}</span>
                      <span>{formatUsage(h.usage / MB_DIVISOR)}</span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
