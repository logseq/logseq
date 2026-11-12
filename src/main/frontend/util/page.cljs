(ns frontend.util.page
  "Provides util fns for page blocks"
  (:require [clojure.string :as string]
            [frontend.db.subs :as db-subs]
            [frontend.state :as state]
            [frontend.util :as util]))

(defn- ready-snapshot-value
  [{:keys [status value]}]
  (when (= :ready status)
    value))

(defn- ready-block
  [block-uuid]
  (when (uuid? block-uuid)
    (ready-snapshot-value (db-subs/block-snapshot block-uuid))))

(defn- ready-resource
  [resource-key]
  (ready-snapshot-value (db-subs/resource-snapshot resource-key)))

(defn- parse-uuid*
  [value]
  (cond
    (uuid? value) value
    (and (string? value) (util/uuid-string? value)) (uuid value)
    :else nil))

(defn- viewed-entity-uuid
  "Uuid of the entity the visible route displays: the page for :page routes,
   the zoomed block for :page-block routes. Only reads snapshots that the
   page paint already loaded; nil when no page route is showing."
  []
  (or (when-let [lookup (state/get-current-page)]
        (or (parse-uuid* lookup)
            (when (and (string? lookup)
                       (not (string/blank? lookup)))
              (ready-resource [:page-identity lookup]))))
      (when (= :page-block (state/get-current-route))
        (ready-resource [:route-block
                         (get-in (state/get-route-match) [:path-params :name])
                         (get-in (state/get-route-match) [:path-params :block-route-name])]))))

(defn- host-page
  "If the viewed entity is a zoomed block, return its host page."
  [entity]
  (or (when (map? entity)
        (:block/page entity))
      entity))

(defn- editor-block
  []
  (:block (first (state/get-editor-args))))

(defn get-current-page-uuid
  "Fetch the current page's uuid from the current route, then last edited block.
   A zoomed block resolves to its host page."
  []
  (let [viewed-uuid (viewed-entity-uuid)]
    (or (:block/uuid (host-page (ready-block viewed-uuid)))
        viewed-uuid
        (get-in (editor-block) [:block/page :block/uuid]))))

(defn get-current-page-id
  "Fetches the current page id. Looks up page based on latest route and if
  nothing is found, gets page of last edited block.
  Route pages without a cached numeric id are returned as [:block/uuid ...].
  A zoomed block resolves to its host page."
  []
  (let [viewed-uuid (viewed-entity-uuid)
        host (host-page (ready-block viewed-uuid))]
    (or (:db/id host)
        (when viewed-uuid
          [:block/uuid viewed-uuid])
        (get-in (editor-block) [:block/page :db/id])
        (:db/id (editor-block)))))

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
