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
  "Returns a corrected `scroll-top` that keeps the focus row visible in viewport,
  respecting optional scroll-padding insets.

  Input map keys:

  | key                       | description                                                |
  |---------------------------|------------------------------------------------------------|
  | `:scroll-top`             | Current container scroll top                               |
  | `:viewport-height`        | Container viewport height                                  |
  | `:focus-top`              | Focus row top in container scroll coordinates              |
  | `:focus-height`           | Focus row height                                           |
  | `:scroll-height`          | Full scroll height used for clamping                       |
  | `:scroll-padding-top`     | Optional clearance at top of viewport in px (default 0)    |
  | `:scroll-padding-bottom`  | Optional clearance at bottom of viewport in px (default 0) |

  Output:
  - A clamped numeric `scroll-top`."
  [{:keys [scroll-top viewport-height focus-top focus-height  scroll-padding-top scroll-padding-bottom]
    :or {scroll-padding-top 0 scroll-padding-bottom 0} :as data}]
  (let [focus-bottom (+ focus-top focus-height)
        viewport-bottom (+ scroll-top viewport-height)
        target-top (cond
                     (nil? focus-top)
                     scroll-top

                     (< focus-top (+ scroll-top scroll-padding-top))
                     (- focus-top scroll-padding-top)

                     (> focus-bottom (- viewport-bottom scroll-padding-bottom))
                     (+ (- focus-bottom viewport-height) scroll-padding-bottom)

                     :else
                     scroll-top)]
    (clamp-scroll-top target-top data)))

(defn should-scroll-on-item-mounted?
  "Returns true when a mounted row should trigger deferred keyboard scroll correction.

  This guard prevents stale or mouse-driven mounts from unexpectedly scrolling."
  [focus-source pending-item-index highlighted-item-index mounted-item-index]
  (and (= :keyboard focus-source)
       (some? pending-item-index)
       (= pending-item-index mounted-item-index)
       (= highlighted-item-index mounted-item-index)))

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
