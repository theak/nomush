# Mindful Breathing Blocker

Chrome extension that requires a breathing exercise before accessing distracting websites.

## Installation

1. Go to `chrome://extensions/`
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked"
4. Select this directory

## Configuration

All settings are in **`background.js`**:

### Blocked Websites
Lines 2-10, edit the `BLOCKED_SITES` array:
```javascript
const BLOCKED_SITES = [
  { pattern: /^https?:\/\/(www\.)?youtube\.com\/?$/, name: 'youtube' },
  { pattern: /^https?:\/\/(www\.)?instagram\.com\/?$/, name: 'instagram' }
];
```

### Cooldown Duration
Line 12:
```javascript
const COOLDOWN_DURATION = 15 * 60 * 1000; // 15 minutes (in milliseconds)
```

### Breathing Exercise Timing
In **`breathe.js`** (lines 8-10):
```javascript
const INHALE_DURATION_MS = 5000;  // 5 seconds
const EXHALE_DURATION_MS = 8000;  // 8 seconds
const TOTAL_CYCLES = 3;           // Number of breath cycles
```

## How It Works

- Only blocks **main pages** (e.g., `youtube.com/`, not `youtube.com/watch?v=...`)
- After completing the exercise, you get 15 minutes of free access **per site**
- Each website has its own cooldown timer
