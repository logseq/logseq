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
  (some-> (get-content)
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
        control? (fn [node]
                   (d/has-class? node "control"))
        level (get-level heading-tag-name)
        nodes (->> all-nodes
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
                                     true)))))]
    (if (and (last nodes)
             (control? (last nodes)))
      (drop-last nodes)
      nodes)))

(defn collapse!
  [all-nodes id]
  (when-let [node (gdom/getElement id)]
    (let [children (get-heading-children all-nodes node)]
      (doseq [node children]
        (d/hide! node)))))

(defn expand!
  [all-nodes id]
  (when-let [node (gdom/getElement id)]
    (let [children (get-heading-children all-nodes node)]
      (doseq [node children]
        (d/show! node)))))

(defn get-control-node
  [heading]
  (let [control-id (str "control-" (gobj/get heading "id"))]
    (gdom/getElement control-id)))

(defn toggle-all!
  []
  (let [all-nodes (get-content-children)
        headings (next (get-all-headings))
        collapse-mode? (every? (fn [node]
                                 (try
                                   (let [control-node (get-control-node node)]
                                     (d/has-class? control-node "caret-right"))
                                   (catch js/Error _e
                                     nil)))
                               headings)]
    (prn "collapse mode" collapse-mode?)
    (doseq [heading headings]
      (when-let [element (get-control-node heading)]
        (if collapse-mode?
          (do
            (d/remove-class! element "caret-right")
            (d/add-class! element "caret-down")
            (expand! all-nodes (gobj/get heading "id")))
          (do
            (d/remove-class! element "caret-down")
            (d/add-class! element "caret-right")
            (collapse! all-nodes (gobj/get heading "id"))))))))

(defn attach-controls!
  []
  (let [all-nodes (get-content-children)
        headings (get-all-headings)]
    (doseq [heading headings]
      (when-let [heading-children (seq (get-heading-children all-nodes heading))]
        (let [id (gobj/get heading "id")
              control-id (str "control-" id)
              element (d/create-element "a")
              mouseover (fn [e]
                          (when (and
                                 (not (d/has-class? element "caret-down"))
                                 (not (d/has-class? element "caret-right")))
                            (d/add-class! element "caret-down")))
              mouseout (fn [e]
                         (d/remove-class! element "caret-down"))]
          (when-let [old-node (gdom/getElement control-id)]
            (d/remove! old-node))
          (d/set-attr! element
                       :id control-id
                       :class "control block no-underline text-gray-700 hover:bg-gray-100 transition ease-in-out duration-150")
          (d/set-style! element
                        :float "left"
                        :min-width "20px"
                        :min-height "40px"
                        :margin-left "-20px")
          (d/listen! heading :mouseover mouseover)
          (d/listen! heading :mouseout mouseout)
          (d/listen! element :mouseover mouseover)
          (d/listen! element :mouseout mouseout)
          (d/listen! element
                     :click (fn [e]
                              (if (d/has-class? element "caret-down")
                                (do
                                  (d/remove-class! element "caret-down")
                                  (d/add-class! element "caret-right")
                                  (collapse! all-nodes id))
                                (do
                                  (d/remove-class! element "caret-right")
                                  (d/add-class! element "caret-down")
                                  (expand! all-nodes id)))))
          (d/insert-before! element heading))))))

(comment
  (def all-nodes (get-content-children))
  (def id "Ideas")
  (collapse! all-nodes id)
  (expand! all-nodes id)
  )
