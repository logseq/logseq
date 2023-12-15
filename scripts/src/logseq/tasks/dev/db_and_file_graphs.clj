(ns logseq.tasks.dev.db-and-file-graphs
  (:require [babashka.process :refer [shell]]
            [clojure.string :as string]))

(defn- escape-shell-regex
  [s]
  (reduce (fn [acc escape-char]
            (string/replace acc escape-char (str "\\" escape-char)))
          s
          ["." "?"]))

(def db-graph-ns
  "Namespaces or parent namespaces _only_ for DB graphs. Use a '.' at end of a namespace for parent namespaces"
  (mapv escape-shell-regex
        ["logseq.db.sqlite." "logseq.db.frontend.property" "logseq.db.frontend.malli-schema"
         "electron.db"
         "frontend.handler.db-based."
         "frontend.components.property" "frontend.components.class" "frontend.components.db-based"
         "frontend.persist-db"]))

(def file-graph-ns
  "Namespaces or parent namespaces _only_ for file graphs"
  (mapv escape-shell-regex
        ["frontend.handler.file-based" "frontend.handler.conversion" "frontend.handler.file-sync"
         "frontend.db.file-based"
         "frontend.fs"
         "frontend.components.conversion" "frontend.components.file-sync"
         "frontend.util.fs"
         "frontend.modules.outliner.file"]))

(def db-graph-paths
  "Paths _only_ for DB graphs"
  ["src/main/frontend/handler/db_based"
   "src/main/frontend/components/class.cljs"
   "src/main/frontend/components/property.cljs"
   "src/main/frontend/components/property"
   "src/main/frontend/components/db_based"
   ;; TODO: Enable this when run-export-periodically is deleted or moved out of the ns
   #_"src/main/frontend/persist_db.cljs"
   "src/main/frontend/persist_db"
   "src/electron/electron/db.cljs"])

(def file-graph-paths
  "Paths _only_ for file graphs"
  ["src/main/frontend/handler/file_based" "src/main/frontend/handler/conversion.cljs" "src/main/frontend/handler/file_sync.cljs"
   "src/main/frontend/db/file_based"
   "src/main/frontend/fs"
   "src/main/frontend/components/conversion.cljs" "src/main/frontend/components/file_sync.cljs"
   "src/main/frontend/util/fs.cljs"
   "src/main/frontend/modules/outliner/file.cljs"])

(defn- validate-db-ns-not-in-file
  []
  (let [res (apply shell {:out :string :continue true}
                   "git grep -E" (str "(" (string/join "|" db-graph-ns) ")")
                   file-graph-paths)]
    (when-not (and (= 1 (:exit res)) (= "" (:out res)))
      (println "The following db graph namespaces should not be in file graph files:")
      (println (:out res))
      (System/exit 1))))

(defn- validate-file-ns-not-in-db
  []
  (let [res (apply shell {:out :string :continue true}
                   "git grep -E" (str "(" (string/join "|" file-graph-ns) ")")
                   db-graph-paths)]
    (when-not (and (= 1 (:exit res)) (= "" (:out res)))
      (println "The following file graph namespaces should not be in db graph files:")
      (println (:out res))
      (System/exit 1))))

(defn- validate-multi-graph-fns-not-in-file-or-db
  []
  (let [multi-graph-fns ["config/db-based-graph\\?"]
        res (apply shell {:out :string :continue true}
                   "git grep -E" (str "(" (string/join "|" multi-graph-fns) ")")
                   (into file-graph-paths db-graph-paths))]
    (when-not (and (= 1 (:exit res)) (= "" (:out res)))
      (println "The following files should not have contained config/db-based-graph:")
      (println (:out res))
      (System/exit 1))))

(defn- validate-file-concepts-not-in-db
  []
  (let [file-concepts (->>
                       ;; from logseq.db.frontend.schema
                       [:block/properties-text-values :block/pre-block :recent/pages :file/handle :block/file :block/properties-order]
                       (map str)
                       (into [;; e.g. block/properties :title
                              "block/properties :"
                              ;; anything org mode
                              "org"]))
        res (apply shell {:out :string :continue true}
                   "git grep -E" (str "(" (string/join "|" file-concepts) ")")
                   db-graph-paths)]
    (when-not (and (= 1 (:exit res)) (= "" (:out res)))
      (println "The following files should not have contained file specific attributes:")
      (println (:out res))
      (System/exit 1))))

(defn -main
  "Check that file and db graph specific namespaces and concepts are separate"
  []
  (validate-db-ns-not-in-file)
  (validate-file-ns-not-in-db)
  (validate-file-concepts-not-in-db)
  (validate-multi-graph-fns-not-in-file-or-db)
  (println "✅ All checks passed!"))