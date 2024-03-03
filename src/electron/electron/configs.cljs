(ns electron.configs
  (:require ["electron" :refer [^js app] :as electron]
            ["fs-extra" :as ^js fs]
            ["path" :as ^js node-path]
            [cljs.reader :as reader]
            [electron.logger :as logger]))

;; FIXME: move configs.edn to where it should be
(defonce dot-root (.join node-path (.getPath app "home") ".logseq"))
(defonce cfg-root (.getPath app "userData"))
(defonce cfg-path (.join node-path cfg-root "configs.edn"))

(defn- ensure-cfg
  []
  (try
    (.ensureFileSync fs cfg-path)
    (let [body (.toString (.readFileSync fs cfg-path))]
      (if (seq body) (reader/read-string body) {}))
    (catch :default e
      (logger/error :cfg-error e))))

(defn- write-cfg!
  [cfg]
  (try
    (.writeFileSync fs cfg-path (pr-str cfg)) cfg
    (catch :default e
      (logger/error :cfg-error e))))

(defn set-item!
  [k v]
  (when-let [cfg (ensure-cfg)]
    (some->> (assoc cfg k v)
             (write-cfg!))))

(defn get-item
  [k]
  (when-let [cfg (and k (ensure-cfg))]
    (get cfg k)))

(defn get-config
  []
  (ensure-cfg))
