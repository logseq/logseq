(ns logseq.db-worker.network-proxy
  "Apply Network Proxy settings to Node undici fetch used by db-worker-node."
  (:require [clojure.string :as string]
            [lambdaisland.glogi :as log]))

(def ^:private proxy-env-keys
  ["HTTP_PROXY" "HTTPS_PROXY" "ALL_PROXY"
   "http_proxy" "https_proxy" "all_proxy"
   "NODE_USE_ENV_PROXY" "LOGSEQ_NETWORK_PROXY"])

(defn- proxy-type
  [{:keys [type protocol]}]
  (or type protocol))

(defn proxy-url
  "Return http://host:port or socks5://host:port for explicit proxy settings."
  [settings]
  (let [type (proxy-type settings)
        host (:host settings)
        port (:port settings)]
    (when (and (contains? #{"http" "socks5"} type)
               (not (string/blank? (str host)))
               (some? port)
               (not (string/blank? (str port))))
      (str type "://" host ":" port))))

(defn child-env
  "Env overlay for a spawned db-worker-node process.

  nil values mean the key should be deleted so a `direct` proxy ignores inherited
  HTTP_PROXY. nil return means leave the parent environment unchanged."
  [settings]
  (let [type (proxy-type settings)]
    (cond
      (= "direct" type)
      (into {"LOGSEQ_NETWORK_PROXY" "direct"}
            (map (fn [k] [k nil]) (remove #{"LOGSEQ_NETWORK_PROXY"} proxy-env-keys)))

      (seq (proxy-url settings))
      (let [url (proxy-url settings)]
        (cond-> {"LOGSEQ_NETWORK_PROXY" url
                 "NODE_USE_ENV_PROXY" "1"}
          (= "http" type)
          (assoc "HTTP_PROXY" url
                 "HTTPS_PROXY" url
                 "http_proxy" url
                 "https_proxy" url
                 "ALL_PROXY" nil
                 "all_proxy" nil)

          (= "socks5" type)
          (assoc "ALL_PROXY" url
                 "all_proxy" url
                 "HTTP_PROXY" nil
                 "HTTPS_PROXY" nil
                 "http_proxy" nil
                 "https_proxy" nil)))

      :else
      nil)))

(defonce *child-env (atom nil))

(defn remember-child-env!
  [settings]
  (reset! *child-env (child-env settings)))

(defn current-child-env
  []
  @*child-env)

(defn- load-undici
  []
  (when (exists? js/process)
    (try
      (js/require "undici")
      (catch :default e
        (log/warn :db-sync/undici-unavailable {:error e})
        nil))))

(defn- env-proxy-url
  []
  (when (exists? js/process)
    (let [env (.-env js/process)]
      (or (aget env "LOGSEQ_NETWORK_PROXY")
          (aget env "HTTPS_PROXY")
          (aget env "https_proxy")
          (aget env "HTTP_PROXY")
          (aget env "http_proxy")
          (aget env "ALL_PROXY")
          (aget env "all_proxy")))))

(defn- ->dispatcher
  [^js undici settings]
  (let [Agent (.-Agent undici)
        ProxyAgent (.-ProxyAgent undici)
        EnvHttpProxyAgent (.-EnvHttpProxyAgent undici)
        type (proxy-type settings)
        url (or (proxy-url settings)
                (when (and (string? (env-proxy-url))
                           (not= "direct" (env-proxy-url))
                           (or (nil? settings)
                               (= "system" type)))
                  (env-proxy-url)))]
    (cond
      (= "direct" type)
      (new Agent)

      (= "direct" url)
      (new Agent)

      (and (string? url)
           (or (string/starts-with? url "http://")
               (string/starts-with? url "https://")
               (string/starts-with? url "socks5://")))
      (try
        (new ProxyAgent url)
        (catch :default e
          (log/warn :db-sync/proxy-agent-failed {:url url :error e})
          (new EnvHttpProxyAgent)))

      :else
      (new EnvHttpProxyAgent))))

(defn apply-settings!
  "Set undici's global dispatcher so js/fetch honors Network Proxy settings.
   nil / :system falls back to HTTP_PROXY via EnvHttpProxyAgent."
  [settings]
  (when-let [undici (load-undici)]
    (let [dispatcher (->dispatcher undici settings)]
      (.setGlobalDispatcher undici dispatcher)
      dispatcher)))

(defn- url->settings
  [url]
  (try
    (let [parsed (js/URL. url)
          protocol (string/replace (.-protocol parsed) #":$" "")]
      (when (contains? #{"http" "https" "socks5"} protocol)
        {:type (if (= "https" protocol) "http" protocol)
         :host (.-hostname parsed)
         :port (.-port parsed)}))
    (catch :default _
      nil)))

(defn apply-from-process-env!
  []
  (let [url (env-proxy-url)]
    (when (seq url)
      (apply-settings!
       (if (= "direct" url)
         {:type "direct"}
         (url->settings url))))))

(defn merge-child-env
  "Build the env object passed to child_process.spawn."
  [extra-env]
  (let [env (js/Object.assign #js {} (.-env js/process) #js {:ELECTRON_RUN_AS_NODE "1"})]
    (when extra-env
      (doseq [[k v] extra-env]
        (let [k (if (keyword? k) (name k) (str k))]
          (if (nil? v)
            (js-delete env k)
            (aset env k (str v))))))
    (let [direct? (= "direct" (aget env "LOGSEQ_NETWORK_PROXY"))
          has-proxy-url? (or (and (seq (aget env "LOGSEQ_NETWORK_PROXY"))
                                  (not direct?))
                             (seq (aget env "HTTP_PROXY"))
                             (seq (aget env "HTTPS_PROXY"))
                             (seq (aget env "http_proxy"))
                             (seq (aget env "https_proxy"))
                             (seq (aget env "ALL_PROXY"))
                             (seq (aget env "all_proxy")))]
      (if direct?
        (doseq [k (remove #{"LOGSEQ_NETWORK_PROXY"} proxy-env-keys)]
          (js-delete env k))
        (when (and has-proxy-url?
                   (not (seq (aget env "NODE_USE_ENV_PROXY"))))
          (aset env "NODE_USE_ENV_PROXY" "1"))))
    env))
