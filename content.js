// Keyword Blocker for X - content script
(() => {
  const POST_SELECTOR = 'article[data-testid="tweet"]';
  let enabled = true;
  let rules = [];          // compiled matchers: { label, test(text) }
  let version = 0;         // bumped whenever settings change
  let pendingCount = 0;
  const evaluated = new WeakMap(); // article -> "version|postId" it was last evaluated for
  const countedIds = new Set();    // post IDs already counted on this page
  const countedPosts = new WeakSet(); // fallback for posts without a detectable ID

  // "/pattern/flags" => regex, anything else => case-insensitive plain substring
  function compile(entry) {
    const raw = entry.trim();
    if (!raw) return null;
    const m = raw.match(/^\/(.+)\/([gimsuy]*)$/);
    if (m) {
      try {
        const flags = m[2].replace('g', '').replace('y', '');
        const re = new RegExp(m[1], flags.includes('i') ? flags : flags + 'i');
        return { label: raw, test: (t) => re.test(t) };
      } catch (e) {
        console.warn('[Keyword Blocker for X] Invalid regex skipped:', raw);
        return null;
      }
    }
    const needle = raw.toLowerCase();
    return { label: raw, test: (t) => t.toLowerCase().includes(needle) };
  }

  function loadSettings(cb) {
    chrome.storage.sync.get({ enabled: true, keywords: [] }, (s) => {
      enabled = s.enabled;
      rules = s.keywords.map(compile).filter(Boolean);
      version++;
      cb && cb();
    });
  }

  function postText(article) {
    // Main text + quoted post text + card/link text + display name & handle
    const parts = [];
    article.querySelectorAll('[data-testid="tweetText"]').forEach((n) => parts.push(n.innerText));
    article.querySelectorAll('[data-testid="card.wrapper"]').forEach((n) => parts.push(n.innerText));
    const user = article.querySelector('[data-testid="User-Name"]');
    if (user) parts.push(user.innerText);
    return parts.join('\n');
  }

  // Permalink of the post (e.g. "/user/status/123"); X reuses <article> nodes for different posts
  function postId(article) {
    const link = article.querySelector('a[href*="/status/"] time')?.closest('a');
    return link ? link.getAttribute('href') : null;
  }

  function container(article) {
    // Hide the whole timeline cell so no blank gap remains
    return article.closest('[data-testid="cellInnerDiv"]') || article;
  }

  function flushCount() {
    if (!pendingCount) return;
    const add = pendingCount;
    pendingCount = 0;
    // The background worker serializes increments so multiple tabs don't overwrite each other
    try {
      chrome.runtime.sendMessage({ type: 'blocked', count: add }).catch(() => {});
    } catch (e) {
      // Extension was reloaded; this orphaned content script can no longer talk to it
    }
  }

  function evaluate(article) {
    const id = postId(article);
    const key = version + '|' + id;
    if (id && evaluated.get(article) === key) return; // no ID => always re-check
    evaluated.set(article, key);

    const box = container(article);
    const text = enabled && rules.length ? postText(article) : '';
    const hit = text && rules.some((r) => r.test(text));

    if (hit) {
      box.style.display = 'none';
      box.dataset.xkbHidden = '1';
      if (id ? !countedIds.has(id) : !countedPosts.has(article)) {
        id ? countedIds.add(id) : countedPosts.add(article);
        pendingCount++;
      }
    } else if (box.dataset.xkbHidden) {
      box.style.display = '';
      delete box.dataset.xkbHidden;
    }
  }

  function scan() {
    document.querySelectorAll(POST_SELECTOR).forEach(evaluate);
    flushCount();
  }

  // Debounced scan on DOM changes (X virtualizes and re-renders the timeline constantly)
  let timer = null;
  const observer = new MutationObserver(() => {
    if (timer) return;
    timer = setTimeout(() => { timer = null; scan(); }, 100);
  });

  loadSettings(() => {
    scan();
    observer.observe(document.body, { childList: true, subtree: true });
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && (changes.keywords || changes.enabled)) {
      loadSettings(scan);
    }
  });
})();
