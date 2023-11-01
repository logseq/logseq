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
  "Namespaces or parent namespaces _only_ for DB graphs"
  (mapv escape-shell-regex
        ["logseq.db.sqlite." "logseq.db.frontend.property" "logseq.db.frontend.malli-schema"
         "electron.db"
         "frontend.handler.db-based."
         "frontend.components.property" "frontend.components.class"]))

(def file-graph-ns
  "Namespaces or parent namespaces _only_ for file graphs"
  (mapv escape-shell-regex
        ["frontend.handler.file-based" "frontend.fs"]))

(def db-graph-paths
  "Paths _only_ for DB graphs"
  ["src/main/frontend/handler/db_based"
   "src/main/frontend/components/class.cljs"
   "src/main/frontend/components/property.cljs"])

(def file-graph-paths
  "Paths _only_ for file graphs"
  ["src/main/frontend/handler/file_based" "src/main/frontend/fs"])

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

(defn- validate-file-attributes-not-in-db
  []
  (let [file-attrs-str (str "("
                            ;; from logseq.db.frontend.schema
                            (->> [:block/properties-text-values :block/pre-block :recent/pages :file/handle :block/file :block/properties-order]
                                 (map #(subs (str %) 1))
                                 (string/join "|"))
                            ")")
        res (apply shell {:out :string :continue true}
                   "git grep -E" file-attrs-str
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
  (validate-file-attributes-not-in-db)
  (validate-multi-graph-fns-not-in-file-or-db)
  (println "✅ All checks passed!"))