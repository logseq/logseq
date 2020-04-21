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
    (some-> (d/sel node [".ls-heading-parent"])
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
  [all-headings id]
  (when-let [node (gdom/getElement id)]
    (let [children (next (array-seq (d/children node)))]
      (doseq [node children]
        (d/hide! node)))))

(defn expand-non-heading!
  [all-headings id]
  (when-let [node (gdom/getElement id)]
    (let [children (next (array-seq (d/children node)))]
      (doseq [node children]
        (d/show! node)))))

(defn collapse!
  [headings-id heading-id]
  (let [all-headings (get-headings headings-id)]
    (collapse-non-heading! all-headings heading-id)
    (when-let [node (gdom/getElement heading-id)]
      (let [children (get-heading-children all-headings node)]
        (doseq [node children]
          (let [id (uuid (string/replace (gobj/get node "id") "ls-heading-parent-" ""))]
            (prn {:id id})
            (swap! state/collapsed-headings conj id))
          (d/hide! node))))
    (let [id (uuid (string/replace heading-id "ls-heading-parent-" ""))]
      (swap! state/collapsed-headings conj id))))

(defn expand!
  [headings-id heading-id]
  (let [all-headings (get-headings headings-id)]
    (expand-non-heading! all-headings heading-id)
    (when-let [node (gdom/getElement heading-id)]
      (let [children (get-heading-children all-headings node)]
        (doseq [node children]
          (let [id (uuid (string/replace (gobj/get node "id") "ls-heading-parent-" ""))]
            (swap! state/collapsed-headings disj id))
          (d/show! node))))
    (let [id (uuid (string/replace heading-id "ls-heading-parent-" ""))]
      (swap! state/collapsed-headings disj id))))

(defn get-control-node
  [heading]
  (let [heading-id (string/replace (gobj/get heading "id") "ls-heading-parent-" "")
        control-id (str "control-" heading-id)]
    (gdom/getElement control-id)))

;; ;; Collapse acts like TOC
(defn toggle-all!
  [id]
  (let [all-headings (get-headings id)
        headings (next all-headings)]
    (let [toggle-state @state/toggle-state]
      (doseq [heading headings]
       (prn "control node: " (get-control-node heading))
       (when-let [element (get-control-node heading)]
         (if toggle-state
           ;; expand
           (do
             (d/remove-class! element "caret-right")
             (expand! id (gobj/get heading "id")))

           (do
             (d/remove-class! element "caret-down")
             (d/add-class! element "caret-right")
             (collapse! id (gobj/get heading "id"))))))
      (swap! state/toggle-state not)
      (when toggle-state
        (reset! state/collapsed-headings #{})))))

(comment
  (def all-headings (get-headings "dGVzdC5vcmc="))
  (def id "Ideas")
  (collapse! all-headings id)
  (expand! all-headings id)
  )
