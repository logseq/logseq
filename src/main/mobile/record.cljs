(ns mobile.record
  "Web audio record"
  {:clj-kondo/config {:linters {:unused-binding {:level :off}
                                :unused-private-var {:level :off}}}}
  (:require [lambdaisland.glogi :as log]
            [promesa.core :as p]))

;; ───────────────────────────────────────────────────────────────────────────────
;; Existing atoms
(defonce ^:private *stream   (atom nil))
(defonce ^:private *recorder (atom nil))
(defonce ^:private *chunks   (atom #js []))

(defonce ^:private *agc-gain (atom 0.8))  ;; adaptive gain
(defonce ^:private *agc-rms  (atom 0))  ;; smoothed rms (optional)

(def mime "audio/mp4")

;; ───────────────────────────────────────────────────────────────────────────────
;; Visualizer state (constant-memory; safe for long sessions)

(defonce ^:private *audio-ctx   (atom nil))
(defonce ^:private *source-node (atom nil))
(defonce ^:private *analyser    (atom nil))
(defonce ^:private *raf-id      (atom nil))
(defonce ^:private *last-ts     (atom 0)) ;; for FPS throttling

(defonce ^:private *canvas-el   (atom nil))
(defonce ^:private *canvas-ctx  (atom nil))
(defonce ^:private *dpr         (atom 1))

;; Reused typed arrays; we never reallocate every frame.
(defonce ^:private *time-bytes  (atom nil))   ;; Uint8Array
(defonce ^:private *time-floats (atom nil))   ;; Float32Array

(defonce ^:private *vis-opts
  (atom {:mode :rolling              ;; :rolling or :oscilloscope
         :fps 30                     ;; throttle draw to this FPS
         :fft-size 2048              ;; analyser.fftSize
         :smoothing 1              ;; analyser.smoothingTimeConstant
         :bg "#00000000"             ;; transparent by default
         :stroke "rgb(167, 167, 167)"
         :window-sec 5.0
         :bar-width 2             ;; px width of each line
         :bar-gap 2               ;; px gap between lines
         :line-cap "round"}))

(defonce ^:private *ring        (atom nil))  ;; Float32Array of bar amplitudes (0..1)
(defonce ^:private *ring-head   (atom 0))    ;; next write index
(defonce ^:private *accum-ms    (atom 0.0))
(defonce ^:private *pending-max (atom 0.0))
(defonce ^:private *agg-last-ts (atom 0.0))

(defn- clamp [x a b] (-> x (max a) (min b)))

(defn- now-ms [] (.now js/Date))

(defn- ensure-buffer-size! [cap]
  (let [^js arr @*ring]
    (when (or (nil? arr) (not= (.-length arr) cap))
      (reset! *ring (js/Float32Array. (max 1 cap)))
      (reset! *ring-head 0)
      (reset! *accum-ms 0.0)
      (reset! *pending-max 0.0)
      (reset! *agg-last-ts (now-ms)))))

(defn- ring-advance! [steps amp]
  (when-let [^js arr @*ring]
    (let [n (.-length arr)
          a (max 0.0 (min 1.0 amp))]
      (loop [k (min steps n) head @*ring-head]
        (if (pos? k)
          (let [head' (let [h (inc head)] (if (= h n) 0 h))]
            (aset arr head a)
            (recur (dec k) head'))
          (reset! *ring-head head))))))

(defn- frame-peak [^js f32]           ;; max |sample| from current analyser frame
  (let [len (.-length f32)
        step (js/Math.max 1 (js/Math.floor (/ len 1024)))]
    (loop [i 0 mx 0.0]
      (if (< i len)
        (let [v (js/Math.abs (aget f32 i))]
          (recur (+ i step) (if (> v mx) v mx)))
        mx))))

(defn- ensure-canvas-size! []
  (when-let [^js c @*canvas-el]
    (let [dpr (or (.-devicePixelRatio js/window) 1)
          css-w (.-clientWidth c)
          css-h (.-clientHeight c)
          px-w (js/Math.round (* css-w dpr))
          px-h (js/Math.round (* css-h dpr))]
      ;; (when (or (not= (.-width c) px-w)
      ;;           (not= (.-height c) px-h))
      ;;   (set! (.-width c) px-w)
      ;;   (set! (.-height c) px-h))
      (reset! *dpr dpr))))

(declare draw-rolling!)
(defn attach-visualizer!
  "Attach a <canvas> for realtime waveform. Call before `start`.
   opts:
   - :fps         15..60 (default 30)
   - :fft-size    512..32768 (default 2048)
   - :smoothing   0.0..0.99 (default 0.8)
   - :bg          CSS color (default transparent)
   - :stroke      CSS color (default neutral gray)"
  ([^js canvas] (attach-visualizer! canvas {}))
  ([^js canvas opts]
   (reset! *agc-gain 1.0)
   (reset! *agc-rms  0.0)
   (reset! *vis-opts (merge @*vis-opts opts))
   (reset! *canvas-el canvas)
   (ensure-canvas-size!)
   (reset! *canvas-ctx (.getContext canvas "2d"))
   ;; If analyser already exists (e.g., start called first), (re)start drawing.
   (when @*analyser
     (js/cancelAnimationFrame (or @*raf-id 0))
     (reset! *raf-id nil)
     (reset! *last-ts 0)
     (when @*canvas-ctx
       ((fn loop! []
          (reset! *raf-id (js/requestAnimationFrame loop!))
          (when (and @*canvas-ctx @*analyser)
            (let [fps (:fps @*vis-opts)
                  min-dt (/ 1000 (max 1 fps))
                  t (now-ms)]
              (when (>= (- t @*last-ts) min-dt)
                (reset! *last-ts t)
                (ensure-canvas-size!)
                (draw-rolling!))))))))))

(defn detach-visualizer!
  "Detach and stop drawing (does NOT stop recording)."
  []
  (when @*raf-id
    (js/cancelAnimationFrame @*raf-id)
    (reset! *raf-id nil))
  (reset! *canvas-el nil)
  (reset! *canvas-ctx nil))

(defn- setup-analyser! [^js stream]
  ;; Create/reuse AudioContext. iOS requires resume on user gesture; we try anyway.
  (let [ctx (or @*audio-ctx
                (try
                  (js/AudioContext. #js {:latencyHint "interactive"})
                  (catch :default _ (js/AudioContext.))))]
    (reset! *audio-ctx ctx)
    (try
      (.resume ctx)
      (catch :default e
        (fn [_] nil)))
    (when @*source-node
      (try (.disconnect ^js @*source-node) (catch :default _ nil)))
    (let [src (.createMediaStreamSource ctx stream)
          an  (.createAnalyser ctx)]
      (set! (.-fftSize an) (max 512 (min 32768 (:fft-size @*vis-opts))))
      (set! (.-smoothingTimeConstant an) (max 0 (min 0.99 (:smoothing @*vis-opts))))
      (.connect src an)
      (reset! *source-node src)
      (reset! *analyser an)
      ;; allocate (or resize) typed arrays once
      (let [n (.-fftSize an)]
        (when (or (nil? @*time-bytes) (not= (.-length ^js @*time-bytes) n))
          (reset! *time-bytes  (js/Uint8Array. n))
          (reset! *time-floats (js/Float32Array. n))))
      ;; kick the paint loop if canvas already attached
      (when @*canvas-el
        (attach-visualizer! @*canvas-el @*vis-opts)))))

(defn- teardown-analyser! []
  (when @*raf-id
    (js/cancelAnimationFrame @*raf-id)
    (reset! *raf-id nil))
  (when @*source-node
    (try (.disconnect ^js @*source-node) (catch :default _ nil))
    (reset! *source-node nil))
  (reset! *analyser nil)
  ;; Keep AudioContext open if you want; closing reduces battery usage after stop.
  (when @*audio-ctx
    (try (.close ^js @*audio-ctx) (catch :default _ nil))
    (reset! *audio-ctx nil)))

;; ───────────────────────────────────────────────────────────────────────────────
;; Drawing

(defn- clear! [^js ctx w h]
  (let [bg (:bg @*vis-opts)]
    (set! (.-fillStyle ctx) bg)
    (.clearRect ctx 0 0 w h)
    (when (and bg (not= bg "#00000000"))
      (.fillRect ctx 0 0 w h))))

(defn- stroke-style! [^js ctx]
  (set! (.-lineWidth ctx) (or (:line-width @*vis-opts) 1))
  (set! (.-strokeStyle ctx) (:stroke @*vis-opts))
  (set! (.-lineCap ctx) "round"))

(defn- draw-rolling! []
  (when (and @*canvas-ctx @*analyser)
    (let [^js ctx @*canvas-ctx
          ^js an  @*analyser
          ^js f32 @*time-floats
          ^js c   @*canvas-el]
      (ensure-canvas-size!)
      (let [w (.-width c)  h (.-height c)]
        (when (and (>= w 4) (>= h 4))
          ;; layout
          (let [{:keys [bar-width bar-gap direction window-sec gain auto-gain? line-cap]} @*vis-opts
                bw   (max 1 (int (js/Math.round (or bar-width 2))))
                gap  (max 0 (int (js/Math.round (or bar-gap 2))))
                step (+ bw gap)
                slots (max 1 (int (js/Math.floor (/ w step))))   ;; how many bars fit
                dir  (or direction :rtl)]
            (ensure-buffer-size! slots)

            ;; 1) update ring from current audio frame
            (.getFloatTimeDomainData an f32)
            (let [p   (frame-peak f32)                      ;; 0..1
                  _   (reset! *pending-max (max @*pending-max p))
                  now (now-ms)
                  last-ts @*agg-last-ts
                  dt  (- now last-ts)
                  win (double (or window-sec 5.0))
                  bars-per-sec (/ slots (max 0.001 win))
                  period-ms (/ 1000.0 (max 1e-6 bars-per-sec))
                  total (+ @*accum-ms dt)
                  steps (int (js/Math.floor (/ total period-ms)))
                  accum   (- total (* steps period-ms))]
              (when (pos? steps)
                (ring-advance! steps @*pending-max)
                (reset! *pending-max 0.0))
              (reset! *accum-ms accum)
              (reset! *agg-last-ts now))

            ;; 2) render vertical lines
            (let [halfH (/ h 2)
                  g0  (or gain 1.0)
                  agc (if (false? auto-gain?) 1.0 (or @*agc-gain 1.0))
                  vScale (* g0 agc)
                  ^js arr @*ring
                  n   (.-length arr)
                  head @*ring-head
                  ;; crisp 1px alignment for odd widths
                  odd-width? (== (bit-and bw 1) 1)
                  x-center (fn [i] ;; i = 0..slots-1 oldest→newest on canvas depending on dir
                             (let [offset (* i step)]
                               (if (= dir :ltr)
                                 (+ offset (/ bw 2))
                                 (- w (/ bw 2) offset))))
                  ring-at (fn [x-idx]
                            (let [idx (if (= dir :ltr)
                                        (mod (+ head x-idx) n)  ;; oldest→newest left→right
                                        (mod (- head 1 x-idx) n))] ;; newest at right
                              (aget arr idx)))]
              (clear! ctx w h)
              (set! (.-strokeStyle ctx) (:stroke @*vis-opts))
              (set! (.-lineWidth ctx) bw)
              (set! (.-lineCap ctx) (or line-cap "round"))
              (set! (.-lineJoin ctx) "round")

              (.beginPath ctx)
              (loop [i 0]
                (when (< i slots)
                  (let [amp (max 0.0 (min 1.0 (ring-at i)))
                        hpx (js/Math.max 1 (js/Math.round (* amp halfH vScale)))
                        cx  (x-center i)
                        x   (if odd-width? (+ (js/Math.round cx) 0.5) (js/Math.round cx))
                        y1  (- halfH hpx)
                        y2  (+ halfH hpx)]
                    (.moveTo ctx x y1)
                    (.lineTo ctx x y2)
                    (recur (inc i)))))
              (.stroke ctx)
              (.closePath ctx))))))))

;; ───────────────────────────────────────────────────────────────────────────────
;; Recorder lifecycle (unchanged public API), but we hook the analyser in `start`

(defn destroy!
  []
  ;; cleanup media stream & visualizer
  (when @*stream
    (doseq [t (.getTracks @*stream)] (.stop t)))
  (reset! *stream nil)
  (reset! *recorder nil)
  (reset! *chunks #js [])
  (teardown-analyser!))

(defn- listen-on-stop
  [recorder on-record-end]
  (set! (.-onstop recorder)
        (fn []
          (p/do!
            ;; some encoders flush async; small delay avoids truncated tails
           (p/delay 200)
           (let [blob (js/Blob. @*chunks #js {:type mime})]
             (destroy!)
             (on-record-end blob))))))

(defn start
  "Start recording mic to mp4. Also starts visualizer if a canvas is attached.
   opts:
   - :on-record-end (fn [blob])  (required)
   - :timeslice ms (default 1000)"
  [{:keys [on-record-end timeslice]
    :or {timeslice 1000}}]
  (-> (.getUserMedia js/navigator.mediaDevices #js {:audio true})
      (p/then
       (fn [s]
         (reset! *chunks #js [])
         (reset! *stream s)
          ;; Hook analyser for realtime waveform (separate from MediaRecorder)
         (setup-analyser! s)
         (let [r (js/MediaRecorder. s #js {:mimeType mime
                                           :audioBitsPerSecond 128000})]
           (reset! *recorder r)
           (listen-on-stop r on-record-end)
           (set! (.-ondataavailable r)
                 (fn [e]
                   (when (and e (> (.-size (.-data e)) 0))
                     (.push @*chunks (.-data e)))))
           (set! (.-onerror r) (fn [e] (js/console.error "MediaRecorder error:" e)))
           (.start r timeslice))))
      (p/catch (fn [error]
                 (log/error ::audio-record-failed error)))))

(defn stop
  []
  (when-let [r @*recorder]
    (when (= (.-state r) "recording")
      (.stop r))))

;; ───────────────────────────────────────────────────────────────────────────────
;; Optional helpers

(defn pause-visualizer! []
  (when @*raf-id
    (js/cancelAnimationFrame @*raf-id)
    (reset! *raf-id nil)))

(defn resume-visualizer! []
  (when (and @*canvas-el @*analyser (nil? @*raf-id))
    (attach-visualizer! @*canvas-el @*vis-opts)))
