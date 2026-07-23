(ns frontend.components.imports-test
  (:require ["fs" :as node-fs]
            ["path" :as node-path]
            [cljs.test :refer [async deftest is]]
            [clojure.string :as string]
            [frontend.config :as config]
            [frontend.components.imports]
            [frontend.fs :as fs]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(defn- source-for
  [relative-file]
  (.toString (node-fs/readFileSync (node-path/join (.cwd js/process) relative-file) "utf8")))

(deftest file-graph-import-delegates-db-work-to-worker-test
  (let [source (source-for "src/main/frontend/components/imports.cljs")]
    (is (string/includes? source ":thread-api/import-file-graph")
        "File graph import should call the worker import API.")
    (is (not (string/includes? source (str "db/" "get-db repo false")))
        "File graph import should not acquire the target renderer DB conn.")
    (is (not (string/includes? source "gp-exporter/export-file-graph"))
        "File graph import should not run graph-parser export against a renderer conn.")
    (is (not (string/includes? source "db-browser/transact!"))
        "File graph import should not apply import tx reports from the renderer.")))

(deftest file-graph-import-options-cross-the-transit-boundary-test
  (let [build-options (some-> (resolve 'frontend.components.imports/build-file-graph-worker-options)
                              deref)]
    (is (fn? build-options))
    (when (fn? build-options)
      (let [options (build-options {:tag-classes "Project, Area"
                                    :property-classes "Priority"
                                    :property-parent-classes "Metadata"
                                    :graph-name "Imported graph"}
                                   "{:meta/version 1}")]
        (is (= options (-> options ldb/write-transit-str ldb/read-transit-str)))
        (is (= #{"Project" "Area"} (get-in options [:user-options :tag-classes])))
        (is (not (contains? options :notify-user)))))))

(deftest staged-assets-wait-for-directory-and-all-writes-test
  (async done
    (let [write-staged-assets! (some-> (resolve 'frontend.components.imports/write-staged-assets!)
                                       deref)
          directory-ready (p/deferred)
          writes (atom [])
          completed? (atom false)]
      (is (fn? write-staged-assets!))
      (-> (p/with-redefs [config/get-repo-dir (constantly "/tmp/import-target")
                          fs/mkdir-if-not-exists (fn [_]
                                                  directory-ready)
                          fs/write-plain-text-file!
                          (fn [_repo _dir filename _payload _opts]
                            (let [write (p/deferred)]
                              (swap! writes conj [filename write])
                              write))]
            (let [result (write-staged-assets!
                          "test-repo"
                          [{:asset-id "one" :asset-type "png" :payload "first"}
                           {:asset-id "two" :asset-type "pdf" :payload "second"}])]
              (p/finally result #(reset! completed? true))
              (p/let [_ (p/delay 0)
                      _ (is (empty? @writes)
                            "Asset writes must wait until the directory exists.")
                      _ (is (false? @completed?))
                      _ (p/resolve! directory-ready :ready)
                      _ (p/delay 0)
                      _ (is (= #{"one.png" "two.pdf"}
                               (set (map first @writes))))
                      _ (is (false? @completed?))
                      _ (doseq [[_ write] @writes]
                          (p/resolve! write :written))
                      _ (p/delay 0)]
                (is (true? @completed?)))))
          (p/catch (fn [error]
                     (is false (str error))))
          (p/finally done)))))
