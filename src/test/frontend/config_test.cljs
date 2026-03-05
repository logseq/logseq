(ns frontend.config-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.config :as config]))

(deftest custom-url->ws-url-test
  (testing "https URL becomes wss"
    (is (= "wss://my-server.example.com/sync/%s"
           (config/custom-url->ws-url "https://my-server.example.com"))))

  (testing "http URL becomes ws"
    (is (= "ws://localhost:8787/sync/%s"
           (config/custom-url->ws-url "http://localhost:8787"))))

  (testing "trailing slashes are stripped"
    (is (= "wss://my-server.example.com/sync/%s"
           (config/custom-url->ws-url "https://my-server.example.com/")))
    (is (= "wss://my-server.example.com/sync/%s"
           (config/custom-url->ws-url "https://my-server.example.com///"))))

  (testing "preserves port in URL"
    (is (= "wss://example.com:3000/sync/%s"
           (config/custom-url->ws-url "https://example.com:3000"))))

  (testing "preserves subpath in host"
    ;; Users should only provide a base URL, but verify trailing path doesn't break things
    (is (= "wss://example.com/api/sync/%s"
           (config/custom-url->ws-url "https://example.com/api")))))

(deftest custom-url->http-base-test
  (testing "returns URL as-is when no trailing slash"
    (is (= "https://my-server.example.com"
           (config/custom-url->http-base "https://my-server.example.com"))))

  (testing "strips trailing slashes"
    (is (= "https://my-server.example.com"
           (config/custom-url->http-base "https://my-server.example.com/")))
    (is (= "https://my-server.example.com"
           (config/custom-url->http-base "https://my-server.example.com///"))))

  (testing "preserves http scheme"
    (is (= "http://localhost:8787"
           (config/custom-url->http-base "http://localhost:8787"))))

  (testing "preserves port"
    (is (= "https://example.com:3000"
           (config/custom-url->http-base "https://example.com:3000/")))))

(deftest default-urls-are-returned-when-no-custom-url
  (testing "db-sync-ws-url returns default when no custom URL is set"
    ;; In test environment, node-test? is true so get-custom-sync-server-url
    ;; always returns nil, meaning we always get the default
    (is (string? (config/db-sync-ws-url)))
    (is (= config/default-db-sync-ws-url (config/db-sync-ws-url))))

  (testing "db-sync-http-base returns default when no custom URL is set"
    (is (string? (config/db-sync-http-base)))
    (is (= config/default-db-sync-http-base (config/db-sync-http-base)))))

(deftest valid-sync-server-url?-test
  (testing "accepts http and https URLs"
    (is (config/valid-sync-server-url? "https://my-server.example.com"))
    (is (config/valid-sync-server-url? "http://localhost:8787")))

  (testing "rejects non-URL strings"
    (is (not (config/valid-sync-server-url? "not a url")))
    (is (not (config/valid-sync-server-url? "")))
    (is (not (config/valid-sync-server-url? nil)))))
