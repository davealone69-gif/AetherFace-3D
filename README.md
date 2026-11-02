# AetherFace 3D Studio

A browser-based procedural 3D character studio. The original supplied single-page Studio interface is restored in `index.html`; the local launcher, installable web-app manifest and SVG app icon are retained.

## Start on Android / Termux

```sh
pkg install git python -y
git clone --branch feature/studio-repair-autostart-2026-11-02 https://github.com/davealone69-gif/AetherFace-3D.git
cd AetherFace-3D
bash start.sh
```

The launcher starts the local HTTP server and attempts to open the browser automatically at `http://127.0.0.1:8000/`. If Android does not open it automatically, open that address manually. Keep Termux running while using the local app.

Optional: `python start.py --port 8080` or `python start.py --no-open`.

## Install as an app

Open the local page in a supported browser and use its Install app / Add to Home Screen command. This is a PWA, not a native Android APK. The included icon is `assets/aetherface-icon.svg`.

## Current capabilities and limitations

- Procedural 3D head preview with mouse/touch rotation and pinch zoom.
- Human, vampire, cyborg and demon presets.
- Jaw, cheek, fang and ear shape controls.
- Image URL and local image texture loading, plus generated cyber/pallor texture patterns.
- Browser speech synthesis with approximate jaw movement.
- PNG snapshot and OBJ mesh export.
- AI prompt staging only. No image-generation provider or API key is connected.
- OBJ export is geometry only. It does not provide a rig, blendshapes, animation or a production-ready GLB avatar.

Three.js and Tailwind are loaded from CDNs, so the first launch requires internet access. Local launcher startup was previously observed in Termux; browser rendering, export behaviour and installation must still be verified on the target phone.