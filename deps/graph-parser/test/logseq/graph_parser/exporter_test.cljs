(ns logseq.graph-parser.exporter-test
  (:require [cljs.test :refer [testing is]]
            [logseq.graph-parser.test.helper :as test-helper :include-macros true :refer [deftest-async]]
            [datascript.core :as d]
            [clojure.string :as string]
            ["path" :as node-path]
            ["fs" :as fs]
            ["fs/promises" :as fsp]
            [logseq.common.graph :as common-graph]
            [promesa.core :as p]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.frontend.validate :as db-validate]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.graph-parser.exporter :as gp-exporter]))

(defn- build-graph-files
  "Given a file graph directory, return all files including assets and adds relative paths
   on ::rpath since paths are absolute by default and exporter needs relative paths for
   some operations"
  [dir*]
  (let [dir (node-path/resolve dir*)]
    (->> (common-graph/get-files dir)
         (concat (when (fs/existsSync (node-path/join dir* "assets"))
                   (common-graph/readdir (node-path/join dir* "assets"))))
         (mapv #(hash-map :path %
                          ::rpath (node-path/relative dir* %))))))

(defn- <read-file
  [file]
  (p/let [s (fsp/readFile (:path file))]
    (str s)))

(defn- notify-user [m]
  (println (:msg m))
  (println "Ex-data:" (pr-str (dissoc (:ex-data m) :error)))
  (println "Stacktrace:")
  (if-let [stack (some-> (get-in m [:ex-data :error]) ex-data :sci.impl/callstack deref)]
    (println (string/join
              "\n"
              (map
               #(str (:file %) (when (:line %) (str ":" (:line %)))
                     " calls #'"
                     (str (get-in % [:sci.impl/f-meta :ns]) "/" (get-in % [:sci.impl/f-meta :name])))
               stack)))
    (println (.-stack (get-in m [:ex-data :error])))))

(def default-export-options
  {;; common options
   :rpath-key ::rpath
   :notify-user notify-user
   :<read-file <read-file
   ;; :set-ui-state prn
   ;; config file options
   ;; TODO: Add actual default
   :default-config {}})

;; Copied from db-import script and tweaked for an in-memory import
(defn- import-file-graph-to-db
  "Import a file graph dir just like UI does. However, unlike the UI the
  exporter receives file maps containing keys :path and ::rpath since :path
  are full paths"
  [file-graph-dir conn options]
  (let [*files (build-graph-files file-graph-dir)
        config-file (first (filter #(string/ends-with? (:path %) "logseq/config.edn") *files))
        _ (assert config-file "No 'logseq/config.edn' found for file graph dir")
        options (merge options
                       default-export-options
                       ;; TODO: Update when asset is tested
                        ;; asset file options
                       {:<copy-asset identity})]
    (gp-exporter/export-file-graph conn conn config-file *files options)))

(deftest-async export-basic-graph
  ;; This graph will contain basic examples of different features to import
  (p/let [file-graph-dir "test/resources/exporter-test-graph"
          conn (d/create-conn db-schema/schema-for-db-based-graph)
          _ (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
          _ (import-file-graph-to-db file-graph-dir conn {})]

    (is (nil? (:errors (db-validate/validate-db! @conn)))
        "Created graph has no validation errors")

    (testing "logseq files"
      (is (= ".foo {}\n"
             (ffirst (d/q '[:find ?content :where [?b :file/path "logseq/custom.css"] [?b :file/content ?content]] @conn))))
      (is (= "logseq.api.show_msg('hello good sir!');\n"
             (ffirst (d/q '[:find ?content :where [?b :file/path "logseq/custom.js"] [?b :file/content ?content]] @conn)))))

    (testing "user pages"
      (is (= 1 (count (d/q '[:find ?b :where [?b :block/type "journal"]] @conn)))))))