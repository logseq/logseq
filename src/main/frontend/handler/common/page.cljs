(ns frontend.handler.common.page
  "Common fns for file and db based page handlers, including create!, delete!
  and favorite fns. This ns should be agnostic of file or db concerns but there
  is still some file-specific tech debt to remove from create!"
  (:require [frontend.state :as state]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.db.model :as model]
            [frontend.db.utils :as db-utils]
            [frontend.format.block :as block]
            [frontend.fs :as fs]
            [frontend.handler.common :as common-handler]
            [frontend.handler.config :as config-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.file-based.editor :as file-editor-handler]
            [frontend.handler.file-based.page-property :as file-page-property]
            [frontend.handler.route :as route-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.util.fs :as fs-util]
            [frontend.util :as util]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.graph-parser.block :as gp-block]
            [logseq.graph-parser.util :as gp-util]
            [logseq.graph-parser.text :as text]
            [lambdaisland.glogi :as log]
            [medley.core :as medley]
            [promesa.core :as p]
            [clojure.string :as string]))

;; create! and its helpers
;; =======================
(defn- build-title [page]
  ;; Don't wrap `\"` anymore, as title property is not effected by `,` now
  ;; The previous extract behavior isn't unwrapping the `'"` either. So no need
  ;; to maintain the compatibility.
  (:block/original-name page))

(defn- default-properties-block
  ([title format page]
   (default-properties-block title format page {}))
  ([title format page properties]
   (let [repo (state/get-current-repo)
         db-based? (config/db-based-graph? repo)]
     (when-not db-based?
       (let [p (common-handler/get-page-default-properties title)
             ps (merge p properties)
             content (if db-based?
                       ""
                       (file-page-property/insert-properties format "" ps))
             refs (gp-block/get-page-refs-from-properties properties
                                                          (db/get-db repo)
                                                          (state/get-date-formatter)
                                                          (state/get-config))]
         {:block/uuid (db/new-block-id)
          :block/refs refs
          :block/left page
          :block/format format
          :block/content content
          :block/parent page
          :block/page page
          :block/pre-block? true
          :block/properties ps
          :block/properties-order (keys ps)})))))

(defn- create-title-property?
  [repo journal? page-name]
  (and (not (config/db-based-graph? repo))
       (not journal?)
       (= (state/get-filename-format) :legacy) ;; reduce title computation
       (fs-util/create-title-property? page-name)))

(defn- build-page-tx [repo format properties page journal? {:keys [whiteboard? class? tags]}]
  (when (:block/uuid page)
    (let [page-entity   [:block/uuid (:block/uuid page)]
          title         (util/get-page-original-name page)
          create-title? (create-title-property? repo journal? title)
          page          (merge page
                               (when (seq properties) {:block/properties properties})
                               (when whiteboard? {:block/type "whiteboard"})
                               (when class? {:block/type "class"})
                               (when tags {:block/tags (mapv #(hash-map :db/id
                                                                        (:db/id (db/entity repo [:block/uuid %])))
                                                             tags)}))
          page-empty?   (db/page-empty? (state/get-current-repo) (:block/name page))
          db-based? (config/db-based-graph? (state/get-current-repo))]
      (cond
        (not page-empty?)
        [page]

        (and create-title?
             (not whiteboard?)
             (not db-based?))
        (let [properties-block (default-properties-block (build-title page) format page-entity properties)]
          [page
           properties-block])

        (and (seq properties)
             (not whiteboard?)
             (not db-based?))
        [page (file-editor-handler/properties-block repo properties format page-entity)]

        :else
        [page]))))

