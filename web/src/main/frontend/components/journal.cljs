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
            [frontend.format :as format]
            [goog.object :as gobj]
            [goog.dom :as gdom]
            [frontend.image :as image]
            [frontend.components.content :as content]))

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
  {:did-mount (fn [state]
                (when-let [content (second (:rum/args state))]
                  (handler/restore-cursor-pos! content))
                state)}
  [heading content]
  [:div.flex-1
   (ui/textarea
    {:id "edit-journal-box"
     :on-change (fn [e]
                  (prn "value: " (util/evalue e))
                  (reset! edit-content (util/evalue e)))
     :initial-value content
     :value-atom edit-content
     :auto-focus true
     :style {:border "none"
             :border-radius 0
             :background "transparent"
             :margin-top 12.5}
     :on-key-down handler/reset-cursor-pos!
     :on-click handler/reset-cursor-pos!
     })
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

(defn split-first [re s]
  (clojure.string/split s re 2))

(defn- split-heading-body
  [content]
  (let [result (split-first #"\n" content)]
    (if (= 1 (count result))
      [result ""]
      [(string/trim (first result))
       (string/trim (second result))])))

(rum/defc journal-cp < rum/reactive
  [{:keys [uuid title content] :as journal}]
  (let [{:keys [edit? edit-journal]} (rum/react state/state)
        [heading content] (split-heading-body content)]
    [:div.flex-1
     [:h1.text-gray-600 {:style {:font-weight "450"}}
      title]
     (if (and edit? (= uuid (:uuid edit-journal)))
       (editor-box heading content)
       (let [id (str "journal-" uuid)
             html (-> (format/to-html content "org" org/config-with-line-break)
                      (util/minimize-html))]
         [:div
          {:id id
           :content-editable true
           :on-click (fn [_e]
                       (handler/reset-cursor-range! (gdom/getElement id))
                       (handler/edit-journal! content journal)
                       (reset! edit-content content))
           :dangerouslySetInnerHTML {:__html html}}]))]))

(rum/defc journals < rum/reactive
  [latest-journals]
  [:div#journals
   (ui/infinite-list
    (for [journal latest-journals]
      [:div.journal.content {:key (cljs.core/random-uuid)}
       (journal-cp journal)])
    {:on-load (fn []
                (handler/load-more-journals!))})])
