(ns frontend.expand
  (:require [dommy.core :as d]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [frontend.util :as util]
            [clojure.string :as string]
            [medley.core :as medley]))

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

(defn- get-level
  [tag-name]
  (util/parse-int (second tag-name)))

(defn- heading?
  [node]
  (let [tag-name (gobj/get node "tagName")]
    (and
     tag-name
     (= \H (first tag-name))
     (int? (get-level tag-name)))))

(defn- h1?
  [node]
  (and (heading? node)
       (= 1 (get-level (gobj/get node "tagName")))))

(defn get-heading-children
  [all-nodes heading]
  (let [heading-id (gobj/get heading "id")
        heading-tag-name (gobj/get heading "tagName")
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
                                   (if (heading? node)
                                     (> (get-level tag-name) level)
                                     true)))))]
    (if (and (last nodes)
             (control? (last nodes)))
      (drop-last nodes)
      nodes)))

(defn get-heading-non-heading-children
  [all-nodes heading]
  (let [heading-id (gobj/get heading "id")
        heading-tag-name (gobj/get heading "tagName")
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
                                   (not (heading? node))))))]
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

(defn collapse-non-heading!
  [all-nodes id]
  (when-let [node (gdom/getElement id)]
    (let [children (get-heading-children all-nodes node)]
      (doseq [node children]
        (prn {:heading? (heading? node)})
        (if (heading? node)
          (collapse-non-heading! all-nodes (gobj/get node "id"))
          (d/hide! node))))))

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

(defn indent-non-headings!
  [heading children]
  (let [tag-name (string/lower-case (gobj/get heading "tagName"))
        level (get-level tag-name)
        id (gobj/get heading "id")]
    (doseq [child children]
      (when-not (heading? child)
        (when (> level 1)
          (doseq [idx (range 1 level)]
            (d/remove-class! child (str "h" idx "-child"))))
        (d/add-class! child (str tag-name "-child"))
        (d/set-attr! child "parent" id)))))

;; Collapse acts like TOC
(defn toggle-all!
  []
  (let [all-nodes (get-content-children)
        headings (next (get-all-headings))
        collapse-mode? (some (fn [node]
                               (try
                                 (let [control-node (get-control-node node)]
                                   (d/has-class? control-node "caret-right"))
                                 (catch js/Error _e
                                   nil)))
                             headings)]
    (doseq [heading headings]
      (when-let [element (get-control-node heading)]
        (if collapse-mode?
          (do
            (d/remove-class! element "caret-right")
            (expand! all-nodes (gobj/get heading "id")))
          (do
            (d/remove-class! element "caret-down")
            (d/add-class! element "caret-right")
            (collapse-non-heading! all-nodes (gobj/get heading "id"))))))))

(defn attach-controls!
  []
  (let [all-nodes (get-content-children)
        headings (get-all-headings)]
    (doseq [heading headings]
      (let [heading-parent (d/parent heading)]
        (when-let [heading-children (seq (get-heading-children all-nodes heading))]
         (indent-non-headings! heading heading-children)
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
           (d/set-style! heading
                         :position "relative")
           (d/set-attr! element
                        :id control-id
                        :class "control block no-underline text-gray-700 hover:bg-gray-100 transition ease-in-out duration-150")
           (d/set-style! element
                         :position "absolute"
                         :top 0
                         :left "-20px")
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
           ;; create a div wrapper
           ;; (let [wrapper (d/create-element "div")
           ;;       non-heading-children (get-heading-non-heading-children all-nodes heading)]
           ;;   ;; (d/replace! heading wrapper)
           ;;   ;; (prn "remove " )
           ;;   ;; (js/console.dir heading)
           ;;   (d/set-class! wrapper "heading-group")
           ;;   (d/remove! heading)
           ;;   (doseq [child non-heading-children]
           ;;     (d/remove! child))
           ;;   (apply d/append! wrapper
           ;;     element
           ;;     heading
           ;;     non-heading-children)
           ;;   (d/append! heading-parent wrapper)
           ;;   )

           (d/prepend! heading element)
           ))))))

(comment
  (def all-nodes (get-content-children))
  (def id "Ideas")
  (collapse! all-nodes id)
  (expand! all-nodes id)
  )
