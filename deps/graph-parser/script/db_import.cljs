(ns db-import
  "Imports given file(s) to a db graph. This script is primarily for
   developing the import feature and for engineers who want to customize
   the import process"
  (:require ["fs" :as fs]
            ["fs/promises" :as fsp]
            ["path" :as node-path]
            [babashka.cli :as cli]
            [cljs.pprint :as pprint]
            [clojure.set :as set]
            [clojure.string :as string]
            [datascript.core :as d]
            [logseq.common.config :as common-config]
            [logseq.common.graph :as common-graph]
            [logseq.db.common.sqlite-cli :as sqlite-cli]
            [logseq.db.frontend.asset :as db-asset]
            [logseq.graph-parser.exporter :as gp-exporter]
            [logseq.outliner.cli :as outliner-cli]
            [logseq.outliner.pipeline :as outliner-pipeline]
            [nbb.classpath :as cp]
            [nbb.core :as nbb]
            [promesa.core :as p]))

(def tx-queue (atom cljs.core/PersistentQueue.EMPTY))
(def original-transact! d/transact!)
(defn dev-transact! [conn tx-data tx-meta]
  (swap! tx-queue (fn [queue]
                    (let [new-queue (conj queue {:tx-data tx-data :tx-meta tx-meta})]
                          ;; Only care about last few so vary 10 as needed
                      (if (> (count new-queue) 10)
                        (pop new-queue)
                        new-queue))))
  (original-transact! conn tx-data tx-meta))

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

(defn- <read-asset-file [file assets]
  (p/let [buffer (fs/readFileSync (:path file))
          checksum (db-asset/<get-file-array-buffer-checksum buffer)]
    (swap! assets assoc
           (gp-exporter/asset-path->name (:path file))
           {:size (.-length buffer)
            :checksum checksum
            :type (db-asset/asset-path->type (:path file))
            :path (:path file)})))

(defn- <copy-asset-file [asset-m db-graph-dir]
  (p/let [parent-dir (node-path/join db-graph-dir common-config/local-assets-dir)
          _ (fsp/mkdir parent-dir #js {:recursive true})]
    (if (:block/uuid asset-m)
      (fsp/copyFile (:path asset-m) (node-path/join parent-dir (str (:block/uuid asset-m) "." (:type asset-m))))
      (do
        (println "[INFO]" "Copied asset" (pr-str (node-path/basename (:path asset-m)))
                 "by its name since it was unused.")
        (fsp/copyFile (:path asset-m) (node-path/join parent-dir (node-path/basename (:path asset-m))))))))

(defn- notify-user [{:keys [continue debug]} m]
  (println (:msg m))
  (when (:ex-data m)
    (println "Ex-data:" (pr-str (merge (dissoc (:ex-data m) :error)
                                       (when-let [err (get-in m [:ex-data :error])]
                                         {:original-error (ex-data (.-cause err))}))))
    (println "\nStacktrace:")
    (if-let [stack (some-> (get-in m [:ex-data :error]) ex-data :sci.impl/callstack deref)]
      (println (string/join
                "\n"
                (map
                 #(str (:file %)
                       (when (:line %) (str ":" (:line %)))
                       (when (:sci.impl/f-meta %)
                         (str " calls #'" (get-in % [:sci.impl/f-meta :ns]) "/" (get-in % [:sci.impl/f-meta :name]))))
                 (reverse stack))))
      (println (some-> (get-in m [:ex-data :error]) .-stack)))
    (when debug
      (when-let [matching-tx (seq (filter #(and (get-in m [:ex-data :path])
                                                (or (= (get-in % [:tx-meta ::gp-exporter/path]) (get-in m [:ex-data :path]))
                                                    (= (get-in % [:tx-meta ::outliner-pipeline/original-tx-meta ::gp-exporter/path]) (get-in m [:ex-data :path]))))
                                          @tx-queue))]
        (println (str "\n" (count matching-tx)) "Tx Maps for failing path:")
        (pprint/pprint matching-tx))))
  (when (and (= :error (:level m)) (not continue))
    (js/process.exit 1)))

(defn default-export-options
  [options]
  {;; common options
   :rpath-key ::rpath
   :notify-user (partial notify-user options)
   :<read-file <read-file
   ;; :set-ui-state prn
   ;; config file options
   ;; TODO: Add actual default
   :default-config {}})

