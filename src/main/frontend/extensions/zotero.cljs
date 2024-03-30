(ns frontend.extensions.zotero
  (:require [cljs.core.async :refer [<! >! chan go go-loop] :as a]
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
            [frontend.context.i18n :refer [t]] 
            [promesa.core :as p]
            [rum.core :as rum]))

(def term-chan (chan))
(def debounce-chan-mult (a/mult (api/debounce term-chan 500)))

(rum/defc zotero-search-item [{:keys [data] :as item} id]
  (let [[is-creating-page set-is-creating-page!] (rum/use-state false)
        title (:title data)
        type (:item-type data)
        abstract (str (subs (:abstract-note data) 0 200) "...")]
    [:div.zotero-search-item.px-2.py-2.border-b.cursor-pointer.border-solid.last:border-none.relative
     {:on-click (fn [] (go
                         (set-is-creating-page! true)
                         (<!
                           (zotero-handler/create-zotero-page item {:block-dom-id id}))
                         (set-is-creating-page! false)))}
     [[:div [[:span.font-medium.mb-1.mr-1.text-sm title]
             [:span.zotero-search-item-type.text-xs.p-1.rounded type]]]
      [:div.text-sm.opacity-60 abstract]]

     (when is-creating-page
       [:div.zotero-search-item-loading-indicator [:span.animate-spin-reverse (svg/refresh)]])]))

(rum/defc zotero-search
  [id]

  (let [[term set-term!] (rum/use-state "")
        [search-result set-search-result!] (rum/use-state [])
        [prev-page set-prev-page!] (rum/use-state "")
        [next-page set-next-page!] (rum/use-state "")
        [prev-search-term set-prev-search-term!] (rum/use-state "")
        [search-error set-search-error!] (rum/use-state nil)
        [is-searching set-is-searching!] (rum/use-state false)

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
      (notification/show! (t :settings-page/zotero-setup-notification) :warn false))

    [:div#zotero-search.zotero-search
     [:div.flex.items-center.input-wrap
      [:input.flex-1.focus:outline-none
       {:autoFocus   true
        :placeholder (t :settings-page/zotero-search-placeholder)
        :value       term
        :on-change   (fn [e]
                       (go
                         (>! term-chan (util/evalue e)))
                       (set-term! (util/evalue e)))}]

      (when is-searching (ui/loading ""))]

     (when search-error
       [:div.h-2.text-sm.text-error.mb-2
        (str (t :settings-page/zotero-search-error) ": " search-error "")])

     (when (seq search-result)
       [:div.p-2
        (map
          (fn [item] (rum/with-key (zotero-search-item item id) (:key item)))
          search-result)

        ;; pagination
        (when-not (str/blank? prev-page)
          (ui/button
            "prev"
            :on-click
            (fn []
              (set! (.-scrollTop (.-parentNode (gdom/getElement "zotero-search"))) 0)
              (search-fn prev-search-term prev-page))))
        (when-not (str/blank? next-page)
          (ui/button
            "next"
            :on-click
            (fn []
              (set! (.-scrollTop (.-parentNode (gdom/getElement "zotero-search"))) 0)
              (search-fn prev-search-term next-page))))])]))

(rum/defcs user-or-group-setting <
  (rum/local (setting/setting :type-id) ::type-id)
  rum/reactive
  [state]
  [:div
   [:div.row
    [:label.title.w-72
     {:for "zotero_type"}
     (t :settings-page/zotero-user-or-group)]
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
    [:label.title.w-72
     {:for "zotero_type_id"}
    (t :settings-page/zotero-userId)]
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
       [:p.text-error
        (t :settings-page/zotero-type-id-warning)]))])

