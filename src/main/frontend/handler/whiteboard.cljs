(ns frontend.handler.whiteboard
  "Whiteboard related handlers"
  (:require [datascript.core :as d]
            [dommy.core :as dom]
            [frontend.db :as db]
            [frontend.db.model :as model]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.property.util :as pu]
            [frontend.state :as state]
            [frontend.config :as config]
            [frontend.storage :as storage]
            [frontend.util :as util]
            [logseq.common.util :as common-util]
            [logseq.graph-parser.whiteboard :as gp-whiteboard]
            [promesa.core :as p]
            [goog.object :as gobj]
            [clojure.set :as set]
            [clojure.string :as string]
            [cljs-bean.core :as bean]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.db.frontend.order :as db-order]
            [logseq.outliner.core :as outliner-core]))

(defn js->clj-keywordize
  [obj]
  (js->clj obj :keywordize-keys true))

(defn- shape->block [shape page-id]
  (let [repo (state/get-current-repo)]
    (gp-whiteboard/shape->block repo shape page-id)))

(defn- build-shapes
  [blocks]
  (let [blocks (db/sort-by-order blocks)]
    (->> blocks
         (db/sort-by-order blocks)
         (filter pu/shape-block?)
         (map pu/block->shape)
         (map (fn [shape]
                (if-let [page-id (:pageId shape)]
                  (let [page (db/get-page page-id)]
                    ;; Used in page preview
                    (assoc shape :pageName (:block/title page)))
                  shape))))))

