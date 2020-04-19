(ns frontend.expand
  (:require [dommy.core :as d]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [frontend.util :as util]))

(defn get-content
  []
  (gdom/getElement "content"))

(defn get-content-children
  []
  (-> (get-content)
      (d/children)
      (array-seq)))

(defn get-all-headings
  []
  (mapcat #(d/sel %) ["h1" "h2" "h3" "h4" "h5" "h6"]))

(defn get-heading-children
  [all-nodes heading]
  (let [heading-id (gobj/get heading "id")
        heading-tag-name (gobj/get heading "tagName")
        get-level (fn [tag-name]
                    (util/parse-int (second tag-name)))
        heading? (fn [tag-name]
                   (and
                    tag-name
                    (= \H (first tag-name))
                    (int? (get-level tag-name))))
        level (get-level heading-tag-name)]
    (->> all-nodes
         ;; drop preceding nodes
         (drop-while (fn [node]
                       (not= heading-id (gobj/get node "id"))))
         ;; drop self
         (next)
         ;; take the children
         (take-while (fn [node]
                       (let [tag-name (gobj/get node "tagName")]
                         (if (heading? tag-name)
                           (> (get-level tag-name) level)
                           true)))))))

(defn collapse!
  ([id]
   (collapse! (get-content-children) id))
  ([all-nodes id]
   (when-let [node (d/sel1 (str "#" id))]
     (let [children (get-heading-children all-nodes node)]
       (doseq [node children]
         (d/hide! node))))))

(defn expand!
  ([id]
   (expand! (get-content-children) id))
  ([all-nodes id]
   (when-let [node (d/sel1 (str "#" id))]
     (let [children (get-heading-children all-nodes node)]
       (doseq [node children]
         (d/show! node))))))

(defn attach-controls!
  []
  (let [headings (get-all-headings)]
    (doseq [heading headings]
      (let [id (gobj/get heading "id")
            control-id (str "control-" id)
            element (d/create-element "a")]
        (d/set-attr! element :id control-id)
        (d/listen! heading
                   :mouseover (fn [e]
                                (let [class-name (if (d/has-class? element "caret-down")
                                                   "caret-right"
                                                   "caret-down")]
                                  (d/set-class! element class-name))))
        (d/listen! heading
                   :mouseout (fn [e]
                               (d/set-class! element "")))
        (d/listen! element
                   :click (fn [e]
                            (prn "clicked " id)
                            (let [[class-name f] (if (d/has-class? element "caret-down")
                                                   ["caret-right" collapse!]
                                                   ["caret-down" expand!])]
                              (prn {:class-name class-name})
                              (d/set-class! element class-name)
                              (f id))))
        (d/prepend! heading element)))))

(comment
  (def all-nodes (get-content-children))
  (def id "Ideas")
  (collapse! all-nodes id)
  (expand! all-nodes id)
  )
