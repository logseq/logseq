(ns frontend.handler.db-based.page
  "Page handlers for DB graphs"
  (:require [frontend.state :as state]
            [frontend.db :as db]
            [frontend.db.model :as model]
            [frontend.db.conn :as conn]
            [frontend.db.utils :as db-utils]
            [frontend.util :as util]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.route :as route-handler]
            [frontend.modules.outliner.core :as outliner-core]
            [frontend.modules.outliner.tree :as outliner-tree]
            [frontend.handler.common.page :as page-common-handler]
            [datascript.core :as d]
            [medley.core :as medley]
            [clojure.string :as string]))

(defn- replace-ref
  "Replace from-page refs with to-page"
  [from-page to-page]
  (let [refs (:block/_refs from-page)
        from-uuid (:block/uuid from-page)
        to-uuid (:block/uuid to-page)
        replace-ref (fn [content] (string/replace content (str from-uuid) (str to-uuid)))]
    (when (seq refs)
      (let [tx-data (mapcat
                     (fn [{:block/keys [raw-content properties] :as ref}]
                         ;; block content or properties
                       (let [content' (replace-ref raw-content)
                             content-tx (when (not= raw-content content')
                                          {:db/id (:db/id ref)
                                           :block/content content'})
                             properties' (-> (medley/map-vals (fn [v]
                                                                (cond
                                                                  (and (coll? v) (uuid? (first v)))
                                                                  (mapv (fn [id] (if (= id from-uuid) to-uuid id)) v)

                                                                  (and (uuid? v) (= v from-uuid))
                                                                  to-uuid

                                                                  (and (coll? v) (string? (first v)))
                                                                  (mapv replace-ref v)

                                                                  (string? v)
                                                                  (replace-ref v)

                                                                  :else
                                                                  v)) properties)
                                             (util/remove-nils-non-nested))
                             tx (merge
                                 content-tx
                                 (when (not= (seq properties) (seq properties'))
                                   {:db/id (:db/id ref)
                                    :block/properties properties'}))]
                         (concat
                          [[:db/add (:db/id ref) :block/refs (:db/id to-page)]
                           [:db/retract (:db/id ref) :block/refs (:db/id from-page)]]
                          (when tx [tx]))))
                     refs)]
        tx-data))))

(defn- based-merge-pages!
  [from-page-name to-page-name persist-op? redirect?]
  (when (and (db/page-exists? from-page-name)
             (db/page-exists? to-page-name)
             (not= from-page-name to-page-name))
    (let [to-page (db/entity [:block/name to-page-name])
          to-id (:db/id to-page)
          from-page (db/entity [:block/name from-page-name])
          from-id (:db/id from-page)
          from-first-child (some->> (db/pull from-id)
                                    (outliner-core/block)
                                    (outliner-tree/-get-down)
                                    (outliner-core/get-data))
          to-last-direct-child-id (model/get-block-last-direct-child (db/get-db) to-id)
          repo (state/get-current-repo)
          conn (conn/get-db repo false)
          datoms (d/datoms @conn :avet :block/page from-id)
          block-eids (mapv :e datoms)
          blocks (db-utils/pull-many repo '[:db/id :block/page :block/refs :block/path-refs :block/left :block/parent] block-eids)
          blocks-tx-data (map (fn [block]
                                (let [id (:db/id block)]
                                  (cond->
                                   {:db/id id
                                    :block/page {:db/id to-id}}

                                    (and from-first-child (= id (:db/id from-first-child)))
                                    (assoc :block/left {:db/id (or to-last-direct-child-id to-id)})

                                    (= (:block/parent block) {:db/id from-id})
                                    (assoc :block/parent {:db/id to-id})))) blocks)
          replace-ref-tx-data (replace-ref from-page to-page)
          tx-data (concat blocks-tx-data replace-ref-tx-data)]
      (db/transact! repo tx-data {:persist-op? persist-op?})
      (page-common-handler/rename-update-namespace! from-page
                                                    (util/get-page-original-name from-page)
                                                    (util/get-page-original-name to-page)))

    (page-common-handler/delete! from-page-name nil :redirect-to-home? false :persist-op? persist-op?)

    (when redirect?
      (route-handler/redirect! {:to          :page
                                :push        false
                                :path-params {:name to-page-name}}))))

(defn rename!
  ([old-name new-name]
   (rename! old-name new-name true true))
  ([old-name new-name redirect? persist-op?]
   (let [repo (state/get-current-repo)
         old-name      (string/trim old-name)
         new-name      (string/trim new-name)
         old-page-name (util/page-name-sanity-lc old-name)
         page-e (db/entity [:block/name old-page-name])
         new-page-name (util/page-name-sanity-lc new-name)
         new-page-e (db/entity [:block/name new-page-name])
         name-changed? (not= old-name new-name)]
     (cond
       (string/blank? new-name)
       (do
         (notification/show! "Please use a valid name, empty name is not allowed!" :error)
         :invalid-empty-name)

       (and page-e new-page-e
            (or (contains? (:block/type page-e) "whiteboard")
                (contains? (:block/type new-page-e) "whiteboard")))
       (do
         (notification/show! "Can't merge whiteboard pages" :error)
         :merge-whiteboard-pages)

       (and old-name new-name name-changed?)
       (do
         (cond
          (= old-page-name new-page-name) ; case changed
          (db/transact! repo
                        [{:db/id (:db/id page-e)
                          :block/original-name new-name}]
                        {:persist-op? persist-op?})

          (and (not= old-page-name new-page-name)
               (db/entity [:block/name new-page-name])) ; merge page
          (based-merge-pages! old-page-name new-page-name persist-op? redirect?)

          :else                          ; rename
          (page-common-handler/create! new-name
                                       {:rename? true
                                        :uuid (:block/uuid page-e)
                                        :redirect? redirect?
                                        :create-first-block? false
                                        :persist-op? persist-op?}))
         (ui-handler/re-render-root!))))))
