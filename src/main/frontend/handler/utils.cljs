(ns frontend.handler.utils
  (:require [frontend.db.queries :as db-queries]
            [frontend.db.react-queries :as react-queries]
            [frontend.db.utils :as db-utils]))

(defn- remove-key
  [repo-url key]
  (db-queries/retract-by-key repo-url key)
  (react-queries/set-new-result! [repo-url :kv key] nil))

(defn set-key-value
  [repo-url key value]
  (if value
    (db-queries/transact-react! repo-url [(db-utils/kv key value)]
      {:key [:kv key]})
    (remove-key repo-url key)))
