(ns frontend.components.content
  (:require [rum.core :as rum]
            [frontend.format :as format]
            [frontend.format.org-mode :as org]
            [frontend.format.markdown :as md]
            [frontend.handler :as handler]
            [frontend.util :as util]
            [frontend.state :as state]
            [frontend.mixins :as mixins]
            [frontend.image :as image]
            [frontend.ui :as ui]
            [goog.dom :as gdom]))

(defn- highlight!
  []
  (doseq [block (-> (js/document.querySelectorAll "pre code")
                    (array-seq))]
    (js/hljs.highlightBlock block)))

(defn lazy-load-js
  [state]
  (let [format (keyword (second (:rum/args state)))
        loader? (contains? handler/html-render-formats format)]
    (when loader?
      (when-not (format/loaded? format)
        (handler/lazy-load format)))))

(rum/defc editor-box <
  (mixins/event-mixin
   (fn [state]
     (mixins/hide-when-esc-or-outside
      state
      nil
      :show-fn (fn []
                 (:edit? @state/state))
      :on-hide (:on-hide (second (:rum/args state))))))
  {:did-mount (fn [state]
                (when-let [content (first (:rum/args state))]
                  (handler/restore-cursor-pos! content))
                state)
   :will-unmount (fn [state]
                   (handler/clear-edit!)
                   state)}
  [content {:keys [on-hide]}]
  [:div.flex-1 {:style {:margin-bottom 400}}
   (ui/textarea
    {:id "edit-box"
     :on-change (fn [e]
                  (reset! state/edit-content (util/evalue e)))
     :initial-value content
     :value-atom state/edit-content
     :auto-focus true
     :style {:border "none"
             :border-radius 0
             :background "transparent"
             :margin-top 12.5}
     :on-key-down handler/reset-cursor-pos!
     :on-click handler/reset-cursor-pos!})
   [:input
    {:id "files"
     :type "file"
     :on-change (fn [e]
                  (let [files (.-files (.-target e))]
                    (image/upload
                     files
                     (fn [file file-name file-type]
                       (handler/request-presigned-url
                        file file-name file-type
                        (fn [signed-url]
                          ;; insert into the text
                          (handler/insert-image! signed-url)))))))
     :hidden true}]])

;; TODO: lazy load highlight.js
(rum/defcs content < rum/reactive
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
  [state id html format {:keys [config
                                content
                                on-click
                                on-hide]}]
  (let [{:keys [edit? format/loading]} (rum/react state/state)]
    (if edit?
      (editor-box content {:on-hide on-hide})
      (let [format (format/normalize format)
            loading? (get loading format)
            html (if html html (format/to-html content format config))
            markup? (contains? handler/html-render-formats format)
            on-click (fn [_e]
                       (handler/reset-cursor-range! (gdom/getElement id))
                       (if on-click
                         (on-click))
                       (reset! state/edit-content content))]
        (cond
          (and markup? loading?)
          [:div "loading ..."]

          markup?
          (let [html (if html html "<span></span>")]
            [:div
             {:id id
              :on-click on-click
              :dangerouslySetInnerHTML {:__html html}}])

          :else                       ; other text formats
          [:div.pre-white-space
           {:id id
            :content-editable true
            :on-click on-click}
           content])))))
