(ns frontend.handler.expand
  (:require [dommy.core :as d]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [frontend.util :as util]
            [clojure.string :as string]
            [medley.core :as medley]
            [frontend.state :as state]
            [frontend.db :as db]))

(defn- hide!
  [element]
  (d/set-style! element :display "none"))

(defn- show!
  [element]
  (d/set-style! element :display ""))

(defn collapse!
  [heading]
  (let [uuid (:heading/uuid heading)
        nodes (array-seq (js/document.getElementsByClassName (str uuid)))]
    (doseq [node nodes]
      (d/add-class! node "collapsed")
      (when-let [e (.querySelector node ".heading-body")]
        (hide! e))
      (when-let [e (.querySelector node ".heading-children")]
        (hide! e)
        (let [elements (d/by-class node "ls-heading")]
          (doseq [element elements]
            (hide! element))))
      (db/collapse-heading! heading))))

(defn expand!
  [heading]
  (let [uuid (:heading/uuid heading)
        nodes (array-seq (js/document.getElementsByClassName (str uuid)))]
    (doseq [node nodes]
      (when-let [e (.querySelector node ".heading-body")]
        (show! e))
      (when-let [e (.querySelector node ".heading-children")]
        (let [elements (d/by-class node "ls-heading")]
          (doseq [element elements]
            (show! element)))
        (show! e))
      (db/expand-heading! heading))))

(defn set-bullet-closed!
  [element]
  (when element
    (when-let [node (.querySelector element ".bullet-container")]
      (d/add-class! node "bullet-closed"))))

;; Collapse acts like TOC
;; There are three modes to cycle:
;; 1. Collapse all headings which levels are greater than 2
;; 2. Hide all heading's body (user can still see the heading title)
;; 3. Show everything
(defn cycle!
  []
  (let [mode (state/next-collapse-mode)
        get-headings (fn []
                       (let [elements (d/by-class "ls-heading")
                             result (group-by (fn [e]
                                                (let [level (d/attr e "level")]
                                                  (and level
                                                       (> (util/parse-int level) 2)))) elements)]
                         [(get result true) (get result false)]))]
    (case mode
      :show-all
      (do
        (doseq [element (d/by-class "ls-heading")]
          (show! element))
        (let [elements (d/by-class "heading-body")]
          (doseq [element elements]
            (show! element)))
        (doseq [element (d/by-class "bullet-closed")]
          (d/remove-class! element "bullet-closed"))
        (doseq [element (d/by-class "heading-children")]
          (show! element)))

      :hide-heading-body
      (let [elements (d/by-class "heading-body")]
        (doseq [element elements]
          (d/set-style! element :display "none")
          (when-let [parent (util/rec-get-heading-node element)]
            (set-bullet-closed! parent))))

      :hide-heading-children
      (let [[elements top-level-elements] (get-headings)
            level-2-elements (filter (fn [e]
                                       (let [level (d/attr e "level")]
                                         (and level
                                              (= (util/parse-int level) 2)
                                              (not (d/has-class? e "pre-heading")))))
                                     top-level-elements)]
        (doseq [element elements]
          (hide! element))
        (doseq [element level-2-elements]
          (when (= "true" (d/attr element "haschild"))
            (set-bullet-closed! element)))))
    (state/cycle-collapse!)))
