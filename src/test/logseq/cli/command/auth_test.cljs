(ns logseq.cli.command.auth-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.test.node-helper :as node-helper]
            [logseq.cli.auth :as cli-auth]
            [logseq.cli.command.auth :as auth-command]
            [logseq.common.cognito-config :as cognito-config]
            [promesa.core :as p]
            ["fs" :as fs]
            ["path" :as node-path]))

(defn- sample-auth
  ([]
   (sample-auth {}))
  ([overrides]
   (merge {:provider "cognito"
           :id-token "id-token-1"
           :access-token "access-token-1"
           :refresh-token "refresh-token-1"
           :expires-at (+ (js/Date.now) 3600000)
           :sub "user-123"
           :email "user@example.com"
           :updated-at 1735686000000}
          overrides)))

(deftest test-login-opens-browser-with-authorize-url-and-persists-auth
  (async done
    (let [dir (node-helper/create-tmp-dir "cli-auth")
          auth-path (node-path/join dir "auth.json")
          open-calls (atom [])
          exchange-calls (atom [])
          write-calls (atom [])
          auth-data (sample-auth)
          callback-server {:port 8765
                           :redirect-uri "http://localhost:8765/auth/callback"
                           :wait! (fn [] (p/resolved {:code "oauth-code"}))
                           :stop! (fn [] (p/resolved true))}]
      (-> (p/with-redefs [cognito-config/CLI-COGNITO-CLIENT-ID "69cs1lgme7p8kbgld8n5kseii6"
                          cli-auth/start-login-callback-server! (fn [_opts]
                                                                  (p/resolved callback-server))
                          cli-auth/open-browser! (fn [url]
                                                   (swap! open-calls conj url)
                                                   (p/resolved {:opened? true}))
                          cli-auth/exchange-code-for-auth! (fn [opts payload]
                                                             (swap! exchange-calls conj [opts payload])
                                                             (p/resolved auth-data))
                          cli-auth/write-auth-file! (fn [opts payload]
                                                      (swap! write-calls conj [opts payload])
                                                      payload)]
            (p/let [result (cli-auth/login! {:auth-path auth-path})
                    authorize-url (first @open-calls)]
              (is (= 1 (count @open-calls)))
              (is (string? authorize-url))
              (is (re-find #"/oauth2/authorize" authorize-url))
              (is (re-find #"response_type=code" authorize-url))
              (is (re-find #"client_id=69cs1lgme7p8kbgld8n5kseii6" authorize-url))
              (is (re-find #"redirect_uri=http%3A%2F%2Flocalhost%3A8765%2Fauth%2Fcallback" authorize-url))
              (is (re-find #"state=" authorize-url))
              (is (re-find #"code_challenge=" authorize-url))
              (is (= 1 (count @exchange-calls)))
              (let [[exchange-opts exchange-payload] (first @exchange-calls)]
                (is (= {:auth-path auth-path} exchange-opts))
                (is (= "oauth-code" (:code exchange-payload)))
                (is (= "http://localhost:8765/auth/callback" (:redirect-uri exchange-payload)))
                (is (string? (:code-verifier exchange-payload))))
              (is (= [[{:auth-path auth-path} auth-data]] @write-calls))
              (is (= auth-path (:auth-path result)))
              (is (= "user@example.com" (:email result)))
              (is (= "user-123" (:sub result)))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn [] (done)))))))

(deftest test-login-validates-state-before-code-exchange
  (async done
    (let [exchange-calls (atom [])]
      (-> (p/with-redefs [cli-auth/open-browser! (fn [authorize-url]
                                                   (let [parsed (js/URL. authorize-url)
                                                         redirect-uri (.get (.-searchParams parsed) "redirect_uri")]
                                                     (-> (js/fetch (str redirect-uri "?code=oauth-code&state=wrong-state"))
                                                         (p/then (fn [_]
                                                                   {:opened? true})))) )
                          cli-auth/exchange-code-for-auth! (fn [opts payload]
                                                             (swap! exchange-calls conj [opts payload])
                                                             (p/resolved (sample-auth)))]
            (-> (cli-auth/login! {:timeout-ms 200})
                (p/then (fn [_]
                          (is false "expected invalid callback state error")))
                (p/catch (fn [e]
                           (is (= :invalid-callback-state (-> e ex-data :code)))
                           (is (= [] @exchange-calls))))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn [] (done)))))))

(deftest test-login-timeout-when-no-browser-callback-arrives
  (async done
    (let [exchange-calls (atom [])]
      (-> (p/with-redefs [cli-auth/open-browser! (fn [_authorize-url]
                                                   (p/resolved {:opened? false}))
                          cli-auth/exchange-code-for-auth! (fn [opts payload]
                                                             (swap! exchange-calls conj [opts payload])
                                                             (p/resolved (sample-auth)))]
            (-> (cli-auth/login! {:login-timeout-ms 10})
                (p/then (fn [_]
                          (is false "expected login timeout error")))
                (p/catch (fn [e]
                           (is (= :login-timeout (-> e ex-data :code)))
                           (is (= [] @exchange-calls))))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn [] (done)))))))

(deftest test-login-ignores-global-request-timeout-for-callback-wait
  (async done
    (let [exchange-calls (atom [])]
      (-> (p/with-redefs [cli-auth/open-browser! (fn [_authorize-url]
                                                   (p/resolved {:opened? false}))
                          cli-auth/exchange-code-for-auth! (fn [opts payload]
                                                             (swap! exchange-calls conj [opts payload])
                                                             (p/resolved (sample-auth)))]
            (-> (cli-auth/login! {:timeout-ms 10
                                  :login-timeout-ms 200})
                (p/then (fn [_]
                          (is false "expected login timeout error")))
                (p/catch (fn [e]
                           (is (= :login-timeout (-> e ex-data :code)))
                           (is (= [] @exchange-calls))))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn [] (done)))))))

(deftest test-logout-removes-auth-file-and-completes-cognito-logout-when-file-existed
  (async done
    (let [dir (node-helper/create-tmp-dir "cli-auth")
          auth-path (node-path/join dir "auth.json")
          open-calls (atom [])]
      (cli-auth/write-auth-file! {:auth-path auth-path} (sample-auth))
      (is (fs/existsSync auth-path))
      (-> (p/with-redefs [cognito-config/CLI-COGNITO-CLIENT-ID "69cs1lgme7p8kbgld8n5kseii6"
                          cli-auth/open-browser! (fn [url]
                                                   (swap! open-calls conj url)
                                                   (let [parsed (js/URL. url)
                                                         logout-uri (.get (.-searchParams parsed) "logout_uri")]
                                                     (-> (js/fetch logout-uri)
                                                         (p/then (fn [_]
                                                                   {:opened? true})))))]
            (p/let [result (cli-auth/logout! {:auth-path auth-path})
                    logout-url (first @open-calls)]
              (is (= 1 (count @open-calls)))
              (is (= auth-path (:auth-path result)))
              (is (true? (:deleted? result)))
              (is (true? (:opened? result)))
              (is (true? (:logout-completed? result)))
              (is (not (fs/existsSync auth-path)))
              (is (string? logout-url))
              (when (string? logout-url)
                (is (re-find #"/logout\?" logout-url))
                (is (re-find #"client_id=69cs1lgme7p8kbgld8n5kseii6" logout-url))
                (is (re-find #"logout_uri=http%3A%2F%2Flocalhost%3A8765%2Flogout-complete" logout-url)))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn [] (done)))))))

(deftest test-logout-completes-cognito-logout-when-auth-file-is-already-absent
  (async done
    (let [dir (node-helper/create-tmp-dir "cli-auth")
          auth-path (node-path/join dir "auth.json")
          open-calls (atom [])]
      (-> (p/with-redefs [cognito-config/CLI-COGNITO-CLIENT-ID "69cs1lgme7p8kbgld8n5kseii6"
                          cli-auth/open-browser! (fn [url]
                                                   (swap! open-calls conj url)
                                                   (let [parsed (js/URL. url)
                                                         logout-uri (.get (.-searchParams parsed) "logout_uri")]
                                                     (-> (js/fetch logout-uri)
                                                         (p/then (fn [_]
                                                                   {:opened? true})))))]
            (p/let [result (cli-auth/logout! {:auth-path auth-path})
                    logout-url (first @open-calls)]
              (is (= 1 (count @open-calls)))
              (is (= auth-path (:auth-path result)))
              (is (false? (:deleted? result)))
              (is (true? (:opened? result)))
              (is (true? (:logout-completed? result)))
              (is (not (fs/existsSync auth-path)))
              (is (string? logout-url))
              (when (string? logout-url)
                (is (re-find #"logout_uri=http%3A%2F%2Flocalhost%3A8765%2Flogout-complete" logout-url)))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn [] (done)))))))

(deftest test-command-execute-login-and-logout
  (async done
    (let [login-calls (atom [])
          logout-calls (atom [])]
      (-> (p/with-redefs [cli-auth/login! (fn [config]
                                            (swap! login-calls conj config)
                                            (p/resolved {:auth-path "/tmp/auth.json"
                                                         :email "user@example.com"
                                                         :sub "user-123"}))
                          cli-auth/logout! (fn [config]
                                             (swap! logout-calls conj config)
                                             {:auth-path "/tmp/auth.json"
                                              :deleted? true})]
            (p/let [login-result (auth-command/execute {:type :login} {:auth-path "/tmp/auth.json"})
                    logout-result (auth-command/execute {:type :logout} {:auth-path "/tmp/auth.json"})]
              (is (= [{:auth-path "/tmp/auth.json"}] @login-calls))
              (is (= [{:auth-path "/tmp/auth.json"}] @logout-calls))
              (is (= :ok (:status login-result)))
              (is (= "user@example.com" (get-in login-result [:data :email])))
              (is (= :ok (:status logout-result)))
              (is (true? (get-in logout-result [:data :deleted?])))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn [] (done)))))))
