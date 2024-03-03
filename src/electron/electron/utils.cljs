(ns electron.utils
  (:require ["@logseq/rsapi" :as rsapi]
            ["electron" :refer [app BrowserWindow]]
            ["fs-extra" :as fs]
            ["path" :as node-path]
            [clojure.string :as string]
            [electron.configs :as cfgs]
            [electron.logger :as logger]
            [cljs-bean.core :as bean]
            [promesa.core :as p]))

(defonce *win (atom nil)) ;; The main window

(defonce mac? (= (.-platform js/process) "darwin"))
(defonce win32? (= (.-platform js/process) "win32"))
(defonce linux? (= (.-platform js/process) "linux"))

(defonce prod? (= js/process.env.NODE_ENV "production"))

;; Under e2e testing?
(defonce ci? (let [v js/process.env.CI]
               (or (true? v)
                   (= v "true"))))

(defonce dev? (not prod?))
(defonce *fetchAgent (atom nil))

(defonce open (js/require "open"))
(defonce HttpsProxyAgent (.-HttpsProxyAgent (js/require "https-proxy-agent")))
(defonce SocksProxyAgent (.-SocksProxyAgent (js/require "socks-proxy-agent")))
(defonce _fetch (js/require "node-fetch"))
(defonce extract-zip (js/require "extract-zip"))

(defn fetch
  ([url] (fetch url nil))
  ([url options]
   (_fetch url (bean/->js (merge options {:agent @*fetchAgent})))))

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
  [{:keys [protocol host port]}]
  (if (and protocol host port (or (= protocol "http") (= protocol "socks5")))
    (let [proxy-url (str protocol "://" host ":" port)]
      (condp = protocol
        "http"
        (reset! *fetchAgent (new HttpsProxyAgent proxy-url))
        "socks5"
        (reset! *fetchAgent (new SocksProxyAgent proxy-url))
        (logger/error "Unknown proxy protocol:" protocol)))
    (reset! *fetchAgent nil)))

(defn- set-rsapi-proxy
  "Set proxy for Logseq Sync(rsapi)"
  [{:keys [protocol host port]}]
  (if (and protocol host port (or (= protocol "http") (= protocol "socks5")))
    (let [proxy-url (str protocol "://" host ":" port)]
      (rsapi/setProxy proxy-url))
    (rsapi/setProxy nil)))

(defn <set-electron-proxy
  "Set proxy for electron
  type: system | direct | socks5 | http"
  ([{:keys [type host port] :or {type "system"}}]
   (let [->proxy-rules (fn [type host port]
                         (cond
                           (= type "http")
                           (str "http=" host ":" port ";https=" host ":" port)
                           (= type "socks5")
                           (str "http=socks5://" host ":" port ";https=socks5://" host ":" port)
                           (or (= type "socks") (= type "socks4"))
                           (str "http=socks://" host ":" port ";https=socks://" host ":" port)
                           (= type "direct")
                           "direct://"
                           :else
                           nil))
         config (cond
                  (= type "system")
                  #js {:mode "system"}

                  (= type "direct")
                  #js {:mode "direct"}

                  (or (= type "socks5") (= type "http"))
                  #js {:mode "fixed_servers"
                       :proxyRules (->proxy-rules type host port)
                       :proxyBypassRules "<local>"}

                  :else
                  #js {:mode "system"})
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


(defn <get-system-proxy
  "Get system proxy for url, requires proxy to be set to system"
  ([] (<get-system-proxy "https://www.google.com"))
  ([for-url]
   (when-let [sess (.. ^js @*win -webContents -session)]
     (p/let [proxy (.resolveProxy sess for-url)
             pac-opts (->> (string/split proxy #";")
                        (map parse-pac-rule)
                        (remove nil?))]
       (when (seq pac-opts)
         (first pac-opts))))))

(defn <set-proxy
  "Set proxy for electron, fetch, and rsapi"
  ([{:keys [type host port] :or {type "system"} :as opts}]
   (logger/info "set proxy to" opts)
   (cond
     (= type "system")
     (p/let [_ (<set-electron-proxy {:type "system"})
             proxy (<get-system-proxy)]
       (set-fetch-agent-proxy proxy)
       (set-rsapi-proxy proxy))

     (= type "direct")
     (do
       (<set-electron-proxy {:type "direct"})
       (set-fetch-agent-proxy nil)
       (set-rsapi-proxy nil))

     (or (= type "socks5") (= type "http"))
     (do
       (<set-electron-proxy {:type type :host host :port port})
       (set-fetch-agent-proxy {:protocol type :host host :port port})
       (set-rsapi-proxy {:protocol type :host host :port port}))

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
  [{:keys [type host port test] :or {type "system"}}]
  (if (or (= type "system") (= type "direct"))
    (cfgs/set-item! :settings/agent {:type type :test test})
    (cfgs/set-item! :settings/agent {:type type :protocol type :host host :port port :test test})))

(defn should-read-content?
  "Skip reading content of file while using file-watcher"
  [path]
  (let [ext (string/lower-case (node-path/extname path))]
    (contains? #{".md" ".markdown" ".org" ".js" ".edn" ".css"} ext)))

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
  (when (string/includes? graph-name "logseq_local_")
    (string/replace-first graph-name "logseq_local_" "")))

(defn get-graph-name
  "reversing `get-graph-dir`"
  [graph-dir]
  (str "logseq_local_" graph-dir))

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
