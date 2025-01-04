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
         "frontend.worker.handler.page.db-based"
         "frontend.components.property" "frontend.components.class"
         "frontend.components.db-based" "frontend.components.objects" "frontend.components.query.view"]))

(def file-graph-ns
  "Namespaces or parent namespaces _only_ for file graphs"
  (mapv escape-shell-regex
        ["frontend.handler.file-based" "frontend.handler.file-sync"
         "frontend.db.file-based"
         "frontend.util.file-based"
         "frontend.worker.handler.page.file-based"
         ;; Want to only specify this ns and not the ones under it but don't have a way yet
         "frontend.worker.file"
         "frontend.fs"
         "frontend.components.file-sync"
         "frontend.components.file-based"
         "frontend.util.fs"]))

(def db-graph-paths
  "Paths _only_ for DB graphs"
  ["src/main/frontend/handler/db_based"
   ;; TODO: Re-enable if db namespace support is moved elsewhere
  ;;  "src/main/frontend/worker/handler/page/db_based"
   "src/main/frontend/components/class.cljs"
   "src/main/frontend/components/property.cljs"
   "src/main/frontend/components/property"
   "src/main/frontend/components/objects.cljs"
   "src/main/frontend/components/db_based"
   "src/main/frontend/components/query/view.cljs"
   "src/electron/electron/db.cljs"])

(def file-graph-paths
  "Paths _only_ for file graphs"
  ["src/main/frontend/handler/file_based" "src/main/frontend/handler/file_sync.cljs" "src/main/frontend/db/file_based"
   "src/main/frontend/util/file_based" "src/main/frontend/worker/handler/page/file_based" "src/main/frontend/worker/file.cljs"
   "src/main/frontend/fs"
   "src/main/frontend/components/file_sync.cljs"
   "src/main/frontend/components/file_based"
   "src/main/frontend/util/fs.cljs"])

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
  (let [multi-graph-fns ["config/db-based-graph\\?" "sqlite-util/db-based-graph\\?"]
        res (apply shell {:out :string :continue true}
                   "git grep -E" (str "(" (string/join "|" multi-graph-fns) ")")
                   (into file-graph-paths db-graph-paths))]
    (when-not (and (= 1 (:exit res)) (= "" (:out res)))
      (println "The following files should not have fns meant to be used in multi-graph contexts:")
      (println (:out res))
      (System/exit 1))))

(defn- validate-file-concepts-not-in-db
  []
  (let [file-concepts (->>
                       ;; from logseq.db.frontend.schema
                       [:block/namespace :block/properties-text-values :block/pre-block :recent/pages :block/file :block/properties-order
                        :block/repeated :block/deadline :block/scheduled :block/priority :block/marker :block/macros
                        :block/type]
                       (map str)
                       (into [;; e.g. block/properties :title
                              "block/properties :"
                              "block/name"
                              ;; anything org mode
                              "org"
                              "#+BEGIN_"
                              "#+END_"
                              "pre-block"
                              "db/get-page"
                              "/page-name-sanity-lc"]))
        ;; For now use the whole code line. If this is too brittle can make this smaller
        allowed-exceptions #{"{:block/name page-title})))"
                             "{:block/name page-title})"
                             "(when-not (db/get-page journal)"
                             "(let [value (if datetime? (tc/to-long d) (db/get-page journal))]"}
        res (apply shell {:out :string :continue true}
                   "git grep -E" (str "(" (string/join "|" file-concepts) ")")
                   db-graph-paths)
        invalid-lines (when (= 0 (:exit res))
                        (remove #(->> (string/split % #":\s+") second string/trim (contains? allowed-exceptions))
                                (string/split-lines (:out res))))]
    (when (> (:exit res) 1) (System/exit 1))
    (when (and (= 0 (:exit res)) (seq invalid-lines))
      (println "The following files should not have contained file specific concepts:")
      (println (string/join "\n" invalid-lines))
      (System/exit 1))))

(defn- validate-db-concepts-not-in-file
  []
  (let [db-concepts
        ;; from logseq.db.frontend.schema
        ["closed-value" "class/properties" "schema.classes" "property/parent"]
        res (apply shell {:out :string :continue true}
                   "git grep -E" (str "(" (string/join "|" db-concepts) ")")
                   file-graph-paths)]
    (when-not (and (= 1 (:exit res)) (= "" (:out res)))
      (println "The following files should not have contained db specific concepts:")
      (println (:out res))
      (System/exit 1))))

(defn -main
  "Check that file and db graph specific namespaces and concepts are separate"
  []
  (validate-db-ns-not-in-file)
  (validate-file-ns-not-in-db)
  (validate-file-concepts-not-in-db)
  (validate-db-concepts-not-in-file)
  (validate-multi-graph-fns-not-in-file-or-db)
  (println "✅ All checks passed!"))
