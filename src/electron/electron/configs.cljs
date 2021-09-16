(ns electron.configs
  (:require
    ["fs-extra" :as ^js fs]
    ["path" :as ^js path]
    ["electron" :refer [^js app] :as electron]
    [cljs.reader :as reader]))

(defonce dot-root (.join path (.getPath app "home") ".logseq"))
(defonce cfg-root (.getPath app "userData"))
(defonce cfg-path (.join path cfg-root "configs.edn"))

(defn- ensure-cfg
  []
  (try
    (do
      (.ensureFileSync fs cfg-path)
      (let [body (.toString (.readFileSync fs cfg-path))]
        (if (seq body) (reader/read-string body) {})))
    (catch js/Error e
      (js/console.error :cfg-error e)
      {})))

(defn- write-cfg!
  [cfg]
  (try
    (do (.writeFileSync fs cfg-path (pr-str cfg)) cfg)
    (catch js/Error e
      (js/console.error :cfg-error e))))

(defn set-item!
  [k v]
  (let [cfg (ensure-cfg)
        cfg (assoc cfg k v)]
    (write-cfg! cfg)))

(defn del-item!
  [k]
  (when-let [cfg (and k (ensure-cfg))]
    (let [cfg (dissoc cfg k)]
      (write-cfg! cfg))))

(defn get-item
  [k]
  (when-let [cfg (and k (ensure-cfg))]
    (get cfg k)))

(defn get-config
  []
  (ensure-cfg))
