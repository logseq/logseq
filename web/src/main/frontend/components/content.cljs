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
            [frontend.expand :as expand]
            [frontend.config :as config]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [clojure.string :as string]))

(defn- highlight!
  []
  (doseq [block (-> (js/document.querySelectorAll "pre code")
                    (array-seq))]
    (js/hljs.highlightBlock block)))

(defn lazy-load-js
  [state]
  (let [format (nth (:rum/args state) 2)
        loader? (contains? config/html-render-formats format)]
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
                  (handler/set-edit-content! (util/evalue e)))
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

(defn- node-link?
  [node]
  (contains?
   #{"A" "BUTTON"}
   (gobj/get node "tagName")))

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
                        (expand/toggle-all!))))))
  {:will-mount (fn [state]
                 (lazy-load-js state)
                 state)
   :did-mount (fn [state]
                (highlight!)
                (handler/render-local-images!)
                ;; (expand/attach-controls!)
                state)
   :did-update (fn [state]
                 (highlight!)
                 (handler/render-local-images!)
                 ;; (expand/attach-controls!)
                 (lazy-load-js state)
                 state)}
  [state id html format {:keys [config
                                content
                                on-click
                                on-hide]}]
  (let [{:keys [edit? edit-id format/loading edit-journal edit-file]} (rum/react state/state)
        edit-id (rum/react state/edit-id)]
    (if (and edit? (= id edit-id))
      (editor-box content {:on-hide on-hide})
      (let [format (format/normalize format)
            loading? (get loading format)
            markup? (contains? config/html-render-formats format)
            on-click (fn [e]
                       (when-not (node-link? (gobj/get e "target"))
                         (reset! state/edit-id id)
                         (handler/reset-cursor-range! (gdom/getElement (str id)))
                         (when on-click
                           (on-click))
                         (handler/set-edit-content! content)))]
        (cond
          (and markup? loading?)
          [:div "loading ..."]

          markup?
          (let [html (if (string/blank? html)
                       (format/to-html content format config)
                       html )
                html (if html html "<span></span>")]
            (if (= format :org)
              [:div
               {:id id
                :on-click on-click}
               (format/to-html content format config)]
              [:div
               {:id id
                :on-click on-click
                :dangerouslySetInnerHTML {:__html html}}]))

          :else                       ; other text formats
          [:div.pre-white-space
           {:id id
            :on-click on-click}
           content])))))
