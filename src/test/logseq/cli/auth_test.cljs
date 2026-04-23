(ns logseq.cli.auth-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.test.node-helper :as node-helper]
            [logseq.cli.auth :as auth]
            [logseq.cli.test-helper :as test-helper]
            [promesa.core :as p]
            ["fs" :as fs]
            ["os" :as os]
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

(defn- read-json-file
  [path]
  (-> (fs/readFileSync path)
      (.toString "utf8")
      js/JSON.parse
      (js->clj :keywordize-keys true)))

(defn- call-private
  [sym & args]
  (when-let [v (get (ns-interns 'logseq.cli.auth) sym)]
    (apply @v args)))

(defn- jwt-with-claims
  [claims]
  (let [encode (fn [value]
                 (.toString (js/Buffer.from (js/JSON.stringify (clj->js value)) "utf8")
                            "base64url"))]
    (str (encode {:alg "none"
                  :typ "JWT"})
         "."
         (encode claims)
         ".signature")))

(deftest test-default-auth-path
  (is (= (node-path/join (.homedir os) "logseq" "auth.json")
         (auth/default-auth-path))))

(deftest test-write-auth-file-creates-parent-dir
  (let [dir (node-helper/create-tmp-dir "cli-auth")
        auth-dir (node-path/join dir "nested" "tokens")
        auth-path (node-path/join auth-dir "auth.json")
        payload (sample-auth)]
    (is (not (fs/existsSync auth-dir)))
    (auth/write-auth-file! {:auth-path auth-path} payload)
    (is (fs/existsSync auth-dir))
    (is (fs/existsSync auth-path))
    (when (fs/existsSync auth-path)
      (is (= payload (read-json-file auth-path))))))

(deftest test-read-auth-file-returns-nil-when-missing
  (let [dir (node-helper/create-tmp-dir "cli-auth")
        auth-path (node-path/join dir "missing" "auth.json")]
    (is (nil? (auth/read-auth-file {:auth-path auth-path})))))

(deftest test-delete-auth-file-is-idempotent
  (let [dir (node-helper/create-tmp-dir "cli-auth")
        auth-path (node-path/join dir "auth.json")]
    (auth/delete-auth-file! {:auth-path auth-path})
    (is (not (fs/existsSync auth-path)))
    (auth/write-auth-file! {:auth-path auth-path} (sample-auth))
    (is (fs/existsSync auth-path))
    (auth/delete-auth-file! {:auth-path auth-path})
    (is (not (fs/existsSync auth-path)))))

(deftest test-read-auth-file-invalid-json
  (let [dir (node-helper/create-tmp-dir "cli-auth")
        auth-path (node-path/join dir "auth.json")]
    (fs/writeFileSync auth-path "{\"provider\":")
    (try
      (auth/read-auth-file {:auth-path auth-path})
      (is false "expected invalid-auth-file error")
      (catch :default e
        (is (= :invalid-auth-file (-> e ex-data :code)))
        (is (= auth-path (-> e ex-data :auth-path)))))))

(deftest test-resolve-auth-token-refreshes-expired-token
  (async done
    (let [dir (node-helper/create-tmp-dir "cli-auth")
          auth-path (node-path/join dir "auth.json")
          refresh-calls (atom [])
          expired-auth (sample-auth {:id-token "expired-id-token"
                                     :access-token "expired-access-token"
                                     :expires-at 0})
          refreshed-auth (sample-auth {:id-token "fresh-id-token"
                                       :access-token "fresh-access-token"
                                       :refresh-token "refresh-token-1"
                                       :expires-at (+ (js/Date.now) 7200000)
                                       :updated-at 1735689600000})]
      (auth/write-auth-file! {:auth-path auth-path} expired-auth)
      (let [result-promise
            (p/with-redefs [auth/refresh-auth! (fn [opts auth-data]
                                                 (swap! refresh-calls conj [opts auth-data])
                                                 (p/resolved refreshed-auth))]
              (p/let [token (auth/resolve-auth-token! {:auth-path auth-path})
                      stored (auth/read-auth-file {:auth-path auth-path})]
                (is (= [[{:auth-path auth-path} expired-auth]] @refresh-calls))
                (is (= "fresh-id-token" token))
                (is (= refreshed-auth stored))
                (when (fs/existsSync auth-path)
                  (is (= refreshed-auth (read-json-file auth-path))))))]
        (-> result-promise
            (p/catch (fn [e]
                       (is false (str "unexpected error: " e))))
            (p/finally (fn []
                         (done))))))))

(deftest test-open-browser-fails-when-spawn-throws
  (async done
    (let [child-process (js/require "child_process")]
      (-> (test-helper/with-js-property-override
            child-process
            "spawn"
            (fn [& _]
              (throw (js/Error. "spawn failed")))
            (fn []
              (-> (auth/open-browser! "https://example.com")
                  (p/then (fn [_]
                            (is false "expected browser spawn failure")))
                  (p/catch (fn [e]
                             (is (= :browser-open-failed (-> e ex-data :code))))))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (done)))))))

(deftest test-open-browser-uses-cmd-start-on-windows
  (let [open-command (fn [platform url]
                       (call-private 'browser-open-command platform url))
        [command args] (open-command "win32"
                                     "https://example.com/oauth2/authorize?response_type=code&client_id=abc&redirect_uri=http%3A%2F%2Flocalhost%3A8765%2Fauth%2Fcallback")]
    (is (= "cmd.exe" command))
    (is (= ["/d" "/c"
            "start \"\" \"https://example.com/oauth2/authorize?response_type=code&client_id=abc&redirect_uri=http%3A%2F%2Flocalhost%3A8765%2Fauth%2Fcallback\""]
           args))))

(deftest test-open-browser-normalizes-prequoted-windows-url
  (let [open-command (fn [platform url]
                       (call-private 'browser-open-command platform url))
        [command args] (open-command "win32"
                                     "\"https://example.com/oauth2/authorize?response_type=code&client_id=abc&redirect_uri=http%3A%2F%2Flocalhost%3A8765%2Fauth%2Fcallback\"")]
    (is (= "cmd.exe" command))
    (is (= ["/d" "/c"
            "start \"\" \"https://example.com/oauth2/authorize?response_type=code&client_id=abc&redirect_uri=http%3A%2F%2Flocalhost%3A8765%2Fauth%2Fcallback\""]
           args))))

(deftest test-open-browser-uses-verbatim-windows-cmd-arguments
  (let [spawn-options (fn [platform]
                        (call-private 'browser-open-spawn-options platform))]
    (is (= {:detached true
            :stdio "ignore"
            :shell false
            :windowsVerbatimArguments true}
           (spawn-options "win32")))
    (is (= {:detached true
            :stdio "ignore"
            :shell false}
           (spawn-options "linux")))))

(deftest test-parse-jwt-fails-fast-on-invalid-token
  (let [parse-jwt (fn [jwt]
                    (call-private 'parse-jwt jwt))]
    (is (= {:sub "user-123"
            :email "user@example.com"
            :exp 1735689600}
           (parse-jwt (jwt-with-claims {:sub "user-123"
                                        :email "user@example.com"
                                        :exp 1735689600}))))
    (try
      (parse-jwt "not-a-jwt")
      (is false "expected invalid token to throw")
      (catch :default e
        (is (= :invalid-auth-token (-> e ex-data :code)))
        (is (= "not-a-jwt" (-> e ex-data :token)))))))

(deftest test-refresh-auth-fails-when-token-response-misses-id-token
  (async done
    (-> (p/with-redefs [auth/oauth-token-request! (fn [_params]
                                                    (p/resolved {:access_token "access-token-only"
                                                                 :refresh_token "refresh-token-1"}))]
          (-> (auth/refresh-auth! {:auth-path "/tmp/auth.json"}
                                  (sample-auth {:refresh-token "refresh-token-1"}))
              (p/then (fn [_]
                        (is false "expected refresh-auth! to reject when id_token is missing")))
              (p/catch (fn [e]
                         (is (= :auth-refresh-failed (-> e ex-data :code)))
                         (is (= :missing-id-token
                                (get-in (ex-data e) [:context :code])))))))
        (p/catch (fn [e]
                   (is false (str "unexpected error: " e))))
        (p/finally (fn []
                     (done))))))
