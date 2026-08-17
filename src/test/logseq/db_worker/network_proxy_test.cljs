(ns logseq.db-worker.network-proxy-test
  (:require [cljs.test :refer [async deftest is]]
            [clojure.string :as string]
            [frontend.worker.platform :as platform]
            [goog.object :as gobj]
            [logseq.db-worker.network-proxy :as network-proxy]
            [promesa.core :as p]))

(def ^:private http (js/require "http"))
(def ^:private net (js/require "net"))

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

(defn- start-http-proxy
  []
  (p/create
   (fn [resolve reject]
     (let [hits (atom [])
           origin (.createServer http
                                 (fn [_req res]
                                   (.writeHead res 404 #js {"content-type" "text/plain"})
                                   (.end res "origin-via-proxy-404")))
           proxy (.createServer http
                                (fn [req res]
                                  (swap! hits conj [:request (.-method req) (.-url req)])
                                  (.writeHead res 404 #js {"content-type" "text/plain"})
                                  (.end res "proxy-404-via-proxy")))]
       (.on proxy "connect"
            (fn [req client-socket head]
              (swap! hits conj [:connect (.-url req)])
              (.listen origin 0 "127.0.0.1"
                       (fn []
                         (let [port (.-port (.address origin))
                               sock (.connect net port "127.0.0.1"
                                              (fn []
                                                (.write client-socket "HTTP/1.1 200 Connection Established\r\n\r\n")
                                                (when (and head (pos? (.-length head)))
                                                  (.write sock head))
                                                (.pipe sock client-socket)
                                                (.pipe client-socket sock)))]
                           (.on sock "close" (fn [] (.close origin)))
                           (.on sock "error" (fn [_]
                                               (try (.destroy client-socket) (catch :default _))
                                               (.close origin))))))))
       (.on proxy "error" reject)
       (.listen proxy 0 "127.0.0.1"
                (fn []
                  (resolve {:port (.-port (.address proxy))
                            :hits hits
                            :stop! (fn []
                                     (p/create
                                      (fn [resolve-close _]
                                        (try (.close origin) (catch :default _))
                                        (.close proxy (fn [] (resolve-close true))))))}))))))))

(defn- load-undici
  []
  (try
    (js/require "undici")
    (catch :default _
      nil)))

(deftest fetch-honors-applied-http-proxy-settings
  (async done
         (if-not (load-undici)
           (do
             (is false "undici is required for db-worker-node proxy dispatch")
             (done))
           (let [undici (load-undici)
                 prev-dispatcher (.getGlobalDispatcher undici)
                 target "http://192.0.2.1:8787/sync/deadbeef/pull"
                 stop!* (atom nil)]
             (-> (p/let [{:keys [port hits stop!]} (start-http-proxy)
                         _ (reset! stop!* stop!)
                         _ (network-proxy/apply-settings! {:type "http"
                                                           :host "127.0.0.1"
                                                           :port (str port)})
                         proxied (js/fetch target)
                         proxied-text (.text proxied)
                         _ (network-proxy/apply-settings! {:type "direct"})
                         direct-error (p/catch
                                       (js/fetch target #js {:signal (.timeout js/AbortSignal 1500)})
                                       (fn [e] e))]
                   (is (= 404 (.-status proxied)))
                   (is (string/includes? proxied-text "via-proxy"))
                   (is (seq @hits))
                   (is (some (fn [hit]
                               (let [[kind _method-or-url url] hit]
                                 (or (and (= :connect kind)
                                          (string/includes? (str _method-or-url) "192.0.2.1:8787"))
                                     (and (= :request kind)
                                          (string/includes? (str url) "192.0.2.1:8787")))))
                             @hits))
                   (is (some? direct-error))
                   (is (or (string/includes? (or (.-message direct-error) "") "fetch failed")
                           (string/includes? (or (.-message direct-error) "") "aborted")
                           (string/includes? (or (.-name direct-error) "") "Timeout")
                           (string/includes? (or (.-name direct-error) "") "Abort")
                           (string/includes? (or (.-code direct-error) "") "UND_ERR"))))
                 (p/catch (fn [e]
                            (is false (str e))))
                 (p/finally
                   (fn []
                     (.setGlobalDispatcher undici prev-dispatcher)
                     (let [stop! @stop!*]
                       (if stop!
                         (-> (stop!)
                             (p/finally (fn [] (done))))
                         (done))))))))))
