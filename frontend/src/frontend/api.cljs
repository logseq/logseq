(ns frontend.api
  (:require [clojure.string :as str]
            [cognitect.transit :as t]
            [clojure.walk :as walk]
            [goog.events :as events]
            [frontend.config :as config])
  (:import [goog.net XhrIo EventType]))

(defn parse-headers [headers]
  (reduce
   #(let [[k v] (str/split %2 #":\s+")]
      (if (or (str/blank? k) (str/blank? v))
        %1 (assoc %1 (str/lower-case k) v)))
   {} (str/split (or headers "") #"(\n)|(\r)|(\r\n)|(\n\r)")))

;; goog.net.ErrorCode constants to CLJS keywords
(def error-kw
  {0 :no-error
   1 :access-denied
   2 :file-not-found
   3 :ff-silent-error
   4 :custom-error
   5 :exception
   6 :http-error
   7 :abort
   8 :timeout
   9 :offline})

(defn to-transit
  "Serialization for clojure data."
  [msg]
  (let [writer (t/writer :json)]
    (t/write writer msg)))

(defn from-transit
  "Deserialization for clojure data."
  [in keywordize?]
  (let [reader (t/reader :json)]
    (cond-> (t/read reader in)
        keywordize?
        (walk/keywordize-keys))))

(defn from-json
  [in]
  (-> in
      js/JSON.parse
      (js->clj :keywordize-keys true)))

(defn to-json [params]
  (.stringify js/JSON (clj->js params)))

(defn- type->header [type]
  (case type
    :text {"Content-Type" "text/plain"}
    :edn {"Content-Type" "application/edn"}
    :transit {"Content-Type" "application/transit+json"
              "Accept" "application/transit+json"}
    nil))

(defn- token->header [token]
  (if token
    {"Authorization" (str "Bearer " token)}
    {}))

(defn fetch [api-host {:keys [endpoint params method type headers token on-success on-error
                              on-progress on-upload on-download
                              keywordize?]
                       :or {method :post
                            type   :transit
                            endpoint nil
                            keywordize? true}
                       :as args}]
  (let [xhr (XhrIo.)
        ;; (doto (XhrIo.)
        ;;       (.setTimeoutInterval 5000))
        named-method (str/upper-case (name method))
        body         (case type
                       :json (to-json params)
                       :edn  (pr-str params)
                       :transit (to-transit params)
                       :raw params)
        headers      (merge (type->header type)
                            headers
                            ;; (token->header token)
                            )]
    (when (or on-upload on-download)
      (.setProgressEventsEnabled xhr true)
      ;; (events/listen xhr EventType.PROGRESS
      ;;                (fn [e]
      ;;                  (on-progress {:loaded (.-loaded e)
      ;;                                :total (.-total e)})))
      (when on-upload
        (events/listen xhr EventType.UPLOAD_PROGRESS on-upload))
      (when on-download
        (events/listen xhr EventType.DOWNLOAD_PROGRESS on-download)))
    (events/listen xhr EventType.COMPLETE
                   (fn [e]
                     (let [target ^js (.-target e)
                           ]
                       (if (.isSuccess target)
                         (let [body (from-transit (.getResponseText target) keywordize?)]
                           (on-success body))
                         (let [response {:status (.getStatus target)
                                         :success (.isSuccess target)
                                         :body (.getResponseText target)
                                         :headers (parse-headers (.getAllResponseHeaders target))
                                         :error-code (error-kw (.getLastErrorCode target))
                                         :error-text (.getLastError target)}])))))
    (.send xhr (str api-host endpoint)
           named-method
           body
           headers
           ;; ;; timeoutInterval
           ;; 5000
           ;; ;; withCredentials
           ;; true
           )))

(defn get-me
  [on-success on-error]
  (fetch config/api
         {:endpoint "me"
          :method :get
          :on-success on-success
          :on-error on-error}))

;; TODO: add spec
(defn add-repo
  [url on-success on-error]
  (fetch config/api
         {:endpoint "repos"
          :method :post
          :params {:url url}
          :on-success on-success
          :on-error on-error}))
