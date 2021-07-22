(ns frontend.extensions.zotero
  (:require [cljs.core.async :refer [<! >! go chan go-loop] :as a]
            [clojure.string :as str]
            [frontend.components.svg :as svg]
            [frontend.extensions.zotero.api :as api]
            [frontend.extensions.zotero.extractor :as extractor]
            [frontend.extensions.zotero.handler :as zotero-handler]
            [frontend.extensions.zotero.setting :as setting]
            [frontend.handler.notification :as notification]
            [frontend.handler.route :as route-handler]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [rum.core :as rum]))

(def term-chan (chan))
(def debounce-chan-mult (a/mult (api/debounce term-chan 500)))

(rum/defc zotero-search-item [{:keys [data] :as item} id]
  (let [title (:title data)
        abstract (str (subs (:abstract-note data) 0 200) "...")]

    [:div.px-2.py-4.border-b.cursor-pointer.border-solid.hover:bg-gray-100.last:border-none
     {:on-click (fn [] (go (<! (zotero-handler/create-zotero-page item {:block-dom-id id}))))}
     [[:div.font-bold.mb-1 title]
      [:div.text-sm abstract]]]))

(rum/defc zotero-search
  [id]

  (let [[term set-term!]                   (rum/use-state "")
        [search-result set-search-result!] (rum/use-state [])
        [search-error set-search-error!]   (rum/use-state nil)
        [is-searching set-is-searching!]   (rum/use-state false)]

    (rum/use-effect!
     (fn []
       (let [d-chan (chan)]
         (a/tap debounce-chan-mult d-chan)
         (go-loop []
           (let [d-term (<! d-chan)]
             (when-not (str/blank? d-term)
               (set-is-searching! true)

               (let [result (<! (api/query-top-items d-term))]
                 (if (false? (:success result))
                   (set-search-error! (:body result))
                   (set-search-result! result)))

               (set-is-searching! false)))
           (recur))))
     [])

    (when-not (setting/valid?)
      (route-handler/redirect! {:to :zotero-setting})
      (notification/show! "Please setup Zotero API key and user/group id first!" :warn false))

    (println search-result)

    [:div.zotero-search.p-4
     {:style {:width 600}}

     [:div.flex.items-center.mb-2
      [[:input.p-2.border.mr-2.flex-1
        {:autoFocus   true
         :placeholder "Search for your Zotero journal article (title, author, text, anything)"
         :value       term :on-change (fn [e]
                                        (go
                                          (>! term-chan (util/evalue e)))
                                        (set-term! (util/evalue e)))}]

       (when is-searching [:span.loader-reverse  svg/refresh])]]

     [:div.h-2.text-sm.text-red-400.mb-2 (if search-error (str "Search error: " search-error) "")]

     [:div
      (map
       (fn [item] (rum/with-key (zotero-search-item item id) (:key item)))
       search-result)]]))


(rum/defcs settings
  < rum/reactive
  [state]
  [:div.zotero-settings
   [:h1.mb-4.text-4xl.font-bold.mb-8 "Zotero Settings"]

   [:div.row
    [:label.title
     {:for "zotero_api_key"}
     "Zotero API key"]
    [:div.mt-1.sm:mt-0.sm:col-span-2
     [:div.max-w-lg.rounded-md
      [:input.form-input.block
       {:default-value (setting/api-key)
        :placeholder   "Please enter your Zotero API key"
        :on-blur       (fn [e] (setting/set-api-key (util/evalue e)))}]]]]

   [:div.row
    [:label.title
     {:for "zotero_type"}
     "Zotero user or group?"]
    [:div.mt-1.sm:mt-0.sm:col-span-2
     [:div.max-w-lg.rounded-md
      [:select.form-select
       {:value     (-> (setting/setting :type) name)
        :on-change (fn [e]
                     (let [type (-> (util/evalue e)
                                    (str/lower-case)
                                    keyword)]
                       (setting/set-setting! :type type)))}
       (for [type (map name [:user :group])]
         [:option {:key type :value type} (str/capitalize type)])]]]]

   [:div.row
    [:label.title
     {:for "zotero_type_id"}
     "User or Group id"]
    [:div.mt-1.sm:mt-0.sm:col-span-2
     [:div.max-w-lg.rounded-md
      [:input.form-input.block
       {:default-value (setting/setting :type-id)
        :placeholder   "User/Group id"
        :on-blur       (fn [e] (setting/set-setting! :type-id (util/evalue e)))}]]]]

   [:div.row
    [:label.title
     {:for "zotero_include_attachment_links"}
     "Include attachment links?"]
    [:div
     [:div.rounded-md.sm:max-w-xs
      (ui/toggle (setting/setting :include-attachments?)
                 (fn [] (setting/set-setting! :include-attachments? (not (setting/setting :include-attachments?))))
                 true)]]]

   (when (setting/setting :include-attachments?)
     [:div.row
      [:label.title
       {:for "zotero_attachments_block_text"}
       "Attachtment under block of:"]
      [:div.mt-1.sm:mt-0.sm:col-span-2
       [:div.max-w-lg.rounded-md
        [:input.form-input.block
         {:default-value (setting/setting :attachments-block-text)
          :on-blur       (fn [e] (setting/set-setting! :attachments-block-text (util/evalue e)))}]]]])

   [:div.row
    [:label.title
     {:for "zotero_include_notes"}
     "Include notes?"]
    [:div
     [:div.rounded-md.sm:max-w-xs
      (ui/toggle (setting/setting :include-notes?)
                 (fn [] (setting/set-setting! :include-notes?
                                              (not (setting/setting :include-notes?))))
                 true)]]]

   (when (setting/setting :include-notes?)
     [:div.row
      [:label.title
       {:for "zotero_notes_block_text"}
       "Notes under block of:"]
      [:div.mt-1.sm:mt-0.sm:col-span-2
       [:div.max-w-lg.rounded-md
        [:input.form-input.block
         {:default-value (setting/setting :notes-block-text)
          :on-blur       (fn [e] (setting/set-setting! :notes-block-text (util/evalue e)))}]]]])

   [:div.row
    [:label.title
     {:for "zotero_page_prefix"}
     "Insert page name with prefix:"]
    [:div.mt-1.sm:mt-0.sm:col-span-2
     [:div.max-w-lg.rounded-md
      [:input.form-input.block
       {:default-value (setting/setting :page-insert-prefix)
        :on-blur       (fn [e] (setting/set-setting! :page-insert-prefix (util/evalue e)))}]]]]])
