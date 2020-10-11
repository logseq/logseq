(ns frontend.handler.ui
  (:require [dommy.core :as dom]
            [frontend.state :as state]
            [frontend.db :as db]
            [rum.core :as rum]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [frontend.util :as util :refer-macros [profile]]))

;; sidebars
(defn hide-left-sidebar
  []
  (dom/add-class! (dom/by-id "menu")
                  "md:block")
  (dom/remove-class! (dom/by-id "left-sidebar")
                     "enter")
  (dom/remove-class! (dom/by-id "search")
                     "sidebar-open")
  (dom/remove-class! (dom/by-id "main")
                     "sidebar-open"))

(defn show-left-sidebar
  []
  (dom/remove-class! (dom/by-id "menu")
                     "md:block")
  (dom/add-class! (dom/by-id "left-sidebar")
                  "enter")
  (dom/add-class! (dom/by-id "search")
                  "sidebar-open")
  (dom/add-class! (dom/by-id "main")
                  "sidebar-open"))

(defn hide-right-sidebar
  []
  (state/hide-right-sidebar!))

(defn show-right-sidebar
  []
  (state/open-right-sidebar!))

(defn toggle-right-sidebar!
  []
  (state/toggle-sidebar-open?!))


;; FIXME: re-render all embedded blocks since they will not be re-rendered automatically
(defn re-render-root!
  []
  (when-let [component (state/get-root-component)]
    (db/clear-query-state-without-refs-and-embeds!)
    (rum/request-render component)
    (doseq [component (state/get-custom-query-components)]
      (rum/request-render component))))

(defn re-render-file!
  []
  (when-let [component (state/get-file-component)]
    (when (= :file (state/get-current-route))
      (rum/request-render component))))

(defn highlight-element!
  [fragment]
  (let [id (and
            (> (count fragment) 36)
            (subs fragment (- (count fragment) 36)))]
    (if (and id (util/uuid-string? id))
      (let [elements (array-seq (js/document.getElementsByClassName id))]
        (when (first elements)
          (util/scroll-to-element (gobj/get (first elements) "id")))
        (doseq [element elements]
          (dom/add-class! element "block-highlight")
          (js/setTimeout #(dom/remove-class! element "block-highlight")
                         4000)))
      (when-let [element (gdom/getElement fragment)]
        (util/scroll-to-element fragment)
        (dom/add-class! element "block-highlight")
        (js/setTimeout #(dom/remove-class! element "block-highlight")
                       4000)))))

(defn scroll-and-highlight!
  [state]
  (when-let [fragment (util/get-fragment)]
    (highlight-element! fragment))
  state)

(defn add-style-if-exists!
  []
  (when-let [style (or
                    (state/get-custom-css-link)
                    (db/get-custom-css)
                    ;; (state/get-custom-css-link)
                    )]
    (util/add-style! style)))
