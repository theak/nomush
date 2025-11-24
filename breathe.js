const orb = document.getElementById('breath-orb');
const text = document.getElementById('status-text');
const timerDisplay = document.getElementById('timer-text');
const instruction = document.getElementById('instruction-label');
const ripple = document.getElementById('ripple-bg');

// Configuration
const INHALE_DURATION_MS = 5000;
const EXHALE_DURATION_MS = 8000;
const TOTAL_CYCLES = 3;

let currentCycle = 0;
let isBreathing = false;

// Get the redirect URL and site name from query parameters
const urlParams = new URLSearchParams(window.location.search);
const redirectUrl = urlParams.get('redirect');
const siteName = urlParams.get('site');

orb.addEventListener('click', () => {
    // Only trigger start if we aren't already breathing and haven't finished yet
    if (!isBreathing && currentCycle === 0 && text.innerText === "Start breathing") {
        startBreathingSession();
    } else if (orb.classList.contains('mode-proceed')) {
        // Send message to background script to set cooldown and redirect
        chrome.runtime.sendMessage({
            type: 'exerciseComplete',
            redirectUrl: redirectUrl,
            siteName: siteName
        });
    }
});

// Accessible trigger via Enter key
orb.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        orb.click();
    }
});

function startBreathingSession() {
    isBreathing = true;

    // Morph into circle
    orb.classList.add('mode-circle');
    text.style.opacity = 0; // Fade out "Start" text quickly
    instruction.classList.add('visible');

    // Wait 1s for shape morph to complete before starting breathing loop
    setTimeout(() => {
        runCycle();
    }, 1000);
}

function runCycle() {
    if (currentCycle >= TOTAL_CYCLES) {
        finishSession();
        return;
    }

    // --- INHALE PHASE ---
    performPhase('Inhale', 1.6, INHALE_DURATION_MS, () => {

        // --- EXHALE PHASE ---
        performPhase('Exhale', 1.0, EXHALE_DURATION_MS, () => {

            // Cycle Complete
            currentCycle++;
            runCycle(); // Recursion for next cycle
        });
    });
}

function performPhase(phaseText, scaleSize, duration, callback) {
    // Update Text
    text.innerText = phaseText;
    text.style.opacity = 1;

    // Timer Logic
    let remaining = Math.ceil(duration / 1000);
    timerDisplay.innerText = remaining;
    timerDisplay.style.opacity = 1;

    // Apply transition duration dynamically for this phase
    // We use cubic-bezier for a more natural "lung" feel
    orb.style.transition = `transform ${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1), width 1s, height 1s, border-radius 1s, background-color 1s`;
    orb.style.transform = `scale(${scaleSize})`;

    // Optional: Animate ripple during inhale
    if(phaseText === 'Inhale') {
        ripple.style.transition = `all ${duration}ms ease-out`;
        ripple.style.width = '300px';
        ripple.style.height = '300px';
        ripple.style.opacity = '1';
    } else {
        ripple.style.transition = `all ${duration}ms ease-in`;
        ripple.style.width = '150px';
        ripple.style.height = '150px';
        ripple.style.opacity = '0';
    }

    // Countdown Interval
    const timerInterval = setInterval(() => {
        remaining--;
        if (remaining > 0) {
            timerDisplay.innerText = remaining;
        }
    }, 1000);

    // Wait for duration then callback
    setTimeout(() => {
        clearInterval(timerInterval);
        timerDisplay.style.opacity = 0;
        if (callback) callback();
    }, duration);
}

function finishSession() {
    isBreathing = false;
    timerDisplay.innerText = '';

    // Reset transforms
    orb.style.transition = `width 1s, height 1s, border-radius 1s, background-color 1s`;
    orb.style.transform = `scale(1)`;

    // Morph to "Proceed" button
    orb.classList.remove('mode-circle');
    orb.classList.add('mode-proceed');

    // Update text
    text.style.opacity = 0;
    instruction.classList.remove('visible');

    setTimeout(() => {
        text.innerText = "Proceed";
        text.style.opacity = 1;
    }, 500);
}
