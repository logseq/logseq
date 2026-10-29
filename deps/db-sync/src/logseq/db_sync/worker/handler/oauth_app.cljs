(ns logseq.db-sync.worker.handler.oauth-app
  "Developer registration and review for Logseq apps.

  An app stays pending until an operator approves it. Sign in with Logseq
  rejects every app that is not approved."
  (:require [clojure.string :as string]
            [logseq.db-sync.common :as common]
            [logseq.db-sync.index :as index]
            [logseq.db-sync.worker.auth :as auth]
            [logseq.db-sync.worker.http :as http]
            [logseq.db-sync.worker.oauth :as oauth]
            [promesa.core :as p]))

(def ^:private collection-path "/api/v1/oauth/apps")
(def ^:private admin-collection-path "/admin/oauth/apps")

(defn route?
  [path]
  (or (= collection-path path)
      (string/starts-with? path (str collection-path "/"))
      (= admin-collection-path path)
      (string/starts-with? path (str admin-collection-path "/"))))

(defn- app-id-from-path
  [path]
  (when (string/starts-with? path (str collection-path "/"))
    (let [id (subs path (count (str collection-path "/")))]
      (when (oauth/valid-client-id? id)
        id))))

(defn- review-id-from-path
  [path]
  (when (string/starts-with? path (str admin-collection-path "/"))
    (let [suffix (subs path (count (str admin-collection-path "/")))]
      (when (string/ends-with? suffix "/review")
        (let [id (subs suffix 0 (- (count suffix) (count "/review")))]
          (when (oauth/valid-client-id? id)
            id))))))

(defn- admin-token-valid?
  [request env]
  (let [expected (aget env "DB_SYNC_ADMIN_TOKEN")
        actual (.get (.-headers request) "x-db-sync-admin-token")]
    (and (string? expected)
         (seq expected)
         (= expected actual))))

(defn- <create!
  [request env user-id]
  (p/let [raw-body (-> (common/read-json request)
                       (p/catch (fn [_] ::invalid)))
          body (when (and raw-body (not= ::invalid raw-body))
                 (js->clj raw-body :keywordize-keys true))]
    (if-not (map? body)
      (http/bad-request "invalid body")
      (let [name (oauth/clean-name (:name body))
            description (oauth/clean-optional-text (:description body))
            redirect-uris (oauth/clean-redirect-uris (:redirect-uris body))
            now (common/now-ms)]
        (cond
          (nil? name)
          (http/bad-request "invalid name")

          (= description ::oauth/invalid)
          (http/bad-request "invalid description")

          (nil? redirect-uris)
          (http/bad-request "invalid redirect uri")

          :else
          (p/let [count (index/<oauth-app-count-by-owner (aget env "DB") user-id)]
            (if (>= count oauth/max-apps-per-user)
              (http/bad-request "too many apps")
              (let [app {:id (oauth/generate-client-id)
                         :owner-user-id user-id
                         :name name
                         :description description
                         :redirect-uris redirect-uris
                         :status "pending"
                         :review-note nil
                         :created-at now
                         :updated-at now
                         :reviewed-at nil}]
                (p/let [_ (index/<oauth-app-insert! (aget env "DB") app)]
                  (http/json-response nil (oauth/public-app app) 201))))))))))

(defn- <delete!
  [env user-id app-id]
  (p/let [app (index/<oauth-app-by-id (aget env "DB") app-id)]
    (if (not= user-id (:owner-user-id app))
      (http/not-found)
      (p/let [_ (index/<oauth-grants-delete-by-app! (aget env "DB") app-id)
              deleted (index/<oauth-app-delete! (aget env "DB") app-id user-id)]
        (if (pos? deleted)
          (common/options-response)
          (http/not-found))))))

(defn- <handle-authenticated
  [request env claims]
  (let [path (.-pathname (js/URL. (.-url request)))
        method (.-method request)
        user-id (aget claims "sub")]
    (if-not (string? user-id)
      (http/unauthorized)
      (p/let [rtc-user? (auth/<rtc-user? request claims)]
        (cond
          (not rtc-user?)
          (http/forbidden)

          (and (= method "GET") (= path collection-path))
          (p/let [apps (index/<oauth-apps-by-owner (aget env "DB") user-id)]
            (http/json-response nil {:apps (mapv oauth/public-app apps)}))

          (and (= method "POST") (= path collection-path))
          (<create! request env user-id)

          (and (= method "DELETE") (app-id-from-path path))
          (<delete! env user-id (app-id-from-path path))

          :else
          (http/not-found))))))

(defn- admin-app
  [app]
  (assoc (oauth/public-app app) :owner-user-id (:owner-user-id app)))

(defn- <review!
  [request env app-id]
  (p/let [raw-body (-> (common/read-json request)
                       (p/catch (fn [_] ::invalid)))
          body (when (and raw-body (not= ::invalid raw-body))
                 (js->clj raw-body :keywordize-keys true))
          status (:status body)
          note (oauth/clean-optional-text (:note body))]
    (cond
      (not (map? body))
      (http/bad-request "invalid body")

      (not (contains? #{"approved" "rejected"} status))
      (http/bad-request "invalid status")

      (= note ::oauth/invalid)
      (http/bad-request "invalid note")

      :else
      (let [now (common/now-ms)]
        (p/let [updated (index/<oauth-app-review!
                         (aget env "DB") app-id
                         {:status status :note note :reviewed-at now})]
          (if-not (pos? updated)
            (http/not-found)
            (p/let [app (index/<oauth-app-by-id (aget env "DB") app-id)]
              (http/json-response nil (admin-app app)))))))))

(defn- <handle-admin
  [request env]
  (if-not (admin-token-valid? request env)
    (http/unauthorized)
    (let [url (js/URL. (.-url request))
          path (.-pathname url)
          method (.-method request)
          status (.get (.-searchParams url) "status")]
      (cond
        (and (= method "GET") (= path admin-collection-path))
        (if-not (contains? oauth/app-statuses status)
          (http/bad-request "invalid status")
          (p/let [apps (index/<oauth-apps-by-status (aget env "DB") status)]
            (http/json-response nil {:apps (mapv admin-app apps)})))

        (and (= method "POST") (review-id-from-path path))
        (<review! request env (review-id-from-path path))

        :else
        (http/not-found)))))

(defn handle
  [request env]
  (let [path (.-pathname (js/URL. (.-url request)))]
    (cond
      (= "OPTIONS" (.-method request))
      (common/options-response)

      (or (= path admin-collection-path)
          (string/starts-with? path (str admin-collection-path "/")))
      (<handle-admin request env)

      :else
      (p/let [claims (auth/auth-claims request env)]
        (if claims
          (<handle-authenticated request env claims)
          (http/unauthorized))))))
