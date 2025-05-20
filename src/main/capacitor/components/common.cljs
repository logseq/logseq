(ns capacitor.components.common)

(defn get-dom-block-uuid
  [^js el]
  (some-> el
    (.closest "[data-blockid]")
    (.-dataset) (.-blockid)
    (uuid)))

(defn get-dom-page-scroll
  [^js el]
  (some-> el (.closest "[part=scroll]")))