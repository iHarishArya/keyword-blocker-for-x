// Keyword Blocker for X - background service worker: owns blockedCount and the toolbar badge

// Chain all count updates so concurrent messages from several tabs can't lose increments
let queue = Promise.resolve();
function update(fn) {
  queue = queue
    .then(() => chrome.storage.local.get({ blockedCount: 0 }))
    .then((r) => chrome.storage.local.set({ blockedCount: fn(r.blockedCount) }))
    .catch((e) => console.warn('[X Keyword Blocker] Count update failed:', e));
}

// Badges fit ~4 characters: 999, 1.2k, 12k, 1.2M
function format(n) {
  if (n < 1000) return String(n);
  if (n < 10000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  if (n < 1e6) return Math.floor(n / 1000) + 'k';
  return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
}

function setBadge(n) {
  chrome.action.setBadgeText({ text: n > 0 ? format(n) : '' });
}

function refreshBadge() {
  chrome.action.setBadgeBackgroundColor({ color: '#e0245e' });
  chrome.storage.local.get({ blockedCount: 0 }, (r) => setBadge(r.blockedCount));
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === 'blocked' && msg.count > 0) update((n) => n + msg.count);
  else if (msg?.type === 'reset') update(() => 0);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.blockedCount) setBadge(changes.blockedCount.newValue || 0);
});

chrome.runtime.onInstalled.addListener(refreshBadge);
chrome.runtime.onStartup.addListener(refreshBadge);
refreshBadge();