(rum/defc overwrite-mode-setting <
  rum/reactive
  []
  [:div
   [:div.row
    [:label.title.w-72
     {:for "zotero_overwrite_mode"}
     (str (t :settings-page/zotero-overwrite-mode))]
    [:div
     [:div.rounded-md.sm:max-w-xs
      (ui/toggle (setting/setting :overwrite-mode?)
                 (fn [] (setting/set-setting! :overwrite-mode? (not (setting/setting :overwrite-mode?))))
                 true)]]]
   (when (setting/setting :overwrite-mode?)
     (ui/admonition
       :warning
       [:p.text-error
        (t :settings-page/zotero-overwrite-warning)]))])

(rum/defc attachment-setting <
  rum/reactive
  []
  [:div
   [:div.row
    [:label.title.w-72
     {:for "zotero_include_attachment_links"}
     (t :settings-page/zotero-attachment-include-links)]
    [:div
     [:div.rounded-md.sm:max-w-xs
      (ui/toggle (setting/setting :include-attachments?)
                 (fn [] (setting/set-setting! :include-attachments? (not (setting/setting :include-attachments?))))
                 true)]]]
   (when (setting/setting :include-attachments?)
     [:div.row
      [:label.title.w-72
       {:for "zotero_attachments_block_text"}
       (t :settings-page/zotero-attachment-under-block-of)]
      [:div.mt-1.sm:mt-0.sm:col-span-2
       [:div.max-w-lg.rounded-md
        [:input.form-input.block
         {:default-value (setting/setting :attachments-block-text)
          :on-blur       (fn [e] (setting/set-setting! :attachments-block-text (util/evalue e)))}]]]])
   (when (setting/setting :include-attachments?)
     [:div.row
      [:label.title.w-72
       {:for "zotero_linked_attachment_base_directory"}
       (t :settings-page/zotero-attachment-base-directory)
       [:a.ml-2
        {:title  (t :settings-page/zotero-attachment-base-directory-a-title)
         :href   "https://www.zotero.org/support/preferences/advanced#linked_attachment_base_directory"
         :target "_blank"}
        (svg/info)]]
      [:div.mt-1.sm:mt-0.sm:col-span-2
       [:div.max-w-lg.rounded-md
        [:input.form-input.block
         {:default-value (setting/setting :zotero-linked-attachment-base-directory)
          :placeholder   "/Users/Sarah/Dropbox"
          :on-blur       (fn [e] (setting/set-setting! :zotero-linked-attachment-base-directory (util/evalue e)))}]]]])])

(rum/defc prefer-citekey-setting <
  rum/reactive
  []
  [:div.row
   [:label.title.w-72
    {:for   "zotero_prefer_citekey"
     :title (t :settings-page/zotero-prefer-citekey-title)}
    (t :settings-page/zotero-prefer-citekey)]
   [:div
    [:div.rounded-md.sm:max-w-xs
     (ui/toggle (setting/setting :prefer-citekey?)
                (fn [] (setting/set-setting! :prefer-citekey? (not (setting/setting :prefer-citekey?))))
                true)]]])

(rum/defc api-key-setting []
  [:div.row
   [:label.title.w-72
    {:for "zotero_api_key"}
    (t  :settings-page/zotero-api-key-set)]
   [:div.mt-1.sm:mt-0.sm:col-span-2
    [:div.max-w-lg.rounded-md
     [:input.form-input.block
      {:default-value (setting/api-key)
       :placeholder   (t :settings-page/zotero-api-key-set-placeholder)
       :on-blur       (fn [e] (setting/set-api-key (util/evalue e)))}]]]])

(rum/defc notes-setting <
  rum/reactive
  []
  [:div
   [:div.row
    [:label.title.w-72
     {:for "zotero_include_notes"}
     (t :settings-page/zotero-notes-setting-include-notes)]
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
       (t :settings-page/zotero-notes-setting-notes-under-block-of)]
      [:div.mt-1.sm:mt-0.sm:col-span-2
       [:div.max-w-lg.rounded-md
        [:input.form-input.block
         {:default-value (setting/setting :notes-block-text)
          :on-blur       (fn [e] (setting/set-setting! :notes-block-text (util/evalue e)))}]]]])])

