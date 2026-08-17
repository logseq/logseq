(ns frontend.components.imports-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.config :as config]
            [frontend.components.imports :as imports]
            [frontend.fs :as fs]
            [frontend.handler.notification :as notification]
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

(deftest abort-file-graph-import-reports-uninitialized-worker-as-import-error
  (let [original-state (state/get-state)
        notifications (atom [])]
    (try
      (state/replace-state! (assoc original-state
                                  :graph/importing :file-graph
                                  :graph/importing-state {:current-page "pages/A.md"}))
      (with-redefs [notification/show! (fn [content status]
                                         (swap! notifications conj [content status]))]
        (imports/abort-file-graph-import!
         {:error (state/db-worker-uninitialized-error)})
        (is (nil? (state/get-state :graph/importing)))
        (is (nil? (state/get-state :graph/importing-state)))
        (is (= 1 (count @notifications)))
        (is (= :error (second (first @notifications))))
        (imports/abort-file-graph-import!
         {:error (state/db-worker-uninitialized-error)})
        (is (= 1 (count @notifications))
            "Abort is idempotent once importing is cleared"))
      (finally
        (state/replace-state! original-state)))))

(deftest invoke-import-file-graph-converts-sync-uninitialized-throw-to-rejected-promise
  (async done
    (let [invoke-import (some-> (resolve 'frontend.components.imports/<invoke-import-file-graph)
                                deref)]
      (is (fn? invoke-import))
      (-> (p/with-redefs [state/<wait-for-db-worker (fn [] (p/resolved true))
                          state/<invoke-db-worker
                          (fn [& _]
                            (throw (state/db-worker-uninitialized-error)))]
            (-> (invoke-import "repo" {:path "logseq/config.edn"} [] {})
                (p/then (fn [_] {:status :resolved}))
                (p/catch (fn [error]
                           {:status :rejected
                            :message (ex-message error)}))))
          (p/then (fn [result]
                    (is (= :rejected (:status result)))
                    (is (= "db-worker has not been initialized" (:message result)))))
          (p/catch (fn [error]
                     (is false (str error))))
          (p/finally done)))))
