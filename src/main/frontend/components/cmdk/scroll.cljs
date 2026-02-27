(ns frontend.components.cmdk.scroll
  "Scroll geometry helpers for Cmd+K focus visibility.")

(defn focus-row-visible-rect
  "Builds normalized focus geometry from `container` and `target` DOM elements.

  Input:
  - `container`: scroll container element.
  - `target`: focused row element.

  Output:
  - `nil` if either input is missing.
  - A map with keys:
    `:scroll-top`, `:viewport-height`, `:scroll-height`, `:focus-top`, `:focus-height`."
  [container target]
  (when (and container target)
    (let [container-rect (.getBoundingClientRect container)
          target-rect (.getBoundingClientRect target)
          scroll-top (.-scrollTop container)
          focus-top (+ scroll-top (- (.-top target-rect) (.-top container-rect)))
          focus-height (.-height target-rect)]
      {:scroll-top scroll-top
       :viewport-height (.-clientHeight container)
       :scroll-height (.-scrollHeight container)
       :focus-top focus-top
       :focus-height focus-height})))

(defn- max-scroll-top
  "Returns the maximum valid scroll top for geometry map `data`."
  [{:keys [scroll-height viewport-height]}]
  (max 0 (- (or scroll-height 0) (or viewport-height 0))))

(defn- clamp-scroll-top
  "Clamps numeric `scroll-top` into valid range based on geometry map `data`.
  Always returns an integer."
  [scroll-top data]
  (let [max-top (max-scroll-top data)]
    (-> scroll-top
        (max 0)
        (min max-top)
        (js/Math.round))))

(defn ensure-focus-visible-scroll-top
  "Returns a corrected `scroll-top` that keeps the focus row visible in viewport.

  Input map keys:

  | key                | description                                   |
  |--------------------|-----------------------------------------------|
  | `:scroll-top`      | Current container scroll top                  |
  | `:viewport-height` | Container viewport height                     |
  | `:focus-top`       | Focus row top in container scroll coordinates |
  | `:focus-height`    | Focus row height                              |
  | `:scroll-height`   | Full scroll height used for clamping          |

  Output:
  - A clamped numeric `scroll-top`."
  [{:keys [scroll-top viewport-height focus-top focus-height] :as data}]
  (let [focus-bottom (+ (or focus-top 0) (or focus-height 0))
        viewport-bottom (+ (or scroll-top 0) (or viewport-height 0))
        target-top (cond
                     (nil? focus-top) scroll-top
                     (< focus-top scroll-top) focus-top
                     (> focus-bottom viewport-bottom) (- focus-bottom viewport-height)
                     :else scroll-top)]
    (clamp-scroll-top target-top data)))

(defn scroll-behavior
  "Returns `:smooth` or `:instant` based on the scroll distance.

  Uses `:smooth` when the absolute distance between `current-scroll-top`
  and `target-scroll-top` is at most `2 * viewport-height`, and `:instant`
  for larger jumps to avoid overly long animations.

  Input:
  - `current-scroll-top`: numeric current scroll position.
  - `target-scroll-top`: numeric desired scroll position.
  - `viewport-height`: numeric viewport height.

  Output:
  - `:smooth` or `:instant`."
  [current-scroll-top target-scroll-top viewport-height]
  (let [distance (js/Math.abs (- (or target-scroll-top 0) (or current-scroll-top 0)))
        threshold (* 2 (or viewport-height 0))]
    (if (<= distance threshold) :smooth :instant)))

(defn accel-step
  "Compute keyboard acceleration step based on held duration.

  Returns 1 during the initial `delay-ms` and then increases by 1
  every `interval-ms`, capped at `max-step`.

  Input:
  - `held-ms`:     how long the key has been held (non-negative).
  - `delay-ms`:    grace period before acceleration starts.
  - `interval-ms`: milliseconds between each step increase.
  - `max-step`:    upper bound on returned step.

  Output:
  - A positive integer in [1, max-step]."
  [held-ms delay-ms interval-ms max-step]
  (if (< held-ms delay-ms)
    1
    (min max-step
         (inc (quot (- held-ms delay-ms) (max 1 interval-ms))))))

(defn adaptive-lerp-factor
  "Returns an easing factor that increases with distance from target.

  Near target (distance → 0): returns `base-factor` for smooth deceleration.
  Far from target (distance ≥ ramp-px): returns `max-factor` for fast tracking.
  In between: linearly interpolates.

  This gives fast scrolling during sustained keypresses (large gap)
  and smooth settle when the user stops (small gap).

  Input:
  - `base-factor`: minimum factor (0..1), used near target.
  - `max-factor`:  maximum factor (0..1), used far from target.
  - `distance`:    absolute pixel distance to target (non-negative).
  - `ramp-px`:     distance at which max-factor is fully reached (positive).

  Output:
  - A numeric factor in [base-factor, max-factor]."
  [base-factor max-factor distance ramp-px]
  (let [t (min 1.0 (/ (js/Math.abs distance) (max 1 ramp-px)))]
    (+ base-factor (* t (- max-factor base-factor)))))

(defn lerp-scroll-top
  "Returns next scroll-top for one animation frame using exponential easing.

  Each frame covers `factor` (0..1) of the remaining distance to `target-top`,
  with a minimum absolute step of 1px to guarantee progress.
  Snaps to `target-top` when within 0.5px.

  Input:
  - `current-top`: numeric current scroll position.
  - `target-top`: numeric desired scroll position.
  - `factor`: easing factor per frame (e.g. 0.25).

  Output:
  - An integer scroll-top one frame closer to `target-top`."
  [current-top target-top factor]
  (let [diff (- target-top current-top)]
    (if (<= (js/Math.abs diff) 0.5)
      target-top
      (let [step (* diff factor)
            step (if (pos? diff)
                   (max step 1)
                   (min step -1))]
        (js/Math.round (+ current-top step))))))
