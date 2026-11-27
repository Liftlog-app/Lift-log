# Lift Log

A workout tracker for anyone: pick a program (Push Pull Legs with 15-week blocks, Upper/Lower, Full Body, Body-Part Split) or build your own, log sets with automatic saving, swap exercises, use the rest timer and workout clock, and track progress charts.

## Get the app

1. Open the **Releases** page of this repo on your Android phone.
2. Download `LiftLog.apk` from the newest release.
3. Open the file. If Android asks, allow your browser to install unknown apps.

Every push to `main` builds a new APK automatically (see the Actions tab).

## Notes

- Your workouts are saved on the phone. Uninstalling the app erases them, so use Settings > Copy all data as JSON to keep a backup.
- The app page lives in `app/src/main/assets/index.html`.

## iPhone

iPhones can't install the APK. Use the web version instead:

1. Open https://liftlog-app.github.io/Lift-log/ in **Safari**.
2. Tap the **Share** button, then **Add to Home Screen**.
3. Open Lift Log from the new icon. It runs full screen and saves workouts on the phone.

The web version lives in the `docs` folder (served by GitHub Pages from `main` / `docs`).

## Credits

Exercise photos come from [Free Exercise DB](https://github.com/yuhonas/free-exercise-db), released into the public domain (Unlicense).

## Development

The whole app is `src/index.html`. After editing it:

```bash
python3 scripts/sync.py   # copies it into the Android, iPhone and web versions
npm install && npm test   # runs the tests in tests/
```

## Agent team

A team of AI agents (Researcher, Product Lead, Coder, QA, Designer, Marketer) improves the app every week. App changes arrive as pull requests for review; notes live in `ops/`. See `ops/README.md` and `CLAUDE.md`.
