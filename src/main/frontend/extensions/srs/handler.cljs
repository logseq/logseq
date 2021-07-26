(ns frontend.extensions.srs.handler)

(defn click
  [id]
  (when-let [node (js/document.getElementById id)]
    (.click node)))

(defn toggle-answers []
  (click "card-answers"))

(defn next-card []
  (click "card-next"))

(defn forgotten []
  (click "card-forgotten"))

(defn remembered []
  (click "card-remembered"))

(defn recall []
  (click "card-recall"))
