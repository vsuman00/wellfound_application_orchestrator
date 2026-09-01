# Spec: browser-runtime

Status: `READY FOR REVIEW`

## Objective

Install and launch the pinned managed Chromium build, maintain a local persistent
Wellfound context, and report session health without requiring installed Chrome.

## Public contracts

- `BrowserProvider`, `BrowserSession`, `SessionHealth`, and browser installer
- visible one-time login; headed or headless runtime selected by validated policy
- platform-safe profile/cache paths outside Git

## Acceptance criteria

- Clean macOS and Windows tests install and launch the expected Chromium revision.
- Login never injects PII or API keys into the page.
- Missing browser, expired session, profile lock, and unsupported platform fail clearly.
- No stealth plugin, branded-browser channel, CAPTCHA bypass, or custom executable path.
