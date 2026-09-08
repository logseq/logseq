(ns frontend.components.right-sidebar-util
  "Helpers for right sidebar item actions"
  (:require [frontend.db.async :as db-async]
            [promesa.core :as p]))

(defn sidebar-action-block-lookup
  "Return the id or page name used to load the sidebar item that Open as Page
  should open.

  Contents sidebar items use the string db-id \"contents\", which is not a block
  entity id. Resolve them by the built-in Contents page name, matching
  `<build-sidebar-item`."
  [db-id type]
  (cond
    (= :contents (keyword type)) "Contents"
    (or (integer? db-id) (uuid? db-id)) db-id
    :else nil))

(defn <sidebar-action-block
  [repo db-id type]
  (if-let [id (sidebar-action-block-lookup db-id type)]
    (db-async/<get-block repo id {:children? false})
    (p/resolved nil)))
