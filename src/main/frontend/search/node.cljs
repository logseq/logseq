(ns frontend.search.node
  (:require [frontend.search.protocol :as protocol]
            [frontend.util :as util]
            [electron.ipc :as ipc]
            [cljs-bean.core :as bean]
            [frontend.search.db :as search-db]
            [frontend.db :as db]
            [promesa.core :as p]))

(defrecord Node [repo]
  protocol/Engine
  (query [this q opts]
    (p/let [result (ipc/ipc "search-blocks" repo q opts)
            result (bean/->clj result)]
      (map (fn [{:keys [content id uuid page]}]
             {:block/uuid uuid
              :block/content content
              :block/page page}) result)))
  (rebuild-blocks-indice! [this]
    (let [indice (search-db/build-blocks-indice repo)]
      (ipc/ipc "rebuild-blocks-indice" repo indice)))
  (transact-blocks! [this data]
    (ipc/ipc "transact-blocks" repo (bean/->js data)))
  (truncate-blocks! [this]
    (ipc/ipc "truncate-blocks" repo))
  (remove-db! [this]
    (ipc/ipc "remove-db" repo)))
