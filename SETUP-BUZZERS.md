# Turn on phone buzzers (one-time, about 10 minutes)

Without this, both games still work normally; you can run them and score manually, just without phone buzzers.

## 1. Make a free Firebase project
1. Go to https://console.firebase.google.com and sign in with a Google account.
2. **Create a project** (any name, e.g. `friendsgiving`). You can turn Google Analytics off.

## 2. Turn on anonymous sign-in
**Build > Authentication > Get started > Sign-in method > Anonymous > Enable > Save.**
(Players never make accounts. This just gives each phone a private ID.)

## 3. Create the database
1. **Build > Realtime Database > Create Database**. Pick any location and choose **Start in locked mode**.
2. Open the **Rules** tab, replace everything with the text below, and click **Publish**.

```json
{
  "rules": {
    "rooms": {
      "$room": {
        ".read": "auth != null",
        "host": { ".write": "auth != null && !data.exists()" },
        "state": { ".write": "auth != null && auth.uid === root.child('rooms').child($room).child('host').val()" },
        "teams": { ".write": "auth != null && auth.uid === root.child('rooms').child($room).child('host').val()" },
        "assign": { ".write": "auth != null && auth.uid === root.child('rooms').child($room).child('host').val()" },
        "players": {
          "$pid": { ".write": "auth != null && (auth.uid === $pid || auth.uid === root.child('rooms').child($room).child('host').val())" }
        },
        "buzzes": {
          ".write": "auth != null && auth.uid === root.child('rooms').child($room).child('host').val()",
          "$att": {
            "$pid": {
              ".write": "auth != null && auth.uid === $pid && !data.exists() && root.child('rooms').child($room).child('state').child('open').val() === true && root.child('rooms').child($room).child('state').child('attempt').val() === $att && newData.val() === now"
            }
          }
        }
      }
    }
  }
}
```
These rules mean only the presenter (the browser that created the room) can change scores, teams, and the buzzer lock, and a phone can only buzz once per round, and only while buzzers are open.

## 4. Connect the site
1. Click the gear next to **Project Overview > Project settings > General**. Under **Your apps**, click the web icon `</>`, name it, and register it (skip hosting).
2. Copy the `firebaseConfig` values it shows you into `assets/firebase-config.js`. Make sure `databaseURL` is included (you can also copy it from the top of the Realtime Database page).
3. **Authentication > Settings > Authorized domains > Add domain:** `YOUR-USERNAME.github.io`.
4. In `assets/presenter-config.js`, change the presenter password.
5. Commit both files on GitHub and wait a minute.

## 5. Run a game
1. Open either `games/jeopardy/` or `games/family-feud/` on the TV or laptop. Enter the presenter password; the host screen will show a room code and QR code.
2. Friends scan the QR code (or open `/play/` and enter the room code) and type their names.
3. Click **Players** on the host screen to assign people to teams, or use **Randomize teams**.
4. In Jeopardy, open a clue, read it, and click **Open buzzers**. In Family Feud, use **Face-off: open buzzers** for the face-off. The host screen displays the order in which players buzzed.
5. Lock the buzzers between attempts. Players' phones show their assigned team and live scores.

Notes: the host screen must stay open in the same browser that created the room. If you clear that browser's data, you will get a new room code. The presenter password only hides the host screen from casual clicks; because this is a public repository, it is visible to anyone who can inspect the source. Firebase database rules—not the password—control database access.
