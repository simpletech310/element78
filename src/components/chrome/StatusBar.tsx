// iOS-style status bar / home indicator chrome.
// Originally meant to mock device chrome; now retired from browser
// rendering since users found the "9:41 / battery / wifi" overlay confusing.
// Components still exported as no-ops so existing imports keep compiling.
// Re-enable for true PWA standalone mode later via display-mode: standalone.

export function StatusBar(_props: { dark?: boolean }) {
  return null;
}

export function HomeIndicator(_props: { dark?: boolean }) {
  return null;
}
