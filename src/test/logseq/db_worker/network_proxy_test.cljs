(ns logseq.db-worker.network-proxy-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.worker.platform :as platform]
            [goog.object :as gobj]
            [logseq.db-worker.network-proxy :as network-proxy]))
(deftest proxy-url-for-http-and-socks5-settings
  (is (= "http://127.0.0.1:10808"
         (network-proxy/proxy-url {:type "http" :host "127.0.0.1" :port "10808"})))
  (is (= "socks5://127.0.0.1:1080"
         (network-proxy/proxy-url {:protocol "socks5" :host "127.0.0.1" :port 1080})))
  (is (nil? (network-proxy/proxy-url {:type "system"})))
  (is (nil? (network-proxy/proxy-url {:type "direct"})))
  (is (nil? (network-proxy/proxy-url {:type "http" :host "127.0.0.1"}))))

(deftest child-env-for-http-direct-and-system
  (is (= {"LOGSEQ_NETWORK_PROXY" "http://127.0.0.1:10808"
          "NODE_USE_ENV_PROXY" "1"
          "HTTP_PROXY" "http://127.0.0.1:10808"
          "HTTPS_PROXY" "http://127.0.0.1:10808"
          "http_proxy" "http://127.0.0.1:10808"
          "https_proxy" "http://127.0.0.1:10808"
          "ALL_PROXY" nil
          "all_proxy" nil}
         (network-proxy/child-env {:type "http" :host "127.0.0.1" :port "10808"})))
  (is (= "socks5://127.0.0.1:1080"
         (get (network-proxy/child-env {:type "socks5" :host "127.0.0.1" :port "1080"})
              "ALL_PROXY")))
  (is (nil? (get (network-proxy/child-env {:type "socks5" :host "127.0.0.1" :port "1080"})
                 "HTTP_PROXY")))
  (let [direct (network-proxy/child-env {:type "direct"})]
    (is (= "direct" (get direct "LOGSEQ_NETWORK_PROXY")))
    (is (nil? (get direct "HTTP_PROXY")))
    (is (nil? (get direct "NODE_USE_ENV_PROXY"))))
  (is (nil? (network-proxy/child-env {:type "system"})))
  (is (nil? (network-proxy/child-env nil))))

(deftest merge-child-env-applies-http-proxy-and-strips-direct
  (let [process-env (.-env js/process)
        original-http (gobj/get process-env "HTTP_PROXY")
        original-https (gobj/get process-env "HTTPS_PROXY")
        original-all (gobj/get process-env "ALL_PROXY")]
    (try
      (gobj/set process-env "HTTP_PROXY" "http://inherited.example:8080")
      (gobj/set process-env "HTTPS_PROXY" "http://inherited.example:8080")
      (gobj/set process-env "ALL_PROXY" "socks5://inherited.example:1080")
      (let [http-env (js->clj (network-proxy/merge-child-env
                               (network-proxy/child-env {:type "http" :host "127.0.0.1" :port "10808"}))
                              :keywordize-keys false)
            direct-env (js->clj (network-proxy/merge-child-env
                                 (network-proxy/child-env {:type "direct"}))
                                :keywordize-keys false)
            inherited-env (js->clj (network-proxy/merge-child-env nil)
                                   :keywordize-keys false)]
        (is (= "1" (get http-env "ELECTRON_RUN_AS_NODE")))
        (is (= "http://127.0.0.1:10808" (get http-env "LOGSEQ_NETWORK_PROXY")))
        (is (= "http://127.0.0.1:10808" (get http-env "HTTP_PROXY")))
        (is (= "1" (get http-env "NODE_USE_ENV_PROXY")))
        (is (nil? (get http-env "ALL_PROXY")))
        (is (= "direct" (get direct-env "LOGSEQ_NETWORK_PROXY")))
        (is (nil? (get direct-env "HTTP_PROXY")))
        (is (nil? (get direct-env "HTTPS_PROXY")))
        (is (nil? (get direct-env "ALL_PROXY")))
        (is (nil? (get direct-env "NODE_USE_ENV_PROXY")))
        (is (= "http://inherited.example:8080" (get inherited-env "HTTP_PROXY")))
        (is (= "1" (get inherited-env "NODE_USE_ENV_PROXY"))))
      (finally
        (if original-http
          (gobj/set process-env "HTTP_PROXY" original-http)
          (gobj/remove process-env "HTTP_PROXY"))
        (if original-https
          (gobj/set process-env "HTTPS_PROXY" original-https)
          (gobj/remove process-env "HTTPS_PROXY"))
        (if original-all
          (gobj/set process-env "ALL_PROXY" original-all)
          (gobj/remove process-env "ALL_PROXY"))))))

(deftest remember-and-current-child-env
  (let [prev (network-proxy/current-child-env)]
    (try
      (network-proxy/remember-child-env! {:type "http" :host "127.0.0.1" :port "10808"})
      (is (= "http://127.0.0.1:10808"
             (get (network-proxy/current-child-env) "LOGSEQ_NETWORK_PROXY")))
      (network-proxy/remember-child-env! nil)
      (is (nil? (network-proxy/current-child-env)))
      (finally
        (reset! network-proxy/*child-env prev)))))

(deftest set-http-proxy-is-noop-without-platform-adapter
  (with-redefs [platform/maybe-current (constantly nil)]
    (is (nil? (platform/set-http-proxy! {:type "http" :host "127.0.0.1" :port "10808"})))))

(deftest set-http-proxy-uses-platform-http-capability
  (let [called (atom nil)]
    (with-redefs [platform/maybe-current
                  (fn []
                    {:http {:set-proxy! (fn [settings]
                                          (reset! called settings))}})]
      (platform/set-http-proxy! {:type "direct"})
      (is (= {:type "direct"} @called)))))

(defn- load-undici
  []
  (try
    (js/require "undici")
    (catch :default _
      nil)))

(deftest apply-settings-installs-proxy-agent-and-direct-agent
  (let [undici (load-undici)]
    (is (some? undici) "undici is required for db-worker-node proxy dispatch")
    (when undici
      (let [prev (.getGlobalDispatcher undici)]
        (try
          (let [proxy-dispatcher (network-proxy/apply-settings! {:type "http"
                                                                 :host "127.0.0.1"
                                                                 :port "10808"})
                direct-dispatcher (network-proxy/apply-settings! {:type "direct"})]
            (is (some? proxy-dispatcher))
            (is (= "ProxyAgent" (.-name (.-constructor proxy-dispatcher))))
            (is (= "Agent" (.-name (.-constructor direct-dispatcher))))
            (is (= direct-dispatcher (.getGlobalDispatcher undici))))
          (finally
            (.setGlobalDispatcher undici prev)))))))
