(ns logseq.db-sync.worker.handler.personal-access-token
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [logseq.db-sync.common :as common]
            [logseq.db-sync.index :as index]
            [logseq.db-sync.worker.auth :as auth]
            [logseq.db-sync.worker.http :as http]
            [promesa.core :as p]))

(def ^:private one-year-ms (* 365 24 60 60 1000))
(def ^:private one-day-ms (* 24 60 60 1000))
(def ^:private permissions #{"read" "write" "both"})
(def ^:private rtc-groups #{"team" "rtc_2025_07_10"})
(def ^:private collection-path "/api/v1/personal-access-tokens")
(def ^:private user-info-url "https://api.logseq.com/file-sync/user_info")

(defn route?
  [path]
  (or (= collection-path path)
      (string/starts-with? path (str collection-path "/"))))

(defn- claims-groups
  [claims]
  (let [groups (some-> claims (aget "cognito:groups"))]
    (cond
      (array? groups) (set (array-seq groups))
      (string? groups) (->> (string/split groups #"[\[\]\s,\"]+")
                            (remove string/blank?)
                            set)
      :else #{})))

(defn- <rtc-user?
  [request claims]
  (let [claim-groups (claims-groups claims)]
    (if (seq claim-groups)
      (p/resolved (boolean (seq (set/intersection rtc-groups claim-groups))))
      (-> (p/let [token (auth/token-from-request request)
                  response (js/fetch user-info-url
                                     #js {:method "POST"
                                          :headers #js {"authorization" (str "Bearer " token)
                                                        "content-type" "application/json"}
                                          :body "{}"})
                  user-info (when (.-ok response) (.json response))
                  user-groups (claims-groups
                               #js {"cognito:groups" (some-> user-info (aget "UserGroups"))})]
            (boolean (seq (set/intersection rtc-groups user-groups))))
          (p/catch (fn [_] false))))))

(defn- random-hex
  [size]
  (let [payload (js/Uint8Array. size)]
    (.getRandomValues js/crypto payload)
    (->> (array-seq payload)
         (map (fn [octet]
                (.padStart (.toString octet 16) 2 "0")))
         (apply str))))

(defn- generate-token
  []
  (str auth/personal-access-token-prefix (random-hex 32)))

(defn- token-display-prefix
  [token]
  (subs token 0 (min (count token) 23)))

(defn- token-id-from-path
  [path]
  (when (string/starts-with? path (str collection-path "/"))
    (let [id (subs path (count (str collection-path "/")))]
      (when (and (seq id) (not (string/includes? id "/")))
        id))))

(defn- <create!
  [request env user-id]
  (p/let [raw-body (-> (common/read-json request)
                       (p/catch (fn [_] ::invalid)))
          body (when (and raw-body (not= ::invalid raw-body))
                 (js->clj raw-body :keywordize-keys true))]
    (if-not (map? body)
      (http/bad-request "invalid body")
      (let [graph-id (:graph-id body)
            permission (:permission body)
            now (common/now-ms)
            expires-at (if (contains? body :expires-at)
                         (:expires-at body)
                         (+ now one-year-ms))]
        (cond
          (or (not (string? graph-id)) (string/blank? graph-id))
          (http/bad-request "invalid graph id")

          (not (contains? permissions permission))
          (http/bad-request "invalid permission")

          ;; End-of-day in the picker's timezone may run up to ~a day past one
          ;; year, so the cap leaves a one-day buffer.
          (or (not (number? expires-at))
              (<= expires-at now)
              (> expires-at (+ now one-year-ms one-day-ms)))
          (http/bad-request "invalid expiration")

          :else
          ;; A token may be created for any accessible non-E2EE graph, even one
          ;; whose initial sync is still in progress (graph_ready_for_use = 0);
          ;; the semantic API itself gates reads on readiness.
          (p/let [db (aget env "DB")
                  accessible? (index/<user-has-access-to-graph? db graph-id user-id)
                  graph-e2ee? (index/<graph-e2ee? db graph-id)]
            (if-not (and accessible? (false? graph-e2ee?))
              (http/forbidden)
              (let [id (str (random-uuid))
                    token (generate-token)
                    token-prefix (token-display-prefix token)]
                (p/let [token-hash (auth/<sha-256-hex token)
                        _ (index/<personal-access-token-create!
                           (aget env "DB")
                           {:id id
                            :user-id user-id
                            :graph-id graph-id
                            :token-hash token-hash
                            :token-prefix token-prefix
                            :permission permission
                            :created-at now
                            :expires-at expires-at})]
                  (http/json-response nil
                                      {:id id
                                       :token token
                                       :token-prefix token-prefix
                                       :graph-id graph-id
                                       :permission permission
                                       :created-at now
                                       :expires-at expires-at}
                                      201))))))))))

(defn- <handle-authenticated
  [request env claims]
  (let [path (.-pathname (js/URL. (.-url request)))
        method (.-method request)
        user-id (aget claims "sub")]
    (if-not (string? user-id)
      (http/unauthorized)
      (p/let [rtc-user? (<rtc-user? request claims)]
        (cond
          (not rtc-user?)
          (http/forbidden)

          (and (= method "GET") (= path collection-path))
          (p/let [tokens (index/<personal-access-tokens-list (aget env "DB") user-id)]
            (http/json-response nil {:tokens tokens}))

          (and (= method "POST") (= path collection-path))
          (<create! request env user-id)

          (and (= method "DELETE") (token-id-from-path path))
          (p/let [_ (index/<personal-access-token-delete!
                     (aget env "DB") (token-id-from-path path) user-id)]
            (common/options-response))

          :else
          (http/not-found))))))

(defn handle
  [request env]
  (if (= "OPTIONS" (.-method request))
    (common/options-response)
    (p/let [claims (auth/auth-claims request env)]
      (if claims
        (<handle-authenticated request env claims)
        (http/unauthorized)))))
