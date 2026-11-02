# AetherFace 3D Studio

A local-first browser-based character workshop with a Three.js preview, editable procedural head proportions, material presets, local image-texture upload, browser speech synthesis, PNG capture, and Wavefront OBJ export.

## Quick start

**Termux (Android):**
```sh
pkg install python
cd ~/AetherFace-3D
bash start.sh
```

**Windows:** double-click `start.bat`, or run `py -3 start.py`.

**Linux/macOS:**
```sh
python3 start.py
```

The launcher starts a local HTTP server on `127.0.0.1:8000` and opens the browser. Use `python start.py --port 8080` to change the port, or `python start.py --no-open` to suppress browser launch. Stop with Ctrl+C.

## Install as an app

Serve the site over localhost or HTTPS, open it in a supported browser, then use the browser's **Install app** / **Add to Home screen** action. The web app manifest and service worker provide the install metadata and offline caching for the local application shell. Three.js and its OBJ exporter are loaded from jsDelivr, so the 3D engine requires internet access unless those dependencies are self-hosted.

## Features and limitations

- Human, Vampire, Cyborg and Demon starting presets.
- Jaw, cheek, ear and fang proportion controls.
- Porcelain, Graphite, Gold and Synthetic material presets.
- Upload a local image as a face surface texture.
- Browser SpeechSynthesis with approximate jaw movement. This is not phoneme-accurate lip sync.
- PNG screenshot and OBJ mesh export.
- Touch/pointer orbit and wheel zoom.
- No account, API key or paid service is required for the included features.

**Not included:** AI portrait generation, server-side AI, a production facial rig, blendshapes, skeletal animation, GLB/GLTF export or photorealistic reconstruction. OBJ export is geometry only and does not package a rig or animation. The generated procedural head is a starter mesh, not a finished production avatar.

## App icon

`assets/aetherface-icon.svg` is the scalable AetherFace 3D app mark. The icon contains no forehead marker/red dot.

## Verification

The repository contains browser code and launch scripts. A successful local server start does not prove WebGL compatibility on every device. Confirm the live preview on the target phone; WebGL and external CDN availability are runtime requirements.
