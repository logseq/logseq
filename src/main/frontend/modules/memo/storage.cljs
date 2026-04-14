;; src/main/frontend/modules/memo/storage.cljs
(ns frontend.modules.memo.storage
  (:require [clojure.string :as string]
            [frontend.config :as config]
            [frontend.fs :as fs]
            [frontend.modules.memo.index :as index]
            [frontend.modules.memo.parser :as parser]
            [logseq.common.path :as path]))

(def type->dir
  {:character "人物"
   :world "世界观"
   :timeline "时间线"
   :location "地点"
   :custom "自定义"})

(def dir->type
  (reduce-kv (fn [m type dir] (assoc m dir type)) {} type->dir))

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
  (let [full-path (path/path-join (setting-type-dir graph-path type) filename)]
    (fs/write-file! full-path content)
    ;; Index the setting
    (let [setting (parser/parse-setting full-path content)]
      (index/index-setting! setting))))

(defn sync-settings! [repo]
  "Sync all settings from files to index"
  (let [graph-path (config/get-repo-dir repo)
        type-dirs (vals type->dir)]
    (doseq [type-dir type-dirs]
      (let [type (dir->type type-dir)
            files (fs/read-dir (path/path-join graph-path ".settings" type-dir))]
        (doseq [file files]
          (when (string/ends-with? file ".md")
            (let [full-path (path/path-join graph-path ".settings" type-dir file)
                  content (fs/read-file full-path)
                  setting (parser/parse-setting full-path content)]
              (index/index-setting! setting))))))))