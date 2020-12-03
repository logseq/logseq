(ns frontend.handler.ui
  (:require [dommy.core :as dom]
            [frontend.state :as state]
            [frontend.db :as db]
            [rum.core :as rum]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [frontend.util :as util :refer-macros [profile]]))

;; sidebars
(defn close-left-sidebar!
  []
  (when-let [elem (gdom/getElement "close-left-bar")]
    (.click elem)))

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
  ([]
   (re-render-root! {}))
  ([{:keys [clear-all-query-state?]
     :or {clear-all-query-state? false}}]
   (when-let [component (state/get-root-component)]
     (if clear-all-query-state?
       (db/clear-query-state!)
       (db/clear-query-state-without-refs-and-embeds!))
     (rum/request-render component)
     (doseq [component (state/get-custom-query-components)]
       (rum/request-render component)))))

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
  (if-let [fragment (util/get-fragment)]
    (highlight-element! fragment)
    (util/scroll-to-top))
  state)

(defn add-style-if-exists!
  []
  (when-let [style (or
                    (state/get-custom-css-link)
                    (db/get-custom-css)
                    ;; (state/get-custom-css-link)
)]
    (util/add-style! style)))
