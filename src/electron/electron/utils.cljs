(ns electron.utils
  (:require [clojure.string :as string]
            ["fs-extra" :as fs]
            ["path" :as path]
            [electron.configs :as cfgs]
            [electron.logger :as logger]
            [cljs-bean.core :as bean]
            ["electron" :refer [app BrowserWindow]]))

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
(defonce HttpsProxyAgent (js/require "https-proxy-agent"))
(defonce _fetch (js/require "node-fetch"))
(defonce extract-zip (js/require "extract-zip"))

(defn fetch
  ([url] (fetch url nil))
  ([url options]
   (_fetch url (bean/->js (merge options {:agent @*fetchAgent})))))

(defn get-ls-dotdir-root
  []
  (let [lg-dir (path/join (.getPath app "home") ".logseq")]
    (if-not (fs/existsSync lg-dir)
      (do (fs/mkdirSync lg-dir) lg-dir)
      lg-dir)))

(defn get-ls-default-plugins
  []
  (let [plugins-root (path/join (get-ls-dotdir-root) "plugins")
        _ (when-not (fs/existsSync plugins-root)
            (fs/mkdirSync plugins-root))
        dirs (js->clj (fs/readdirSync plugins-root #js{"withFileTypes" true}))
        dirs (->> dirs
                  (filter #(.isDirectory %))
                  (filter (fn [f] (not (some #(string/starts-with? (.-name f) %) ["_" "."]))))
                  (map #(path/join plugins-root (.-name %))))]
    dirs))

(defn set-fetch-agent
  [{:keys [protocol host port] :as opts}]
  (reset! *fetchAgent
          (when (and protocol host port)
            (new HttpsProxyAgent (str protocol "://" host ":" port))))
  (cfgs/set-item! :settings/agent opts))

(defn restore-user-fetch-agent
  []
  (when-let [agent (cfgs/get-item :settings/agent)]
    (set-fetch-agent agent)))

(defn ignored-path?
  "Ignore given path from file-watcher notification"
  [dir path]
  (when (string? path)
    (or
     (some #(string/starts-with? path (str dir "/" %))
           ["." ".recycle" "node_modules" "logseq/bak" "version-files"])
     (some #(string/includes? path (str "/" % "/"))
           ["." ".recycle" "node_modules" "logseq/bak" "version-files"])
     (some #(string/ends-with? path %)
           [".DS_Store" "logseq/graphs-txid.edn" "logseq/broken-config.edn"])
     ;; hidden directory or file
     (let [relpath (path/relative dir path)]
       (or (re-find #"/\.[^.]+" relpath)
           (re-find #"^\.[^.]+" relpath))))))

(defn should-read-content?
  "Skip reading content of file while using file-watcher"
  [path]
  (let [ext (string/lower-case (path/extname path))]
    (contains? #{".md" ".markdown" ".org" ".js" ".edn" ".css"} ext)))

(defn fix-win-path!
  [path]
  (when path
    (if win32?
      (string/replace path "\\" "/")
      path)))

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
  (string/replace graph-name "logseq_local_" ""))

(defn get-graph-name
  "reversing `get-graph-dir`"
  [graph-dir]
  (str "logseq_local_" graph-dir))

;; Keep update with the normalization in main
(defn normalize
  [s]
  (.normalize s "NFC"))

(defn normalize-lc
  [s]
  (normalize (string/lower-case s)))
