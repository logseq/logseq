import assert from 'node:assert/strict';

export function measureSurfaceMotion(selector) {
  const element = document.querySelector(selector);
  const style = getComputedStyle(element);
  return {
    durations: style.transitionDuration.split(',').map(value => Number(value.trim().slice(0, -1))),
    easing: style.transitionTimingFunction,
    origin: style.transformOrigin.split(' ').slice(0, 2).map(value => Number(value.slice(0, -2))),
    width: element.offsetWidth,
    height: element.offsetHeight,
  };
}

export function assertSurfaceMotion(state, {duration, easing}) {
  assert.ok(state.durations.length > 0);
  assert.ok(state.durations.every(value => Math.abs(value - duration) < 0.00001),
    `Unexpected motion durations: ${state.durations}`);
  assert.ok(state.easing.split(',').every(value => value.trim() === easing),
    `Unexpected easing: ${state.easing}`);
  assert.ok(Math.abs(state.origin[0] - state.width / 2) < 0.51
    && Math.abs(state.origin[1] - state.height / 2) < 0.51,
  `Zoom origin ${state.origin} must stay at the surface center`);
}
