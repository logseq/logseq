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
            [frontend.util.fs :as fs-util]))

(defn publish
  []
  (state/set-state! [:ui/loading? :publish] true)
  (let [repo         (state/get-current-repo)
        page-name    (or (state/get-current-page)
                         (date/today))
        block-page?  (util/uuid-string? page-name)
        block-uuid   (when block-page? (uuid page-name))
        page         (if block-uuid
                       (db/pull [:block/uuid block-uuid])
                       (db/pull [:block/name (util/page-name-sanity-lc page-name)]))
        blocks       (if block-uuid
                       (db/get-block-and-children repo block-uuid)
                       (db/get-page-blocks-no-cache page-name))
        ref-ids      (->> (mapcat :block/refs blocks)
                          (map :db/id)
                          (set))
        refs         (db/pull-many '[*] ref-ids)
        refed-blocks (->> (filter #(nil? (:block/name %)) refs)
                          (map (fn [b]
                                 [(:block/uuid b) (db/get-block-and-children repo (:block/uuid b))]))
                          (into {}))
        page-id      (:block/uuid page)
        blocks'      (if (and block-uuid (seq blocks))
                       (->>
                        (update (vec blocks) 0 dissoc :block/left :block/parent)
                        (map #(dissoc % :block/page)))
                       (cons page blocks))
        blocks       (->> blocks'
                          (util/distinct-by :block/uuid))
        body         {:page-id      page-id
                      :blocks       blocks
                      :refed-blocks refed-blocks
                      :refs         refs}
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
            html     (publish/->html {:graph-id graph-id} blocks refed-blocks refs page-id)
            body (assoc body
                        :graph-id graph-id
                        :html html)
            result (<! (http/post publish-api
                                  {:oauth-token       token
                                   :edn-params        body
                                   :with-credentials? false}))]
        (state/set-state! [:ui/loading? :publish] false)
        (if (:success result)
          (when-let [permalink (get-in result [:body :permalink])]
            (let [url' (str "http://localhost:3000" "/" permalink)]
              (state/pub-event! [:notification/show
                                 {:content [:span
                                            "Congrats! The page has been published to "
                                            [:a {:href url'
                                                 :target "_blank"}
                                             url']
                                            "."]
                                  :status :success}])))
          (do
            (prn "Publish failed" result)
            (notification/show!
             "Something is wrong, please try again."
             :error true)
            (state/pub-event! [:instrument {:type    :publish-failed
                                            :payload {:status (:status result)}}])))))))