(rum/defc page-prefix-setting []
  [:div.row
   [:label.title
    {:for "zotero_page_prefix"}
    (t :settings-page/zotero-page-prefix-setting)]
   [:div.mt-1.sm:mt-0.sm:col-span-2
    [:div.max-w-lg.rounded-md
     [:input.form-input.block
      {:default-value (setting/setting :page-insert-prefix)
       :on-blur       (fn [e] (setting/set-setting! :page-insert-prefix (util/evalue e)))}]]]])

(rum/defc extra-tags-setting []
  [:div.row
   [:label.title
    {:for   "zotero_extra_tags"
     :title (t :settings-page/zotero-extra-tags-title)}
    (t :settings-page/zotero-extra-tags)]
   [:div.mt-1.sm:mt-0.sm:col-span-2
    [:div.max-w-lg.rounded-md
     [:input.form-input.block
      {:default-value (setting/setting :extra-tags)
       :placeholder   "tag1,tag2,tag3"
       :on-blur       (fn [e] (setting/set-setting! :extra-tags (util/evalue e)))}]]]])

(rum/defc data-directory-setting []
  [:div.row
   [:label.title
    {:for "zotero_data_directory"}
    (t :settings-page/zotero-data-directory)
    [:a.ml-2
     {:title  (t :settings-page/zotero-data-directory-a-title)
      :href   "https://www.zotero.org/support/zotero_data"
      :target "_blank"}
     (svg/info)]]
   [:div.mt-1.sm:mt-0.sm:col-span-2
    [:div.max-w-lg.rounded-md
     [:input.form-input.block
      {:default-value (setting/setting :zotero-data-directory)
       :placeholder   "/Users/<username>/Zotero"
       :on-blur       (fn [e] (setting/set-setting! :zotero-data-directory (util/evalue e)))}]]]])

(rum/defcs profile-name-dialog-inner <
  (rum/local "" ::input)
  [state profile* close-fn]
  (let [input (get state ::input)]
    [:div
     [:div.sm:flex.sm:items-start
      [:div.mt-3.text-center.sm:mt-0.sm:text-left
       [:h3#modal-headline.text-lg.leading-6.font-medium
        (t :settings-page/zotero-profile-name-dialog)]]]

     [:input.form-input.block.w-full.sm:text-sm.sm:leading-5.my-2
      {:auto-focus    true
       :default-value ""
       :on-change     (fn [e] (reset! input (util/evalue e)))}]

     [:div.mt-5.sm:mt-4.sm:flex.sm:flex-row-reverse
      [:span.flex.w-full.rounded-md.shadow-sm.sm:ml-3.sm:w-auto
       (ui/button
         (t :submit)
         :class "ui__modal-enter"
         :on-click (fn []
                     (let [profile-name (str/trim @input)]
                       (when-not (str/blank? profile-name)
                         (p/let [_ (setting/add-profile profile-name)
                                 _ (setting/set-profile profile-name)]
                           (reset! profile* profile-name)))
                       (state/close-modal!))))]
      [:span.mt-3.flex.w-full.rounded-md.sm:mt-0.sm:w-auto
       (ui/button (t :cancel) {:variant :ghost :on-click close-fn :class "opacity-70 hover:opacity-100"})]]]))

