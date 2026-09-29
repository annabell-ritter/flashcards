# Flashcard Study App

## What it does
- Users create question/answer cards.
- They flip cards in review mode.
- They mark each card as known or unknown.

## Stack
- HTML, CSS, JavaScript.
- Data lives in `localStorage`. There is no backend.
- Hosted on GitHub Pages.
- Open `index.html` in a browser to run it. No server needed.

## File structure
- `index.html`
- `style.css`
- `app.js`
- One file per concern.

## Rules
- Everything stays on one screen. Add no new pages.
- Code that reads `localStorage` must handle a missing or malformed value.
- This covers first run and cleared storage.
- Add no external libraries or packages without asking first.
- Add no npm dependencies.
- Never use `eval()`.
- Never commit secrets. No API keys, passwords, or tokens.

## Visual standards
- The app must be usable at 1280 px and 375 px width.
- Nothing may overflow or disappear at either width.
- Use no horizontal scroll at 375 px.
- Buttons must look like buttons. Inputs must look like inputs.
- Use consistent spacing. The page must not look like a raw HTML dump.
- Text must meet WCAG AA contrast. That is 4.5:1 for body text.

## Working style
- Write in short sentences. One idea each.
- If anything is unclear, ask me a question before assuming.
