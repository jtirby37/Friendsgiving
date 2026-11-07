# Friendsgiving Game Night

A static site (no build step) you host free on GitHub Pages.

## Put it online
1. Create a GitHub repo and upload everything in this folder (keep `index.html` at the top level).
2. Repo **Settings > Pages**: Source = "Deploy from a branch", Branch = `main`, folder `/ (root)`.
3. In about a minute it is live at `https://YOUR-USERNAME.github.io/REPO-NAME/`.

You can also test locally by double-clicking `index.html`.

## Edit questions and categories
Open `games/jeopardy/questions.js` (on GitHub: click the file, then the pencil icon), edit, commit. The site updates in about a minute.
- Every category needs one clue per entry in the round's `values`. Add or remove categories freely.
- Add `dd:true` to a clue to make it a Daily Double.
- Edit `final` for Final Jeopardy and `teams` for the default team names.
- Clues can use simple HTML such as `<i>italics</i>`.

## Running a game
- Enter team names on the setup screen (add up to 8). Scores save automatically, so a refresh will not lose the game. "New game" resets everything.
- Click a dollar amount to open a clue. "Reveal answer" shows it. Right adds the value and marks that team as picking next; Wrong subtracts it.
- Tap a team name to mark who picks next. Use − and + for $100 changes, or tap a score to type an exact number.
- Daily Doubles ask for a wager. Final Jeopardy takes each team's wager, then scores Right/Wrong and shows the winner.

## Family Feud
Open `games/family-feud/questions.js` to edit. It has three games (Turkey Time, Holiday Mayhem, Mistletoe Madness), each with 3 rounds and 5 Fast Money questions. Answers are `["Answer", points]`.
- `multipliers` sets the point multiplier per round (default 1x, 2x, 3x).
- `fastMoney` sets the target score, bonus points, and seconds for each player.
- Play: pick a game, enter teams, click an answer to reveal it, use Strike for wrong answers, then award the bank to a team. After the last round, Fast Money is played by one team (two players, timed).

## Add another game

1. Make a folder like `games/family-feud/` with its own `index.html`, script, and data file. Copy the jeopardy folder as a starting point.
2. Add one line to the `GAMES` list in the root `index.html`.
3. Include `../../assets/style.css` and `../../assets/fall.js` to get the shared fall look.
