// Blocked domains - only main pages
const BLOCKED_SITES = [
  { pattern: /^https?:\/\/(www\.)?youtube\.com\/?$/, name: 'youtube' },
  { pattern: /^https?:\/\/(www\.)?slickdeals\.net\/?$/, name: 'slickdeals' },
  { pattern: /^https?:\/\/news\.ycombinator\.com\/?$/, name: 'hackernews' },
  { pattern: /^https?:\/\/(www\.)?facebook\.com\/?$/, name: 'facebook' },
  { pattern: /^https?:\/\/(www\.)?instagram\.com\/?$/, name: 'instagram' },
  { pattern: /^https?:\/\/(www\.)?wsj\.com\/?$/, name: 'wsj' },
  { pattern: /^https?:\/\/(www\.)?nytimes\.com\/?$/, name: 'nytimes' },
  { pattern: /^https?:\/\/(www\.)?linkedin\.com\/?$/, name: 'linkedin' }
];

const COOLDOWN_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

// Check if URL matches any blocked site (main page only)
// Returns the site object if matched, null otherwise
function getBlockedSite(url) {
  return BLOCKED_SITES.find(site => site.pattern.test(url)) || null;
}

// Check if cooldown is active for a specific site
async function isCooldownActive(siteName) {
  const result = await chrome.storage.local.get(['cooldowns']);
  const now = Date.now();

  if (!result.cooldowns) {
    return false;
  }

  const cooldowns = result.cooldowns;

  if (cooldowns[siteName] && cooldowns[siteName] > now) {
    return true;
  }

  // Cooldown expired or doesn't exist, clean it up
  if (cooldowns[siteName]) {
    delete cooldowns[siteName];
    await chrome.storage.local.set({ cooldowns });
  }

  return false;
}

// Set cooldown for a specific site after completing breathing exercise
async function setCooldown(siteName) {
  const expiry = Date.now() + COOLDOWN_DURATION;
  const result = await chrome.storage.local.get(['cooldowns']);
  const cooldowns = result.cooldowns || {};

  cooldowns[siteName] = expiry;
  await chrome.storage.local.set({ cooldowns });
}

// Listen for navigation attempts
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  // Only handle main frame navigation (not iframes)
  if (details.frameId !== 0) {
    return;
  }

  const url = details.url;

  // Check if this is a blocked URL
  const blockedSite = getBlockedSite(url);
  if (!blockedSite) {
    return;
  }

  // Check if cooldown is active for this specific site
  const cooldownActive = await isCooldownActive(blockedSite.name);

  if (cooldownActive) {
    // Allow navigation
    return;
  }

  // Redirect to breathing exercise, passing both the URL and site name
  const breatheUrl = chrome.runtime.getURL('breathe.html') +
                     '?redirect=' + encodeURIComponent(url) +
                     '&site=' + encodeURIComponent(blockedSite.name);
  chrome.tabs.update(details.tabId, { url: breatheUrl });
});

// Listen for messages from breathe.html
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'exerciseComplete') {
    // Set cooldown for the specific site
    setCooldown(message.siteName).then(() => {
      // Redirect to original URL
      if (message.redirectUrl) {
        chrome.tabs.update(sender.tab.id, { url: message.redirectUrl });
      }
      sendResponse({ success: true });
    });
    return true; // Keep channel open for async response
  }
});
