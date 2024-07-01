(ns ^:node-only logseq.graph-parser.exporter-test
  (:require [cljs.test :refer [testing is]]
            [logseq.graph-parser.test.helper :as test-helper :include-macros true :refer [deftest-async]]
            [datascript.core :as d]
            [clojure.string :as string]
            ["path" :as node-path]
            ["fs" :as fs]
            [logseq.common.graph :as common-graph]
            [promesa.core :as p]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.frontend.validate :as db-validate]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.graph-parser.exporter :as gp-exporter]
            [logseq.db.frontend.malli-schema :as db-malli-schema]
            [logseq.db.frontend.property :as db-property]))

(defn- find-block-by-content [db content]
  (->> content
       (d/q '[:find [(pull ?b [*]) ...]
              :in $ ?content
              :where [?b :block/content ?content]]
            db)
       first))

(defn- find-page-by-name [db name]
  (->> name
       (d/q '[:find [(pull ?b [*]) ...]
              :in $ ?name
              :where [?b :block/original-name ?name]]
            db)
       first))

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
  (p/let [s (fs/readFileSync (:path file))]
    (str s)))

(defn- notify-user [m]
  (println (:msg m))
  (println "Ex-data:" (pr-str (dissoc (:ex-data m) :error)))
  (println "Stacktrace:")
  (if-let [stack (some-> (get-in m [:ex-data :error]) ex-data :sci.impl/callstack deref)]
    (println (string/join
              "\n"
              (map
               #(str (:file %)
                     (when (:line %) (str ":" (:line %)))
                     (when (:sci.impl/f-meta %)
                       (str " calls #'" (get-in % [:sci.impl/f-meta :ns]) "/" (get-in % [:sci.impl/f-meta :name]))))
               (reverse stack))))
    (println (some-> (get-in m [:ex-data :error]) .-stack))))

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
  [file-graph-dir conn {:keys [assets] :as options}]
  (let [*files (build-graph-files file-graph-dir)
        config-file (first (filter #(string/ends-with? (:path %) "logseq/config.edn") *files))
        _ (assert config-file "No 'logseq/config.edn' found for file graph dir")
        options' (-> (merge options
                            default-export-options
                            ;; asset file options
                            {:<copy-asset #(swap! assets conj %)})
                     (dissoc :assets))]
    (gp-exporter/export-file-graph conn conn config-file *files options')))

(deftest-async export-basic-graph
  ;; This graph will contain basic examples of different features to import
  (p/let [file-graph-dir "test/resources/exporter-test-graph"
          conn (d/create-conn db-schema/schema-for-db-based-graph)
          _ (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
          assets (atom [])
          _ (import-file-graph-to-db file-graph-dir conn {:assets assets})]

    (is (nil? (:errors (db-validate/validate-db! @conn)))
        "Created graph has no validation errors")

    (testing "logseq files"
      (is (= ".foo {}\n"
             (ffirst (d/q '[:find ?content :where [?b :file/path "logseq/custom.css"] [?b :file/content ?content]] @conn))))
      (is (= "logseq.api.show_msg('hello good sir!');\n"
             (ffirst (d/q '[:find ?content :where [?b :file/path "logseq/custom.js"] [?b :file/content ?content]] @conn)))))

    (testing "user content"
      (is (= 3 (count (d/q '[:find ?b :where [?b :block/type "journal"]] @conn))))
      ;; Count includes Contents
      (is (= 3
             (count (d/q '[:find (pull ?b [*]) :where [?b :block/original-name ?name] (not [?b :block/type])] @conn))))
      (is (= 1 (count @assets)))

      (testing "properties"
        (is (= #{{:db/ident :user.property/prop-bool :block/schema {:type :checkbox}}
                 {:db/ident :user.property/prop-string :block/schema {:type :default}}
                 {:db/ident :user.property/prop-num :block/schema {:type :number}}
                 {:db/ident :user.property/prop-num2 :block/schema {:type :number}}}
               (->> @conn
                    (d/q '[:find [(pull ?b [:db/ident :block/schema]) ...]
                           :where [?b :block/type "property"]])
                    (remove #(db-malli-schema/internal-ident? (:db/ident %)))
                    set))
            "Properties defined correctly")

        (is (= {:user.property/prop-bool true
                :user.property/prop-num 5
                :user.property/prop-string "woot"}
               (update-vals (db-property/properties (find-block-by-content @conn "b1"))
                            (fn [ref]
                              (db-property/ref->property-value-content @conn ref))))
            "Basic block has correct properties")
        (is (= #{"prop-num" "prop-string" "prop-bool"}
               (->> (d/entity @conn (:db/id (find-block-by-content @conn "b1")))
                    :block/refs
                    (map :block/original-name)
                    set))
            "Block with properties has correct refs")

        (is (= {:user.property/prop-num2 10}
               (update-vals (db-property/properties (find-page-by-name @conn "new page"))
                            (fn [ref]
                              (db-property/ref->property-value-content @conn ref))))
            "New page has correct properties")
        (is (= {:user.property/prop-bool true
                :user.property/prop-num 5
                :user.property/prop-string "yeehaw"}
               (update-vals (db-property/properties (find-page-by-name @conn "some page"))
                            (fn [ref]
                              (db-property/ref->property-value-content @conn ref))))
            "Existing page has correct properties")))))