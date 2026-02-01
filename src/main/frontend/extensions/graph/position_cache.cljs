(ns frontend.extensions.graph.position-cache
  (:require [goog.object :as gobj]))

;; -- node-position cache (keyed by page title, survives restarts) -----------
(def ^:private POSITIONS-KEY "logseq-global-graph-node-positions")

(defn- load-positions-from-storage
  []
  (try
    (when-let [^js raw (.getItem js/localStorage POSITIONS-KEY)]
      (let [^js parsed (js/JSON.parse raw)]
        (->> (js/Object.keys parsed)
             (reduce (fn [acc ^js label]
                       (let [^js pos (gobj/get parsed label)]
                         (if (and (number? (.-x pos)) (number? (.-y pos)))
                           (assoc acc label {:x (.-x pos) :y (.-y pos)})
                           acc)))
                     {}))))
    (catch :default _e {})))

(defn- save-positions-to-storage
  [positions]
  (try
    (.setItem js/localStorage POSITIONS-KEY
              (js/JSON.stringify (clj->js positions)))
    (catch :default _e nil)))

(defonce *cached-node-positions
  (atom (load-positions-from-storage)))
;; ---------------------------------------------------------------------------

(defn capture-positions!
  "Snapshot live node x/y into the position cache and persist.
  Merges into existing cache so positions for pages not in the current
  (possibly filtered) view are preserved.
  nodes — a JS array of d3 node objects, or nil (no-op)."
  [nodes]
  (when nodes
    (let [new-positions
          (reduce (fn [acc ^js node]
                    (let [label (.-label node)
                          x     (.-x node)
                          y     (.-y node)]
                      (if (and label (number? x) (number? y))
                        (assoc acc label {:x x :y y})
                        acc)))
                  {}
                  nodes)]
      (swap! *cached-node-positions merge new-positions)
      (save-positions-to-storage @*cached-node-positions))))
