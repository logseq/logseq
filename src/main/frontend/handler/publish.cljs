(ns frontend.handler.publish
  "Publish page or block(s)."
  (:require [frontend.state :as state]
            [frontend.date :as date]
            [frontend.util :as util]
            [frontend.config :as config]
            [lambdaisland.glogi :as log]
            [frontend.db :as db]
            [cljs-bean.core :as bean]
            [cljs-http.client :as http]
            [cljs.core.async :as async :refer [go <!]]
            [clojure.core.async.interop :refer [p->c]]
            [frontend.handler.notification :as notification]
            [clojure.string :as string]
            [logseq.publish :as publish]
            [frontend.util.fs :as fs-util]
            [frontend.util.page-property :as page-property]
            [frontend.handler.editor :as editor-handler]
            [logseq.graph-parser.util.page-ref :as page-ref]
            [logseq.graph-parser.util :as gp-util]
            [medley.core :as medley]))

(defn- transform-blocks
  [root-block]
  (let [repo (state/get-current-repo)
        page-block? (:block/name root-block)
        blocks (if page-block? ; page
                 (db/get-page-blocks-no-cache (:block/name root-block))
                 (db/get-block-and-children repo (:block/uuid root-block)))
        ref-ids      (->> (mapcat :block/refs blocks)
                          (map :db/id)
                          (set))
        refs         (db/pull-many '[*] ref-ids)
        refed-blocks (->> (filter #(nil? (:block/name %)) refs)
                          (map (fn [b]
                                 [(:block/uuid b) (db/get-block-and-children repo (:block/uuid b))]))
                          (into {}))
        blocks'      (if (and (not page-block?) (seq blocks))
                       (->>
                        (update (vec blocks) 0 dissoc :block/left :block/parent)
                        (map #(dissoc % :block/page)))
                       (let [page (db/pull (:db/id root-block))]
                         (cons page blocks)))]
    {:original-blocks blocks
     :blocks (->> blocks'
                  (remove nil?)
                  (util/distinct-by :block/uuid))
     :refs refs
     :refed-blocks refed-blocks}))

(defn- get-embed-pages
  [blocks]
  (let [pages (->> (map :block/macros blocks)
                   (apply concat)
                   (map :db/id)
                   (set)
                   (db/pull-many '[*])
                   (keep (fn [macro]
                           (when (and (= (:block/type macro) "macro")
                                      (= "embed" (get-in macro [:block/properties :logseq.macro-name])))
                             (when-let [page (first (get-in macro [:block/properties :logseq.macro-arguments]))]
                               (when (page-ref/page-ref? page)
                                 (let [result (page-ref/get-page-name page)]
                                   (when-not (string/blank? result)
                                     result))))))))]
    (->> (keep (fn [p]
                 (let [page (gp-util/page-name-sanity-lc p)
                       page-entity (db/entity [:block/name page])
                       blocks (:blocks (transform-blocks page-entity))]
                   (when (seq blocks)
                     [page {:page-id (:block/uuid page-entity)
                            :blocks blocks}]))) pages)
         (into {}))))

(defn publish
  [& {:keys [page-name]}]
  (state/set-state! [:ui/loading? :publish] true)
  (let [repo         (state/get-current-repo)
        page-name    (or page-name
                         (state/get-current-page)
                         (date/today))
        block-page?  (util/uuid-string? page-name)
        block-uuid   (when block-page? (uuid page-name))
        page         (if block-uuid
                       (db/pull [:block/uuid block-uuid])
                       (db/pull [:block/name (util/page-name-sanity-lc page-name)]))
        page-id      (:block/uuid page)
        {:keys [original-blocks blocks refs refed-blocks]} (transform-blocks page)
        embed-page-blocks (get-embed-pages original-blocks)
        body         (let [embed-page-blocks' (medley/map-vals :blocks embed-page-blocks)]
                       {:page-id      page-id
                        :blocks       blocks
                        :refed-blocks refed-blocks
                        :refs         refs
                        :embed-page-blocks embed-page-blocks'})
        ;; TODO: refresh token if empty
        token        (state/get-auth-id-token)
        publish-api  (if config/dev?
                       (str "http://localhost:3000/api/v1/blocks")
                       (str "https://" config/API-DOMAIN "/publish/publish_upload"))]
    (go
      (let [graph-dir (config/get-repo-dir repo)
            graph-id (<! (p->c (fs-util/read-graph-id graph-dir)))
            graph-id (or graph-id
                         ;; FIXME: make sure the new graph id doesn't exist
                         (let [new-graph-id (random-uuid)]
                           (<! (p->c (fs-util/save-graph-id-if-not-exists! repo new-graph-id)))
                           new-graph-id))
            html     (publish/->html {:graph-id graph-id} blocks refed-blocks refs page-id embed-page-blocks)
            body     (assoc body
                            :graph-id graph-id
                            :html html)
            result   (<! (http/post publish-api
                                    {:oauth-token       token
                                     :edn-params        body
                                     :with-credentials? false}))]
        (state/set-state! [:ui/loading? :publish] false)
        (if (:success result)
          (do
            ;; persist page/block id
            (if block-page?
              (do
                (editor-handler/set-blocks-id! [block-uuid])
                (editor-handler/set-block-property! block-uuid :published true))
              (do
                (page-property/add-property! page-name :id page-id)
                (page-property/add-property! page-name :published true)))
            (when-let [permalink (get-in result [:body :permalink])]
              (let [url' (str "http://localhost:3000" "/" permalink)]
                (state/pub-event! [:notification/show
                                   {:content [:span
                                              "Congrats! The page has been published to "
                                              [:a {:href url'
                                                   :target "_blank"}
                                               url']
                                              "."]
                                    :status :success}]))))
          (do
            (prn "Publish failed" result)
            (notification/show!
             "Something is wrong, please try again."
             :error true)
            (state/pub-event! [:instrument {:type    :publish-failed
                                            :payload {:status (:status result)}}])))))))
