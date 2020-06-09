(ns frontend.expand
  (:require [dommy.core :as d]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [frontend.util :as util]
            [clojure.string :as string]
            [medley.core :as medley]
            [frontend.state :as state]))

(defn get-headings
  [id]
  ;; TODO: dommy/by-id will fail if id includes `=`
  (when-let [node (gdom/getElement id)]
    (some-> (d/sel node [".ls-heading"])
            (array-seq))))

(defn- get-level
  [node]
  (-> (d/attr node "level")
      (util/parse-int)))

(defn get-heading-children
  [headings heading]
  (let [heading-id (gobj/get heading "id")
        level (get-level heading)
        nodes (->> headings
                   ;; drop preceding nodes
                   (drop-while (fn [node]
                                 (not= heading-id (gobj/get node "id"))))
                   ;; drop self
                   (next)
                   ;; take the children
                   (take-while (fn [node]
                                 (> (get-level node) level))))]
    nodes))

(defn collapse-non-heading!
  [id]
  (when-let [node (gdom/getElement id)]
    (doseq [node (d/sel node [".heading-body"])]
      (d/hide! node))))

(defn expand-non-heading!
  [id]
  (when-let [node (gdom/getElement id)]
    (doseq [node (d/sel node [".heading-body"])]
      (d/show! node))))

(defn collapse!
  [headings-id heading-id]
  (let [all-headings (get-headings headings-id)]
    (collapse-non-heading! heading-id)
    (when-let [node (gdom/getElement heading-id)]
      (let [root-level (d/attr node "level")]
        (let [children (get-heading-children all-headings node)]
          (doseq [node children]
            (let [child-level (d/attr node "level")]
              (when (and root-level
                         child-level
                         (= 1 (- (util/parse-int child-level)
                                 (util/parse-int root-level))))
                (d/add-class! node "is-collapsed"))
              (d/hide! node))))))))

(defn expand!
  [headings-id heading-id]
  (let [all-headings (get-headings headings-id)]
    (state/expand-heading! heading-id)
    (expand-non-heading! heading-id)
    (when-let [node (gdom/getElement heading-id)]
      (d/remove-class! node "is-collapsed")
      (let [root-level (d/attr node "level")]
        (let [children (get-heading-children all-headings node)]
          (doseq [node children]
            (let [child-level (d/attr node "level")
                  collapsed? (d/has-class? node "is-collapsed")
                  next-child? (and collapsed?
                                   root-level
                                   child-level
                                   (= 1 (- (util/parse-int child-level)
                                           (util/parse-int root-level))))]
              (when next-child?
                (d/remove-class! node "is-collapsed"))
              (when (or (not collapsed?)
                        next-child?)
                (d/show! node)))))))))


;; ;; Collapse acts like TOC
(defn toggle-all!
  [id]
  ;; default to level 2
  (let [all-headings (get-headings id)
        headings all-headings]
    (when (seq headings)
      (let [toggle-state (:ui/toggle-state @state/state)]
        (doseq [heading headings]
          (let [heading-id (gobj/get heading "id")
                level (util/parse-int (d/attr heading "level"))]
            (if toggle-state
              (expand! id heading-id)
              (when (= level 2)
                (collapse! id heading-id)
                (state/collapse-heading! heading-id)))))
        (when toggle-state
          (state/clear-collapsed-headings!))
        (state/ui-toggle-state!)))))
