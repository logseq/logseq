(ns frontend.search.browser
  "Browser implementation of search protocol"
  (:require [cljs-bean.core :as bean]
            [frontend.search.protocol :as protocol]
            [promesa.core :as p]
            [frontend.persist-db.browser :as browser]
            [frontend.state :as state]
            [frontend.config :as config]
            [frontend.handler.file-based.property.util :as property-util]
            [logseq.db :as ldb]))

(defonce *sqlite browser/*worker)

(defrecord Browser [repo]
  protocol/Engine
  (query [_this q option]
    (if-let [^js sqlite @*sqlite]
      (p/let [result (.search-blocks sqlite (state/get-current-repo) q (bean/->js option))]
        (ldb/read-transit-str result))
      (p/resolved nil)))
  (rebuild-pages-indice! [_this]
    (if-let [^js sqlite @*sqlite]
      (.search-build-pages-indice sqlite repo)
      (p/resolved nil)))
  (rebuild-blocks-indice! [this]
    (if-let [^js sqlite @*sqlite]
      (p/let [repo (state/get-current-repo)
              file-based? (config/local-file-based-graph? repo)
              _ (protocol/truncate-blocks! this)
              result (.search-build-blocks-indice sqlite repo)
              blocks (if file-based?
                       (->> (bean/->clj result)
                            ;; remove built-in properties from content
                            (map #(update % :content
                                          (fn [content]
                                            (property-util/remove-built-in-properties (get % :format :markdown) content))))
                            bean/->js)
                       result)
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