(rum/defc zotero-profile-selector <
  rum/reactive
  [profile*]
  [:div.flex.flex-row.mb-4.items-center
   [:label.title.mr-32 {:for "profile-select"} (str (t :settings-page/zotero-profile) ":")]
   [:div.flex.flex-row.ml-4
    [:select.ml-1.rounded
     {:style {:padding "0px 36px 0px 8px"}
      :value @profile*
      :on-change
      (fn [e]
        (when-let [profile (util/evalue e)]
          (p/let [_ (setting/set-profile profile)]
            (reset! profile* profile))))}
     (map-indexed (fn [i x] [:option
                             {:key   i
                              :value x}
                             x]) (setting/all-profiles))]
    (ui/button
      (t :settings-page/zotero-profile-new)
      :small? true
      :class "ml-4"
      :on-click
      (fn []
        (state/set-modal!
          (fn [close-fn]
            (profile-name-dialog-inner profile* close-fn)))))
    (ui/button
      (t :settings-page/zotero-profile-delete)
      :small? true
      :background "red"
      :class "ml-4"
      :on-click
      (fn []
        (p/let [_ (setting/remove-profile @profile*)]
          (reset! profile* (setting/profile)))))]])

(rum/defcs add-all-items <
  (rum/local nil ::progress)
  (rum/local false ::total)
  (rum/local (t :settings-page/zotero-import-all-add-all) ::fetching-button)
  rum/reactive
  [state]
  [:div
   [:div.row
    [:label.title.w-72
     {:for "zotero_import_all"}
     (t :settings-page/zotero-import-all)]
    [:div.mt-1.sm:mt-0.sm:col-span-2
     (ui/button
       @(::fetching-button state)
       :on-click
       (fn []
         (go
           (let [_ (reset! (::fetching-button state) (t :settings-page/zotero-import-all-fetching))
                 total (<! (api/all-top-items-count))
                 _ (reset! (::fetching-button state) (t :settings-page/zotero-import-all-add-all))]
             (when (.confirm
                     js/window
                     (str (t :settings-page/zotero-import-all-confirm total)))

               (reset! (::total state) total)
               (<! (zotero-handler/add-all (::progress state)))
               (reset! (::total state) false)
               (notification/show! (t :settings-page/zotero-import-all-success) :success))))))]]
   (ui/admonition
     :warning
     (t :settings-page/zotero-import-all-warning))

   (when @(::total state)
     [:div.row
      [:div.bg-greenred-200.py-3.rounded-lg.col-span-full
       [:progress.w-full {:max (+ @(::total state) 30) :value @(::progress state)}] (t :settings-page/zotero-import-all-importing)]])])

(rum/defc setting-rows
  []
  [:div
   (api-key-setting)

   (user-or-group-setting)

   (prefer-citekey-setting)

   (attachment-setting)

   (notes-setting)

   (page-prefix-setting)

   (extra-tags-setting)

   (data-directory-setting)

   (overwrite-mode-setting)])

(rum/defcs settings
  <
  (rum/local (setting/all-profiles) ::all-profiles)
  (rum/local (setting/profile) ::profile)
  rum/reactive
  {:should-update
   (fn [old-state _new-state]
     (let [all-profiles (setting/all-profiles)]
       (not= all-profiles @(::all-profiles old-state))))}
  [state]
  [:div.zotero-settings
   [:h1.mb-4.text-4xl.font-bold.mb-8 (str "Zotero" (t :settings))]

   (zotero-profile-selector (::profile state))

   (rum/with-key (setting-rows) @(::profile state))

   (add-all-items)])

(defn open-button [full-path]
  (if (str/ends-with? (str/lower-case full-path) "pdf")
    (ui/button
      (t :open)
      :small? true
      :on-click
      (fn [e]
        (when-let [current (pdf-assets/inflate-asset full-path)]
          (util/stop e)
          (state/set-state! :pdf/current current))))
    (ui/button
      (t :open)
      :small? true
      :target "_blank"
      :href full-path)))

(rum/defc zotero-imported-file
  [item-key filename]
  (if (str/blank? (setting/setting :zotero-data-directory))
    [:p.warning (t :settings-page/zotero-imported-file-warning)]
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
    [:p.warning (t :settings-page/zotero-linked-file-warning)]
    (let [path (read-string path)
          full-path
          (str "file://"
               (util/node-path.join
                 (setting/setting :zotero-linked-attachment-base-directory)
                 (str/replace-first path "attachments:" "")))]
      (open-button full-path))))
