const $ = (id) => document.getElementById(id);
let keywords = [];

function validate(entry) {
  const m = entry.match(/^\/(.+)\/([gimsuy]*)$/);
  if (!m) return null;
  try { new RegExp(m[1], m[2]); return null; } catch (e) { return 'Invalid regex: ' + e.message; }
}

function render() {
  const list = $('list');
  list.textContent = '';
  keywords.forEach((k, i) => {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.textContent = k;
    const del = document.createElement('button');
    del.textContent = '×';
    del.title = 'Remove';
    del.onclick = () => { keywords.splice(i, 1); save(); };
    li.append(span, del);
    list.appendChild(li);
  });
  $('empty').hidden = keywords.length > 0;
}

function save() {
  chrome.storage.sync.set({ keywords }, render);
}

$('add-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const val = $('keyword').value.trim();
  const err = $('error');
  err.hidden = true;
  if (!val) return;
  const problem = validate(val);
  if (problem) { err.textContent = problem; err.hidden = false; return; }
  if (!keywords.some((k) => k.toLowerCase() === val.toLowerCase())) {
    keywords.push(val);
    save();
  }
  $('keyword').value = '';
});

$('enabled').addEventListener('change', (e) => chrome.storage.sync.set({ enabled: e.target.checked }));
$('reset').addEventListener('click', () => chrome.runtime.sendMessage({ type: 'reset' }));

chrome.storage.sync.get({ enabled: true, keywords: [] }, (s) => {
  keywords = s.keywords;
  $('enabled').checked = s.enabled;
  render();
});
chrome.storage.local.get({ blockedCount: 0 }, (r) => ($('count').textContent = r.blockedCount));
chrome.storage.onChanged.addListener((c, area) => {
  if (area === 'local' && c.blockedCount) $('count').textContent = c.blockedCount.newValue;
});
