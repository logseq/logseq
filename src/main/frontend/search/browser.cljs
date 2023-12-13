(ns frontend.search.browser
  "Browser implementation of search protocol"
  (:require [cljs-bean.core :as bean]
            [frontend.search.protocol :as protocol]
            [promesa.core :as p]
            [frontend.persist-db.browser :as browser]
            [frontend.state :as state]
            [frontend.search.db :as search-db]))

(defonce *sqlite browser/*sqlite)

(defrecord Browser [repo]
  protocol/Engine
  (query [_this q option]
    (if-let [^js sqlite @*sqlite]
      (p/let [result (.search-blocks sqlite (state/get-current-repo) q (bean/->js option))
              result (bean/->clj result)]
        (keep (fn [{:keys [content page] :as block}]
                {:block/uuid (uuid (:uuid block))
                 :block/content content
                 :block/page (uuid page)}) result))
      (p/resolved nil)))
  (rebuild-blocks-indice! [this]
    (if-let [^js sqlite @*sqlite]
      (p/let [_ (protocol/truncate-blocks! this)
              blocks (search-db/build-blocks-indice)
              _ (when (seq blocks)
                  (.search-upsert-blocks sqlite repo blocks))])
      (p/resolved nil)))
  (transact-blocks! [_this {:keys [blocks-to-remove-set
                                   blocks-to-add]}]
    (if-let [^js sqlite @*sqlite]
      (let [repo (state/get-current-repo)]
        (p/let [_ (when (seq blocks-to-remove-set)
                    (.search-delete-blocks sqlite repo (bean/->js blocks-to-remove-set)))]
          (when (seq blocks-to-add)
            (.search-upsert-blocks sqlite repo (bean/->js blocks-to-add)))))
      (p/resolved nil)))
  (truncate-blocks! [_this]
    (if-let [^js sqlite @*sqlite]
      (.search-truncate-tables sqlite (state/get-current-repo))
      (p/resolved nil)))
  (remove-db! [_this]
    ;; Already removed in OPFS
    (p/resolved nil)))
