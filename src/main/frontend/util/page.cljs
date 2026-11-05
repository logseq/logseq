(ns frontend.util.page
  "Provides util fns for page blocks"
  (:require [frontend.state :as state]
            [frontend.util :as util]
            [promesa.core :as p]))

(defn- get-route-page-uuid
  "The uuid of the page in the current route, or nil when the route is not a page"
  []
  (let [current-page (state/get-current-page)]
    (when (and (string? current-page)
               (util/uuid-string? current-page))
      (uuid current-page))))

(defn get-current-page-uuid
  "Fetch the current page's uuid with same approach as <get-current-page-id"
  []
  (or (get-route-page-uuid)
      (get-in (first (state/get-editor-args)) [:block :block/page :block/uuid])))

(defn <get-current-page-id
  "Fetches the current page's entity id. Looks up the entity of the latest route
  and uses its page when it is a block that was opened as a page, or itself when
  it is a page. If nothing is found, gets the page of the last edited block"
  []
  (let [editor-block (:block (first (state/get-editor-args)))
        editor-page-id (or (get-in editor-block [:block/page :db/id])
                           (:db/id editor-block))]
    (if-let [route-uuid (get-route-page-uuid)]
      (p/let [route-entity (state/<invoke-db-worker :thread-api/pull
                                                    (state/get-current-repo)
                                                    [:db/id {:block/page [:db/id]}]
                                                    [:block/uuid route-uuid])]
        (or (get-in route-entity [:block/page :db/id])
            (:db/id route-entity)
            editor-page-id))
      (p/resolved editor-page-id))))

(defn entity-is-current-page?
  "True when the page-ref/tag entity is the page currently being viewed.
   `current-page` is typically `state/get-current-page` (uuid string or page name)."
  ([entity]
   (entity-is-current-page? entity (state/get-current-page)))
  ([entity current-page]
   (boolean
    (when (and entity current-page)
      (let [current (str current-page)
            ids (cond
                  (uuid? entity) [(str entity)]
                  (string? entity) [entity]
                  (map? entity)
                  (keep identity
                        [(some-> (:block/uuid entity) str)
                         (:block/name entity)])
                  :else nil)]
        (some #(= current %) ids))))))
