(ns frontend.search.node
  "NodeJS implementation of search protocol"
  (:require [cljs-bean.core :as bean]
            [electron.ipc :as ipc]
            [frontend.search.db :as search-db]
            [frontend.search.protocol :as protocol]
            [promesa.core :as p]
            [frontend.state :as state]))

(defrecord Node [repo]
  protocol/Engine
  (query [_this q opts]
    (p/let [result (ipc/ipc "search-blocks" repo q opts)
            result (bean/->clj result)]
      (keep (fn [{:keys [content uuid page]}]
              (when-not (> (count content) (state/block-content-max-length repo))
                {:block/uuid uuid
                 :block/content content
                 :block/page page})) result)))
  (rebuild-blocks-indice! [_this]
    (let [indice (search-db/build-blocks-indice repo)]
      (ipc/ipc "rebuild-blocks-indice" repo indice)))
  (transact-blocks! [_this data]
    (ipc/ipc "transact-blocks" repo (bean/->js data)))
  (truncate-blocks! [_this]
    (ipc/ipc "truncate-blocks" repo))
  (remove-db! [_this]
    (ipc/ipc "remove-db" repo)))
