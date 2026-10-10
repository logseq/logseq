// Load in the built web app on a disposable origin, then drive real keys
// through the browser's native keyboard API. Synthetic events have no default
// action and cannot serve as a textarea latency baseline.
// Run prepareEditorCaretBenchmark, await editorCaretBenchmark.arm('editor')
// or arm('native'), send Left/Right, then await editorCaretBenchmark.completion.
// Alternate modes, exclude warmup with result(), and retain samples() for review.
globalThis.prepareEditorCaretBenchmark = async function (lines = 1, rich = false, position = 'start') {
  if (!['start', 'end'].includes(position)) throw new Error('Unknown caret benchmark position');
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  const wait = async predicate => {
    for (let i = 0; i < 300; i++) {
      if (predicate()) return;
      await pause(10);
    }
    throw new Error('Caret benchmark fixture did not become ready');
  };
  await wait(() => globalThis.logseq?.api && document.querySelector('.page-blocks-inner'));
  globalThis.editorCaretBenchmark?.dispose();
  document.querySelector('.ed-input')?.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}));
  await pause(80);
  const name = 'Caret benchmark ' + crypto.randomUUID();
  const page = await logseq.api.create_page(name, {}, {});
  const content = Array.from({length: lines}, (_, i) => rich
    ? `Line ${i} **bold** and \`code\` https://example.com plain text for navigation`
    : `Line ${i} plain text long enough for forward and backward navigation`).join('\n');
  const block = await logseq.api.append_block_in_page(name, content, {});
  location.hash = '#/page/' + page.uuid;
  await wait(() => document.querySelector('#block-content-' + block.uuid));
  document.querySelector('#block-content-' + block.uuid).click();
  await wait(() => document.querySelector('.ed-input') === document.activeElement && document.querySelector('.ed-caret'));
  await pause(450);
  const input = document.querySelector('.ed-input');
  input.dispatchEvent(new KeyboardEvent('keydown', {key: position === 'start' ? 'Home' : 'End', metaKey: true, bubbles: true, cancelable: true}));
  input.dispatchEvent(new KeyboardEvent('keydown', {key: position === 'start' ? 'ArrowRight' : 'ArrowLeft', bubbles: true, cancelable: true}));
  await pause(50);
  const native = document.createElement('textarea');
  native.id = 'native-caret-baseline';
  native.value = content;
  const surface = document.querySelector('.block-editor');
  const font = getComputedStyle(surface);
  native.style.cssText = `position:fixed;left:20px;top:90px;width:700px;height:500px;z-index:9999;background:white;color:black;font:${font.font};line-height:${font.lineHeight};padding:0;resize:none`;
  native.spellcheck = false;
  const initialOffset = position === 'start' ? 1 : content.length - 1;
  native.setSelectionRange(initialOffset, initialOffset);
  document.body.append(native);
  const samples = [];
  const eventTimings = [];
  const observer = new PerformanceObserver(list => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'keydown' && [native, input].includes(entry.target))
        eventTimings.push({mode: entry.target === native ? 'native' : 'editor',
          duration: entry.duration, processingMs: entry.processingEnd - entry.processingStart});
    }
  });
  observer.observe({type: 'event', durationThreshold: 16});
  let pending, running = true, raf;
  const tick = time => {
    frameTimes.push(time);
    if (running) raf = requestAnimationFrame(tick);
  };
  const frameTimes = [];
  raf = requestAnimationFrame(tick);
  const offset = mode => mode === 'native' ? native.selectionStart : input.__lsEd.caret_off;
  const keydown = event => {
    if (!pending || !event.isTrusted || event.target !== pending.target
      || ['Control', 'Meta', 'Alt', 'Shift'].includes(event.key)) return;
    const sample = pending;
    sample.started = performance.now();
    sample.lastFrame = frameTimes.at(-1);
    sample.phaseMs = sample.started - sample.lastFrame;
    sample.key = event.key;
    // A trusted event checkpoints microtasks between listeners, before the
    // textarea's default action. Use the next task for both implementations.
    setTimeout(() => {
      sample.nextTaskMs = performance.now() - sample.started;
    }, 0);
    requestAnimationFrame(timestamp => {
      // Timestamp before inspecting either control. Reading only the custom
      // caret's layout first would charge our observer's work to that control.
      sample.frameMs = performance.now() - sample.started;
      const recent = frameTimes.slice(-30);
      const intervals = recent.slice(1).map((t, i) => t - recent[i]);
      const interval = percentile(intervals, .5);
      sample.framesToUpdate = Math.max(1, Math.round((timestamp - sample.lastFrame) / interval));
      sample.after = offset(sample.mode);
      if (sample.mode === 'editor') {
        const caret = document.querySelector('.ed-caret');
        const rect = caret.getBoundingClientRect();
        sample.x = rect.x; sample.y = rect.y;
        sample.visible = getComputedStyle(caret).opacity === '1';
      }
      // The second callback bounds presentation of the preceding frame.
      // This is a browser frame proxy, not a hardware photon measurement.
      requestAnimationFrame(() => {
        sample.presentationBoundMs = performance.now() - sample.started;
        samples.push(sample);
        pending = null;
        sample.resolve();
      });
    });
  };
  document.addEventListener('keydown', keydown, true);
  const percentile = (xs, q) => [...xs].sort((a, b) => a - b)[Math.ceil(xs.length * q) - 1];
  globalThis.editorCaretBenchmark = {
    lines, rich, position,
    samples: () => samples.map(({target, resolve, ...sample}) => sample),
    async arm(mode) {
      if (pending) throw new Error('Previous caret sample has not finished');
      const target = mode === 'native' ? native : input;
      if (document.activeElement !== target) {
        native.style.display = mode === 'native' ? 'block' : 'none';
        target.focus({preventScroll: true});
        await new Promise(resolve => setTimeout(resolve, 80));
      }
      // Match the input phase within the display cycle for both controls.
      await new Promise(requestAnimationFrame);
      const completion = new Promise(resolve => { pending = {mode, target, before: offset(mode), resolve}; });
      this.completion = completion;
    },
    result(warmup = 10) {
      const result = {lines, rich, position, frameP50Ms: percentile(frameTimes.slice(1).map((t, i) => t - frameTimes[i]), .5)};
      for (const mode of ['native', 'editor']) {
        const data = samples.filter(s => s.mode === mode).slice(warmup);
        if (!data.length || data.some(s => s.before === s.after)) throw new Error('Native key action did not move the caret');
        result[mode] = {samples: data.length, invisible: data.filter(s => s.visible === false).length};
        for (const field of ['phaseMs', 'nextTaskMs', 'frameMs', 'presentationBoundMs', 'framesToUpdate'])
          result[mode][field] = {p50: percentile(data.map(s => s[field]), .5), p95: percentile(data.map(s => s[field]), .95), max: Math.max(...data.map(s => s[field]))};
        const timing = eventTimings.filter(s => s.mode === mode).slice(warmup);
        result[mode].eventTiming = {samples: timing.length,
          durationP50Ms: timing.length ? percentile(timing.map(s => s.duration), .5) : null,
          durationP95Ms: timing.length ? percentile(timing.map(s => s.duration), .95) : null,
          processingP50Ms: timing.length ? percentile(timing.map(s => s.processingMs), .5) : null,
          processingP95Ms: timing.length ? percentile(timing.map(s => s.processingMs), .95) : null};
      }
      return result;
    },
    dispose() {
      running = false; cancelAnimationFrame(raf);
      document.removeEventListener('keydown', keydown, true);
      observer.disconnect();
      native.remove();
    },
  };
  return {lines, rich, position, characters: content.length};
};
