(ns electron.utils
  (:require ["electron" :refer [app BrowserWindow session]]
            ["fs-extra" :as fs]
            ["node-fetch" :default node-fetch]
            ["open" :as open-module]
            ["path" :as node-path]
            [cljs-bean.core :as bean]
            [clojure.string :as string]
            [electron.configs :as cfgs]
            [electron.interop :as interop]
            [electron.logger :as logger]
            [logseq.melange.bridge.common.api :as melange-common]
            [logseq.melange.bridge.platform.node :as platform-node]
            [promesa.core :as p]))

(defonce *win (atom nil)) ;; The main window

(defonce mac? (= (.-platform js/process) "darwin"))
(defonce win32? (= (.-platform js/process) "win32"))
(defonce linux? (= (.-platform js/process) "linux"))

(defonce prod? (= js/process.env.NODE_ENV "production"))

(defonce dev? (not prod?))
(defonce *fetchAgent (atom nil))
(defonce extract-zip (js/require "extract-zip"))
(defonce https-proxy-agent (js/require "https-proxy-agent"))
(defonce socks-proxy-agent (js/require "socks-proxy-agent"))
(defonce open-external
  (interop/default-function-or-module open-module))

(declare <resolve-fetch-proxy)

(defn open
  ([target] (open target nil))
  ([target options]
   (if options
     (open-external target (bean/->js options))
     (open-external target))))

