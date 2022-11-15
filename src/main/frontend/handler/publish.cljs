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
            [frontend.handler.notification :as notification]
            [clojure.string :as string]
            [logseq.publish :as publish]))

(defn- update-vals-uuid->str
  [coll]
  (mapv (fn [m]
          (println m)
          (update-vals m (fn [v] (if (uuid? v) (str v) v))))
        coll))

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
                                 [(str (:block/uuid b)) (update-vals-uuid->str (db/get-block-and-children repo (:block/uuid b)))]))
                          (into {}))
        page-id      (str (:block/uuid page))
        blocks'      (if (and block-uuid (seq blocks))
                       (->>
                        (update (vec blocks) 0 dissoc :block/left :block/parent)
                        (map #(dissoc % :block/page)))
                       (cons page blocks))
        blocks       (->> blocks'
                          (util/distinct-by :block/uuid)
                          update-vals-uuid->str)
        refs         (update-vals-uuid->str refs)
        html         (publish/->html blocks refed-blocks refs page-id)
        body         {:page-id      page-id
                      :blocks       blocks
                      :refed-blocks refed-blocks
                      :refs         refs
                      :html         html}
        ;; TODO: refresh token if empty
        token        (state/get-auth-id-token)]
    (prn "Debug [PUBLISH] body: " body)
    (go
      (let [result (<! (http/post (str "https://" config/API-DOMAIN "/publish/publish_upload")
                                  {:oauth-token       token
                                   :body              (js/JSON.stringify (bean/->js body))
                                   :with-credentials? false}))]
        (state/set-state! [:ui/loading? :publish] false)
        (if (:success result)
          (when-let [url (get-in result [:body :url])]
            (let [url' (string/replace url "https://logseq.io" "http://localhost:3000")]
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
