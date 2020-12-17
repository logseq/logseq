(ns frontend.handler.expand
  (:require [dommy.core :as d]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [frontend.util :as util]
            [frontend.state :as state]
            [frontend.handler.block :as block-handler]))

(defn- hide!
  [element]
  (d/set-style! element :display "none"))

(defn- show!
  [element]
  (d/set-style! element :display ""))

(defn collapse!
  [block]
  (let [uuid (:block/uuid block)
        nodes (array-seq (js/document.getElementsByClassName (str uuid)))]
    (doseq [node nodes]
      (d/add-class! node "collapsed")
      (when-let [e (.querySelector node ".block-body")]
        (hide! e))
      (when-let [e (.querySelector node ".block-children")]
        (hide! e)
        (let [elements (d/by-class node "ls-block")]
          (doseq [element elements]
            (hide! element))))
      (block-handler/collapse-block! block))))

(defn expand!
  [block]
  (let [uuid (:block/uuid block)
        nodes (array-seq (js/document.getElementsByClassName (str uuid)))]
    (doseq [node nodes]
      (when-let [e (.querySelector node ".block-body")]
        (show! e))
      (when-let [e (.querySelector node ".block-children")]
        (let [elements (d/by-class node "ls-block")]
          (doseq [element elements]
            (show! element)))
        (show! e))
      (block-handler/expand-block! block))))

(defn set-bullet-closed!
  [element]
  (when element
    (when-let [node (.querySelector element ".bullet-container")]
      (d/add-class! node "bullet-closed"))))

;; Collapse acts like TOC
;; There are three modes to cycle:
;; 1. Collapse all blocks which levels are greater than 2
;; 2. Hide all block's body (user can still see the block title)
;; 3. Show everything
(defn cycle!
  []
  (let [mode (state/next-collapse-mode)
        get-blocks (fn []
                     (let [elements (d/by-class "ls-block")
                           result (group-by (fn [e]
                                              (let [level (d/attr e "level")]
                                                (and level
                                                     (> (util/parse-int level) 2)))) elements)]
                       [(get result true) (get result false)]))]
    (case mode
      :show-all
      (do
        (doseq [element (d/by-class "ls-block")]
          (show! element))
        (let [elements (d/by-class "block-body")]
          (doseq [element elements]
            (show! element)))
        (doseq [element (d/by-class "bullet-closed")]
          (d/remove-class! element "bullet-closed"))
        (doseq [element (d/by-class "block-children")]
          (show! element)))

      :hide-block-body
      (let [elements (d/by-class "block-body")]
        (doseq [element elements]
          (d/set-style! element :display "none")
          (when-let [parent (util/rec-get-block-node element)]
            (set-bullet-closed! parent))))

      :hide-block-children
      (let [[elements top-level-elements] (get-blocks)
            level-2-elements (filter (fn [e]
                                       (let [level (d/attr e "level")]
                                         (and level
                                              (= (util/parse-int level) 2)
                                              (not (d/has-class? e "pre-block")))))
                                     top-level-elements)]
        (doseq [element elements]
          (hide! element))
        (doseq [element level-2-elements]
          (when (= "true" (d/attr element "haschild"))
            (set-bullet-closed! element)))))
    (state/cycle-collapse!)))
