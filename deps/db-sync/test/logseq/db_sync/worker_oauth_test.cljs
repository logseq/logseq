(ns logseq.db-sync.worker-oauth-test
  (:require ["node:fs" :as fs]
            ["node:os" :as os]
            [logseq.db-sync.node.storage :as node-storage]
            [cljs.test :refer [async deftest is testing]]
            [clojure.string :as string]
            [logseq.common.authorization :as authorization]
            [logseq.db-sync.common :as common]
            [logseq.db-sync.index :as index]
            [logseq.db-sync.worker.auth :as auth]
            [logseq.db-sync.worker.dispatch :as dispatch]
            [logseq.db-sync.worker.handler.oauth :as oauth-handler]
            [logseq.db-sync.worker.oauth :as oauth]
            [logseq.db-sync.worker.oauth-page :as page]
            [promesa.core :as p]))

(def ^:private verifier "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")
(def ^:private challenge "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM")
(def ^:private redirect-uri "https://app.example/callback")
(def ^:private db-env #js {"DB" #js {}
                           "DB_SYNC_ADMIN_TOKEN" "admin-token"})

(defn- finish [result done]
  (-> result
      (p/then (fn [] (done)))
      (p/catch (fn [error]
                 (is false (str error))
                 (done)))))

(defn- json-body [response]
  (p/let [text (.text response)]
    (when (seq text)
      (js->clj (js/JSON.parse text) :keywordize-keys true))))

(defn- text-body [response]
  (.text response))

(defn- json-request
  ([method path]
   (json-request method path nil))
  ([method path body]
   (let [init #js {:method method
                   :headers #js {"authorization" "Bearer login-token"
                                 "content-type" "application/json"}}]
     (when body
       (aset init "body" (js/JSON.stringify (clj->js body))))
     (js/Request. (str "http://localhost" path) init))))

(defn- form-request
  ([path params]
   (form-request path params nil))
  ([path params cookie]
   (let [search (js/URLSearchParams.)
         headers #js {"content-type" "application/x-www-form-urlencoded"
                      "origin" "http://localhost"}]
     (doseq [[k v] params]
       (when (some? v)
         (.set search k (str v))))
     (when cookie
       (aset headers "cookie" cookie))
     (js/Request. (str "http://localhost" path)
                  #js {:method "POST"
                       :headers headers
                       :body (.toString search)}))))

