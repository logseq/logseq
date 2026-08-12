(ns logseq.db-sync.worker.handler.personal-access-token
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [logseq.db-sync.common :as common]
            [logseq.db-sync.index :as index]
            [logseq.db-sync.worker.auth :as auth]
            [logseq.db-sync.worker.http :as http]
            [promesa.core :as p]))

(def ^:private one-year-ms (* 365 24 60 60 1000))
(def ^:private permissions #{"read" "write" "both"})
(def ^:private rtc-groups #{"team" "rtc_2025_07_10"})
(def ^:private collection-path "/api/v1/personal-access-tokens")

(defn route?
  [path]
  (or (= collection-path path)
      (string/starts-with? path (str collection-path "/"))))

(defn- claims-groups
  [claims]
  (let [groups (some-> claims (aget "cognito:groups"))]
    (cond
      (array? groups) (set (array-seq groups))
      (string? groups) (->> (string/split groups #"[ ,]+")
                            (remove string/blank?)
                            set)
      :else #{})))

(defn- rtc-claims?
  [claims]
  (seq (set/intersection rtc-groups (claims-groups claims))))

(defn- random-hex
  [size]
  (let [payload (js/Uint8Array. size)]
    (.getRandomValues js/crypto payload)
    (->> (array-seq payload)
         (map (fn [byte]
                (.padStart (.toString byte 16) 2 "0")))
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
  (p/let [raw-body (common/read-json request)
          body (when raw-body (js->clj raw-body :keywordize-keys true))]
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

          (or (not (number? expires-at)) (<= expires-at now))
          (http/bad-request "invalid expiration")

          :else
          (p/let [graph (index/<semantic-graph-get (aget env "DB") user-id graph-id)]
            (if-not graph
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
                                       :expires-at expires-at
                                       :last-used-at nil}
                                      201))))))))))

(defn- <handle-authenticated
  [request env claims]
  (let [path (.-pathname (js/URL. (.-url request)))
        method (.-method request)
        user-id (aget claims "sub")]
    (cond
      (not (string? user-id))
      (http/unauthorized)

      (not (rtc-claims? claims))
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
      (http/not-found))))

(defn handle
  [request env]
  (if (= "OPTIONS" (.-method request))
    (common/options-response)
    (p/let [claims (auth/auth-claims request env)]
      (if claims
        (<handle-authenticated request env claims)
        (http/unauthorized)))))
