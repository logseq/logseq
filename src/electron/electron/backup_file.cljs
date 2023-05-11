(ns electron.backup-file
  (:require [clojure.string :as string]
            ["path" :as node-path]
            ["fs" :as fs]
            ["fs-extra" :as fs-extra]))

(def backup-dir "logseq/bak")
(def version-file-dir "logseq/version-files/local")

(defn- get-backup-dir*
  [repo relative-path bak-dir]
  (let [relative-path* (string/replace relative-path repo "")
        bak-dir (node-path/join repo bak-dir)
        path (node-path/join bak-dir relative-path*)
        parsed-path (node-path/parse path)]
    (node-path/join (.-dir parsed-path)
                    (.-name parsed-path))))

(defn get-backup-dir
  [repo relative-path]
  (get-backup-dir* repo relative-path backup-dir))

(defn get-version-file-dir
  [repo relative-path]
  (get-backup-dir* repo relative-path version-file-dir))

(defn- truncate-old-versioned-files!
  "reserve the latest 6 version files"
  [dir]
  (let [files (fs/readdirSync dir (clj->js {:withFileTypes true}))
        files (mapv #(.-name %) files)
        old-versioned-files (drop 6 (reverse (sort files)))]
    (doseq [file old-versioned-files]
      (fs-extra/removeSync (node-path/join dir file)))))

(defn backup-file
  "backup CONTENT under DIR :backup-dir or :version-file-dir
  :backup-dir = `backup-dir`
  :version-file-dir = `version-file-dir`"
  [repo dir relative-path ext content]
  {:pre [(contains? #{:backup-dir :version-file-dir} dir)]}
  (let [dir* (case dir
               :backup-dir (get-backup-dir repo relative-path)
               :version-file-dir (get-version-file-dir repo relative-path))
        new-path (node-path/join dir*
                                 (str (string/replace (.toISOString (js/Date.)) ":" "_")
                                      ".Desktop" ext))]
    (fs-extra/ensureDirSync dir*)
    (fs/writeFileSync new-path content)
    (fs/statSync new-path)
    (truncate-old-versioned-files! dir*)))
