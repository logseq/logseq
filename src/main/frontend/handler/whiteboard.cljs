(ns frontend.handler.whiteboard
  "Whiteboard related handlers"
  (:require [datascript.core :as d]
            [dommy.core :as dom]
            [frontend.db :as db]
            [frontend.db.model :as model]
            [frontend.db.utils :as db-utils]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.route :as route-handler]
            [frontend.modules.editor.undo-redo :as history]
            [frontend.modules.outliner.core :as outliner]
            [frontend.modules.outliner.file :as outliner-file]
            [frontend.state :as state]
            [frontend.config :as config]
            [frontend.storage :as storage]
            [frontend.util :as util]
            [logseq.graph-parser.util :as gp-util]
            [logseq.graph-parser.whiteboard :as gp-whiteboard]
            [promesa.core :as p]
            [goog.object :as gobj]
            [clojure.set :as set]
            [clojure.string :as string]
            [cljs-bean.core :as bean]))

(defn js->clj-keywordize
  [obj]
  (js->clj obj :keywordize-keys true))

(defn shape->block [shape page-name]
  (let [properties {:ls-type :whiteboard-shape
                    :logseq.tldraw.shape shape}
        block {:block/page {:block/name (util/page-name-sanity-lc page-name)}
               :block/parent {:block/name page-name}
               :block/properties properties}
        additional-props (gp-whiteboard/with-whiteboard-block-props block page-name)]
    (merge block additional-props)))

(defn- get-whiteboard-clj [page-name]
  (when (model/page-exists? page-name)
    (let [page-block (model/get-page page-name)
          ;; fixme: can we use cache?
          blocks (model/get-page-blocks-no-cache page-name)]
      [page-block blocks])))

(defn- build-shapes
  [page-block blocks]
  (let [shapes-index (get-in page-block [:block/properties :logseq.tldraw.page :shapes-index])
        shape-id->index (zipmap shapes-index (range 0 (count shapes-index)))]
    (->> blocks
         (map (fn [block]
                (assoc block :index (get shape-id->index (str (:block/uuid block)) 0))))
         (filter gp-whiteboard/shape-block?)
         (map gp-whiteboard/block->shape)
         (sort-by :index))))

