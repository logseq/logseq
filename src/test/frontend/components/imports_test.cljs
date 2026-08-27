(ns frontend.components.imports-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.components.imports]
            [frontend.config :as config]
            [frontend.fs :as fs]
            [frontend.handler.notification :as notification]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.persist-db :as persist-db]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.db :as ldb]
            [logseq.common.file-graph-import :as file-graph-import]
            [logseq.shui.ui :as shui]
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

(deftest import-file-serialization-preserves-modified-time-test
  (async done
    (let [serialize-file (some-> (resolve 'frontend.components.imports/<serialize-import-file)
                                 deref)
          modified-at (js/Date. "2024-05-06T07:08:09.000Z")
          file {:path "pages/note.md"
                :last-modified-at modified-at
                :file-object #js {:text (fn [] (p/resolved "- note"))}}]
      (is (fn? serialize-file))
      (-> (serialize-file file)
          (p/then (fn [serialized]
                    (let [round-tripped (-> serialized ldb/write-transit-str ldb/read-transit-str)]
                      (is (= "pages/note.md" (:path round-tripped)))
                      (is (= "- note" (:file/content round-tripped)))
                      (is (= (.getTime modified-at)
                             (.getTime (:last-modified-at round-tripped)))))))
          (p/catch (fn [error]
                     (is false (str error))))
          (p/finally done)))))

(deftest staged-assets-wait-for-directory-and-all-writes-test
  (async done
    (let [write-staged-assets! (some-> (resolve 'frontend.components.imports/<write-staged-assets!)
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

(deftest file-graph-import-publishes-completed-with-errors-test
  (async done
    (let [import-file-graph (some-> (resolve 'frontend.components.imports/<import-file-graph)
                                    deref)
          state-values (atom {})
          lifecycle-ops (atom [])
          notifications (atom [])
          staging-repo (atom nil)
          graph-name "logseq_db_target"
          target-repo "logseq_db_logseq_db_target"
          issue {:code :import/file-parse-failed
                 :severity :error
                 :recoverable? true
                 :phase :import-file
                 :parameters {:path "pages/note.md"}}]
      (is (fn? import-file-graph))
      (-> (p/with-redefs
            [repo-handler/<new-file-graph-import-staging-db!
             (fn [run-id]
               (let [repo (file-graph-import/staging-repo run-id)]
                 (reset! staging-repo repo)
                 (p/resolved repo)))
             repo-handler/new-db!
             (fn [graph-name _opts]
               (swap! lifecycle-ops conj [:register graph-name])
               (p/resolved target-repo))
             persist-db/<publish-file-graph-import!
             (fn [staging target]
               (swap! lifecycle-ops conj [:publish staging target])
               (p/resolved target))
             persist-db/<discard-file-graph-import!
             (fn [repo]
               (swap! lifecycle-ops conj [:discard repo])
               (p/resolved nil))
             state/<invoke-db-worker
             (fn [_method _repo _config _files options]
               (p/resolved
                (file-graph-import/completed-result
                 (:run-id options)
                 {:validation {:status :passed}
                  :files []
                  :import-state {}
                  :notifications []
                  :issues [issue]
                  :staged-assets []})))
             state/get-state
             (fn [path]
               (get-in @state-values (if (coll? path) path [path])))
             state/set-state!
             (fn [path value & _]
               (swap! state-values assoc-in (if (coll? path) path [path]) value))
             state/pub-event! (fn [event]
                                (if (= [:graph/ready target-repo] event)
                                  (throw (js/Error. "event callback failed"))
                                  (swap! lifecycle-ops conj [:event event])))
             notification/show! (fn [& args]
                                  (swap! notifications conj args))
             route-handler/redirect-to-home! (fn [] nil)
             shui/dialog-close! (fn [& _] nil)
             ui-handler/re-render-root! (fn [] nil)
             util/web-platform? false]
            (import-file-graph [] {:graph-name graph-name} nil))
          (p/then
           (fn [result]
             (is (= :completed-with-errors (:status result)))
             (is (= {:status :published :repo target-repo} (:publication result)))
             (is (some #(= [:publish @staging-repo target-repo] %) @lifecycle-ops))
             (is (some #(= [:register graph-name] %) @lifecycle-ops))
             (is (not-any? #(= :discard (first %)) @lifecycle-ops))
             (is (some #(= :warning (second %)) @notifications))
             (is (nil? (get @state-values :graph/importing)))
             (is (nil? (get @state-values :graph/importing-state)))))
          (p/catch #(is false (str "unexpected error: " %)))
          (p/finally done)))))

(deftest file-graph-import-failure-reaches-terminal-state-test
  (async done
    (let [import-file-graph (some-> (resolve 'frontend.components.imports/<import-file-graph)
                                    deref)
          state-changes (atom [])
          state-values (atom {})
          lifecycle-ops (atom [])
          staging-repo (atom nil)
          previous-repo "logseq_db_previous"
          expected-error (ex-info "worker unavailable" {:code :worker-unavailable})]
      (is (fn? import-file-graph))
      (-> (p/with-redefs [repo-handler/<new-file-graph-import-staging-db!
                          (fn [run-id]
                            (let [repo (file-graph-import/staging-repo run-id)]
                              (reset! staging-repo repo)
                              (p/resolved repo)))
                          repo-handler/new-db! (fn [& _]
                                                 (swap! lifecycle-ops conj :register-target)
                                                 (p/resolved "logseq_db_target"))
                          repo-handler/restore-and-setup-repo!
                          (fn [repo & _]
                            (swap! lifecycle-ops conj [:restore repo])
                            (p/resolved nil))
                          persist-db/<discard-file-graph-import!
                          (fn [repo]
                            (swap! lifecycle-ops conj [:discard repo])
                            (p/resolved nil))
                          state/<invoke-db-worker (fn [& _]
                                                    (p/rejected expected-error))
                          state/get-state (fn [path]
                                            (get-in @state-values (if (coll? path) path [path])))
                          state/get-current-repo (constantly previous-repo)
                          state/set-state! (fn [path value & _]
                                             (let [state-path (if (coll? path) path [path])]
                                               (swap! state-values assoc-in state-path value)
                                               (swap! state-changes conj [path value])))
                          notification/show! (fn [& _] nil)]
            (import-file-graph [] {:graph-name "target"} nil))
          (p/then
           (fn [result]
             (is (= :failed (:status result)))
             (is (= [[:discard @staging-repo]
                     [:restore previous-repo]]
                    @lifecycle-ops))
             (is (= [[:graph/importing nil]
                     [:graph/importing-state nil]]
                    (take-last 2 @state-changes)))))
          (p/catch
           (fn [error]
             (is false (str "Import failure must be normalized: " error))))
          (p/finally done)))))

(deftest file-graph-import-cleans-up-rejected-staging-creation-test
  (async done
    (let [import-file-graph (some-> (resolve 'frontend.components.imports/<import-file-graph)
                                    deref)
          staging-repo (atom nil)
          discarded-repos (atom [])
          state-values (atom {})]
      (is (fn? import-file-graph))
      (-> (p/with-redefs [repo-handler/<new-file-graph-import-staging-db!
                          (fn [run-id]
                            (reset! staging-repo (file-graph-import/staging-repo run-id))
                            (p/rejected (js/Error. "staging setup failed")))
                          persist-db/<discard-file-graph-import!
                          (fn [repo]
                            (swap! discarded-repos conj repo)
                            (p/resolved nil))
                          state/get-state
                          (fn [path]
                            (get-in @state-values (if (coll? path) path [path])))
                          state/set-state!
                          (fn [path value & _]
                            (swap! state-values assoc-in (if (coll? path) path [path]) value))
                          notification/show! (fn [& _] nil)]
            (import-file-graph [] {:graph-name "target"} nil))
          (p/then (fn [result]
                    (is (= :failed (:status result)))
                    (is (= :create-staging (:phase result)))
                    (is (= [@staging-repo] @discarded-repos))))
          (p/catch (fn [error]
                     (is false (str error))))
          (p/finally done)))))
