(ns frontend.components.journal
  (:require [rum.core :as rum]
            [frontend.util :as util]
            [frontend.handler :as handler]
            [clojure.string :as string]
            [frontend.ui :as ui]
            [frontend.mixins :as mixins]
            [frontend.db :as db]
            [frontend.state :as state :refer [edit-content]]
            [frontend.format.org-mode :as org]
            [goog.object :as gobj]
            [frontend.image :as image]
            [frontend.components.content :as content]
            [goog.dom :as gdom]))

(rum/defc editor-box <
  (mixins/event-mixin
   (fn [state]
     (let [heading (first (:rum/args state))]
       (mixins/hide-when-esc-or-outside
        state
        nil
        :show-fn (fn []
                   (:edit? @state/state))
        :on-hide (fn []
                   (handler/save-current-edit-journal! (str heading "\n" (string/trimr @edit-content) "\n\n")))))))
  [heading content]
  [:div.flex-1
   (ui/textarea-autosize
    {:ref (fn [ref]
            (handler/set-edit-node! ref))
     :on-change (fn [e]
                  (handler/reset-cursor-pos! e)
                  (reset! edit-content (util/evalue e)))
     :default-value content
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
     ;; :hidden true
     }]])

(defn split-first [re s]
  (clojure.string/split s re 2))

(defn- split-heading-body
  [content]
  (let [result (split-first #"\n" content)]
    (if (= 1 (count result))
      [result ""]
      result)))

(rum/defc journal-cp < rum/reactive
  (mixins/event-mixin
   (fn [state]
     (let [{:keys [title content]} (first (:rum/args state))]
       (mixins/hide-when-esc-or-outside
        state
        nil
        :show-fn (fn []
                   (:edit? @state/state))
        :on-hide (fn []
                   (let [[heading content] (split-heading-body content)]
                     (handler/save-current-edit-journal! (str heading "\n" (string/trimr @edit-content) "\n\n"))))
        :node (gdom/getElement "journal-edit")))))
  [{:keys [uuid title content] :as journal}]
  (let [{:keys [edit? edit-journal]} (rum/react state/state)
        [heading content] (split-heading-body content)]
    [:div.flex-1
     [:h1.text-gray-600 {:style {:font-weight "450"}}
      title]
     [:div {:id (str "journal-edit")
            :content-editable true
            :on-input (fn [e]
                        (let [value (gobj/getValueByKeys e "currentTarget" "textContent")]
                              (prn "value: " value)
                              (reset! edit-content value)))

            ;; :on-click (fn []
            ;;             (handler/edit-journal! content journal)
            ;;             (reset! edit-content content))
            :style {:padding 8
                    :min-height 200}}
      (if (or (not content)
              (string/blank? content))
        [:div]
        (content/html content "org" org/config-with-line-break))]
     ;; (if (and edit? (= uuid (:uuid edit-journal)))
     ;;   (editor-box heading content)
     ;;   [:div {:id (str "journal-" uuid)
     ;;          :on-change (fn [e]
     ;;                       (reset! edit-content (util/evalue e)))
     ;;          :content-editable true
     ;;          ;; :on-click (fn []
     ;;          ;;             (handler/edit-journal! content journal)
     ;;          ;;             (reset! edit-content content))
     ;;          :style {:padding 8
     ;;                  :min-height 200}}
     ;;    (if (or (not content)
     ;;            (string/blank? content))
     ;;      [:div]
     ;;      (content/html content "org" org/config-with-line-break))])
     ]))

(rum/defc journals
  [latest-journals]
  [:div#journals
   (ui/infinite-list
    (for [journal latest-journals]
      [:div.journal.content {:key (cljs.core/random-uuid)}
       (journal-cp journal)])
    {:on-load (fn []
                (handler/load-more-journals!))})])