(defn- whiteboard-clj->tldr [page-block blocks]
  (let [id (str (:block/uuid page-block))
        shapes (build-shapes page-block blocks)
        tldr-page (gp-whiteboard/page-block->tldr-page page-block)
        assets (:assets tldr-page)
        tldr-page (dissoc tldr-page :assets)]
    (clj->js {:currentPageId id
              :assets (or assets #js[])
              :selectedIds #js[]
              :pages [(merge tldr-page
                             {:id id
                              :name (:block/name page-block)
                              :shapes shapes})]})))

(defn build-page-block
  [page-name tldraw-page assets shapes-index]
  (let [page-entity (model/get-page page-name)
        get-k #(gobj/get tldraw-page %)]
    {:block/name page-name
     :block/type "whiteboard"
     :block/properties {:ls-type :whiteboard-page
                        :logseq.tldraw.page {:id (get-k "id")
                                             :name (get-k "name")
                                             :bindings (js->clj-keywordize (get-k "bindings"))
                                             :nonce (get-k "nonce")
                                             :assets (js->clj-keywordize assets)
                                             :shapes-index shapes-index}}
     :block/updated-at (util/time-ms)
     :block/created-at (or (:block/created-at page-entity)
                           (util/time-ms))}))

(defn- compute-tx
  [^js app ^js tl-page new-id-nonces db-id-nonces page-name replace?]
  (let [assets (js->clj-keywordize (.getCleanUpAssets app))
        new-shapes (.-shapes tl-page)
        shapes-index (map #(gobj/get % "id") new-shapes)
        shape-id->index (zipmap shapes-index (range (.-length new-shapes)))
        upsert-shapes (->> (set/difference new-id-nonces db-id-nonces)
                           (map (fn [{:keys [id]}]
                                  (-> (.-serialized ^js (.getShapeById tl-page id))
                                      js->clj-keywordize
                                      (assoc :index (get shape-id->index id)))))
                           (set))
        old-ids (set (map :id db-id-nonces))
        new-ids (set (map :id new-id-nonces))
        created-ids (->> (set/difference new-ids old-ids)
                         (remove string/blank?)
                         (set))
        created-shapes (set (filter #(created-ids (:id %)) upsert-shapes))
        deleted-ids (->> (set/difference old-ids new-ids)
                         (remove string/blank?))
        repo (state/get-current-repo)
        deleted-shapes (when (seq deleted-ids)
                         (->> (db/pull-many repo '[*] (mapv (fn [id] [:block/uuid (uuid id)]) deleted-ids))
                              (map (fn [b]
                                     (get-in b [:block/properties :logseq.tldraw.shape])))))
        deleted-shapes-tx (mapv (fn [id] [:db/retractEntity [:block/uuid (uuid id)]]) deleted-ids)
        with-timestamps (fn [block]
                          (if (contains? created-ids (str (:block/uuid block)))
                            (assoc block :block/updated-at (util/time-ms))
                            (outliner/block-with-timestamps block)))
        changed-shapes (set/difference upsert-shapes created-shapes)
        prev-changed-blocks (when (seq changed-shapes)
                              (db/pull-many repo '[*] (mapv (fn [shape]
                                                              [:block/uuid (uuid (:id shape))]) changed-shapes)))]
    {:page-block (build-page-block page-name tl-page assets shapes-index)
     :upserted-blocks (->> upsert-shapes
                           (map #(shape->block % page-name))
                           (map with-timestamps))
     :delete-blocks deleted-shapes-tx
     :metadata {:whiteboard/transact? (not replace?)
                :replace? replace?
                :data {:page-name page-name
                       :deleted-shapes deleted-shapes
                       :new-shapes created-shapes
                       :changed-shapes changed-shapes
                       :prev-changed-blocks prev-changed-blocks}}}))

(defonce *last-shapes-nonce (atom {}))
(defn transact-tldr-delta! [page-name ^js app replace?]
  (let [tl-page ^js (second (first (.-pages app)))
        shapes (.-shapes ^js tl-page)
        page-block (model/get-page page-name)
        prev-shapes-index (get-in page-block [:block/properties :logseq.tldraw.page :shapes-index])
        shape-id->prev-index (zipmap prev-shapes-index (range (count prev-shapes-index)))
        new-id-nonces (set (map-indexed (fn [idx shape]
                                  (let [id (.-id shape)]
                                    {:id id
                                     :nonce (if (= idx (get shape-id->prev-index id))
                                              (.-nonce shape)
                                              (js/Date.now))})) shapes))
        repo (state/get-current-repo)
        db-id-nonces (or
                      (get-in @*last-shapes-nonce [repo page-name])
                      (set (->> (model/get-whiteboard-id-nonces repo page-name)
                                (map #(update % :id str)))))
        {:keys [page-block upserted-blocks delete-blocks metadata]}
        (compute-tx app tl-page new-id-nonces db-id-nonces page-name replace?)
        tx-data (concat delete-blocks [page-block] upserted-blocks)
        new-shapes (get-in metadata [:data :new-shapes])
        deleted-shapes (get-in metadata [:data :deleted-shapes])
        metadata' (cond
                    ;; group
                    (some #(= "group" (:type %)) new-shapes)
                    (assoc metadata :whiteboard/op :group)

                    ;; ungroup
                    (and (not-empty deleted-shapes) (every? #(= "group" (:type %)) deleted-shapes))
                    (assoc metadata :whiteboard/op :un-group)

                    ;; arrow
                    (some #(and (= "line" (:type %))
                                (= "arrow " (:end (:decorations %)))) new-shapes)

                    (assoc metadata :whiteboard/op :new-arrow)
                    :else
                    metadata)
        metadata' (if (seq (concat upserted-blocks delete-blocks))
                    metadata'
                    (assoc metadata :undo? true))]
    (swap! *last-shapes-nonce assoc-in [repo page-name] new-id-nonces)
    (if (contains? #{:new-arrow} (:whiteboard/op metadata'))
      (state/set-state! :whiteboard/pending-tx-data
                        {:tx-data tx-data
                         :metadata metadata'})
      (let [pending-tx-data (:whiteboard/pending-tx-data @state/state)
            tx-data' (concat (:tx-data pending-tx-data) tx-data)
            metadata'' (merge metadata' (:metadata pending-tx-data))]
        (state/set-state! :whiteboard/pending-tx-data {})
        (db-utils/transact! repo tx-data' metadata'')))))

(defn get-default-new-whiteboard-tx
  [page-name id]
  [#:block{:name (util/page-name-sanity-lc page-name),
           :type "whiteboard",
           :properties
           {:ls-type :whiteboard-page,
            :logseq.tldraw.page
            {:id id,
             :name page-name,
             :ls-type :whiteboard-page,
             :bindings {},
             :nonce 1,
             :assets []}},
           :updated-at (util/time-ms),
           :created-at (util/time-ms)}])

(defn get-whiteboard-entity [page-name]
  (db-utils/entity [:block/name (util/page-name-sanity-lc page-name)]))

(defn create-new-whiteboard-page!
  ([]
   (create-new-whiteboard-page! nil))
  ([name]
   (let [uuid (or (and name (parse-uuid name)) (d/squuid))
         name (or name (str uuid))]
     (db/transact! (get-default-new-whiteboard-tx name (str uuid)))
     (let [entity (get-whiteboard-entity name)
           tx (assoc (select-keys entity [:db/id])
                     :block/uuid uuid)]
       (db-utils/transact! [tx])
       (let [page-entity (get-whiteboard-entity name)]
         (when (and page-entity (nil? (:block/file page-entity)))
           (outliner-file/sync-to-file page-entity)))))))

(defn create-new-whiteboard-and-redirect!
  ([]
   (create-new-whiteboard-and-redirect! (str (d/squuid))))
  ([name]
   (when-not config/publishing?
     (create-new-whiteboard-page! name)
     (route-handler/redirect-to-whiteboard! name {:new-whiteboard? true}))))

(defn ->logseq-portal-shape
  [block-id point]
  {:blockType (if (parse-uuid (str block-id)) "B" "P")
   :id (str (d/squuid))
   :compact false
   :pageId (str block-id)
   :point point
   :size [400, 0]
   :type "logseq-portal"})

(defn add-new-block-portal-shape!
  "Given the block uuid, add a new shape to the referenced block.
   By default it will be placed next to the given shape id"
  [block-uuid source-shape & {:keys [link? bottom?]}]
  (when-let [app (state/active-tldraw-app)]
    (let [^js api (.-api app)
          point (-> (.getShapeById app source-shape)
                    (.-bounds)
                    ((fn [bounds] (if bottom?
                                    [(.-minX bounds) (+ 64 (.-maxY bounds))]
                                    [(+ 64 (.-maxX bounds)) (.-minY bounds)]))))
          shape (->logseq-portal-shape block-uuid point)]
      (when (uuid? block-uuid) (editor-handler/set-blocks-id! [block-uuid]))
      (.createShapes api (clj->js shape))
      (when link?
        (.createNewLineBinding api source-shape (:id shape))))))

(defn page-name->tldr!
  ([page-name]
   (clj->js
    (if page-name
      (if-let [[page-block blocks] (get-whiteboard-clj page-name)]
        (whiteboard-clj->tldr page-block blocks)
        (create-new-whiteboard-page! page-name))
      (create-new-whiteboard-page! nil)))))

(defn- get-whiteboard-blocks
  "Given a page, return all the logseq blocks (exclude all shapes)"
  [page-name]
  (let [blocks (model/get-page-blocks-no-cache page-name)]
    (remove gp-whiteboard/shape-block? blocks)))

(defn- get-last-root-block
  "Get the last root Logseq block in the page. Main purpose is to calculate the new :block/left id"
  [page-name]
  (let [page-id (:db/id (model/get-page page-name))
        blocks (get-whiteboard-blocks page-name)
        root-blocks (filter (fn [block] (= page-id (:db/id (:block/parent block)))) blocks)
        root-block-left-ids (->> root-blocks
                                 (map (fn [block] (get-in block [:block/left :db/id] nil)))
                                 (remove nil?)
                                 (set))
        blocks-with-no-next (remove #(root-block-left-ids (:db/id %)) root-blocks)]
    (when (seq blocks-with-no-next) (first blocks-with-no-next))))

(defn add-new-block!
  [page-name content]
  (let [uuid (d/squuid)
        page-entity (model/get-page page-name)
        last-root-block (or (get-last-root-block page-name) page-entity)
        tx {:block/left (select-keys last-root-block [:db/id])
            :block/uuid uuid
            :block/content (or content "")
            :block/format :markdown ;; fixme to support org?
            :block/page {:block/name (util/page-name-sanity-lc page-name)
                         :block/original-name page-name}
            :block/parent {:block/name page-name}}]
    (db-utils/transact! [tx])
    uuid))

(defn inside-portal?
  [target]
  (some? (dom/closest target ".tl-logseq-cp-container")))

(defn closest-shape
  [target]
  (when-let [shape-el (dom/closest target "[data-shape-id]")]
    (.getAttribute shape-el "data-shape-id")))

(defn get-onboard-whiteboard-edn
  []
  (p/let [^js res (js/fetch "./whiteboard/onboarding.edn") ;; do we need to cache it?
          text (.text res)
          edn (gp-util/safe-read-string text)]
    edn))

(defn clone-whiteboard-from-edn
  "Given a tldr, clone the whiteboard page into current active whiteboard"
  ([edn]
   (when-let [app (state/active-tldraw-app)]
     (clone-whiteboard-from-edn edn (.-api app))))
  ([{:keys [pages blocks]} api]
   (let [page-block (first pages)
         ;; FIXME: should also clone normal blocks
         shapes (build-shapes page-block blocks)
         tldr-page (gp-whiteboard/page-block->tldr-page page-block)
         assets (:assets tldr-page)
         bindings (:bindings tldr-page)]
     (.cloneShapesIntoCurrentPage ^js api (clj->js {:shapes shapes
                                                    :assets assets
                                                    :bindings bindings})))))
(defn should-populate-onboarding-whiteboard?
  "When there is no whiteboard, or there is only one whiteboard that has the given page name, we should populate the onboarding shapes"
  [page-name]
  (let [whiteboards (model/get-all-whiteboards (state/get-current-repo))]
    (and (or (empty? whiteboards)
             (and
              (= 1 (count whiteboards))
              (= page-name (:block/name (first whiteboards)))))
         (not (state/get-onboarding-whiteboard?)))))

(defn populate-onboarding-whiteboard
  [api]
  (when (some? api)
    (-> (p/let [edn (get-onboard-whiteboard-edn)]
          (clone-whiteboard-from-edn edn api)
          (state/set-onboarding-whiteboard! true))
        (p/catch
         (fn [e] (js/console.warn "Failed to populate onboarding whiteboard" e))))))

(defn- delete-shapes!
  [^js api shapes]
  (apply (.-deleteShapes api) (map :id shapes)))

(defn- create-shapes!
  [^js api shapes]
  (apply (.-createShapes api) (bean/->js shapes)))

(defn- update-shapes!
  [^js api shapes]
  (apply (.-updateShapes api) (bean/->js shapes)))

(defn- select-shapes
  [^js api ids]
  (apply (.-selectShapes api) ids))

(defn cleanup!
  [^js tl-page]
  (let [shapes (.-shapes tl-page)]
    (.cleanup tl-page (map #(.-id %) shapes))))

(defn update-bindings!
  [^js tl-page page-name]
  (when-let [page (db/entity [:block/name page-name])]
    (let [bindings (get-in page [:block/properties :logseq.tldraw.page :bindings])]
      (when (seq bindings)
        (.updateBindings tl-page (bean/->js bindings))))))

(defn update-shapes-index!
  [^js tl-page page-name]
  (when-let [page (db/entity [:block/name page-name])]
    (let [shapes-index (get-in page [:block/properties :logseq.tldraw.page :shapes-index])]
      (when (seq shapes-index)
        (.updateShapesIndex tl-page (bean/->js shapes-index))))))

(defn undo!
  [{:keys [tx-meta]}]
  (history/pause-listener!)
  (try
    (when-let [app (state/active-tldraw-app)]
      (let [{:keys [page-name deleted-shapes new-shapes changed-shapes prev-changed-blocks]} (:data tx-meta)
            whiteboard-op (:whiteboard/op tx-meta)
            ^js api (.-api app)
            tl-page ^js (second (first (.-pages app)))]
        (when api
          (update-bindings! tl-page page-name)
          (update-shapes-index! tl-page page-name)
          (case whiteboard-op
            :group
            (do
              (select-shapes api (map :id new-shapes))
              (.unGroup api))
            :un-group
            (do
              (select-shapes api (mapcat :children deleted-shapes))
              (.doGroup api))
            (do
              (when (seq deleted-shapes)
                (create-shapes! api deleted-shapes))
              (when (seq new-shapes)
                (delete-shapes! api new-shapes))
              (when (seq changed-shapes)
                (let [prev-shapes (map (fn [b] (get-in b [:block/properties :logseq.tldraw.shape]))
                                       prev-changed-blocks)]
                  (update-shapes! api prev-shapes))))))))
    (catch :default e
      (js/console.error e)))
  (history/resume-listener!))

(defn redo!
  [{:keys [tx-meta]}]
  (history/pause-listener!)
  (try
    (when-let [app (state/active-tldraw-app)]
      (let [{:keys [page-name deleted-shapes new-shapes changed-shapes]} (:data tx-meta)
            whiteboard-op (:whiteboard/op tx-meta)
            ^js api (.-api app)
            tl-page ^js (second (first (.-pages app)))]
        (when api
          (update-bindings! tl-page page-name)
          (update-shapes-index! tl-page page-name)
          (case whiteboard-op
            :group
            (do
              (select-shapes api (mapcat :children new-shapes))
              (.doGroup api))
            :un-group
            (do
              (select-shapes api (map :id deleted-shapes))
              (.unGroup api))
            (do
              (when (seq deleted-shapes)
                (delete-shapes! api deleted-shapes))
              (when (seq new-shapes)
                (create-shapes! api new-shapes))
              (when (seq changed-shapes)
                (update-shapes! api changed-shapes)))))))
    (catch :default e
      (js/console.error e)))
  (history/resume-listener!))

(defn onboarding-show
  []
  (when (not (or (state/sub :whiteboard/onboarding-tour?)
                 (config/demo-graph?)
                 (util/mobile?)))
    (state/pub-event! [:whiteboard/onboarding])
    (state/set-state! [:whiteboard/onboarding-tour?] true)
    (storage/set :whiteboard-onboarding-tour? true)))