(defn- whiteboard-clj->tldr [page-block blocks]
  (let [id (str (:block/uuid page-block))
        shapes (remove #(nil? (:type %)) (build-shapes blocks))
        tldr-page (pu/page-block->tldr-page page-block)
        assets (:assets tldr-page)
        tldr-page (dissoc tldr-page :assets)]
    (clj->js {:currentPageId id
              :assets (or assets #js[])
              :selectedIds #js[]
              :pages [(merge tldr-page
                             {:id id
                              :name (:block/name page-block)
                              :shapes shapes})]})))

(defn db-build-page-block
  [page-entity page-name tldraw-page assets]
  (let [get-k #(gobj/get tldraw-page %)
        tldraw-page {:id (get-k "id")
                     :name (get-k "name")
                     :bindings (js->clj-keywordize (get-k "bindings"))
                     :nonce (get-k "nonce")
                     :assets (js->clj-keywordize assets)}]
    {:db/id (:db/id page-entity)
     :block/title page-name
     :block/name (util/page-name-sanity-lc page-name)
     :block/type "whiteboard"
     :block/format :markdown
     :logseq.property/ls-type :whiteboard-page
     :logseq.property.tldraw/page tldraw-page
     :block/updated-at (util/time-ms)
     :block/created-at (or (:block/created-at page-entity)
                           (util/time-ms))}))

(defn file-build-page-block
  [page-entity page-name tldraw-page assets]
  (let [get-k #(gobj/get tldraw-page %)]
    {:block/title page-name
     :block/name (util/page-name-sanity-lc page-name)
     :block/type "whiteboard"
     :block/properties {(pu/get-pid :logseq.property/ls-type)
                        :whiteboard-page

                        (pu/get-pid :logseq.property.tldraw/page)
                        {:id (get-k "id")
                         :name (get-k "name")
                         :bindings (js->clj-keywordize (get-k "bindings"))
                         :nonce (get-k "nonce")
                         :assets (js->clj-keywordize assets)}}
     :block/updated-at (util/time-ms)
     :block/created-at (or (:block/created-at page-entity)
                           (util/time-ms))}))

(defn build-page-block
  [page-entity page-name tldraw-page assets]
  (let [f (if (config/db-based-graph? (state/get-current-repo))
            db-build-page-block
            file-build-page-block)]
    (f page-entity page-name tldraw-page assets)))

(defn- compute-tx
  [^js app ^js tl-page new-id-nonces db-id-nonces page-uuid replace?]
  (let [page-entity (db/get-page page-uuid)
        assets (js->clj-keywordize (.getCleanUpAssets app))
        upsert-shapes (->> (set/difference new-id-nonces db-id-nonces)
                           (map (fn [{:keys [id]}]
                                  (-> (.-serialized ^js (.getShapeById tl-page id))
                                      js->clj-keywordize)))
                           (set))
        old-ids (set (map :id db-id-nonces))
        new-ids (set (map :id new-id-nonces))
        created-ids (->> (set/difference new-ids old-ids)
                         (remove string/blank?)
                         (set))
        new-orders (when (seq created-ids)
                     (let [max-key (last (sort (map :block/order (:block/_page page-entity))))]
                       (db-order/gen-n-keys (count created-ids) max-key nil)))
        new-id->order (when (seq created-ids) (zipmap created-ids new-orders))
        created-shapes (set (filter #(created-ids (:id %)) upsert-shapes))
        deleted-ids (->> (set/difference old-ids new-ids)
                         (remove string/blank?))
        repo (state/get-current-repo)
        deleted-shapes (when (seq deleted-ids)
                         (->> (db/pull-many repo '[*] (mapv (fn [id] [:block/uuid (uuid id)]) deleted-ids))
                              (mapv (fn [b] (pu/get-block-property-value b :logseq.property.tldraw/shape)))
                              (remove nil?)))
        deleted-shapes-tx (mapv (fn [id] [:db/retractEntity [:block/uuid (uuid id)]]) deleted-ids)
        upserted-blocks (->> upsert-shapes
                             (map #(shape->block % (:db/id page-entity)))
                             (map sqlite-util/block-with-timestamps)
                             (map (fn [block]
                                    (if-let [new-order (when new-id->order (get new-id->order (str (:block/uuid block))))]
                                      (assoc block :block/order new-order)
                                      block))))
        page-name (or (:block/title page-entity) (str page-uuid))
        page-block (build-page-block page-entity page-name tl-page assets)]
    (when (or (seq upserted-blocks)
              (seq deleted-shapes-tx)
              (not= (:block/properties page-block)
                    (:block/properties page-entity)))
      {:page-block page-block
       :upserted-blocks upserted-blocks
       :delete-blocks deleted-shapes-tx
       :deleted-shapes deleted-shapes
       :new-shapes created-shapes
       :metadata {:whiteboard/transact? true
                  :pipeline-replace? replace?}})))

(defonce *last-shapes-nonce (atom {}))

(defn- get-shape-block-id
  [^js shape]
  (uuid (.-id shape)))

(defn- handle-order-update!
  [page info]
  (let [op (:op info)
        moved-shapes (:shapes info)
        shape-ids (mapv get-shape-block-id moved-shapes)]
    (case op
      "sendToBack"
      (let [next-order (when-let [id (get-shape-block-id (:next info))]
                         (:block/order (db/entity [:block/uuid id])))
            new-orders (db-order/gen-n-keys (count shape-ids) nil next-order)
            tx-data (conj
                     (map-indexed (fn [idx id]
                                    {:block/uuid id
                                     :block/order (nth new-orders idx)}) shape-ids)
                     (outliner-core/block-with-updated-at {:db/id (:db/id page)}))]
        tx-data)

      "bringToFront"
      (let [before-order (when-let [id (get-shape-block-id (:before info))]
                           (:block/order (db/entity [:block/uuid id])))
            new-orders (db-order/gen-n-keys (count shape-ids) before-order nil)
            tx-data (conj
                     (->>
                      (map-indexed (fn [idx id]
                                     (when (db/entity [:block/uuid id])
                                       {:block/uuid id
                                        :block/order (nth new-orders idx)})) shape-ids)
                      (remove nil?))
                     (outliner-core/block-with-updated-at {:db/id (:db/id page)}))]
        tx-data))))

;; FIXME: it seems that nonce for the page block will not be updated with new updates for the whiteboard
(defn <transact-tldr-delta!
  [page-uuid ^js app ^js info*]
  (let [info (bean/->clj info*)
        replace? (:replace info)
        tl-page ^js (second (first (.-pages app)))
        page-block (model/get-page page-uuid)
        order-tx-data (when (contains? #{"bringToFront" "sendToBack"} (:op info))
                        (handle-order-update! page-block info))
        shapes (.-shapes ^js tl-page)
        new-id-nonces (set (map-indexed (fn [_idx shape]
                                          (let [id (.-id shape)]
                                            {:id id
                                             :nonce (or (.-nonce shape) (js/Date.now))})) shapes))
        repo (state/get-current-repo)
        db-id-nonces (or
                      (get-in @*last-shapes-nonce [repo page-uuid])
                      (set (->> (model/get-whiteboard-id-nonces repo (:db/id page-block))
                                (map #(update % :id str)))))
        {:keys [page-block new-shapes deleted-shapes upserted-blocks delete-blocks metadata] :as result}
        (compute-tx app tl-page new-id-nonces db-id-nonces page-uuid replace?)]
    (when (or (seq result) (seq order-tx-data))
      (let [tx-data (concat delete-blocks [page-block] upserted-blocks order-tx-data)
            metadata' (cond
                        ;; group
                        (some #(= "group" (:type %)) new-shapes)
                        (assoc metadata :outliner-op :group)

                        ;; ungroup
                        (and (not-empty deleted-shapes) (every? #(= "group" (:type %)) deleted-shapes))
                        (assoc metadata :outliner-op :un-group)

                        ;; arrow
                        (some #(and (= "line" (:type %))
                                    (= "arrow " (:end (:decorations %)))) new-shapes)

                        (assoc metadata :outliner-op :new-arrow)

                        :else
                        (assoc metadata :outliner-op :save-whiteboard))]
        (swap! *last-shapes-nonce assoc-in [repo page-uuid] new-id-nonces)
        (if (contains? #{:new-arrow} (:outliner-op metadata'))
          (state/set-state! :whiteboard/pending-tx-data
                            {:tx-data tx-data
                             :metadata metadata'})
          (let [pending-tx-data (:whiteboard/pending-tx-data @state/state)
                tx-data' (concat (:tx-data pending-tx-data) tx-data)
                metadata'' (merge metadata' (:metadata pending-tx-data))]
            (state/set-state! :whiteboard/pending-tx-data {})
            (db/transact! repo tx-data' metadata'')))))))

(defn get-default-new-whiteboard-tx
  [page-name id]
  (let [db-based? (config/db-based-graph? (state/get-current-repo))
        tldraw-page {:id (str id),
                     :name page-name,
                     :ls-type :whiteboard-page,
                     :bindings {},
                     :nonce 1,
                     :assets []}
        properties {(pu/get-pid :logseq.property/ls-type) :whiteboard-page,
                    (pu/get-pid :logseq.property.tldraw/page) tldraw-page}
        m #:block{:uuid id
                  :name (util/page-name-sanity-lc page-name),
                  :title page-name
                  :type "whiteboard",
                  :format :markdown
                  :updated-at (util/time-ms),
                  :created-at (util/time-ms)}
        m' (if db-based?
             (merge m properties)
             (assoc m :block/properties properties))]
    [m']))

(defn <create-new-whiteboard-page!
  ([]
   (<create-new-whiteboard-page! nil))
  ([name]
   (p/let [uuid (or (and name (parse-uuid name)) (d/squuid))
           name (or name (str uuid))
           _ (db/transact! (state/get-current-repo) (get-default-new-whiteboard-tx name uuid) {:outliner-op :create-page})]
     uuid)))

(defn <create-new-whiteboard-and-redirect!
  ([]
   (<create-new-whiteboard-and-redirect! (str (d/squuid))))
  ([name]
   (when-not (or config/publishing? (config/db-based-graph? (state/get-current-repo)))
     (p/let [id (<create-new-whiteboard-page! name)]
       (route-handler/redirect-to-page! id {:new-whiteboard? true})))))

(defn ->logseq-portal-shape
  [block-id point]
  {:blockType (if (parse-uuid (str block-id)) "B" "P")
   :id (str (d/squuid))
   :compact false
   ;; Why calling it pageId when it's actually a block id?
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
                                    [(.-minX ^js bounds) (+ 64 (.-maxY ^js bounds))]
                                    [(+ 64 (.-maxX ^js bounds)) (.-minY ^js bounds)]))))
          shape (->logseq-portal-shape block-uuid point)]
      (when (uuid? block-uuid) (editor-handler/set-blocks-id! [block-uuid]))
      (.createShapes api (clj->js shape))
      (when link?
        (.createNewLineBinding api source-shape (:id shape))))))

(defn get-page-tldr
  [page-uuid]
  (let [page (model/get-page page-uuid)
        react-page (db/sub-block (:db/id page))
        blocks (:block/_page react-page)]
    (whiteboard-clj->tldr react-page blocks)))

(defn <add-new-block!
  [page-uuid content]
  (p/let [repo (state/get-current-repo)
          new-block-id (db/new-block-id)
          page-entity (model/get-page page-uuid)
          tx (sqlite-util/block-with-timestamps
              {:block/uuid new-block-id
               :block/title (or content "")
               :block/format :markdown
               :block/page (:db/id page-entity)
               :block/parent (:db/id page-entity)})
          _ (db/transact! repo [tx] {:outliner-op :insert-blocks
                                     :whiteboard/transact? true})]
    new-block-id))

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
          edn (common-util/safe-read-string text)]
    edn))

(defn clone-whiteboard-from-edn
  "Given a tldr, clone the whiteboard page into current active whiteboard"
  ([edn]
   (when-let [app (state/active-tldraw-app)]
     (clone-whiteboard-from-edn edn (.-api app))))
  ([{:keys [pages blocks]} api]
   (let [page-block (first pages)
         ;; FIXME: should also clone normal blocks
         shapes (build-shapes blocks)
         tldr-page (pu/page-block->tldr-page page-block)
         assets (:assets tldr-page)
         bindings (:bindings tldr-page)]
     (.cloneShapesIntoCurrentPage ^js api (clj->js {:shapes shapes
                                                    :assets assets
                                                    :bindings bindings})))))
(defn should-populate-onboarding-whiteboard?
  "When there is no whiteboard, or there is only one whiteboard that has the given page name, we should populate the onboarding shapes"
  [page-uuid]
  (let [whiteboards (model/get-all-whiteboards (state/get-current-repo))]
    (and (or (empty? whiteboards)
             (and
              (= 1 (count whiteboards))
              (= (str page-uuid) (str (:block/uuid (first whiteboards))))))
         (not (state/get-onboarding-whiteboard?)))))

(defn update-shapes!
  [shapes]
  (when-let [app (state/active-tldraw-app)]
    (let [^js api (.-api app)]
      (apply (.-updateShapes api) (bean/->js shapes)))))

(defn update-shapes-index!
  [page-uuid]
  (when-let [app (state/active-tldraw-app)]
    (let [tl-page ^js (second (first (.-pages app)))]
      (when tl-page
        (when-let [page (db/get-page page-uuid)]
          (let [shapes-index (->> (db/sort-by-order (:block/_page page))
                                  (map (comp str :block/uuid)))]
            (when (seq shapes-index)
              (.updateShapesIndex tl-page (bean/->js shapes-index)))))))))

(defn populate-onboarding-whiteboard
  [api]
  (when (some? api)
    (-> (p/let [edn (get-onboard-whiteboard-edn)]
          (clone-whiteboard-from-edn edn api)
          (state/set-onboarding-whiteboard! true))
        (p/catch
         (fn [e] (js/console.warn "Failed to populate onboarding whiteboard" e))))))

(defn cleanup!
  [^js tl-page]
  (let [shapes (.-shapes tl-page)]
    (.cleanup tl-page (map #(.-id %) shapes))))

(defn onboarding-show
  []
  (when (not (or (state/sub :whiteboard/onboarding-tour?)
                 (config/demo-graph?)
                 (util/mobile?)))
    (state/pub-event! [:whiteboard/onboarding])
    (state/set-state! [:whiteboard/onboarding-tour?] true)
    (storage/set :whiteboard-onboarding-tour? true)))
