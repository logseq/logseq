(ns logseq.cli.auth-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.test.node-helper :as node-helper]
            [logseq.cli.auth :as auth]
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
