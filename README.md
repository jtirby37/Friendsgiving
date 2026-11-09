# Friendsgiving Game Night

A static website for Friendsgiving: Family Feud, Jeopardy, and optional live phone buzzers. There is no build step or package installation.

## Publish on GitHub Pages

1. In your GitHub repository, delete the old files and upload **everything inside this folder**. `index.html` must be at the repository root.
2. Open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select branch `main` and folder `/ (root)`, then save.
5. Wait for the Pages deployment to finish. Your site will be at `https://YOUR-USERNAME.github.io/REPO-NAME/`.

Keep the directory structure intact. In particular, do not move the files out of `assets/`, `games/`, or `play/`.

## Games

- **Family Feud:** `games/family-feud/`
- **Jeopardy:** `games/jeopardy/`
- **Phone buzzer join page:** `play/`

Open the root homepage to choose a game. Run the host game on the laptop or TV; players join from their phones using the QR code or room code shown on the host screen.

## Edit questions

- Family Feud questions and point values: `games/family-feud/questions.js`
- Jeopardy categories and clues: `games/jeopardy/questions.js`

Both are plain JavaScript data files. Keep the existing object structure when editing. Jeopardy categories need one clue for every value in that round. Add `dd: true` to a clue to make it a Daily Double. Clues and answers can contain simple HTML such as `<i>italics</i>`.

## Phone buzzers (optional)

The games work without Firebase; you can still run them and score manually. To enable phone buzzers, follow `SETUP-BUZZERS.md` and check these files:

- `assets/firebase-config.js` contains the public Firebase web-app configuration.
- `assets/presenter-config.js` contains the presenter-screen password.

The presenter password is a convenience gate, not real authentication. Anyone who can inspect this public repository can read it. The Firebase web config is also public by design; the Realtime Database rules are what control access.

## Useful notes

- Game progress and scores are saved in the host browser's local storage. Refreshing the host page should preserve the current game.
- Players need internet access and the Firebase project must have Anonymous Authentication and Realtime Database enabled for phone buzzers to work.
- If the repository is renamed or moved, GitHub Pages keeps the relative links working because the site uses repository-relative paths.
- Test the deployed site from the actual GitHub Pages URL. Opening files directly from disk can behave differently from a hosted site, especially for Firebase and QR-code features.
