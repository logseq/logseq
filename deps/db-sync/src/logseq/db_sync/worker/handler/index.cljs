(ns logseq.db-sync.worker.handler.index
  (:require [lambdaisland.glogi :as log]
            [logseq.db-sync.common :as common]
            [logseq.db-sync.index :as index]
            [logseq.db-sync.worker.auth :as auth]
            [logseq.db-sync.worker.http :as http]
            [logseq.db-sync.worker.routes.index :as routes]
            [promesa.core :as p]))

(defn- index-db [^js self]
  (let [db (.-d1 self)]
    (when-not db
      (log/error :db-sync/index-db-missing {:binding "DB"}))
    db))

(defn ^:large-vars/cleanup-todo handle [{:keys [db ^js env request url claims route]}]
  (let [path-params (:path-params route)
        graph-id (:graph-id path-params)
        member-id (:member-id path-params)
        user-id (aget claims "sub")]
    (case (:handler route)
      :graphs/list
      (if (string? user-id)
        (p/let [graphs (index/<index-list db user-id)]
          (http/json-response :graphs/list {:graphs graphs}))
        (http/unauthorized))

      :graphs/create
      (.then (common/read-json request)
             (fn [result]
               (if (nil? result)
                 (http/bad-request "missing body")
                 (let [body (js->clj result :keywordize-keys true)
                       body (http/coerce-http-request :graphs/create body)
                       graph-id (str (random-uuid))]
                   (cond
                     (not (string? user-id))
                     (http/unauthorized)

                     (nil? body)
                     (http/bad-request "invalid body")

                     :else
                     (p/let [{:keys [graph-name schema-version]} body
                             name-exists? (index/<graph-name-exists? db graph-name user-id)]
                       (if name-exists?
                         (http/bad-request "duplicate graph name")
                         (p/let [_ (index/<index-upsert! db graph-id graph-name user-id schema-version)
                                 _ (index/<graph-member-upsert! db graph-id user-id "manager" user-id)]
                           (http/json-response :graphs/create {:graph-id graph-id})))))))))

      :graphs/access
      (cond
        (not (string? user-id))
        (http/unauthorized)

        :else
        (p/let [owns? (index/<user-has-access-to-graph? db graph-id user-id)]
          (if owns?
            (http/json-response :graphs/access {:ok true})
            (http/forbidden))))

      :graph-members/list
      (cond
        (not (string? user-id))
        (http/unauthorized)

        :else
        (p/let [can-access? (index/<user-has-access-to-graph? db graph-id user-id)]
          (if (not can-access?)
            (http/forbidden)
            (p/let [members (index/<graph-members-list db graph-id)]
              (http/json-response :graph-members/list {:members members})))))

      :graph-members/create
      (cond
        (not (string? user-id))
        (http/unauthorized)

        :else
        (.then (common/read-json request)
               (fn [result]
                 (if (nil? result)
                   (http/bad-request "missing body")
                   (let [body (js->clj result :keywordize-keys true)
                         body (http/coerce-http-request :graph-members/create body)
                         member-id (:user-id body)
                         email (:email body)
                         role (or (:role body) "member")]
                     (cond
                       (nil? body)
                       (http/bad-request "invalid body")

                       (and (not (string? member-id))
                            (not (string? email)))
                       (http/bad-request "invalid user")

                       :else
                       (p/let [manager? (index/<user-is-manager? db graph-id user-id)
                               resolved-id (if (string? member-id)
                                             (p/resolved member-id)
                                             (index/<user-id-by-email db email))]
                         (if (not manager?)
                           (http/forbidden)
                           (if-not (string? resolved-id)
                             (http/bad-request "user not found")
                             (p/let [_ (index/<graph-member-upsert! db graph-id resolved-id role user-id)]
                               (http/json-response :graph-members/create {:ok true})))))))))))

      :graph-members/update
      (cond
        (not (string? user-id))
        (http/unauthorized)

        (not (string? member-id))
        (http/bad-request "invalid user id")

        :else
        (.then (common/read-json request)
               (fn [result]
                 (if (nil? result)
                   (http/bad-request "missing body")
                   (let [body (js->clj result :keywordize-keys true)
                         body (http/coerce-http-request :graph-members/update body)
                         role (:role body)]
                     (cond
                       (nil? body)
                       (http/bad-request "invalid body")

                       :else
                       (p/let [manager? (index/<user-is-manager? db graph-id user-id)]
                         (if (not manager?)
                           (http/forbidden)
                           (p/let [_ (index/<graph-member-update-role! db graph-id member-id role)]
                             (http/json-response :graph-members/update {:ok true}))))))))))

      :graph-members/delete
      (cond
        (not (string? user-id))
        (http/unauthorized)

        (not (string? member-id))
        (http/bad-request "invalid user id")

        :else
        (p/let [manager? (index/<user-is-manager? db graph-id user-id)
                target-role (index/<graph-member-role db graph-id member-id)
                self-leave? (and (= user-id member-id)
                                 (= "member" target-role))]
          (cond
            (and manager? (not= "manager" target-role))
            (p/let [_ (index/<graph-member-delete! db graph-id member-id)]
              (http/json-response :graph-members/delete {:ok true}))

            self-leave?
            (p/let [_ (index/<graph-member-delete! db graph-id member-id)]
              (http/json-response :graph-members/delete {:ok true}))

            :else
            (http/forbidden))))

      :graphs/delete
      (cond
        (not (seq graph-id))
        (http/bad-request "missing graph id")

        (not (string? user-id))
        (http/unauthorized)

        :else
        (p/let [owns? (index/<user-has-access-to-graph? db graph-id user-id)]
          (if (not owns?)
            (http/forbidden)
            (p/let [_ (index/<index-delete! db graph-id)]
              (let [^js namespace (.-LOGSEQ_SYNC_DO env)
                    do-id (.idFromName namespace graph-id)
                    stub (.get namespace do-id)
                    reset-url (str (.-origin url) "/admin/reset")]
                (.fetch stub (js/Request. reset-url #js {:method "DELETE"})))
              (http/json-response :graphs/delete {:graph-id graph-id :deleted true})))))

      :e2ee/user-keys-get
      (if (string? user-id)
        (p/let [pair (index/<user-rsa-key-pair db user-id)]
          (http/json-response :e2ee/user-keys (or pair {})))
        (http/unauthorized))

      :e2ee/user-keys-post
      (.then (common/read-json request)
             (fn [result]
               (if (nil? result)
                 (http/bad-request "missing body")
                 (let [body (js->clj result :keywordize-keys true)
                       body (http/coerce-http-request :e2ee/user-keys body)]
                   (cond
                     (not (string? user-id))
                     (http/unauthorized)

                     (nil? body)
                     (http/bad-request "invalid body")

                     :else
                     (let [{:keys [public-key encrypted-private-key]} body]
                       (p/let [_ (index/<user-rsa-key-pair-upsert! db user-id public-key encrypted-private-key)]
                         (http/json-response :e2ee/user-keys {:public-key public-key
                                                              :encrypted-private-key encrypted-private-key}))))))))

      :e2ee/user-public-key-get
      (let [email (.get (.-searchParams url) "email")]
        (p/let [public-key (index/<user-rsa-public-key-by-email db email)]
          (http/json-response :e2ee/user-public-key
                              (cond-> {}
                                (some? public-key)
                                (assoc :public-key public-key)))))

      :e2ee/graph-aes-key-get
      (cond
        (not (string? user-id))
        (http/unauthorized)

        :else
        (p/let [access? (index/<user-has-access-to-graph? db graph-id user-id)]
          (if (not access?)
            (http/forbidden)
            (p/let [encrypted-aes-key (index/<graph-encrypted-aes-key db graph-id user-id)]
              (http/json-response :e2ee/graph-aes-key {:encrypted-aes-key encrypted-aes-key})))))

      :e2ee/graph-aes-key-post
      (cond
        (not (string? user-id))
        (http/unauthorized)

        :else
        (.then (common/read-json request)
               (fn [result]
                 (if (nil? result)
                   (http/bad-request "missing body")
                   (let [body (js->clj result :keywordize-keys true)
                         body (http/coerce-http-request :e2ee/graph-aes-key body)]
                     (if (nil? body)
                       (http/bad-request "invalid body")
                       (p/let [access? (index/<user-has-access-to-graph? db graph-id user-id)]
                         (if (not access?)
                           (http/forbidden)
                           (let [{:keys [encrypted-aes-key]} body]
                             (p/let [_ (index/<graph-encrypted-aes-key-upsert! db graph-id user-id encrypted-aes-key)]
                               (http/json-response :e2ee/graph-aes-key {:encrypted-aes-key encrypted-aes-key})))))))))))

      :e2ee/grant-access
      (if (not (string? user-id))
        (http/unauthorized)
        (.then (common/read-json request)
               (fn [result]
                 (if (nil? result)
                   (http/bad-request "missing body")
                   (let [body (js->clj result :keywordize-keys true)
                         body (http/coerce-http-request :e2ee/grant-access body)]
                     (if (nil? body)
                       (http/bad-request "invalid body")
                       (p/let [manager? (index/<user-is-manager? db graph-id user-id)]
                         (if (not manager?)
                           (http/forbidden)
                           (let [entries (:target-user-email+encrypted-aes-key-coll body)
                                 missing (atom [])]
                             (p/let [_ (p/all
                                        (map (fn [entry]
                                               (let [email (:email entry)
                                                     encrypted-aes-key (:encrypted-aes-key entry)]
                                                 (p/let [target-user-id (index/<user-id-by-email db email)
                                                         access? (and target-user-id
                                                                      (index/<user-has-access-to-graph? db graph-id target-user-id))]
                                                   (if (and target-user-id access?)
                                                     (index/<graph-encrypted-aes-key-upsert! db graph-id target-user-id encrypted-aes-key)
                                                     (swap! missing conj email)))))
                                             entries))]
                               (http/json-response :e2ee/grant-access
                                                   (cond-> {:ok true}
                                                     (seq @missing)
                                                     (assoc :missing-users @missing)))))))))))))

      (http/not-found))))

(defn handle-fetch [^js self request]
  (let [db (index-db self)
        env (.-env self)
        url (js/URL. (.-url request))
        path (.-pathname url)
        method (.-method request)]
    (try
      (cond
        (contains? #{"OPTIONS" "HEAD"} method)
        (common/options-response)

        (nil? db)
        (http/error-response "server error" 500)

        :else
        (p/let [claims (auth/auth-claims request env)
                _ (when claims
                    (index/<user-upsert! db claims))
                route (routes/match-route method path)
                response (cond
                           (nil? claims)
                           (http/unauthorized)

                           route
                           (handle {:db db
                                    :env env
                                    :request request
                                    :url url
                                    :claims claims
                                    :route route})

                           :else
                           (http/not-found))]
          response))
      (catch :default error
        (log/error :db-sync/index-error error)
        (http/error-response "server error" 500)))))

(defn graph-access-response [request env graph-id]
  (let [token (auth/token-from-request request)
        url (js/URL. (.-url request))
        access-url (str (.-origin url) "/graphs/" graph-id "/access")
        headers (js/Headers. (.-headers request))
        index-self #js {:env env :d1 (aget env "DB")}]
    (when (string? token)
      (.set headers "authorization" (str "Bearer " token)))
    (handle-fetch index-self (js/Request. access-url #js {:method "GET" :headers headers}))))
