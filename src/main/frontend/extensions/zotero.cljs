(ns frontend.extensions.zotero
  (:require [cljs.core.async :refer [<! >! go chan go-loop] :as a]
            [clojure.edn :refer [read-string]]
            [clojure.string :as str]
            [frontend.components.svg :as svg]
            [frontend.extensions.pdf.assets :as pdf-assets]
            [frontend.extensions.zotero.api :as api]
            [frontend.extensions.zotero.handler :as zotero-handler]
            [frontend.extensions.zotero.setting :as setting]
            [frontend.handler.notification :as notification]
            [frontend.handler.route :as route-handler]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [goog.dom :as gdom]
            [rum.core :as rum]))

(def term-chan (chan))
(def debounce-chan-mult (a/mult (api/debounce term-chan 500)))

(rum/defc zotero-search-item [{:keys [data] :as item} id]
  (let [[is-creating-page set-is-creating-page!] (rum/use-state false)]
    (let [title (:title data)
          type (:item-type data)
          abstract (str (subs (:abstract-note data) 0 200) "...")]

      [:div.zotero-search-item.px-2.py-4.border-b.cursor-pointer.border-solid.last:border-none.relative
       {:on-click (fn [] (go
                           (set-is-creating-page! true)
                           (<!
                            (zotero-handler/create-zotero-page item {:block-dom-id id}))
                           (set-is-creating-page! false)))}
       [[:div [[:span.font-bold.mb-1.mr-1 title]
               [:span.zotero-search-item-type.text-xs.p-1.rounded type]]]
        [:div.text-sm abstract]]

       (when is-creating-page [:div.zotero-search-item-loading-indicator [:span.animate-spin-reverse  svg/refresh]])])))

(rum/defc zotero-search
  [id]

  (let [[term set-term!]                         (rum/use-state "")
        [search-result set-search-result!]       (rum/use-state [])
        [prev-page set-prev-page!]               (rum/use-state "")
        [next-page set-next-page!]               (rum/use-state "")
        [prev-search-term set-prev-search-term!] (rum/use-state "")
        [search-error set-search-error!]         (rum/use-state nil)
        [is-searching set-is-searching!]         (rum/use-state false)

        search-fn (fn [s-term start]
                    (go
                      (when-not (str/blank? s-term)
                        (set-is-searching! true)

                        (let [{:keys [success next prev result] :as response}
                              (<! (api/query-top-items s-term start))]
                          (if (false? success)
                            (set-search-error! (:body response))

                            (do
                              (set-prev-search-term! s-term)
                              (set-next-page! next)
                              (set-prev-page! prev)
                              (set-search-result! result))))

                        (set-is-searching! false))))]

    (rum/use-effect!
     (fn []
       (let [d-chan (chan)]
         (a/tap debounce-chan-mult d-chan)
         (go-loop []
           (let [d-term (<! d-chan)]
             (<! (search-fn d-term "0")))
           (recur))

         (fn [] (a/untap debounce-chan-mult d-chan))))
     [])

    (when-not (setting/valid?)
      (route-handler/redirect! {:to :zotero-setting})
      (notification/show! "Please setup Zotero API key and user/group id first!" :warn false))

    [:div#zotero-search.zotero-search.p-4
     {:style {:width 600}}

     [:div.flex.items-center.mb-2
      [[:input.p-2.border.mr-2.flex-1.focus:outline-none
        {:autoFocus   true
         :placeholder "Search for your Zotero journal article (title, author, text, anything)"
         :value       term :on-change (fn [e]
                                        (go
                                          (>! term-chan (util/evalue e)))
                                        (set-term! (util/evalue e)))}]

       [:span.animate-spin-reverse {:style {:visibility (if is-searching "visible"  "hidden")}}  svg/refresh]]]

     [:div.h-2.text-sm.text-red-400.mb-2 (if search-error (str "Search error: " search-error) "")]

     [:div
      (map
       (fn [item] (rum/with-key (zotero-search-item item id) (:key item)))
       search-result)
      (when-not (str/blank? prev-page)
        (ui/button
         "prev"
         :on-click
         (fn []
           (set! (.-scrollTop (.-parentNode (gdom/getElement "zotero-search"))) 0)
           (go (<! (search-fn prev-search-term prev-page))))))
      (when-not (str/blank? next-page)
        (ui/button
         "next"
         :on-click
         (fn []
           (set! (.-scrollTop (.-parentNode (gdom/getElement "zotero-search"))) 0)
           (go (<! (search-fn prev-search-term next-page))))))]]))


