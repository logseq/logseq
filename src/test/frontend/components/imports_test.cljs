(ns frontend.components.imports-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.components.imports]
            [frontend.config :as config]
            [frontend.fs :as fs]
            [frontend.handler.notification :as notification]
            [frontend.handler.repo :as repo-handler]
            [frontend.persist-db :as persist-db]
            [frontend.state :as state]
            [logseq.db :as ldb]
            [promesa.core :as p]))

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

(deftest file-graph-import-failure-reaches-terminal-state-test
  (async done
    (let [import-file-graph (some-> (resolve 'frontend.components.imports/<import-file-graph)
                                    deref)
          state-changes (atom [])
          state-values (atom {})
          lifecycle-ops (atom [])
          expected-error (ex-info "worker unavailable" {:code :worker-unavailable})]
      (is (fn? import-file-graph))
      (-> (p/with-redefs [repo-handler/<new-file-graph-import-staging-db!
                          (fn [_run-id]
                            (p/resolved "logseq_db_.logseq-file-graph-import-run"))
                          repo-handler/new-db! (fn [& _]
                                                 (swap! lifecycle-ops conj :register-target)
                                                 (p/resolved "logseq_db_target"))
                          persist-db/<discard-file-graph-import!
                          (fn [repo]
                            (swap! lifecycle-ops conj [:discard repo])
                            (p/resolved nil))
                          state/<invoke-db-worker (fn [& _]
                                                    (p/rejected expected-error))
                          state/get-state (fn [path]
                                            (get-in @state-values (if (coll? path) path [path])))
                          state/set-state! (fn [path value & _]
                                             (let [state-path (if (coll? path) path [path])]
                                               (swap! state-values assoc-in state-path value)
                                               (swap! state-changes conj [path value])))
                          notification/show! (fn [& _] nil)]
            (import-file-graph [] {:graph-name "target"} nil))
          (p/then
           (fn [result]
             (is (= :failed (:status result)))
             (is (= [[:discard "logseq_db_.logseq-file-graph-import-run"]]
                    @lifecycle-ops))
             (is (= [[:graph/importing nil]
                     [:graph/importing-state nil]]
                    (take-last 2 @state-changes)))))
          (p/catch
           (fn [error]
             (is false (str "Import failure must be normalized: " error))))
          (p/finally done)))))
