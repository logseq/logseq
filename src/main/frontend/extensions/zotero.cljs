(ns frontend.extensions.zotero
  (:require [cljs.core.async :refer [<! >! go chan] :as a]
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

(defonce term-chan (chan))
(defonce debounce-chan  (api/debounce term-chan 200))

(rum/defc zotero-search-item [{:keys [data] :as item} handle-command-zotero]
  (let [type (:item-type data)
        title (:title data)
        abstract (str (subs (:abstract-note data) 0 200) "...")]

    (if (= type "journalArticle")
      [:div.px-2.py-4.border-b.cursor-pointer.border-solid.hover:bg-gray-100.last:border-none
       {:on-click (fn [] (go (<! (zotero-handler/create-zotero-page item))
                             (let [{:keys [page-name]} (extractor/extract item)]
                               (handle-command-zotero page-name)

                               (state/sidebar-add-block!
                                (state/get-current-repo)
                                (:db/id page-name)
                                :page
                                {:page page-name}))))}
       [[:div.font-bold.mb-1 title]
        [:div.text-sm abstract]]]
      nil)))

(rum/defc zotero-search [handle-command-zotero]

  (let [[term set-term!]                   (rum/use-state "")
        [search-result set-search-result!] (rum/use-state [])
        [search-error set-search-error!]   (rum/use-state nil)
        [is-searching set-is-searching!]   (rum/use-state false)]
    (when-not (setting/valid?)
      (route-handler/redirect! {:to :zotero-setting})
      (notification/show! "Please setup Zotero API key and user/group id first!" :warn false))

    (go
      (let [d-term   (<! debounce-chan)]
        (when-not (str/blank? d-term)
          (set-is-searching! true)


          (let [result (<! (api/query-items "journalArticle" d-term))]
            (if (false? (:success result))
              (set-search-error! (:body result))
              (set-search-result! result)))

          (set-is-searching! false))))

    [:div.zotero-search.p-4
     {:style {:width 600}}

     [:div.flex.items-center.mb-2
      [[:input.p-2.border.mr-2.flex-1
        {:autoFocus   true
         :placeholder "Search for your Zotero journal article (title, author, text, anything)"
         :value       term :on-change (fn [e]
                                        (go
                                          (js/console.log "sending term-chan!!" (util/evalue e))
                                          (>! term-chan (util/evalue e)))
                                        (set-term! (util/evalue e)))}]

       (when is-searching [:span.loader-reverse  svg/refresh])]]

     [:div.h-2.text-sm.text-red-400.mb-2 (if search-error (str "Search error: " search-error) "")]

     [:div
      (map
       (fn [item] (rum/with-key (zotero-search-item item handle-command-zotero) (:key item)))
       search-result)]]))


(rum/defcs settings
  <
  (rum/local (setting/api-key) ::api-key)
  rum/reactive
  [state]
  (let [api-key (::api-key state)]
    [:div#zotero-settings
     [:h1.title "Zotero settings"]

     [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-start
      [:label.block.text-bg.font-medium.leading-5.opacity-70
       {:for "zotero_api_key"}
       "Zotero API key"]
      [:div.mt-1.sm:mt-0.sm:col-span-2
       [:div.max-w-lg.rounded-md
        [:input.form-input.block
         {:value       @api-key
          :placeholder "Please enter your Zotero API key"
          :on-change   (fn [e]
                         (reset! api-key (util/evalue e))
                         (setting/set-api-key (util/evalue e)))}]]]]

     [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-start
      [:label.block.text-sm.font-medium.leading-5.opacity-70
       {:for "zotero_type"}
       "Zotero user or group?"]
      [:div.mt-1.sm:mt-0.sm:col-span-2
       [:div.max-w-lg.rounded-md
        [:select.form-select.is-small
         {:value     (-> (setting/setting :type) name)
          :on-change (fn [e]
                       (let [type (-> (util/evalue e)
                                      (str/lower-case)
                                      keyword)]
                         (setting/set-setting! :type type)))}
         (for [type (map name [:user :group])]
           [:option {:key type :value type} (str/capitalize type)])]]]]

     [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-start
      [:label.block.text-bg.font-medium.leading-5.opacity-70
       {:for "zotero_type_id"}
       "User or Group id"]
      [:div.mt-1.sm:mt-0.sm:col-span-2
       [:div.max-w-lg.rounded-md
        [:input.form-input.block
         {:value       (setting/setting :type-id)
          :placeholder "User/Group id"
          :on-change   (fn [e]
                         (setting/set-setting! :type-id (util/evalue e)))}]]]]

     [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-start
      [:label.block.text-sm.font-medium.leading-5.opacity-70
       {:for "zotero_include_attachment_links"}
       "Include attachment links?"]
      [:div
       [:div.rounded-md.sm:max-w-xs
        (ui/toggle (setting/setting :include-attachments?)
                   (fn [] (setting/set-setting! :include-attachments? (not (setting/setting :include-attachments?))))
                   true)]]]

     (when (setting/setting :include-attachments?)
       [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-start
        [:label.block.text-bg.font-medium.leading-5.opacity-70
         {:for "zotero_attachments_block_text"}
         "Attachtment under block of:"]
        [:div.mt-1.sm:mt-0.sm:col-span-2
         [:div.max-w-lg.rounded-md
          [:input.form-input.block
           {:value     (setting/setting :attachments-block-text)
            :on-change (fn [e]
                           (setting/set-setting! :attachments-block-text (util/evalue e)))}]]]])

     [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-start
      [:label.block.text-sm.font-medium.leading-5.opacity-70
       {:for "zotero_include_notes"}
       "Include notes?"]
      [:div
       [:div.rounded-md.sm:max-w-xs
        (ui/toggle (setting/setting :include-notes?)
                   (fn [] (setting/set-setting! :include-notes?
                                                (not (setting/setting :include-notes?))))
                   true)]]]

     (when (setting/setting :include-notes?)
       [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-start
        [:label.block.text-bg.font-medium.leading-5.opacity-70
         {:for "zotero_notes_block_text"}
         "Notes under block of:"]
        [:div.mt-1.sm:mt-0.sm:col-span-2
         [:div.max-w-lg.rounded-md
          [:input.form-input.block
           {:value     (setting/setting :notes-block-text)
            :on-change (fn [e]
                           (setting/set-setting! :notes-block-text (util/evalue e)))}]]]])

     [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-start
      [:label.block.text-bg.font-medium.leading-5.opacity-70
       {:for "zotero_page_prefix"}
       "Insert page name with prefix:"]
      [:div.mt-1.sm:mt-0.sm:col-span-2
       [:div.max-w-lg.rounded-md
        [:input.form-input.block
         {:value     (setting/setting :page-insert-prefix)
          :on-change (fn [e]
                         (setting/set-setting! :page-insert-prefix (util/evalue e)))}]]]]]))