(defn- <build-fetch-agent
  [{:keys [protocol host port]}]
  (when (and protocol host port (contains? #{"http" "socks5"} protocol))
    (let [proxy-url (str protocol "://" host ":" port)]
      (if-let [ctor (case protocol
                     "http" (.-HttpsProxyAgent ^js https-proxy-agent)
                     "socks5" (.-SocksProxyAgent ^js socks-proxy-agent)
                     nil)]
        (new ctor proxy-url)
        (do
          (logger/error "Unknown proxy protocol:" protocol)
          nil)))))

(defn- <resolve-fetch-agent
  [url options]
  (let [options (or options {})]
    (cond
      (contains? options :agent)
      (:agent options)

      (contains? options :proxy)
      (p/let [proxy (<resolve-fetch-proxy url (:proxy options))]
        (<build-fetch-agent proxy))

      :else
      @*fetchAgent)))

(defn- ->proxy-config
  [{:keys [type protocol host port] :or {type "system"}}]
  (let [type (or type protocol)
        ->proxy-rules (fn [proxy-type proxy-host proxy-port]
                        (cond
                          (= proxy-type "http")
                          (str "http=" proxy-host ":" proxy-port ";https=" proxy-host ":" proxy-port)
                          (= proxy-type "socks5")
                          (str "http=socks5://" proxy-host ":" proxy-port ";https=socks5://" proxy-host ":" proxy-port)
                          (or (= proxy-type "socks") (= proxy-type "socks4"))
                          (str "http=socks://" proxy-host ":" proxy-port ";https=socks://" proxy-host ":" proxy-port)
                          (= proxy-type "direct")
                          "direct://"
                          :else
                          nil))]
    (cond
      (= type "system")
      #js {:mode "system"}

      (= type "direct")
      #js {:mode "direct"}

      (or (= type "socks5") (= type "http"))
      #js {:mode "fixed_servers"
           :proxyRules (->proxy-rules type host port)
           :proxyBypassRules "<local>"}

      :else
      #js {:mode "system"})))

(defn fetch
  ([url] (fetch url nil))
  ([url options]
   (let [options (or options {})]
     (p/let [agent (<resolve-fetch-agent url options)]
       (node-fetch url (bean/->js (cond-> (dissoc options :proxy)
                                    (some? agent) (assoc :agent agent))))))))

(defn fix-win-path!
  [path]
  (when (not-empty path)
    (if win32?
      (string/replace path "\\" "/")
      path)))

(defn to-native-win-path!
  "Convert path to native win path"
  [path]
  (when (not-empty path)
    (if win32?
      (string/replace path "/" "\\")
      path)))

(defn get-ls-dotdir-root
  []
  (let [lg-dir (node-path/join (.getPath app "home") ".logseq")]
    (when-not (fs/existsSync lg-dir)
      (fs/mkdirSync lg-dir))
    (fix-win-path! lg-dir)))

(defn get-ls-default-plugins
  []
  (let [plugins-root (node-path/join (get-ls-dotdir-root) "plugins")
        _ (when-not (fs/existsSync plugins-root)
            (fs/mkdirSync plugins-root))
        dirs (js->clj (fs/readdirSync plugins-root #js{"withFileTypes" true}))
        dirs (->> dirs
                  (filter #(.isDirectory %))
                  (filter (fn [f] (not (some #(string/starts-with? (.-name f) %) ["_" "."]))))
                  (map #(node-path/join plugins-root (.-name %))))]
    dirs))

(defn- set-fetch-agent-proxy
  "Set proxy for fetch agent(plugin system)
  protocol: http | socks5"
  [proxy]
  (if proxy
    (p/let [agent (<build-fetch-agent proxy)]
      (reset! *fetchAgent agent))
    (reset! *fetchAgent nil)))

(defn <set-electron-proxy
  "Set proxy for electron
  type: system | direct | socks5 | http"
  ([{:keys [type host port] :or {type "system"}}]
   (let [config (->proxy-config {:type type :host host :port port})
         sess (.. ^js @*win -webContents -session)]
     (if sess
       (p/do!
        (.setProxy sess config)
        (.forceReloadProxyConfig sess))
       (p/resolved nil)))))

(defn- parse-pac-rule
  "Parse Proxy Auto Config(PAC) line"
  [line]
  (let [parts (string/split line #"[ :]")
        type (first parts)]
    (cond
      (= type "DIRECT")
      nil

      (and (contains? #{"PROXY" "HTTP" "SOCKS"} type)
           (>= (count parts) 3))
      {:protocol (if (= type "SOCKS") "socks5" "http")
       :host (nth parts 1)
       :port (nth parts 2)}

      :else
      (do
        (logger/warn "Unknown PAC rule:" line)
        nil))))

(defn- <resolve-session-proxy
  [^js sess for-url]
  (p/let [proxy (.resolveProxy sess for-url)
          pac-opts (->> (string/split proxy #";")
                        (map parse-pac-rule)
                        (remove nil?))]
    (when (seq pac-opts)
      (first pac-opts))))

(defn <get-system-proxy
  "Get system proxy for url, requires proxy to be set to system"
  ([] (<get-system-proxy "https://www.google.com"))
  ([for-url]
   (when-let [sess (.. ^js @*win -webContents -session)]
     (<resolve-session-proxy sess for-url))))

(defn- <resolve-temporary-system-proxy
  [for-url]
  (let [session-partition (str "logseq-system-proxy-" (random-uuid))
        ^js sess (.fromPartition session session-partition)]
    (p/do!
     (.setProxy sess #js {:mode "system"})
     (.forceReloadProxyConfig sess)
     (<resolve-session-proxy sess for-url))))

(defn- <resolve-fetch-proxy
  [url {:keys [type protocol host port] :as proxy}]
  (let [type (or type protocol)]
    (cond
      (string/blank? type)
      nil

      (= type "system")
      (<resolve-temporary-system-proxy url)

      (= type "direct")
      nil

      (contains? #{"http" "socks5"} type)
      {:protocol type :host host :port port}

      :else
      (do
        (logger/warn "Unknown fetch proxy type:" proxy)
        nil))))

(defn <set-proxy
  "Set proxy for electron, fetch"
  ([{:keys [type host port] :or {type "system"} :as opts}]
   (logger/info "set proxy to" opts)
   (cond
     (= type "system")
     (p/let [_ (<set-electron-proxy {:type "system"})
             proxy (<get-system-proxy)]
       (set-fetch-agent-proxy proxy))

     (= type "direct")
     (p/let [_ (<set-electron-proxy {:type "direct"})]
       (set-fetch-agent-proxy nil))

     (or (= type "socks5") (= type "http"))
     (p/let [_ (<set-electron-proxy {:type type :host host :port port})]
       (set-fetch-agent-proxy {:protocol type :host host :port port}))

     :else
     (logger/error "Unknown proxy type:" type))))

(defn <restore-proxy-settings
  "Restore proxy settings from configs.edn"
  []
  (let [settings (cfgs/get-item :settings/agent)
        settings (cond
                   (:type settings)
                   settings

                   ;; migration from old config
                   (not-empty (:protocol settings))
                   (assoc settings :type (:protocol settings))

                   :else
                   {:type "system"})]
    (logger/info "restore proxy settings" settings)
    (<set-proxy settings)))

(defn save-proxy-settings
  "Save proxy settings to configs.edn"
  [{test' :test :keys [type host port] :or {type "system"}}]
  (if (or (= type "system") (= type "direct"))
    (cfgs/set-item! :settings/agent {:type type :test test'})
    (cfgs/set-item! :settings/agent {:type type :protocol type :host host :port port :test test'})))

(defn read-file-raw
  [path]
  (fs/readFileSync path))

(defn read-file
  [path]
  (try
    (when (fs/existsSync path)
      (.toString (fs/readFileSync path)))
    (catch :default e
      (logger/error "Read file:" e))))

(defn get-focused-window
  []
  (.getFocusedWindow BrowserWindow))

(defn get-win-from-sender
  [^js evt]
  (try
    (.fromWebContents BrowserWindow (.-sender evt))
    (catch :default _
      nil)))

(defn send-to-renderer
  "Notice: pass the `window` parameter if you can. Otherwise, the message
  will not be received if there's no focused window.
   Use `send-to-focused-renderer` instead if you want to set a window for fallback"
  ([kind payload]
   (send-to-renderer (get-focused-window) kind payload))
  ([window kind payload]
   (when window
     (.. ^js window -webContents
         (send (name kind) (bean/->js payload))))))

(defn send-to-focused-renderer
  "Try to send to focused window. If no focused window, fallback to the `fallback-win`"
  ([kind payload fallback-win]
   (let [focused-win (get-focused-window)
         win         (if focused-win focused-win fallback-win)]
     (send-to-renderer win kind payload))))

(defn get-graph-dir
  "required by all internal state in the electron section"
  [graph-name]
  (when (and (string? graph-name)
             (string/starts-with? graph-name melange-common/db-version-prefix))
    (let [repo (melange-common/canonicalize-db-version-repo graph-name)]
      (node-path/join (platform-node/get-db-graphs-dir)
                      (melange-common/repo-to-encoded-graph-dir-name repo)))))

(comment
  (defn get-graph-name
    "Reverse `get-graph-dir`"
    [graph-dir]
    (str melange-common/db-version-prefix (node-path/basename graph-dir))))

(defn decode-protected-assets-schema-path
  [schema-path]
  (cond-> schema-path
    (string? schema-path)
    (string/replace "/logseq__colon/" ":/")))

;; Keep update with the normalization in main
(defn normalize
  [s]
  (.normalize s "NFC"))

(defn normalize-lc
  [s]
  (normalize (string/lower-case s)))

(defn safe-decode-uri-component
  [uri]
  (try
    (js/decodeURIComponent uri)
    (catch :default _
      (println "decodeURIComponent failed: " uri)
      uri)))

(defn fs-stat->clj
  [path]
  (let [stat (fs/statSync path)]
    {:size (.-size stat)
     :birthtime (.-birthtime stat)
     :mtime (.-mtime stat)
     :ctime (.-ctime stat)}))
