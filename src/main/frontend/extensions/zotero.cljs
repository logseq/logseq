(ns frontend.extensions.zotero
  (:require [cljs.core.async :refer [<! >! go chan] :as a]
            [clojure.string :as str]
            [frontend.extensions.zotero.api :as api]
            [frontend.extensions.zotero.handler :as zotero-handler]
            [frontend.extensions.zotero.extractor :as extractor]
            [frontend.state :as state]
            [frontend.util :as util]
            [rum.core :as rum]))

(defonce term-chan (chan))
(defonce debounce-chan  (api/debounce term-chan 5000))


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

  (let [cache-api-key       (js/localStorage.getItem "zotero-api-key")
        cache-user-id       (js/localStorage.getItem "zotero-user-id")
        cache-api-key-empty (str/blank? cache-api-key)
        cache-user-id-empty (str/blank? cache-user-id)
        api-key
        (if cache-api-key-empty
          (js/prompt "Please enter your Zotero API key (https://www.zotero.org/settings/keys/new)")
          cache-api-key)

        user-id (if cache-user-id-empty (js/prompt "Please enter your Zotero user id (https://www.zotero.org/settings/keys)") cache-user-id)]

    (when cache-api-key-empty (js/localStorage.setItem "zotero-api-key" api-key))

    (when cache-user-id-empty (js/localStorage.setItem "zotero-user-id" user-id))

    (let [[term set-term!]                   (rum/use-state "")
          [search-result set-search-result!] (rum/use-state [])
          [search-error set-search-error!]   (rum/use-state nil)
          [is-searching set-is-searching!]   (rum/use-state false)]

      (go
        (let [d-term   (<! debounce-chan)]
          ;; (js/console.log "xxx term:::" d-term)
          (when-not (str/blank? d-term)
            (set-search-result!
             (<! (api/query-items "journalArticle" d-term))))))

      [:div.zotero-search.p-4
       {:style {:width 600}}

       [:input.p-2.border.block.w-full.mb-3
        {:autoFocus   true
         :placeholder "Search for your Zotero journal article (title, author, text, anything)"
         :value       term :on-change (fn [e]
                                        (go
                                          (js/console.log "sending term-chan!!" (util/evalue e))
                                          (>! term-chan (util/evalue e)))
                                        (set-term! (util/evalue e)))}]

       [:div
        (map
         (fn [item] (rum/with-key (zotero-search-item item handle-command-zotero) (:key item)))
         search-result)]])))

(rum/defc setting []
  [:div
   [:h1.title "Zotero setting"]])
