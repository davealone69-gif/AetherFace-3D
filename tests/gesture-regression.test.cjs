const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const functionStart = html.indexOf('function attachOrbit(el){');
const functionEnd = html.indexOf('\n}\nfunction snapCanvas', functionStart);
assert.notEqual(functionStart, -1, 'active inline Studio must define attachOrbit');
assert.notEqual(functionEnd, -1, 'attachOrbit function boundary must be found');
const attachOrbitSource = html.slice(functionStart, functionEnd + 2);

function createOrbitHarness() {
  const listeners = new Map();
  const element = {
    addEventListener(type, listener) {
      const existing = listeners.get(type) || [];
      existing.push(listener);
      listeners.set(type, existing);
    },
    setPointerCapture() {},
    dispatch(type, event) {
      for (const listener of listeners.get(type) || []) listener(event);
    }
  };
  const context = {
    camera: { position: { z: 5 } },
    headGroup: { rotation: { x: 0, y: 0 } },
    THREE: { MathUtils: { clamp: (value, min, max) => Math.max(min, Math.min(max, value)) } }
  };
  const attachOrbit = vm.runInNewContext(`${attachOrbitSource}; attachOrbit`, context);
  attachOrbit(element);
  return { element, ...context };
}

test('single-finger touch continues to rotate the head', () => {
  const { element, headGroup } = createOrbitHarness();
  element.dispatch('pointerdown', {
    pointerId: 1, pointerType: 'touch', isPrimary: true, clientX: 100, clientY: 100
  });
  element.dispatch('pointermove', {
    pointerId: 1, pointerType: 'touch', isPrimary: true, clientX: 120, clientY: 100
  });

  assert.equal(headGroup.rotation.y, 0.1);
});

test('two-finger pinch zooms without rotating the head', () => {
  const { element, camera, headGroup } = createOrbitHarness();
  const touch = (clientX, clientY, identifier) => ({ clientX, clientY, identifier });
  element.dispatch('pointerdown', {
    pointerId: 1, pointerType: 'touch', isPrimary: true, clientX: 100, clientY: 100
  });
  element.dispatch('pointerdown', {
    pointerId: 2, pointerType: 'touch', isPrimary: false, clientX: 200, clientY: 100
  });
  element.dispatch('touchstart', {
    touches: [touch(100, 100, 1), touch(200, 100, 2)]
  });
  element.dispatch('pointermove', {
    pointerId: 1, pointerType: 'touch', isPrimary: true, clientX: 120, clientY: 100
  });
  element.dispatch('touchmove', {
    touches: [touch(90, 100, 1), touch(210, 100, 2)]
  });

  assert.equal(headGroup.rotation.y, 0);
  assert.ok(camera.position.z < 5, 'pinch-out should move the camera closer');
});
