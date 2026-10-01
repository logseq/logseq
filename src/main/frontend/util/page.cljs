(ns frontend.util.page
  "Provides util fns for page blocks"
  (:require [clojure.string :as string]
            [frontend.db.subs :as db-subs]
            [frontend.state :as state]
            [frontend.util :as util]))

(def ^:private page-route-names #{:page :page-block})

(defn- current-route-page-name
  "Page identity from the visible route. For :page-block this is the host page,
   not the zoomed heading."
  []
  (or (state/get-current-page)
      (when (contains? page-route-names (state/get-current-route))
        (get-in (state/get-route-match) [:path-params :name]))))

(defn- ready-snapshot-value
  [{:keys [status value]}]
  (when (= :ready status)
    value))

(defn- peek-block
  [block-uuid]
  (when (uuid? block-uuid)
    (ready-snapshot-value (db-subs/block-snapshot block-uuid))))

(defn- peek-page-identity
  [page-lookup]
  (when (and (string? page-lookup)
             (not (string/blank? page-lookup)))
    (ready-snapshot-value (db-subs/resource-snapshot [:page-identity page-lookup]))))

(defn- parse-uuid*
  [value]
  (cond
    (uuid? value) value
    (and (string? value) (util/uuid-string? value)) (uuid value)
    :else nil))

(defn- host-page
  "If the viewed entity is a zoomed block, return its host page."
  [entity]
  (or (when (map? entity)
        (:block/page entity))
      entity))

(defn- editor-block
  []
  (:block (first (state/get-editor-args))))

(defn- route-page-uuid
  []
  (let [current-page (current-route-page-name)]
    (or (when-let [route-uuid (parse-uuid* current-page)]
          (let [entity (peek-block route-uuid)]
            (or (parse-uuid* (:block/uuid (host-page entity)))
                (parse-uuid* (:block/page-uuid entity))
                route-uuid)))
        (parse-uuid* (peek-page-identity current-page)))))

(defn- route-page-id
  []
  (when-let [current-page (current-route-page-name)]
    (if-let [route-uuid (parse-uuid* current-page)]
      (let [entity (peek-block route-uuid)
            host (host-page entity)]
        (or (:db/id host)
            (:block/page-id entity)
            [:block/uuid (or (parse-uuid* (:block/uuid host))
                             (parse-uuid* (:block/page-uuid entity))
                             route-uuid)]))
      (when-let [page-uuid (route-page-uuid)]
        (or (:db/id (peek-block page-uuid))
            [:block/uuid page-uuid])))))

(defn get-current-page-uuid
  "Fetch the current page's uuid from the current route, then last edited block.
   A zoomed block resolves to its host page."
  []
  (or (route-page-uuid)
      (get-in (editor-block) [:block/page :block/uuid])))

(defn get-current-page-id
  "Fetches the current page id. Looks up page based on latest route and if
  nothing is found, gets page of last edited block.
  Route pages without a cached numeric id are returned as [:block/uuid ...].
  A zoomed block resolves to its host page."
  []
  (or (route-page-id)
      (get-in (editor-block) [:block/page :db/id])
      (:db/id (editor-block))))

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
