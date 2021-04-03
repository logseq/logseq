(ns frontend.search.node
  (:require [frontend.search.protocol :as protocol]
            [frontend.util :as util]))

;; sqlite3

(defrecord Node [repo]
  protocol/Engine
  (query [this q option])
  (rebuild-blocks-indice! [this])
  (transact-blocks! [this data])
  (truncate-blocks! [this]))