(rum/defcs settings
  <
  (rum/local (setting/setting :type-id) ::type-id)
  (rum/local nil ::progress)
  (rum/local false ::total)
  (rum/local "Add all" ::fetching-button)
  rum/reactive
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
     "User or Group ID"]
    [:div.mt-1.sm:mt-0.sm:col-span-2
     [:div.max-w-lg.rounded-md
      [:input.form-input.block
       {:default-value (setting/setting :type-id)
        :placeholder   "User/Group id"
        :on-blur       (fn [e] (setting/set-setting! :type-id (util/evalue e)))
        :on-change     (fn [e] (reset! (::type-id state) (util/evalue e)))}]]]]

   (when
    (and (not (str/blank? (str @(::type-id state))))
         (not (re-matches #"^\d+$" (str @(::type-id state)))))
     (ui/admonition
      :warning
      [:p.text-red-500
       "User ID is different from username and can be found on the "
       [:a {:href "https://www.zotero.org/settings/keys" :target "_blank"}
        "https://www.zotero.org/settings/keys"]
       " page, it's a number of digits"]))

   [:div.row
    [:label.title
     {:for "zotero_prefer_citekey"
      :title "Make sure to install Better BibTeX and pin your item first"}
     "Always prefer citekey as your page title?"]
    [:div
     [:div.rounded-md.sm:max-w-xs
      (ui/toggle (setting/setting :prefer-citekey?)
                 (fn [] (setting/set-setting! :prefer-citekey? (not (setting/setting :prefer-citekey?))))
                 true)]]]

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

   (when (setting/setting :include-attachments?)
     [:div.row
      [:label.title
       {:for "zotero_linked_attachment_base_directory"}
       "Zotero linked attachment base directory"
       [:a.ml-2
        {:title "If you store attached files in Zotero — the default — this setting does not affect you. It only applies to linked files. If you're using the ZotFile plugin to help with a linked-file workflow, you should configure it to store linked files within the base directory you've configured. Click to learn more."
         :href "https://www.zotero.org/support/preferences/advanced#linked_attachment_base_directory"
         :target "_blank"}
        (svg/info)]]
      [:div.mt-1.sm:mt-0.sm:col-span-2
       [:div.max-w-lg.rounded-md
        [:input.form-input.block
         {:default-value (setting/setting :zotero-linked-attachment-base-directory)
          :placeholder   "/Users/Sarah/Dropbox"
          :on-blur       (fn [e] (setting/set-setting! :zotero-linked-attachment-base-directory (util/evalue e)))}]]]])

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
        :on-blur       (fn [e] (setting/set-setting! :page-insert-prefix (util/evalue e)))}]]]]

   [:div.row
    [:label.title
     {:for "zotero_extra_tags"
      :title "Extra tags to add for every imported page. Separate by comma, or leave it empty."}
     "Extra tags to add:"]
    [:div.mt-1.sm:mt-0.sm:col-span-2
     [:div.max-w-lg.rounded-md
      [:input.form-input.block
       {:default-value (setting/setting :extra-tags)
        :placeholder   "tag1,tag2,tag3"
        :on-blur       (fn [e] (setting/set-setting! :extra-tags (util/evalue e)))}]]]]

   (when (util/electron?)
     [:div.row
      [:label.title
       {:for "zotero_data_directory"}
       "Zotero data directory"
       [:a.ml-2
        {:title "Set Zotero data directory to open pdf attachment in Logseq. Click to learn more."
         :href "https://www.zotero.org/support/zotero_data"
         :target "_blank"}
        (svg/info)]]
      [:div.mt-1.sm:mt-0.sm:col-span-2
       [:div.max-w-lg.rounded-md
        [:input.form-input.block
         {:default-value (setting/setting :zotero-data-directory)
          :placeholder   "/Users/<username>/Zotero"
          :on-blur       (fn [e] (setting/set-setting! :zotero-data-directory (util/evalue e)))}]]]])

   [:div.row
    [:label.title
     {:for "zotero_import_all"}
     "Add all zotero items"]
    [:div.mt-1.sm:mt-0.sm:col-span-2
     (ui/button
      @(::fetching-button state)
      :on-click
      (fn []
        (go
          (let [_     (reset! (::fetching-button state) "Fetching..")
                total (<! (api/all-top-items-count))
                _     (reset! (::fetching-button state) "Add all")]
            (when (.confirm
                   js/window
                   (str "This will import all your zotero items and add total number of " total " pages. Do you wish to continue?"))
              (do
                (reset! (::total state) total)
                (<! (zotero-handler/add-all (::progress state)))
                (reset! (::total state) false)
                (notification/show! "Successfully added all items!" :success)))))))]]

   (ui/admonition
    :warning
    "If you have a lot of items in Zotero, adding them all can slow down Logseq. You can type /zotero to import specific item on demand instead.")

   (when @(::total state)
     [:div.row
      [:div.bg-greenred-200.py-3.rounded-lg.col-span-full
       [:progress.w-full {:max (+ @(::total state) 30) :value @(::progress state)}] "Importing items from Zotero....Please wait..."]])])

(defn open-button [full-path]
  (if (str/ends-with? (str/lower-case full-path) "pdf")
    (ui/button
     "open"
     :small? true
     :on-click
     (fn [e]
       (when-let [current (pdf-assets/inflate-asset full-path)]
         (util/stop e)
         (state/set-state! :pdf/current current))))
    (ui/button
     "open"
     :small? true
     :target "_blank"
     :href full-path)))

(rum/defc zotero-imported-file
  [item-key filename]
  (if (str/blank? (setting/setting :zotero-data-directory))
    [:p.warning "This is a zotero imported file, setting Zotero data directory would allow you to open the file in Logseq"]
    (let [filename (read-string filename)
          full-path
          (str "file://"
               (util/node-path.join
                (setting/setting :zotero-data-directory)
                "storage"
                item-key
                filename))]
      (open-button full-path))))

(rum/defc zotero-linked-file
  [path]
  (if (str/blank? (setting/setting :zotero-linked-attachment-base-directory))
    [:p.warning "This is a zotero linked file, setting Zotero linked attachment base directory would allow you to open the file in Logseq"]
    (let [path (read-string path)
          full-path
          (str "file://"
               (util/node-path.join
                (setting/setting :zotero-linked-attachment-base-directory)
                (str/replace-first path "attachments:" "")))]
      (open-button full-path))))
