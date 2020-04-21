(ns frontend.components.content
  (:require [rum.core :as rum]
            [frontend.format :as format]
            [frontend.handler :as handler]
            [frontend.util :as util]
            [frontend.state :as state]
            [frontend.mixins :as mixins]
            [frontend.ui :as ui]
            [frontend.expand :as expand]
            [frontend.config :as config]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [clojure.string :as string]
            [frontend.components.editor :as editor]))

(defn- highlight!
  []
  (doseq [block (-> (js/document.querySelectorAll "pre code")
                    (array-seq))]
    (js/hljs.highlightBlock block)))

(defn lazy-load-js
  [state]
  (let [format (nth (:rum/args state) 1)
        loader? (contains? config/html-render-formats format)]
    (when loader?
      (when-not (format/loaded? format)
        (handler/lazy-load format)))))



;; TODO: lazy load highlight.js
(rum/defcs content < rum/reactive
  (mixins/event-mixin
   (fn [state]
     (mixins/listen state js/window "keyup"
                    (fn [e]
                      ;; t
                      (when (and
                             ;; not in search
                             (nil? @state/q)
                             (= 84 (.-keyCode e)))
                        (let [id (first (:rum/args state))]
                          (expand/toggle-all! id))
                        )))))
  {:will-mount (fn [state]
                 (lazy-load-js state)
                 state)
   :did-mount (fn [state]
                (highlight!)
                (handler/render-local-images!)
                state)
   :did-update (fn [state]
                 (highlight!)
                 (handler/render-local-images!)
                 (lazy-load-js state)
                 state)}
  [state id format {:keys [config
                           hiccup
                           content
                           on-click
                           on-hide]}]
  (let [{:keys [edit? format/loading edit-journal edit-file]} (rum/react state/state)
        edit-id (rum/react state/edit-id)]
    (if (and edit? (= id edit-id))
      (editor/box content {:on-hide on-hide})
      (let [format (format/normalize format)
            loading? (get loading format)
            markup? (contains? config/html-render-formats format)
            on-click (fn [e]
                       (when-not (util/link? (gobj/get e "target"))
                         (reset! state/edit-id id)
                         (handler/reset-cursor-range! (gdom/getElement (str id)))
                         (when on-click
                           (on-click))
                         (handler/set-edit-content! content)))]
        (cond
          (and markup? loading?)
          [:div "loading ..."]

          (and markup? (contains? #{:org} format))
          [:div
           {:id id
            :style {:min-height 300}}
           hiccup]

          markup?
          (let [html (format/to-html content format config)
                html (if html html "<div></div>")]
            [:div
             {:id id
              :style {:min-height 300}
              :on-click on-click
              :dangerouslySetInnerHTML {:__html html}}])

          :else                       ; other text formats
          [:div.pre-white-space
           {:id id
            :on-click on-click}
           content])))))
