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
            [logseq.db.sqlite.util :as sqlite-util]))

(defn js->clj-keywordize
  [obj]
  (js->clj obj :keywordize-keys true))

(defn shape->block [shape page-name]
  (let [repo (state/get-current-repo)
        db (db/get-db repo)]
    (gp-whiteboard/shape->block repo db shape page-name)))

(defn- build-shapes
  [page-block blocks]
  (let [page-metadata (pu/get-block-property-value page-block :logseq.tldraw.page)
        shapes-index (:shapes-index page-metadata)
        shape-id->index (zipmap shapes-index (range 0 (count shapes-index)))]
    (->> blocks
         (map (fn [block]
                (assoc block :index (get shape-id->index (str (:block/uuid block)) 0))))
         (filter pu/shape-block?)
         (map pu/block->shape)
         (sort-by :index))))

(defn- whiteboard-clj->tldr [page-block blocks]
  (let [id (str (:block/uuid page-block))
        shapes (build-shapes page-block blocks)
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

(defn build-page-block
  [page-entity page-name tldraw-page assets shapes-index]
  (let [get-k #(gobj/get tldraw-page %)]
    {:block/original-name page-name
     :block/name (util/page-name-sanity-lc page-name)
     :block/type "whiteboard"
     :block/properties {(pu/get-pid :ls-type)
                        :whiteboard-page

                        (pu/get-pid :logseq.tldraw.page)
                        {:id (get-k "id")
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
                              (mapv (fn [b] (pu/get-block-property-value b :logseq.tldraw.shape)))
                              (remove nil?)))
        deleted-shapes-tx (mapv (fn [id] [:db/retractEntity [:block/uuid (uuid id)]]) deleted-ids)
        upserted-blocks (->> (map #(shape->block % page-name) upsert-shapes)
                             (remove (fn [b]
                                       (= (:nonce
                                           (pu/get-block-property-value
                                            (db/entity [:block/uuid (:block/uuid b)])
                                            :logseq.tldraw.shape))
                                          (:nonce
                                           (pu/get-block-property-value
                                            b
                                            :logseq.tldraw.shape))))))
        page-entity (model/get-page page-name)
        page-block (build-page-block page-entity page-name tl-page assets shapes-index)]
    (when (or (seq upserted-blocks)
              (seq deleted-shapes-tx)
              (not= (:block/properties page-block)
                    (:block/properties page-entity)))
      {:page-block page-block
       :upserted-blocks (map sqlite-util/block-with-timestamps upserted-blocks)
       :delete-blocks deleted-shapes-tx
       :deleted-shapes deleted-shapes
       :new-shapes created-shapes
       :metadata {:whiteboard/transact? true
                  :replace? replace?}})))

(defonce *last-shapes-nonce (atom {}))

;; FIXME: it seems that nonce for the page block will not be updated with new updates for the whiteboard
(defn <transact-tldr-delta!
  [page-name ^js app replace?]
  (let [tl-page ^js (second (first (.-pages app)))
        shapes (.-shapes ^js tl-page)
        page-block (model/get-page page-name)
        prev-page-metadata (pu/get-block-property-value page-block :logseq.tldraw.page)
        prev-shapes-index (:shapes-index prev-page-metadata)
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
        {:keys [page-block new-shapes deleted-shapes upserted-blocks delete-blocks metadata] :as result}
        (compute-tx app tl-page new-id-nonces db-id-nonces page-name replace?)]
    (when (seq result)
      (let [tx-data (concat delete-blocks [page-block] upserted-blocks)
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
                        metadata)]
        (swap! *last-shapes-nonce assoc-in [repo page-name] new-id-nonces)
        (if (contains? #{:new-arrow} (:whiteboard/op metadata'))
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
  (let [properties {(pu/get-pid :ls-type) :whiteboard-page,
                    (pu/get-pid :logseq.tldraw.page)
                    {:id (str id),
                     :name page-name,
                     :ls-type :whiteboard-page,
                     :bindings {},
                     :nonce 1,
                     :assets []}}]
    [#:block{:uuid id
             :name (util/page-name-sanity-lc page-name),
             :original-name page-name
             :type "whiteboard",
             :properties properties,
             :journal? false
             :format :markdown
             :updated-at (util/time-ms),
             :created-at (util/time-ms)}]))

(defn <create-new-whiteboard-page!
  ([]
   (<create-new-whiteboard-page! nil))
  ([name]
   (p/let [uuid (or (and name (parse-uuid name)) (d/squuid))
           name (or name (str uuid))
           repo (state/get-current-repo)
           _ (db/transact! (get-default-new-whiteboard-tx name uuid))]
     ;; TODO: check to remove this
     (state/update-state! [repo :unloaded-pages] (fn [pages] (conj (set pages)
                                                                   (util/page-name-sanity-lc name))))
     name)))

(defn <create-new-whiteboard-and-redirect!
  ([]
   (<create-new-whiteboard-and-redirect! (str (d/squuid))))
  ([name]
   (when-not config/publishing?
     (p/do!
       (<create-new-whiteboard-page! name)
       (route-handler/redirect-to-whiteboard! name {:new-whiteboard? true})))))

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
                                    [(.-minX ^js bounds) (+ 64 (.-maxY ^js bounds))]
                                    [(+ 64 (.-maxX ^js bounds)) (.-minY ^js bounds)]))))
          shape (->logseq-portal-shape block-uuid point)]
      (when (uuid? block-uuid) (editor-handler/set-blocks-id! [block-uuid]))
      (.createShapes api (clj->js shape))
      (when link?
        (.createNewLineBinding api source-shape (:id shape))))))

(defn page-name->tldr!
  [page-name]
  (let [page (model/get-page page-name)
        react-page (db/sub-block (:db/id page))
        blocks (:block/_page react-page)]
    (whiteboard-clj->tldr react-page blocks)))

(defn <add-new-block!
  [page-name content]
  (p/let [repo (state/get-current-repo)
          new-block-id (db/new-block-id)
          page-entity (model/get-page page-name)
          tx (sqlite-util/block-with-timestamps
              {:block/uuid new-block-id
               :block/content (or content "")
               :block/format :markdown
               :block/page {:block/name (util/page-name-sanity-lc page-name)
                            :block/original-name page-name}
               :block/parent (:db/id page-entity)})
          _ (db/transact! repo [tx] {:whiteboard/transact? true})]
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
         shapes (build-shapes page-block blocks)
         tldr-page (pu/page-block->tldr-page page-block)
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

(defn update-shapes!
  [shapes]
  (when-let [app (state/active-tldraw-app)]
    (let [^js api (.-api app)]
      (apply (.-updateShapes api) (bean/->js shapes)))))

(defn update-shapes-index!
  [page-name]
  (when-let [app (state/active-tldraw-app)]
    (let [tl-page ^js (second (first (.-pages app)))]
      (when tl-page
        (when-let [page (db/entity [:block/name page-name])]
         (let [page-metadata (pu/get-block-property-value page :logseq.tldraw.page)
               shapes-index (:shapes-index page-metadata)]
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
