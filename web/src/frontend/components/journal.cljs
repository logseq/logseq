(ns frontend.components.journal
  (:require [rum.core :as rum]
            [frontend.util :as util]
            [frontend.handler :as handler]
            [clojure.string :as string]
            [frontend.ui :as ui]
            [frontend.format :as format]
            [frontend.mixins :as mixins]
            [frontend.db :as db]
            [frontend.state :as state]
            [frontend.format.org-mode :as org]
            [goog.object :as gobj]
            [frontend.image :as image]
            [frontend.components.content :as content]))

(def edit-content (atom ""))
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
                   (handler/save-current-edit-journal! (str heading "\n" @edit-content)))))))
  [heading content]
  [:div.flex-1
   (ui/textarea-autosize
    {:on-change (fn [e]
                  (reset! edit-content (util/evalue e)))
     :default-value content
     :auto-focus true
     :style {:border "none"
             :border-radius 0
             :background "transparent"
             :margin-top 12.5}})
   [:input
    {:id "files"
     :type "file"
     :on-change (fn [e]
                  (let [files (.-files (.-target e))]
                    (image/upload
                     files
                     (fn [file file-form-data file-name file-type]
                       ;; TODO: set uploading
                       (.append file-form-data "name" file-name)
                       (.append file-form-data file-type true)

                       ;; (citrus/dispatch!
                       ;;  :image/upload
                       ;;  file-form-data
                       ;;  (fn [url]
                       ;;    (reset! uploading? false)
                       ;;    (swap! form assoc name url)
                       ;;    (if on-uploaded
                       ;;      (on-uploaded form name url))))
                       ))))
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
  [{:keys [uuid title content] :as journal}]
  (let [{:keys [edit? edit-journal]} (rum/react state/state)
        [heading content] (split-heading-body content)]
    [:div.flex-1
     [:h1.text-gray-600 {:style {:font-weight "450"}}
      title]

     (if (and edit? (= uuid (:uuid edit-journal)))
       (editor-box heading content)
       [:div {:on-click (fn []
                          (handler/edit-journal! content journal)
                          (reset! edit-content content))
              :style {:padding 8
                      :min-height 200}}
        (if (or (not content)
                (string/blank? content))
          [:div]
          (content/html content "org" org/config-with-line-break))])]))

(rum/defcs journals < rum/reactive
  {:will-mount (fn [state]
                 (handler/set-latest-journals!)
                 state)}
  [state]
  (let [{:keys [latest-journals]} (rum/react state/state)]
    [:div#journals
     (for [journal latest-journals]
       [:div.journal.content {:key (cljs.core/random-uuid)}
        (journal-cp journal)])]))