(defn- rtc-claims []
  #js {"sub" "user-1"
       "cognito:groups" #js ["rtc_2025_07_10"]})

(defn- new-store []
  (atom {:apps {}
         :sessions {}
         :codes {}
         :access {}
         :refresh {}
         :graphs {"graph-1" {:graph-id "graph-1"
                             :graph-name "Ledger"}}
         :now 1700000000000
         :cognito-result nil
         :cognito-calls []}))

(defn- remove-app-rows [rows app-id]
  (into {} (remove (fn [[_ row]] (= app-id (:app-id row))) rows)))

(defn- with-store [store f]
  (p/with-redefs [common/now-ms (fn [] (:now @store))
                  auth/auth-claims (fn [_ _] (p/resolved (rtc-claims)))
                  oauth-handler/<cognito-login
                  (fn [_env username password]
                    (swap! store update :cognito-calls conj {:username username
                                                             :password password})
                    (p/resolved (or (:cognito-result @store)
                                    {:claims #js {"sub" "user-1"
                                                  "email" "user@example.com"
                                                  "cognito:username" username}})))
                  index/<oauth-app-count-by-owner
                  (fn [_ user-id]
                    (p/resolved (->> (vals (:apps @store))
                                     (filter #(= user-id (:owner-user-id %)))
                                     count)))
                  index/<oauth-app-insert!
                  (fn [_ app]
                    (swap! store assoc-in [:apps (:id app)] app)
                    (p/resolved nil))
                  index/<oauth-app-by-id
                  (fn [_ id]
                    (p/resolved (get-in @store [:apps id])))
                  index/<oauth-apps-by-owner
                  (fn [_ user-id]
                    (p/resolved (->> (vals (:apps @store))
                                     (filter #(= user-id (:owner-user-id %)))
                                     (sort-by :created-at #(compare %2 %1))
                                     vec)))
                  index/<oauth-apps-by-status
                  (fn [_ status]
                    (p/resolved (->> (vals (:apps @store))
                                     (filter #(= status (:status %)))
                                     (sort-by :created-at)
                                     (take 100)
                                     vec)))
                  index/<oauth-app-delete!
                  (fn [_ id user-id]
                    (if (= user-id (:owner-user-id (get-in @store [:apps id])))
                      (do (swap! store update :apps dissoc id)
                          (p/resolved 1))
                      (p/resolved 0)))
                  index/<oauth-app-review!
                  (fn [_ id {:keys [status note reviewed-at]}]
                    (if (get-in @store [:apps id])
                      (do (swap! store update-in [:apps id] merge
                                 {:status status
                                  :review-note note
                                  :reviewed-at reviewed-at
                                  :updated-at reviewed-at})
                          (p/resolved 1))
                      (p/resolved 0)))
                  index/<oauth-grants-delete-by-app!
                  (fn [_ app-id]
                    (swap! store (fn [state]
                                   (-> state
                                       (update :codes remove-app-rows app-id)
                                       (update :access remove-app-rows app-id)
                                       (update :refresh remove-app-rows app-id))))
                    (p/resolved nil))
                  index/<oauth-session-insert!
                  (fn [_ session]
                    (swap! store assoc-in [:sessions (:id session)] session)
                    (p/resolved nil))
                  index/<oauth-session-by-id
                  (fn [_ id]
                    (p/resolved (get-in @store [:sessions id])))
                  index/<oauth-code-insert!
                  (fn [_ row]
                    (swap! store assoc-in [:codes (:code-hash row)] row)
                    (p/resolved nil))
                  index/<oauth-code-by-hash
                  (fn [_ code-hash]
                    (p/resolved (get-in @store [:codes code-hash])))
                  index/<oauth-code-delete!
                  (fn [_ code-hash]
                    (if (contains? (:codes @store) code-hash)
                      (do (swap! store update :codes dissoc code-hash)
                          (p/resolved 1))
                      (p/resolved 0)))
                  index/<oauth-access-token-by-hash
                  (fn [_ token-hash]
                    (p/resolved
                     (when-let [row (get-in @store [:access token-hash])]
                       (assoc row :app-status (get-in @store [:apps (:app-id row) :status])))))
                  index/<oauth-refresh-token-by-hash
                  (fn [_ token-hash]
                    (p/resolved
                     (when-let [row (get-in @store [:refresh token-hash])]
                       (assoc row :app-status (get-in @store [:apps (:app-id row) :status])))))
                  index/<oauth-tokens-exchange!
                  (fn [_ {:keys [code-hash refresh-token-hash]} access refresh]
                    (let [bucket (if code-hash :codes :refresh)
                          key (or code-hash refresh-token-hash)
                          row (get-in @store [bucket key])]
                      (if row
                        (do
                          (swap! store (fn [state]
                                         (-> state
                                             (update bucket dissoc key)
                                             (assoc-in [:access (:token-hash access)] access)
                                             (assoc-in [:refresh (:token-hash refresh)] refresh))))
                          (p/resolved 1))
                        (p/resolved 0))))
                  index/<semantic-graphs-list
                  (fn [_ user-id _]
                    (p/resolved {:graphs (if (= "user-1" user-id)
                                           (vec (vals (:graphs @store)))
                                           [])}))
                  index/<semantic-graph-get
                  (fn [_ user-id graph-id]
                    (p/resolved (when (and (= "user-1" user-id)
                                           (get-in @store [:graphs graph-id]))
                                  (get-in @store [:graphs graph-id]))))
                  index/<user-has-access-to-graph?
                  (fn [_ graph-id user-id]
                    (p/resolved (boolean (and (= "user-1" user-id)
                                              (get-in @store [:graphs graph-id])))))
                  index/<graph-e2ee?
                  (fn [_ _] (p/resolved false))]
    (f)))

(defn- <call [request]
  (dispatch/handle-worker-fetch request db-env))

(defn- hidden-value [html name]
  (second (re-find (re-pattern (str "name=\"" name "\" value=\"([^\"]*)\"")) html)))

(defn- session-cookie [response]
  (some-> (.get (.-headers response) "set-cookie")
          (string/split #";")
          first))

(defn- app-body []
  {:name "Ledger"
   :description "Accounting"
   :redirect-uris [redirect-uri "http://localhost:3000/callback"]})

(defn- <create-app []
  (p/let [response (<call (json-request "POST" "/api/v1/oauth/apps" (app-body)))
          body (json-body response)]
    {:response response :body body}))

(defn- admin-request
  [method path body]
  (let [init #js {:method method
                  :headers #js {"content-type" "application/json"
                                "x-db-sync-admin-token" "admin-token"}}]
    (when body
      (aset init "body" (js/JSON.stringify (clj->js body))))
    (js/Request. (str "http://localhost" path) init)))

(defn- <review! [client-id status]
  (<call (admin-request "POST"
                        (str "/admin/oauth/apps/" client-id "/review")
                        {:status status :note "reviewed"})))

(defn- authorize-path [client-id scope]
  (let [params (js/URLSearchParams.)]
    (.set params "response_type" "code")
    (.set params "client_id" client-id)
    (.set params "redirect_uri" redirect-uri)
    (.set params "scope" scope)
    (.set params "state" "state-1")
    (.set params "code_challenge" challenge)
    (.set params "code_challenge_method" "S256")
    (str "/oauth/authorize?" (.toString params))))

(defn- authorize-fields [client-id]
  {"response_type" "code"
   "client_id" client-id
   "redirect_uri" redirect-uri
   "scope" "logseq/read logseq/write"
   "state" "state-1"
   "code_challenge" challenge
   "code_challenge_method" "S256"})

(defn- <approved-client []
  (p/let [{:keys [response body]} (<create-app)
          client-id (:id body)
          review (when client-id (<review! client-id "approved"))]
    (is (= 201 (.-status response)))
    (is (= 200 (.-status review)))
    client-id))

(deftest migration-creates-oauth-tables-test
  (let [sql (.readFileSync fs "worker/migrations/0008_add_oauth_apps.sql" "utf8")]
    (is (string/includes? sql "create table if not exists oauth_apps"))
    (is (string/includes? sql "create table if not exists oauth_login_sessions"))
    (is (string/includes? sql "create table if not exists oauth_authorization_codes"))
    (is (string/includes? sql "create table if not exists oauth_access_tokens"))
    (is (string/includes? sql "create table if not exists oauth_refresh_tokens"))
    (is (string/includes? sql "token_hash text not null unique"))))

(deftest redirect-uri-scope-and-pkce-rules-test
  (async done
         (finish
          (p/let [actual (oauth/<code-challenge verifier)]
            (testing "pkce s256"
              (is (= challenge actual)))
            (testing "redirect uris"
              (is (oauth/valid-redirect-uri? "https://app.example/callback"))
              (is (oauth/valid-redirect-uri? "https://app.example/callback?from=logseq"))
              (is (oauth/valid-redirect-uri? "http://localhost:3000/callback"))
              (is (oauth/valid-redirect-uri? "http://127.0.0.1/callback"))
              (is (not (oauth/valid-redirect-uri? "http://app.example/callback")))
              (is (not (oauth/valid-redirect-uri? "http://localhost.evil.com/callback")))
              (is (not (oauth/valid-redirect-uri? "https://user:pass@app.example/callback")))
              (is (not (oauth/valid-redirect-uri? "https://app.example/callback#fragment")))
              (is (not (oauth/valid-redirect-uri? "javascript:alert(1)")))
              (is (= ["https://app.example/callback" "http://localhost:8787/cb"]
                     (oauth/clean-redirect-uris [" https://app.example/callback "
                                                 "http://localhost:8787/cb"])))
              (is (nil? (oauth/clean-redirect-uris ["https://app.example/callback"
                                                    "https://app.example/callback"])))
              (is (nil? (oauth/clean-redirect-uris "https://app.example/callback")))
              (is (nil? (oauth/clean-redirect-uris (repeat 11 "https://app.example/callback")))))
            (testing "scopes and state"
              (is (= "logseq/read" (oauth/parse-scope "logseq/read")))
              (is (= "logseq/read logseq/write" (oauth/parse-scope "logseq/write logseq/read")))
              (is (nil? (oauth/parse-scope "logseq/read logseq/read")))
              (is (nil? (oauth/parse-scope "email")))
              (is (nil? (oauth/parse-scope "")))
              (is (oauth/valid-state? "state-1"))
              (is (not (oauth/valid-state? "")))
              (is (not (oauth/valid-state? (apply str (repeat 513 "a")))))
              (is (not (oauth/valid-state? "bad\nstate"))))
            (testing "names"
              (is (= "Ledger" (oauth/clean-name " Ledger ")))
              (is (nil? (oauth/clean-name " ")))
              (is (nil? (oauth/clean-name (apply str (repeat 81 "a")))))
              (is (= ::oauth/invalid (oauth/clean-optional-text (apply str (repeat 501 "a"))))))
            (testing "cognito endpoint"
              (is (= "https://cognito-idp.us-east-1.amazonaws.com/"
                     (oauth/cognito-idp-endpoint
                      "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_example")))
              (is (nil? (oauth/cognito-idp-endpoint "https://example.com")))))
          done)))

(deftest authorize-errors-do-not-redirect-for-an-untrusted-client-test
  (let [app {:id "logseq_app_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
             :status "approved"
             :redirect-uris [redirect-uri]}
        params {"response_type" "code"
                "client_id" (:id app)
                "redirect_uri" redirect-uri
                "scope" "logseq/read"
                "state" "state-1"
                "code_challenge" challenge
                "code_challenge_method" "S256"}]
    (is (= :unknown-app (:error (oauth/normalize-authorize params nil))))
    (is (= :pending (:error (oauth/normalize-authorize params (assoc app :status "pending")))))
    (is (= :rejected (:error (oauth/normalize-authorize params (assoc app :status "rejected")))))
    (is (= :redirect-mismatch
           (:error (oauth/normalize-authorize (assoc params "redirect_uri" "https://evil.example/cb") app))))
    (let [invalid (oauth/normalize-authorize (assoc params "scope" "email") app)]
      (is (:redirect? invalid))
      (is (= :invalid-request (:error invalid)))
      (is (string/includes? (oauth/authorization-error-redirect invalid) "error=invalid_request"))
      (is (string/starts-with? (oauth/authorization-error-redirect invalid) redirect-uri)))))

(deftest sign-in-page-escapes-app-content-and-localizes-test
  (let [request {:client-id "logseq_app_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
                 :redirect-uri redirect-uri
                 :scope "logseq/read logseq/write"
                 :state "state-1"
                 :code-challenge challenge
                 :code-challenge-method "S256"
                 :response-type "code"}
        app {:name "<script>alert(1)</script>"
             :description "<img src=x onerror=alert(1)>"}
        html (page/login-page {:lang :en :app app :request request})]
    (is (= "same-origin" (.get (.-headers (page/html-response html)) "referrer-policy")))
    (is (string/includes? html "&lt;script&gt;alert(1)&lt;/script&gt;"))
    (is (string/includes? html "&lt;img src=x onerror=alert(1)&gt;"))
    (is (not (re-find #"<script" html)))
    (is (not (re-find #"<img" html)))
    (is (= :zh (page/request-lang (js/Request. "http://localhost/oauth/authorize"
                                               #js {:headers #js {"accept-language" "zh-CN,zh;q=0.9"}}))))
    (is (= :zh-hant (page/request-lang (js/Request. "http://localhost/oauth/authorize"
                                                    #js {:headers #js {"accept-language" "zh-TW"}}))))
    (is (string/includes? (page/t :zh :login-title) "登录"))
    (is (string/includes? (page/t :zh-hant :login-title) "登入"))))

(deftest oauth-management-requires-login-and-validates-input-test
  (async done
         (let [store (new-store)]
           (finish
            (with-store store
              (fn []
                (p/let [forbidden (p/with-redefs [auth/auth-claims
                                                         (fn [_ _]
                                                           (p/resolved #js {"sub" "user-1"
                                                                            "cognito:groups" #js ["beta-tester"]}))]
                                   (<call (json-request "GET" "/api/v1/oauth/apps")))
                        invalid-name (<call (json-request "POST" "/api/v1/oauth/apps"
                                                          {:name " "
                                                           :redirect-uris [redirect-uri]}))
                        http-uri (<call (json-request "POST" "/api/v1/oauth/apps"
                                                      {:name "Ledger"
                                                       :redirect-uris ["http://app.example/callback"]}))
                        javascript-uri (<call (json-request "POST" "/api/v1/oauth/apps"
                                                            {:name "Ledger"
                                                             :redirect-uris ["javascript:alert(1)"]}))
                        long-description (<call (json-request "POST" "/api/v1/oauth/apps"
                                                              {:name "Ledger"
                                                               :description (apply str (repeat 501 "a"))
                                                               :redirect-uris [redirect-uri]}))
                        created (<create-app)
                        listed (<call (json-request "GET" "/api/v1/oauth/apps"))
                        listed-body (json-body listed)]
                  (is (= 403 (.-status forbidden)))
                  (is (= 400 (.-status invalid-name)))
                  (is (= 400 (.-status http-uri)))
                  (is (= 400 (.-status javascript-uri)))
                  (is (= 400 (.-status long-description)))
                  (is (= 201 (.-status (:response created))))
                  (is (oauth/valid-client-id? (:id (:body created))))
                  (is (= "pending" (:status (:body created))))
                  (is (= redirect-uri (first (:redirect-uris (:body created)))))
                  (is (not (contains? (:body created) :owner-user-id)))
                  (is (= 200 (.-status listed)))
                  (is (= [(:id (:body created))] (map :id (:apps listed-body))))
                  (is (empty? (:cognito-calls @store))))))
            done))))

(deftest app-limit-owner-delete-and-admin-review-test
  (async done
         (let [store (new-store)]
           (doseq [n (range oauth/max-apps-per-user)]
             (swap! store assoc-in [:apps (str "logseq_app_" (.padStart (.toString n 16) 32 "0"))]
                    {:id (str "logseq_app_" (.padStart (.toString n 16) 32 "0"))
                     :owner-user-id "user-1"
                     :name "Existing"
                     :redirect-uris [redirect-uri]
                     :status "pending"
                     :created-at n}))
           (finish
            (with-store store
              (fn []
                (p/let [limited (<call (json-request "POST" "/api/v1/oauth/apps" (app-body)))
                        _ (swap! store assoc :apps {})
                        {:keys [body]} (<create-app)
                        client-id (:id body)
                        unauthenticated (<call (js/Request. "http://localhost/admin/oauth/apps?status=pending"))
                        invalid-status (<call (js/Request. "http://localhost/admin/oauth/apps"
                                                           #js {:headers #js {"x-db-sync-admin-token" "admin-token"}}))
                        pending (<call (js/Request. "http://localhost/admin/oauth/apps?status=pending"
                                                    #js {:headers #js {"x-db-sync-admin-token" "admin-token"}}))
                        pending-body (json-body pending)
                        bad-note (<call (admin-request "POST"
                                                       (str "/admin/oauth/apps/" client-id "/review")
                                                       {:status "approved"
                                                        :note (apply str (repeat 501 "a"))}))
                        approved (<review! client-id "approved")
                        approved-body (json-body approved)
                        foreign (p/with-redefs [auth/auth-claims
                                                (fn [_ _]
                                                  (p/resolved #js {"sub" "user-2"
                                                                   "cognito:groups" #js ["rtc_2025_07_10"]}))]
                                  (<call (json-request "DELETE" (str "/api/v1/oauth/apps/" client-id))))
                        still-there (<call (json-request "GET" "/api/v1/oauth/apps"))
                        still-body (json-body still-there)
                        deleted (<call (json-request "DELETE" (str "/api/v1/oauth/apps/" client-id)))
                        after (<call (json-request "GET" "/api/v1/oauth/apps"))
                        after-body (json-body after)]
                  (is (= 400 (.-status limited)))
                  (is (= 401 (.-status unauthenticated)))
                  (is (= 400 (.-status invalid-status)))
                  (is (= [client-id] (map :id (:apps pending-body))))
                  (is (= "user-1" (:owner-user-id (first (:apps pending-body)))))
                  (is (= 400 (.-status bad-note)))
                  (is (= 200 (.-status approved)))
                  (is (= "approved" (:status approved-body)))
                  (is (= "reviewed" (:review-note approved-body)))
                  (is (= 404 (.-status foreign)))
                  (is (= [client-id] (map :id (:apps still-body))))
                  (is (= 204 (.-status deleted)))
                  (is (empty? (:apps after-body))))))
            done))))

(deftest pending-and-untrusted-apps-cannot-start-sign-in-test
  (async done
         (let [store (new-store)]
           (finish
            (with-store store
              (fn []
                (p/let [{:keys [body]} (<create-app)
                        client-id (:id body)
                        pending (<call (js/Request. (str "http://localhost" (authorize-path client-id "logseq/read"))))
                        pending-html (text-body pending)
                        rejected (<review! client-id "rejected")
                        rejected-page (<call (js/Request. (str "http://localhost" (authorize-path client-id "logseq/read"))))
                        rejected-html (text-body rejected-page)
                        unknown (<call (js/Request. (str "http://localhost"
                                                        (authorize-path "logseq_app_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
                                                                        "logseq/read"))))
                        unknown-html (text-body unknown)
                        mismatch (<review! client-id "approved")
                        mismatch-page (<call (js/Request.
                                              (str "http://localhost/oauth/authorize?response_type=code"
                                                   "&client_id=" client-id
                                                   "&redirect_uri=" (js/encodeURIComponent "https://evil.example/cb")
                                                   "&scope=logseq/read&state=state-1"
                                                   "&code_challenge=" challenge
                                                   "&code_challenge_method=S256")))
                        mismatch-html (text-body mismatch-page)]
                  (is (= 403 (.-status pending)))
                  (is (string/includes? pending-html "waiting for review"))
                  (is (not (string/includes? pending-html "type=\"password\"")))
                  (is (nil? (.get (.-headers pending) "location")))
                  (is (= 200 (.-status rejected)))
                  (is (= 403 (.-status rejected-page)))
                  (is (string/includes? rejected-html "not approved"))
                  (is (= 404 (.-status unknown)))
                  (is (not (string/includes? unknown-html "https://evil.example")))
                  (is (= 200 (.-status mismatch)))
                  (is (= 400 (.-status mismatch-page)))
                  (is (nil? (.get (.-headers mismatch-page) "location")))
                  (is (string/includes? mismatch-html "redirect URI"))
                  (is (empty? (:cognito-calls @store))))))
            done))))

(defn- <sign-in [client-id scope]
  (p/let [login (<call (form-request "/oauth/login"
                                     (assoc (authorize-fields client-id)
                                            "scope" scope
                                            "username" " user@example.com "
                                            "password" "correct-password")))
          cookie (session-cookie login)
          consent-url (.get (.-headers login) "location")
          consent (<call (js/Request. consent-url #js {:headers #js {"cookie" cookie}}))
          consent-html (text-body consent)
          csrf (hidden-value consent-html "csrf")
          approved (<call (form-request "/oauth/consent"
                                        (assoc (authorize-fields client-id)
                                               "scope" scope
                                               "csrf" csrf
                                               "graph_id" "graph-1"
                                               "decision" "approve")
                                        cookie))
          location (.get (.-headers approved) "location")
          code (.get (.-searchParams (js/URL. location)) "code")]
    {:login login
     :cookie cookie
     :consent consent
     :consent-html consent-html
     :approved approved
     :location location
     :code code}))

(defn- <exchange [client-id code code-verifier]
  (<call (form-request "/oauth/token"
                       {"grant_type" "authorization_code"
                        "code" code
                        "client_id" client-id
                        "redirect_uri" redirect-uri
                        "code_verifier" code-verifier})))

(deftest sign-in-selects-a-graph-and-limits-the-access-token-test
  (async done
         (let [store (new-store)
               forwarded (atom [])
               calls (atom [])
               env (js/Object.assign
                    #js {"SEMANTIC_READ_RATE_LIMITER"
                         #js {:limit (fn [opts]
                                       (swap! calls conj (js->clj opts :keywordize-keys true))
                                       (p/resolved #js {:success true}))}
                         "SEMANTIC_WRITE_RATE_LIMITER"
                         #js {:limit (fn []
                                       (p/resolved #js {:success true}))}
                         "LOGSEQ_SYNC_DO"
                         #js {:idFromName (fn [graph-id] graph-id)
                              :get (fn [_]
                                     #js {:fetch (fn [request]
                                                   (swap! forwarded conj request)
                                                   (p/resolved (js/Response. "{\"ok\":true}"
                                                                             #js {:status 200
                                                                                  :headers #js {"content-type" "application/json"}})))})}}
                    db-env)]
           (finish
            (with-store store
              (fn []
                (p/let [client-id (<approved-client)
                        signed-in (<sign-in client-id "logseq/write logseq/read")
                        _ (is (string/includes?
                               (.get (.-headers (:consent signed-in)) "content-security-policy")
                               "https://app.example"))
                        token-response (<exchange client-id (:code signed-in) verifier)
                        token (json-body token-response)
                        reused (<exchange client-id (:code signed-in) verifier)
                        reused-body (json-body reused)
                        graphs (dispatch/handle-worker-fetch
                                (js/Request. "http://localhost/api/v1/graphs"
                                             #js {:headers #js {"authorization" (str "Bearer " (:access_token token))}})
                                env)
                        graphs-body (json-body graphs)
                        pages (dispatch/handle-worker-fetch
                               (js/Request. "http://localhost/api/v1/graphs/graph-1/pages"
                                            #js {:headers #js {"authorization" (str "Bearer " (:access_token token))}})
                               env)
                        other (dispatch/handle-worker-fetch
                               (js/Request. "http://localhost/api/v1/graphs/graph-2/pages"
                                            #js {:headers #js {"authorization" (str "Bearer " (:access_token token))}})
                               env)
                        write-only (<sign-in client-id "logseq/write")
                        write-token-response (<exchange client-id (:code write-only) verifier)
                        write-token (json-body write-token-response)
                        read-with-write-token (dispatch/handle-worker-fetch
                                               (js/Request. "http://localhost/api/v1/graphs/graph-1/pages"
                                                            #js {:headers #js {"authorization"
                                                                               (str "Bearer " (:access_token write-token))}})
                                               env)
                        read-with-write-body (json-body read-with-write-token)
                        other-body (json-body other)]
                  (is (= 303 (.-status (:login signed-in))))
                  (is (= "user@example.com" (:username (first (:cognito-calls @store)))))
                  (is (= "correct-password" (:password (first (:cognito-calls @store)))))
                  (is (not (string/includes? (or (:location signed-in) "") "correct-password")))
                  (is (string/includes? (:consent-html signed-in) "Ledger"))
                  (is (string/includes? (:consent-html signed-in) "value=\"graph-1\""))
                  (is (string/includes? (:consent-html signed-in) "value=\"approve\""))
                  (is (string/includes? (:consent-html signed-in) "Read pages"))
                  (is (string/includes? (:consent-html signed-in) "Create and edit"))
                  (is (= 303 (.-status (:approved signed-in))))
                  (is (string/starts-with? (:code signed-in) "logseq_oac_"))
                  (is (= "state-1" (.get (.-searchParams (js/URL. (:location signed-in))) "state")))
                  (is (= 200 (.-status token-response)))
                  (is (string/starts-with? (:access_token token) "logseq_oat_"))
                  (is (string/starts-with? (:refresh_token token) "logseq_ort_"))
                  (is (= "Bearer" (:token_type token)))
                  (is (= 3600 (:expires_in token)))
                  (is (= (+ 1700000000000 oauth/refresh-token-ttl-ms)
                         (:expires-at (first (vals (:refresh @store))))))
                  (is (= "graph-1" (:graph_id token)))
                  (is (= "logseq/read logseq/write" (:scope token)))
                  (is (not (some #(= (:access_token token) %)
                                 (mapcat vals (vals (select-keys @store [:access :refresh :codes]))))))
                  (is (= 400 (.-status reused)))
                  (is (= "invalid_grant" (:error reused-body)))
                  (is (= 200 (.-status graphs)))
                  (is (= ["graph-1"] (map :graph-id (:graphs graphs-body))))
                  (is (= 200 (.-status pages)))
                  (is (= 1 (count @forwarded)))
                  (is (= 403 (.-status other)))
                  (is (= "forbidden" (:error other-body)))
                  (is (= "logseq/write" (:scope write-token)))
                  (is (= 403 (.-status read-with-write-token)))
                  (is (= "insufficient scope" (:error read-with-write-body))))))
            done))))

(deftest denied-consent-wrong-pkce-and-bad-credentials-test
  (async done
         (let [store (new-store)]
           (finish
            (with-store store
              (fn []
                (p/let [client-id (<approved-client)
                        login (<call (form-request "/oauth/login"
                                                   (assoc (authorize-fields client-id)
                                                          "username" "user@example.com"
                                                          "password" "correct-password")))
                        cookie (session-cookie login)
                        consent-url (.get (.-headers login) "location")
                        consent (<call (js/Request. consent-url #js {:headers #js {"cookie" cookie}}))
                        consent-html (text-body consent)
                        csrf (hidden-value consent-html "csrf")
                        denied (<call (form-request "/oauth/consent"
                                                    (assoc (authorize-fields client-id)
                                                           "csrf" csrf
                                                           "decision" "deny")
                                                    cookie))
                        _ (is (empty? (:codes @store)))
                        bad-csrf (<call (form-request "/oauth/consent"
                                                      (assoc (authorize-fields client-id)
                                                             "csrf" "wrong"
                                                             "graph_id" "graph-1"
                                                             "decision" "approve")
                                                     cookie))
                        no-session (<call (form-request "/oauth/consent"
                                                        (assoc (authorize-fields client-id)
                                                               "csrf" csrf
                                                               "decision" "deny")))
                        signed-in (<sign-in client-id "logseq/read")
                        wrong-verifier (<exchange client-id (:code signed-in) (str verifier "x"))
                        consumed (<exchange client-id (:code signed-in) verifier)
                        _ (swap! store assoc :cognito-result {:error :invalid-credentials})
                        bad-login (<call (form-request "/oauth/login"
                                                       (assoc (authorize-fields client-id)
                                                              "username" "user@example.com"
                                                              "password" "hunter2-secret")))
                        bad-html (text-body bad-login)
                        _ (swap! store assoc :cognito-result {:error :unsupported-challenge})
                        challenge-login (<call (form-request "/oauth/login"
                                                             (assoc (authorize-fields client-id)
                                                                    "username" "user@example.com"
                                                                    "password" "correct-password")))
                        challenge-html (text-body challenge-login)]
                  (is (= 303 (.-status denied)))
                  (is (string/includes? (.get (.-headers denied) "location") "error=access_denied"))
                  (is (string/includes? (.get (.-headers denied) "location") "state=state-1"))
                  (is (empty? (:codes @store)) "denial does not mint a code")
                  (is (= 400 (.-status bad-csrf)))
                  (is (nil? (.get (.-headers bad-csrf) "location")))
                  (is (= 401 (.-status no-session)))
                  (is (= 400 (.-status wrong-verifier)))
                  (is (= 400 (.-status consumed)))
                  (is (= 401 (.-status bad-login)))
                  (is (not (string/includes? bad-html "hunter2-secret")))
                  (is (string/includes? bad-html "incorrect"))
                  (is (string/includes? challenge-html "extra sign-in step")))))
            done))))

(deftest refresh-rotates-and-stops-when-the-app-is-rejected-test
  (async done
         (let [store (new-store)]
           (finish
            (with-store store
              (fn []
                (p/let [client-id (<approved-client)
                        signed-in (<sign-in client-id "logseq/read logseq/write")
                        first-response (<exchange client-id (:code signed-in) verifier)
                        first-token (json-body first-response)
                        mismatched (<call (form-request "/oauth/token"
                                                        {"grant_type" "refresh_token"
                                                         "refresh_token" (:refresh_token first-token)
                                                         "client_id" "logseq_app_cccccccccccccccccccccccccccccccc"}))
                        refreshed (<call (form-request "/oauth/token"
                                                       {"grant_type" "refresh_token"
                                                        "refresh_token" (:refresh_token first-token)
                                                        "client_id" client-id}))
                        refreshed-body (json-body refreshed)
                        old-refresh (<call (form-request "/oauth/token"
                                                         {"grant_type" "refresh_token"
                                                          "refresh_token" (:refresh_token first-token)
                                                          "client_id" client-id}))
                        _ (swap! store assoc :now (+ 1700000000000 (* 2 60 60 1000)))
                        expired-access (dispatch/handle-worker-fetch
                                        (js/Request. "http://localhost/api/v1/graphs"
                                                     #js {:headers #js {"authorization"
                                                                        (str "Bearer " (:access_token refreshed-body))}})
                                        db-env)
                        rejected (<review! client-id "rejected")
                        rejected-refresh (<call (form-request "/oauth/token"
                                                              {"grant_type" "refresh_token"
                                                               "refresh_token" (:refresh_token refreshed-body)
                                                               "client_id" client-id}))]
                  (is (= 400 (.-status mismatched)))
                  (is (= 200 (.-status refreshed)))
                  (is (not= (:refresh_token first-token) (:refresh_token refreshed-body)))
                  (is (not= (:access_token first-token) (:access_token refreshed-body)))
                  (is (= "graph-1" (:graph_id refreshed-body)))
                  (is (= 400 (.-status old-refresh)))
                  (is (= 401 (.-status expired-access)))
                  (is (= 200 (.-status rejected)))
                  (is (= 400 (.-status rejected-refresh))))))
            done))))

(deftest expired-code-and-expired-session-test
  (async done
         (let [store (new-store)]
           (finish
            (with-store store
              (fn []
                (p/let [client-id (<approved-client)
                        signed-in (<sign-in client-id "logseq/read")
                        _ (swap! store assoc :now (+ 1700000000000 (* 6 60 1000)))
                        expired (<exchange client-id (:code signed-in) verifier)
                        login (<call (form-request "/oauth/login"
                                                   (assoc (authorize-fields client-id)
                                                          "username" "user@example.com"
                                                          "password" "correct-password")))
                        cookie (session-cookie login)
                        _ (swap! store assoc :now (+ (:now @store) (* 16 60 1000)))
                        authorize (<call (js/Request. (str "http://localhost" (authorize-path client-id "logseq/read"))
                                                     #js {:headers #js {"cookie" cookie}}))
                        html (text-body authorize)]
                  (is (= 400 (.-status expired)))
                  (is (string/includes? html "type=\"password\"")))))
            done))))

(deftest discovery-and-token-protocol-errors-test
  (async done
         (finish
          (p/let [discovery (<call (js/Request. "http://localhost/.well-known/oauth-authorization-server"))
                  body (json-body discovery)
                  missing-type (<call (js/Request. "http://localhost/oauth/token"
                                                   #js {:method "POST"
                                                        :headers #js {"content-type" "application/json"}
                                                        :body "{}"}))
                  missing-body (json-body missing-type)
                  unsupported (<call (form-request "/oauth/token" {"grant_type" "client_credentials"}))
                  unsupported-body (json-body unsupported)
                  configured (oauth-handler/<cognito-login #js {} "user" "password")]
            (is (= 200 (.-status discovery)))
            (is (= "http://localhost" (:issuer body)))
            (is (= "http://localhost/oauth/authorize" (:authorization_endpoint body)))
            (is (= "http://localhost/oauth/token" (:token_endpoint body)))
            (is (= ["S256"] (:code_challenge_methods_supported body)))
            (is (= ["logseq/read" "logseq/write"] (:scopes_supported body)))
            (is (= 400 (.-status missing-type)))
            (is (= "invalid_request" (:error missing-body)))
            (is (= "unsupported_grant_type" (:error unsupported-body)))
            (is (= :not-configured (:error configured))))
          done)))

(deftest pat-cannot-manage-oauth-apps-test
  (async done
         (finish
          (p/with-redefs [authorization/verify-jwt
                          (fn [_ _]
                            (p/rejected (ex-info "invalid" {})))]
            (p/let [response (<call (js/Request. "http://localhost/api/v1/oauth/apps"
                                                 #js {:headers #js {"authorization" "Bearer logseq_pat_not-a-login-token"}}))]
              (is (= 401 (.-status response)))))
          done)))

(deftest index-persists-oauth-rows-without-raw-secrets-test
  (async done
         (finish
          (p/let [insert (atom nil)
                  _ (p/with-redefs [common/<d1-run
                                    (fn [_ sql & args]
                                      (reset! insert {:sql sql :args args})
                                      (p/resolved #js {:meta #js {:changes 1}}))]
                      (index/<oauth-app-insert!
                       :db
                       {:id "logseq_app_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
                        :owner-user-id "user-1"
                        :name "Ledger"
                        :description nil
                        :redirect-uris [redirect-uri]
                        :status "pending"
                        :review-note nil
                        :created-at 1
                        :updated-at 1
                        :reviewed-at nil}))
                  lookup-sql (atom nil)
                  token (p/with-redefs [common/<d1-all
                                        (fn [_ sql & args]
                                          (reset! lookup-sql {:sql sql :args args})
                                          (p/resolved
                                           #js {:results #js [#js {"id" "token-1"
                                                                   "user_id" "user-1"
                                                                   "graph_id" "graph-1"
                                                                   "scope" "logseq/read"
                                                                   "expires_at" 50
                                                                   "app_status" "approved"}]}))]
                          (index/<oauth-access-token-by-hash :db "hashed"))
                  delete-sql (atom [])
                  _ (p/with-redefs [common/<d1-run
                                    (fn [_ sql & _]
                                      (swap! delete-sql conj (string/lower-case sql))
                                      (p/resolved #js {:meta #js {:changes 1}}))]
                      (index/<graph-delete-metadata! :db "graph-1"))
                  init-sql (atom [])
                  _ (p/with-redefs [common/<d1-all (fn [& _]
                                                    (p/resolved #js {:results #js []}))
                                    common/<d1-run (fn [_ sql & _]
                                                     (swap! init-sql conj (string/lower-case sql))
                                                     (p/resolved {:ok true}))]
                      (index/<index-init! :db))]
            (is (string/includes? (string/lower-case (:sql @insert)) "insert into oauth_apps"))
            (is (some #(= "pending" %) (:args @insert)))
            (is (some #(= (js/JSON.stringify (clj->js [redirect-uri])) %) (:args @insert)))
            (is (string/includes? (string/lower-case (:sql @lookup-sql)) "join oauth_apps"))
            (is (= "approved" (:app-status token)))
            (is (= "graph-1" (:graph-id token)))
            (is (some #(string/includes? % "delete from oauth_access_tokens") @delete-sql))
            (is (some #(string/includes? % "delete from oauth_refresh_tokens") @delete-sql))
            (is (some #(string/includes? % "delete from oauth_authorization_codes") @delete-sql))
            (is (some #(string/includes? % "oauth_apps") @init-sql))
            (is (some #(string/includes? % "oauth_login_sessions") @init-sql)))
          done)))

(deftest login-rejects-cross-origin-and-missing-origin-test
  (async done
         (let [store (new-store)]
           (finish
            (with-store store
              (fn []
                (p/let [client-id (<approved-client)]
                  (p/doseq [origin ["https://attacker.example" "null" nil]]
                    (let [request (form-request "/oauth/login"
                                                (assoc (authorize-fields client-id)
                                                       "username" "attacker"
                                                       "password" "attacker-password"))]
                      (if origin
                        (.set (.-headers request) "origin" origin)
                        (.delete (.-headers request) "origin"))
                      (p/let [response (<call request)]
                        (is (= 400 (.-status response)))
                        (is (nil? (.get (.-headers response) "set-cookie")))
                        (is (empty? (:sessions @store)))
                        (is (empty? (:cognito-calls @store)))))))))
            done))))

(deftest form-reader-cancels-oversized-stream-test
  (async done
         (let [reads (atom 0)
               cancelled? (atom false)
               stream (js/ReadableStream.
                       #js {:pull (fn [controller]
                                    (swap! reads inc)
                                    (if (<= @reads 20)
                                      (.enqueue controller (js/Uint8Array. 4096))
                                      (.close controller)))
                            :cancel (fn [] (reset! cancelled? true))}
                       #js {:highWaterMark 0})]
           (finish
            (p/let [params (oauth/<form-params
                            (js/Request. "http://localhost/oauth/token"
                                         #js {:method "POST" :body stream :duplex "half"}))
                    valid (oauth/<form-params (form-request "/oauth/token" {"name" "你好"}))]
              (is (= oauth/too-large-form params))
              (is @cancelled?)
              (is (< @reads 10))
              (is (= {"name" "你好"} valid)))
            done))))

(defn- with-real-oauth-db [f]
  (let [dir (.mkdtempSync fs (str (.tmpdir os) "/logseq-oauth-test-"))
        db (node-storage/open-index-db dir)]
    (-> (p/with-redefs [db-env #js {"DB" db "DB_SYNC_ADMIN_TOKEN" "admin-token"}
                        auth/auth-claims (fn [_ _] (p/resolved (rtc-claims)))
                        oauth-handler/<cognito-login
                        (fn [_ _ _] (p/resolved {:claims (rtc-claims)}))]
          (p/let [_ (index/<index-init! db)
                  _ (index/<index-upsert! db "graph-1" "Ledger" "user-1" "65" false)]
            (f db)))
        (p/finally (fn []
                     (.close db)
                     (.rmSync fs dir #js {:recursive true :force true}))))))

(deftest sqlite-oauth-issuance-is-atomic-test
  (async done
         (finish
          (with-real-oauth-db
            (fn [db]
              (p/let [client-id (<approved-client)]
                (p/doseq [table ["oauth_access_tokens" "oauth_refresh_tokens"]]
                  (p/let [signed-in (<sign-in client-id "logseq/read")
                          _ (.exec db (str "create trigger fail_token before insert on " table
                                           " begin select raise(abort, 'injected token failure'); end"))
                          failed (-> (<exchange client-id (:code signed-in) verifier)
                                     (p/catch (fn [_] :failed)))
                          _ (.exec db "drop trigger fail_token")
                          rows (.exec db "select count(*) as n from oauth_access_tokens")
                          retried (<exchange client-id (:code signed-in) verifier)
                          token (json-body retried)
                          refresh-params {"grant_type" "refresh_token"
                                          "client_id" client-id
                                          "refresh_token" (:refresh_token token)}
                          _ (.exec db (str "create trigger fail_token before insert on " table
                                           " begin select raise(abort, 'injected token failure'); end"))
                          failed-refresh (-> (<call (form-request "/oauth/token" refresh-params))
                                             (p/catch (fn [_] :failed)))
                          _ (.exec db "drop trigger fail_token")
                          retried-refresh (<call (form-request "/oauth/token" refresh-params))]
                    (is (= 500 (.-status failed)))
                    (is (= 200 (.-status retried)))
                    (is (= 500 (.-status failed-refresh)))
                    (is (= 200 (.-status retried-refresh)))
                    (is (= "no-store" (.get (.-headers retried) "cache-control")))
                    (is (= "no-cache" (.get (.-headers retried) "pragma")))
                    (is (= (if (= table "oauth_access_tokens") 0 2) (aget (first rows) "n"))))))))
          done)))

(deftest sqlite-oauth-single-winner-and-revocation-test
  (async done
         (finish
          (with-real-oauth-db
            (fn [_]
              (p/let [client-id (<approved-client)
                      signed-in (<sign-in client-id "logseq/read")
                      exchanged (p/all [(<exchange client-id (:code signed-in) verifier)
                                         (<exchange client-id (:code signed-in) verifier)])
                      success (first (filter #(= 200 (.-status %)) exchanged))
                      token (json-body success)
                      request (js/Request. "http://localhost/api/v1/graphs"
                                           #js {:headers #js {"authorization" (str "Bearer " (:access_token token))}})
                      before (auth/semantic-auth-claims request db-env)
                      _ (<review! client-id "rejected")
                      after (auth/semantic-auth-claims request db-env)
                      refresh (<call (form-request "/oauth/token"
                                                    {"grant_type" "refresh_token"
                                                     "client_id" client-id
                                                     "refresh_token" (:refresh_token token)}))]
                (is (= [200 400] (sort (map #(.-status %) exchanged))))
                (is (some? before))
                (is (nil? after))
                (is (= 400 (.-status refresh)))
                (is (= "no-store" (.get (.-headers refresh) "cache-control"))))))
          done)))

(deftest sqlite-oauth-removes-expired-records-test
  (async done
         (finish
          (with-real-oauth-db
            (fn [db]
              (p/let [client-id (<approved-client)
                      signed-in (<sign-in client-id "logseq/read")
                      response (<exchange client-id (:code signed-in) verifier)
                      _ (.exec db "update oauth_access_tokens set expires_at = 1")
                      _ (.exec db "update oauth_refresh_tokens set expires_at = 1")
                      _ (.exec db "update oauth_login_sessions set expires_at = 1")
                      abandoned (<sign-in client-id "logseq/read")
                      _ (.exec db "update oauth_authorization_codes set expires_at = 1")
                      current (<sign-in client-id "logseq/read")
                      exchanged (<exchange client-id (:code current) verifier)]
                (is (= 200 (.-status response)))
                (is (some? (:code abandoned)))
                (is (= 200 (.-status exchanged)))
                (doseq [table ["oauth_access_tokens" "oauth_refresh_tokens"
                               "oauth_login_sessions" "oauth_authorization_codes"]]
                  (let [rows (.exec db (str "select count(*) as n from " table " where expires_at = 1"))]
                    (is (zero? (aget (first rows) "n")) table))))))
          done)))

(deftest sqlite-oauth-code-cleanup-is-bounded-test
  (async done
         (finish
          (with-real-oauth-db
            (fn [db]
              (p/let [client-id (<approved-client)
                      _ (.exec db
                               (str "with recursive n(x) as (values(1) union all select x+1 from n where x<250) "
                                    "insert into oauth_authorization_codes "
                                    "select 'expired-' || x, 'app', 'user', 'graph', 'https://example.com', "
                                    "'logseq/read', 'pkce', 1, 0 from n"))
                      _ (index/<oauth-code-insert!
                         db {:code-hash "live" :app-id client-id :user-id "user-1" :graph-id "graph-1"
                             :redirect-uri redirect-uri :scope "logseq/read" :code-challenge challenge
                             :created-at 2 :expires-at 99999})
                      expired (.exec db "select count(*) as n from oauth_authorization_codes where expires_at = 1")
                      live (index/<oauth-code-by-hash db "live")]
                (is (= 150 (aget (first expired) "n")))
                (is (= "live" (:code-hash live))))))
          done)))
