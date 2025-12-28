(ns frontend.handler.publish
  "Prepare publish payloads for pages."
  (:require [frontend.config :as config]
            [frontend.db :as db]
            [frontend.handler.notification :as notification]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(defn- <sha256-hex
  [text]
  (p/let [encoder (js/TextEncoder.)
          data (.encode encoder text)
          digest (.digest (.-subtle js/crypto) "SHA-256" data)
          bytes (js/Uint8Array. digest)]
    (->> bytes
         (map (fn [b]
                (.padStart (.toString b 16) 2 "0")))
         (apply str))))

(defn- publish-endpoint
  []
  (str config/PUBLISH-API-BASE "/pages"))

(defn- <post-publish!
  [payload]
  (let [token (state/get-auth-id-token)
        headers (cond-> {"content-type" "application/transit+json"}
                  token (assoc "authorization" (str "Bearer " token)))]
    (p/let [body (ldb/write-transit-str payload)
            content-hash (<sha256-hex body)
            graph-uuid (or (:graph-uuid payload)
                           (some-> (ldb/get-graph-rtc-uuid (db/get-db)) str))
            _ (when-not graph-uuid
                (throw (ex-info "Missing graph UUID" {:repo (state/get-current-repo)})))
            publish-meta {:graph graph-uuid
                          :page_uuid (str (:page-uuid payload))
                          :block_count (:block-count payload)
                          :schema_version (:schema-version payload)
                          :format :transit
                          :compression :none
                          :content_hash content-hash
                          :content_length (count body)
                          :created_at (util/time-ms)}
            publish-body (assoc payload :meta publish-meta)
            headers (assoc headers "x-publish-meta" (js/JSON.stringify (clj->js publish-meta)))
            resp (js/fetch (publish-endpoint)
                           (clj->js {:method "POST"
                                     :headers headers
                                     :body (ldb/write-transit-str publish-body)}))]
      (if (.-ok resp)
        resp
        (p/let [body (.text resp)]
          (throw (ex-info "Publish failed"
                          {:status (.-status resp)
                           :body body})))))))

(defn publish-page!
  "Prepares and uploads the publish payload for a page."
  [page]
  (let [repo (state/get-current-repo)]
    (if-let [db* (and repo (db/get-db repo))]
      (if (and page (:db/id page))
        (p/let [payload (state/<invoke-db-worker :thread-api/build-publish-page-payload repo (:db/id page))]
          (if payload
            (-> (<post-publish! payload)
                (p/then (fn [_resp]
                          (let [graph-uuid (or (:graph-uuid payload)
                                               (some-> (ldb/get-graph-rtc-uuid db*) str))
                                page-uuid (str (:block/uuid page))
                                url (when (and graph-uuid page-uuid)
                                      (str config/PUBLISH-API-BASE "/page/" graph-uuid "/" page-uuid))]
                            (when url
                              (notification/show!
                               [:div.inline
                                [:span "Published to: "]
                                [:a {:target "_blank"
                                     :href url}
                                 url]]
                               :success
                               false)))))
                (p/catch (fn [error]
                           (js/console.error error)
                           (notification/show! "Publish failed." :error))))
            (notification/show! "Publish failed: invalid page." :error)))
        (notification/show! "Publish failed: invalid page." :error))
      (notification/show! "Publish failed: missing database." :error))))