(defn- import-file-graph-to-db
  "Import a file graph dir just like UI does. However, unlike the UI the
  exporter receives file maps containing keys :path and ::rpath since :path
  are full paths"
  [file-graph-dir db-graph-dir conn options]
  (let [*files (build-graph-files file-graph-dir)
        config-file (first (filter #(string/ends-with? (:path %) "logseq/config.edn") *files))
        _ (assert config-file "No 'logseq/config.edn' found for file graph dir")
        options (merge options
                       (default-export-options options)
                        ;; asset file options
                       {:<copy-asset (fn copy-asset [file]
                                       (<copy-asset-file file db-graph-dir))
                        :<read-asset <read-asset-file})]
    (p/with-redefs [d/transact! dev-transact!]
      (gp-exporter/export-file-graph conn conn config-file *files options))))

(defn- resolve-path
  "If relative path, resolve with $ORIGINAL_PWD"
  [path]
  (if (node-path/isAbsolute path)
    path
    (node-path/join (or js/process.env.ORIGINAL_PWD ".") path)))

(defn- import-files-to-db
  "Import specific doc files for dev purposes"
  [file conn {:keys [files] :as options}]
  (let [doc-options (gp-exporter/build-doc-options {:macros {}} (merge options (default-export-options options)))
        files' (mapv #(hash-map :path %)
                     (into [file] (map resolve-path files)))]
    (p/with-redefs [d/transact! dev-transact!]
      (p/let [_ (gp-exporter/export-doc-files conn files' <read-file doc-options)]
        {:import-state (:import-state doc-options)}))))

(def spec
  "Options spec"
  {:help {:alias :h
          :desc "Print help"}
   :verbose {:alias :v
             :desc "Verbose mode"}
   :debug {:alias :d
           :desc "Debug mode"}
   :continue {:alias :c
              :desc "Continue past import failures"}
   :all-tags {:alias :a
              :desc "All tags convert to classes"}
   :tag-classes {:alias :t
                 :coerce []
                 :desc "List of tags to convert to classes"}
   :files {:alias :f
           :coerce []
           :desc "Additional files to import"}
   :remove-inline-tags {:alias :r
                        :desc "Remove inline tags"}
   :property-classes {:alias :p
                      :coerce []
                      :desc "List of properties whose values convert to classes"}
   :property-parent-classes
   {:alias :P
    :coerce []
    :desc "List of properties whose values convert to a parent class"}})

(defn -main [args]
  (let [[file-graph db-graph-dir] args
        options (cli/parse-opts args {:spec spec})
        _ (when (or (< (count args) 2) (:help options))
            (println (str "Usage: $0 FILE-GRAPH DB-GRAPH [OPTIONS]\nOptions:\n"
                          (cli/format-opts {:spec spec})))
            (js/process.exit 1))
        init-conn-args (sqlite-cli/->open-db-args db-graph-dir)
        db-name (if (= 1 (count init-conn-args)) (first init-conn-args) (second init-conn-args))
        db-full-dir (if (= 1 (count init-conn-args))
                      (node-path/dirname (first init-conn-args))
                      (apply node-path/join init-conn-args))
        file-graph' (resolve-path file-graph)
        conn (apply outliner-cli/init-conn (conj init-conn-args {:classpath (cp/get-classpath)
                                                                 :import-type :cli/db-import}))
        directory? (.isDirectory (fs/statSync file-graph'))
        user-options (cond-> (merge {:all-tags false} (dissoc options :verbose :files :help :continue))
                       ;; coerce option collection into strings
                       (:tag-classes options)
                       (update :tag-classes (partial mapv str))
                       true
                       (set/rename-keys {:all-tags :convert-all-tags? :remove-inline-tags :remove-inline-tags?}))
        _ (when (:verbose options) (prn :options user-options))
        options' (merge {:user-options user-options}
                        (select-keys options [:files :verbose :continue :debug]))]
    (p/let [{:keys [import-state]}
            (if directory?
              (import-file-graph-to-db file-graph' db-full-dir conn options')
              (import-files-to-db file-graph' conn options'))]

      (when-let [ignored-props (seq @(:ignored-properties import-state))]
        (println "Ignored properties:" (pr-str ignored-props)))
      (when-let [ignored-assets (seq @(:ignored-assets import-state))]
        (println "Ignored assets:" (pr-str ignored-assets)))
      (when-let [ignored-files (seq @(:ignored-files import-state))]
        (println (count ignored-files) "ignored file(s):" (pr-str (vec ignored-files))))
      (when (:verbose options') (println "Transacted" (count (d/datoms @conn :eavt)) "datoms"))
      (println "Created graph" (str db-name "!")))))

(when (= nbb/*file* (nbb/invoked-file))
  (-main *command-line-args*))
