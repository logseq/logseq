(ns electron.utils
  (:require [clojure.string :as string]
            ["fs-extra" :as fs]
            ["path" :as path]
            [clojure.string :as string]
            [cljs-bean.core :as bean]
            ["electron" :refer [app BrowserWindow]]))

(defonce *win (atom nil))
(defonce mac? (= (.-platform js/process) "darwin"))
(defonce win32? (= (.-platform js/process) "win32"))
(defonce linux? (= (.-platform js/process) "linux"))

(defonce prod? (= js/process.env.NODE_ENV "production"))
(defonce dev? (not prod?))
(defonce logger (js/require "electron-log"))

(defonce open (js/require "open"))
(defonce fetch (js/require "node-fetch"))
(defonce extract-zip (js/require "extract-zip"))

(defn get-ls-dotdir-root
  []
  (let [lg-dir (str (.getPath app "home") "/.logseq")]
    (if-not (fs/existsSync lg-dir)
      (and (fs/mkdirSync lg-dir) lg-dir)
      lg-dir)))

(defn get-ls-default-plugins
  []
  (let [plugins-root (path/join (get-ls-dotdir-root) "plugins")
        _ (if-not (fs/existsSync plugins-root)
            (fs/mkdirSync plugins-root))
        dirs (js->clj (fs/readdirSync plugins-root #js{"withFileTypes" true}))
        dirs (->> dirs
                  (filter #(.isDirectory %))
                  (filter #(not (string/starts-with? (.-name %) "_")))
                  (map #(path/join plugins-root (.-name %))))]
    dirs))

(defn ignored-path?
  [dir path]
  (when (string? path)
    (or
     (some #(string/starts-with? path (str dir "/" %))
           ["." ".recycle" "assets" "node_modules"])
     (some #(string/includes? path (str "/" % "/"))
           ["." ".recycle" "assets" "node_modules"])
     (string/ends-with? path ".DS_Store")
     ;; hidden directory or file
     (re-find #"/\.[^.]+" path)
     (re-find #"^\.[^.]+" path)
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

(defn send-to-renderer
  [kind payload]
  (when-let [window (get-focused-window)]
    (.. ^js window -webContents
       (send kind (bean/->js payload)))))