;; TODO: Move file graph concerns to file-based-handler ns
(defn create!
  "Create page. Has the following options:

   * :redirect?           - when true, redirect to the created page, otherwise return sanitized page name.
   * :split-namespace?    - when true, split hierarchical namespace into levels.
   * :create-first-block? - when true, create an empty block if the page is empty.
   * :uuid                - when set, use this uuid instead of generating a new one.
   * :class?              - when true, adds a :block/type 'class'
   * :whiteboard?         - when true, adds a :block/type 'whiteboard'
   * :tags                - tag uuids that are added to :block/tags
   * :persist-op?         - when true, add an update-page op
   TODO: Add other options"
  ([title]
   (create! title {}))
  ([title {:keys [redirect? create-first-block? format properties split-namespace? journal? uuid rename? persist-op?]
           :or   {redirect?           true
                  create-first-block? true
                  rename?             false
                  format              nil
                  properties          nil
                  split-namespace?    true
                  uuid                nil
                  persist-op?         true}
           :as options}]
   (let [title      (-> (string/trim title)
                        (text/page-ref-un-brackets!)
                        ;; remove `#` from tags
                        (string/replace #"^#+" ""))
         title      (gp-util/remove-boundary-slashes title)
         page-name  (util/page-name-sanity-lc title)
         repo       (state/get-current-repo)
         with-uuid? (if (uuid? uuid) uuid true)] ;; FIXME: prettier validation
     (when (or (db/page-empty? repo page-name) rename?)
       (let [pages    (if split-namespace?
                        (gp-util/split-namespace-pages title)
                        [title])
             format   (or format (state/get-preferred-format))
             pages    (map (fn [page]
                             ;; only apply uuid to the deepest hierarchy of page to create if provided.
                             (-> (block/page-name->map page (if (= page title) with-uuid? true))
                                 (assoc :block/format format)))
                           pages)
             txs      (->> pages
                           ;; for namespace pages, only last page need properties
                           drop-last
                           (mapcat #(build-page-tx repo format nil % journal? {}))
                           (remove nil?))
             txs      (map-indexed (fn [i page]
                                     (if (zero? i)
                                       page
                                       (assoc page :block/namespace
                                              [:block/uuid (:block/uuid (nth txs (dec i)))])))
                                   txs)
             last-txs (build-page-tx repo format properties (last pages) journal? (select-keys options [:whiteboard? :class? :tags]))
             last-txs (if (seq txs)
                        (update last-txs 0
                                (fn [p]
                                  (assoc p :block/namespace [:block/uuid (:block/uuid (last txs))])))
                        last-txs)
             txs      (concat
                       (when (and rename? uuid)
                         (when-let [e (db/entity [:block/uuid uuid])]
                           [[:db/retract (:db/id e) :block/namespace]
                            [:db/retract (:db/id e) :block/refs]]))
                       txs
                       last-txs)]
         (when (seq txs)
           (db/transact! repo txs {:persist-op? persist-op?})))

       (when create-first-block?
         (when (or
                (db/page-empty? repo (:db/id (db/entity [:block/name page-name])))
                (create-title-property? repo journal? page-name))
           (editor-handler/api-insert-new-block! "" {:page page-name}))))

     (when redirect?
       (route-handler/redirect-to-page! page-name))
     page-name)))

;; favorite fns
;; ============
(defn favorited?
  [page-name]
  (let [favorites (->> (:favorites (state/get-config))
                       (filter string?)
                       (map string/lower-case)
                       (set))]
    (contains? favorites page-name)))

(defn favorite-page!
  [page-name]
  (when-not (string/blank? page-name)
    (let [favorites (->
                     (cons
                      page-name
                      (or (:favorites (state/get-config)) []))
                     (distinct)
                     (vec))]
      (config-handler/set-config! :favorites favorites))))

(defn unfavorite-page!
  [page-name]
  (when-not (string/blank? page-name)
    (let [old-favorites (:favorites (state/get-config))
          new-favorites (->> old-favorites
                             (remove #(= (string/lower-case %) (string/lower-case page-name)))
                             (vec))]
      (when-not (= old-favorites new-favorites)
        (config-handler/set-config! :favorites new-favorites)))))

;; delete! and its helpers
;; =======================
(defn delete-file!
  [repo page-name unlink-file?]
  (let [file (db/get-page-file page-name)
        file-path (:file/path file)]
    ;; delete file
    (when-not (string/blank? file-path)
      (db/transact! [[:db.fn/retractEntity [:file/path file-path]]])
      (when unlink-file?
        (-> (fs/unlink! repo (config/get-repo-fpath repo file-path) nil)
            (p/catch (fn [error] (js/console.error error))))))))

(defn db-refs->page
  "Replace [[page name]] with page name"
  [repo page-entity]
  (when (config/db-based-graph? repo)
    (let [refs (:block/_refs page-entity)
          id-ref->page #(db-utils/special-id-ref->page % [page-entity])]
      (when (seq refs)
        (let [tx-data (mapcat (fn [{:block/keys [raw-content properties] :as ref}]
                                ;; block content or properties
                                (let [content' (id-ref->page raw-content)
                                      content-tx (when (not= raw-content content')
                                                   {:db/id (:db/id ref)
                                                    :block/content content'})
                                      page-uuid (:block/uuid page-entity)
                                      properties' (-> (medley/map-vals (fn [v]
                                                                         (cond
                                                                           (and (coll? v) (uuid? (first v)))
                                                                           (vec (remove #{page-uuid} v))

                                                                           (and (uuid? v) (= v page-uuid))
                                                                           nil

                                                                           (and (coll? v) (string? (first v)))
                                                                           (mapv id-ref->page v)

                                                                           (string? v)
                                                                           (id-ref->page v)

                                                                           :else
                                                                           v)) properties)
                                                      (util/remove-nils-non-nested))
                                      tx (merge
                                          content-tx
                                          (when (not= (seq properties) (seq properties'))
                                            {:db/id (:db/id ref)
                                             :block/properties properties'}))]
                                  (concat
                                   [[:db/retract (:db/id ref) :block/refs (:db/id page-entity)]]
                                   (when tx [tx])))) refs)]
          tx-data)))))

(defn- page-unable-to-delete
  "If a page is unable to delete, returns a map with more information. Otherwise returns nil"
  [repo page]
  (try
    (cond
      (and (contains? (:block/type page) "class")
           (seq (model/get-tag-blocks repo (:block/name page))))
      {:msg "Page content deleted but unable to delete this page because blocks are tagged with this page"}

      (contains? (:block/type page) "property")
      (cond (seq (model/get-classes-with-property (:block/uuid page)))
            {:msg "Page content deleted but unable to delete this page because classes use this property"}
            (->> (model/get-block-property-values (:block/uuid page))
                 (filter (fn [[_ v]] (if (seq? v) (seq v) (some? v))))
                 seq)
            {:msg "Page content deleted but unable to delete this page because blocks use this property"})

      (or (seq (:block/_refs page)) (contains? (:block/type page) "hidden"))
      {:msg "Page content deleted but unable to delete this page because there're still references to it"})

    (catch :default e
      (log/error :exception e)
      (state/pub-event! [:capture-error {:error e}])
      {:msg (str "An unexpected failure while deleting: " e)})))

(defn delete!
  "Deletes a page and then either calls the ok-handler or the error-handler if unable to delete"
  [page-name ok-handler & {:keys [delete-file? redirect-to-home? persist-op? error-handler]
                           :or {delete-file? true
                                redirect-to-home? true
                                persist-op? true
                                error-handler (fn [{:keys [msg]}] (log/error :msg msg))}}]
  (when page-name
    (when-let [repo (state/get-current-repo)]
      (let [page-name (util/page-name-sanity-lc page-name)
            page (db/entity [:block/name page-name])
            blocks (:block/_page page)
            truncate-blocks-tx-data (mapv
                                     (fn [block]
                                       [:db.fn/retractEntity [:block/uuid (:block/uuid block)]])
                                     blocks)
            db-based? (config/db-based-graph? repo)]
        (if-let [msg (and db-based? (page-unable-to-delete repo page))]
          (do
            (db/transact! repo truncate-blocks-tx-data
                          {:outliner-op :delete-page :persist-op? persist-op?})
            (error-handler msg))
          (let [_ (when-not db-based? (delete-file! repo page-name delete-file?))
                ;; if other page alias this pagename,
                ;; then just remove some attrs of this entity instead of retractEntity
                delete-page-tx (cond
                                 (not (:block/_namespace page))
                                 (if (model/get-alias-source-page (state/get-current-repo) page-name)
                                   (when-let [id (:db/id (db/entity [:block/name page-name]))]
                                     (mapv (fn [attribute]
                                             [:db/retract id attribute])
                                           db-schema/retract-page-attributes))
                                   (concat (db-refs->page repo page)
                                           [[:db.fn/retractEntity [:block/name page-name]]]))

                                 :else
                                 nil)
                tx-data (concat truncate-blocks-tx-data delete-page-tx)]
            (db/transact! repo tx-data {:outliner-op :delete-page :persist-op? persist-op?})

            (unfavorite-page! page-name)

            (when redirect-to-home? (route-handler/redirect-to-home!))

            (when (fn? ok-handler) (ok-handler))
            (ui-handler/re-render-root!)))))))


;; other fns
;; =========
(defn rename-update-namespace!
  "update :block/namespace of the renamed block"
  [page old-original-name new-name]
  (let [old-namespace? (text/namespace-page? old-original-name)
        new-namespace? (text/namespace-page? new-name)
        repo           (state/get-current-repo)]
    (cond
      new-namespace?
      ;; update namespace
      (let [namespace (first (gp-util/split-last "/" new-name))]
        (when namespace
          (create! namespace {:redirect? false}) ;; create parent page if not exist, creation of namespace ref is handled in `create!`
          (let [namespace-block (db/pull [:block/name (gp-util/page-name-sanity-lc namespace)])
                page-txs [{:db/id (:db/id page)
                           :block/namespace (:db/id namespace-block)}]]
            (db/transact! repo page-txs))))

      old-namespace?
      ;; retract namespace
      (db/transact! [[:db/retract (:db/id page) :block/namespace]])

      :else
      nil)))
