(ns frontend.publish.client
  "Client helpers for published page snapshots."
  (:require [frontend.config :as config]
            [frontend.state :as state]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(defn- <fetch-json
  [url headers]
  (p/let [resp (js/fetch url (clj->js {:headers headers}))]
    (cond
      (= 304 (.-status resp)) {:status 304}
      (.-ok resp) (p/let [data (.json resp)] {:status 200 :data data})
      :else (p/let [body (.text resp)]
              (throw (ex-info "Publish fetch failed" {:status (.-status resp) :body body}))))))

(defn- cache-key
  [graph-uuid page-uuid]
  (str "publish/" graph-uuid "/" page-uuid))

(defn- get-cache
  [graph-uuid page-uuid]
  (when-let [raw (js/localStorage.getItem (cache-key graph-uuid page-uuid))]
    (try
      (js/JSON.parse raw)
      (catch :default _e nil))))

(defn- set-cache!
  [graph-uuid page-uuid value]
  (js/localStorage.setItem (cache-key graph-uuid page-uuid)
                           (js/JSON.stringify (clj->js value))))

(defn <get-page-meta
  "Fetch metadata for a published page, honoring ETag if cached.

  Returns {:status 200 :data <meta>} or {:status 304}.
  "
  ([page-uuid]
   (<get-page-meta page-uuid (get-graph-uuid)))
  ([page-uuid graph-uuid]
   (when-not graph-uuid
     (throw (ex-info "Missing graph UUID" {:page-uuid page-uuid})))
   (let [cached (get-cache graph-uuid page-uuid)
         headers (cond-> {}
                   (and cached (.-etag cached))
                   (assoc "if-none-match" (.-etag cached)))]
     (p/let [resp (<fetch-json (str config/PUBLISH-API-BASE "/pages/" graph-uuid "/" page-uuid)
                               headers)]
       (if (= 304 (:status resp))
         resp
         (let [meta (js->clj (:data resp) :keywordize-keys true)
               etag (get meta :publish/content-hash)]
           (set-cache! graph-uuid page-uuid {:etag etag :meta meta})
           {:status 200 :data meta}))))))

(defn <get-transit-url
  "Fetch a signed transit URL. Uses meta ETag caching if provided.

  Returns {:status 200 :data {:url ... :etag ...}} or {:status 304}.
  "
  ([page-uuid]
   (<get-transit-url page-uuid (get-graph-uuid)))
  ([page-uuid graph-uuid]
   (when-not graph-uuid
     (throw (ex-info "Missing graph UUID" {:page-uuid page-uuid})))
   (let [cached (get-cache graph-uuid page-uuid)
         headers (cond-> {}
                   (and cached (.-etag cached))
                   (assoc "if-none-match" (.-etag cached)))]
     (p/let [resp (<fetch-json (str config/PUBLISH-API-BASE "/pages/" graph-uuid "/" page-uuid
                                    "/transit")
                               headers)]
       (if (= 304 (:status resp))
         resp
         (let [data (js->clj (:data resp) :keywordize-keys true)]
           {:status 200 :data data}))))))

(defn <get-published-transit
  "Fetch the published transit blob and return its text body.

  If the metadata is unchanged, returns {:status 304}.
  "
  ([page-uuid]
   (<get-published-transit page-uuid (get-graph-uuid)))
  ([page-uuid graph-uuid]
   (p/let [meta-resp (<get-page-meta page-uuid graph-uuid)]
     (if (= 304 (:status meta-resp))
       meta-resp
       (p/let [url-resp (<get-transit-url page-uuid graph-uuid)]
         (if (= 304 (:status url-resp))
           url-resp
           (let [url (get-in url-resp [:data :url])]
             (p/let [resp (js/fetch url)]
               (if (.-ok resp)
                 (p/let [text (.text resp)]
                   {:status 200
                    :etag (get-in url-resp [:data :etag])
                    :body text})
                 (p/let [body (.text resp)]
                   (throw (ex-info "Publish transit fetch failed"
                                   {:status (.-status resp) :body body}))))))))))))

(defn get-graph-uuid
  "Returns the RTC graph UUID if available."
  []
  (some-> (ldb/get-graph-rtc-uuid (state/get-current-repo)) str))
