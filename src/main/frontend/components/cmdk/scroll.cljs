(ns frontend.components.cmdk.scroll
  "Scroll geometry helpers for Cmd+K focus visibility and wheel anchoring.")

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
  "Clamps numeric `scroll-top` into valid range based on geometry map `data`."
  [scroll-top data]
  (let [max-top (max-scroll-top data)]
    (-> scroll-top
        (max 0)
        (min max-top))))

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

(defn anchored-scroll-top
  "Returns anchored `scroll-top` after applying wheel delta while keeping focus in view.

  Input map keys:

  | key                | description                                   |
  |--------------------|-----------------------------------------------|
  | `:scroll-top`      | Current container scroll top                  |
  | `:delta-y`         | Requested wheel delta                         |
  | `:viewport-height` | Container viewport height                     |
  | `:scroll-height`   | Full scroll height                            |
  | `:focus-top`       | Focus row top in container scroll coordinates |
  | `:focus-height`    | Focus row height                              |

  Behavior:
  - If focus geometry is missing, behaves like normal clamped scrolling.
  - If focus geometry is present, constrains result so focus row remains visible.

  Output:
  - A clamped numeric `scroll-top`."
  [{:keys [scroll-top delta-y viewport-height focus-top focus-height] :as data}]
  (let [base-scroll-top (or scroll-top 0)
        desired-scroll-top (clamp-scroll-top (+ base-scroll-top (or delta-y 0)) data)]
    (if (or (nil? focus-top) (nil? focus-height) (<= (or viewport-height 0) 0))
      desired-scroll-top
      (let [focus-bottom (+ focus-top focus-height)
            min-visible-top (inc (- focus-top viewport-height))
            max-visible-top (dec focus-bottom)
            min-top (max 0 min-visible-top)
            max-top (min (max-scroll-top data) max-visible-top)
            constrained-top (if (> min-top max-top)
                              desired-scroll-top
                              (-> desired-scroll-top
                                  (max min-top)
                                  (min max-top)))]
        (clamp-scroll-top constrained-top data)))))
