;; src/main/frontend/modules/memo/storage.cljs
(ns frontend.modules.memo.storage
  (:require [clojure.string :as string]
            [frontend.config :as config]
            [frontend.fs :as fs]
            [logseq.common.path :as path]))

(def type->dir
  {:character "人物"
   :world "世界观"
   :timeline "时间线"
   :location "地点"
   :custom "自定义"})

(defn settings-dir [graph-path]
  (path/path-join graph-path ".settings"))

(defn setting-type-dir [graph-path type]
  (path/path-join graph-path ".settings" (type->dir type)))

(defn ensure-settings-dir! [repo]
  (let [graph-path (config/get-repo-dir repo)]
    ;; Create directories if not exist
    (doseq [type (vals type->dir)]
      (fs/mkdir-if-not-exists
       (path/path-join graph-path ".settings" type)))))

(defn read-setting-file [graph-path type filename]
  (let [type-dir (setting-type-dir graph-path type)]
    (fs/read-file type-dir filename)))

(defn write-setting-file! [graph-path type filename content]
  (let [type-dir (setting-type-dir graph-path type)]
    (fs/write-file! (path/path-join type-dir filename) content)))