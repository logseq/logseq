(ns frontend.extensions.srs.handler
  (:require [dommy.core :refer-macros [sel]]))

(defn click
  [id]
  (let [nodes (sel [:#cards-modal (str "." id)])]
    (doseq [node nodes]
      (.click node))))

(defn toggle-answers []
  (click "card-answers"))

;; file-based
(defn next-card []
  (click "card-next"))

(defn forgotten []
  (click "card-forgotten"))

(defn remembered []
  (click "card-remembered"))

(defn recall []
  (click "card-recall"))

;; db-based
(defn card-again []
  (click "card-again"))

(defn card-hard []
  (click "card-hard"))

(defn card-good []
  (click "card-good"))

(defn card-easy []
  (click "card-easy"))
