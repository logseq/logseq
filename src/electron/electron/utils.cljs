(ns electron.utils
  (:require [clojure.string :as string]
            ["fs-extra" :as fs]
            ["path" :as path]
            [electron.configs :as cfgs]
            [cljs-bean.core :as bean]
            ["electron" :refer [app BrowserWindow]]))

(defonce *win (atom nil))
(defonce mac? (= (.-platform js/process) "darwin"))
(defonce win32? (= (.-platform js/process) "win32"))
(defonce linux? (= (.-platform js/process) "linux"))

(defonce prod? (= js/process.env.NODE_ENV "production"))

(defonce ci? (let [v js/process.env.CI]
               (or (true? v)
                   (= v "true"))))

(defonce dev? (not prod?))
(defonce logger (js/require "electron-log"))
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
  (let [lg-dir (str (.getPath app "home") "/.logseq")]
    (if-not (fs/existsSync lg-dir)
      (and (fs/mkdirSync lg-dir) lg-dir)
      lg-dir)))

(defn get-ls-default-plugins
  []
  (let [plugins-root (path/join (get-ls-dotdir-root) "plugins")
        _ (when-not (fs/existsSync plugins-root)
            (fs/mkdirSync plugins-root))
        dirs (js->clj (fs/readdirSync plugins-root #js{"withFileTypes" true}))
        dirs (->> dirs
                  (filter #(.isDirectory %))
                  (filter #(not (string/starts-with? (.-name %) "_")))
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

;; keep same as ignored-path? in src/main/frontend/util/fs.cljs
;; TODO: merge them
(defn ignored-path?
  [dir path]
  (when (string? path)
    (or
     (some #(string/starts-with? path (str dir "/" %))
           ["." ".recycle" "assets" "node_modules" "logseq/bak"])
     (some #(string/includes? path (str "/" % "/"))
           ["." ".recycle" "assets" "node_modules" "logseq/bak"])
     (string/ends-with? path ".DS_Store")
     ;; hidden directory or file
     (let [relpath (path/relative dir path)]
       (or (re-find #"/\.[^.]+" relpath)
           (re-find #"^\.[^.]+" relpath)))
     (let [path (string/lower-case path)]
       (and
        (not (string/blank? (path/extname path)))
        (not
         (some #(string/ends-with? path %)
               [".md" ".markdown" ".org" ".js" ".edn" ".css"])))))))

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
    (catch js/Error e
      (js/console.error e))))

(defn get-focused-window
  []
  (.getFocusedWindow BrowserWindow))

(defn get-win-from-sender
  [^js evt]
  (try
    (.fromWebContents BrowserWindow (.-sender evt))
    (catch js/Error _
      nil)))

(defn send-to-renderer
  "Notice: pass the `window` parameter if you can. Otherwise, the message
  will not be received if there's no focused window."
  ([kind payload]
   (send-to-renderer (get-focused-window) kind payload))
  ([window kind payload]
   (when window
     (.. ^js window -webContents
         (send kind (bean/->js payload))))))

(defn get-graph-dir
  [graph-name]
  (string/replace graph-name "logseq_local_" ""))

(defn get-URL-decoded-params
  "Get decoded URL parameters from parsed js/URL.
   `nil` for non-existing keys."
  [^js parsed-url keys]
  (let [params (.-searchParams parsed-url)]
    (map (fn [key]
           (when-let [value (.get params key)]
             (js/decodeURI value)))
         keys)))
