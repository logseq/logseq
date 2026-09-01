(ns frontend.components.imports-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.components.imports]
            [frontend.config :as config]
            [frontend.handler.notification :as notification]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.db :as ldb]
            [logseq.shui.dialog.core :as shui-dialog]
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

(deftest compact-import-result-notifies-counts-not-file-lists-test
  (let [validate-imported-data (some-> (resolve 'frontend.components.imports/validate-imported-data)
                                       deref)
        shown (atom [])]
    (is (fn? validate-imported-data))
    (when (fn? validate-imported-data)
      (with-redefs [notification/show! (fn [content status & _]
                                         (swap! shown conj [content status]))]
        (validate-imported-data {:org-file-count 2
                                 :ignored-files-count 1
                                 :ignored-assets-count 0
                                 :ignored-properties-count 4
                                 :validation-error-count 3
                                 :notifications []})
        (is (= 4 (count @shown)))
        (is (= #{:info :warning} (set (map second @shown))))))))

(deftest file-graph-import-initial-ui-state-is-importing-test
  (let [initial-ui-state (some-> (resolve 'frontend.components.imports/file-graph-import-initial-ui-state)
                                 deref)]
    (is (map? initial-ui-state))
    (is (= :importing (:step initial-ui-state)))
    (is (= :import/loading (:label initial-ui-state))
        "Progress starts as Importing before the worker sends file names.")))

(defn- file-graph-import-fn
  []
  (some-> (resolve 'frontend.components.imports/import-file-graph) deref))

(deftest file-graph-import-creates-graph-then-restores-once-without-reload
  (async done
         (let [import-file-graph (file-graph-import-fn)
               graph-name "Imported"
               expected-repo (str config/db-version-prefix graph-name)
               ui (atom {:git/current-repo "logseq_db_old"})
               calls (atom [])]
           (is (fn? import-file-graph))
           (-> (p/with-redefs [util/electron? (constantly true)
                               state/set-state! (fn [path value]
                                                  (swap! calls conj [:set-state path])
                                                  (if (vector? path)
                                                    (swap! ui assoc-in path value)
                                                    (swap! ui assoc path value)))
                               state/get-state (fn [path]
                                                 (if (vector? path)
                                                   (get-in @ui path)
                                                   (get @ui path)))
                               state/get-current-repo (fn [] (:git/current-repo @ui))
                               state/pub-event! (fn [event]
                                                  (swap! calls conj [:event event]))
                               repo-handler/new-db!
                               (fn [name opts]
                                 (swap! calls conj [:new-db name opts])
                                 (let [repo (str config/db-version-prefix name)]
                                   (swap! ui assoc :git/current-repo repo)
                                   (p/resolved repo)))
                               state/<invoke-db-worker
                               (fn [api & args]
                                 (swap! calls conj (into [api] args))
                                 (if (= api :thread-api/import-file-graph)
                                   (p/resolved {:run-id "import-1"
                                                :status :completed
                                                :persisted? true
                                                :validation {:status :passed :error-count 0}
                                                :issue-count 0
                                                :org-file-count 0
                                                :ignored-files-count 0
                                                :ignored-assets-count 0
                                                :ignored-properties-count 0
                                                :validation-error-count 0
                                                :notifications []})
                                   (p/resolved nil)))
                               repo-handler/restore-and-setup-repo!
                               (fn [repo opts]
                                 (swap! calls conj [:restore repo opts :importing (:graph/importing @ui)])
                                 (p/resolved nil))
                               notification/show! (fn [& _] nil)
                               shui/dialog-open! (fn [& _] nil)
                               shui/dialog-close! (fn [id]
                                                    (swap! calls conj [:dialog-close id]))
                               shui-dialog/get-dialog (fn [_] nil)
                               route-handler/redirect-to-home! (fn []
                                                                 (swap! calls conj [:redirect-home]))
                               ui-handler/re-render-root! (fn []
                                                            (swap! calls conj [:rerender]))]
                 (import-file-graph [{:path "logseq/config.edn"
                                      :fs-path "/tmp/graph/logseq/config.edn"}
                                     {:path "pages/Home.md"
                                      :fs-path "/tmp/graph/pages/Home.md"}]
                                    {:graph-name graph-name}
                                    {:path "logseq/config.edn"}))
               (p/then (fn [_]
                         (let [new-db-idx (->> @calls
                                               (keep-indexed (fn [idx call]
                                                               (when (= :new-db (first call)) idx)))
                                               first)
                               import-idx (->> @calls
                                               (keep-indexed (fn [idx call]
                                                               (when (= :thread-api/import-file-graph (first call)) idx)))
                                               first)
                               restore-idx (->> @calls
                                                (keep-indexed (fn [idx call]
                                                                (when (= :restore (first call)) idx)))
                                                first)
                               search-calls (filter #(= :thread-api/search-build-blocks-indice-in-worker (first %))
                                                    @calls)
                               restore-call (first (filter #(= :restore (first %)) @calls))]
                           (is (< new-db-idx import-idx)
                               "The new graph is created before worker import.")
                           (is (< import-idx restore-idx)
                               "Renderer restore happens after worker import.")
                           (is (= :file-graph (last restore-call))
                               "Importing stays set during restore so :graph/restored does not start search.")
                           (is (= 1 (count search-calls))
                               "Search index is rebuilt once after restore.")
                           (is (< restore-idx (->> @calls
                                                   (keep-indexed (fn [idx call]
                                                                   (when (= :thread-api/search-build-blocks-indice-in-worker (first call))
                                                                     idx)))
                                                   first))
                               "Search starts after restore.")
                           (is (not-any? #(= :reload (first %)) @calls))
                           (is (some #{[:dialog-close :import-indicator]} @calls))
                           (is (nil? (:graph/importing @ui)))
                           (is (= expected-repo (:git/current-repo @ui))))))
               (p/catch (fn [error]
                          (is false (str error))))
               (p/finally done)))))

(deftest file-graph-import-failure-switches-back-to-previous-graph
  (async done
         (let [import-file-graph (file-graph-import-fn)
               previous-repo "logseq_db_old"
               ui (atom {:git/current-repo previous-repo})
               calls (atom [])]
           (-> (p/with-redefs [util/electron? (constantly true)
                               state/set-state! (fn [path value]
                                                  (if (vector? path)
                                                    (swap! ui assoc-in path value)
                                                    (swap! ui assoc path value)))
                               state/get-state (fn [path]
                                                 (if (vector? path)
                                                   (get-in @ui path)
                                                   (get @ui path)))
                               state/get-current-repo (fn [] (:git/current-repo @ui))
                               state/pub-event! (fn [event]
                                                  (swap! calls conj [:event event]))
                               repo-handler/new-db!
                               (fn [name _opts]
                                 (let [repo (str config/db-version-prefix name)]
                                   (swap! ui assoc :git/current-repo repo)
                                   (p/resolved repo)))
                               state/<invoke-db-worker
                               (fn [api & _args]
                                 (if (= api :thread-api/import-file-graph)
                                   (p/rejected (js/Error. "import failed"))
                                   (p/resolved nil)))
                               repo-handler/restore-and-setup-repo!
                               (fn [_repo _opts]
                                 (swap! calls conj [:restore])
                                 (p/resolved nil))
                               notification/show! (fn [content status & _]
                                                    (swap! calls conj [:notify status content]))
                               shui/dialog-open! (fn [& _] nil)
                               shui/dialog-close! (fn [id]
                                                    (swap! calls conj [:dialog-close id]))
                               shui-dialog/get-dialog (fn [_] nil)
                               route-handler/redirect-to-home! (fn []
                                                                 (swap! calls conj [:redirect-home]))
                               ui-handler/re-render-root! (fn []
                                                            (swap! calls conj [:rerender]))]
                 (import-file-graph [{:path "logseq/config.edn"
                                      :fs-path "/tmp/graph/logseq/config.edn"}]
                                    {:graph-name "Broken"}
                                    {:path "logseq/config.edn"}))
               (p/then (fn [_]
                         (is (not-any? #(= :restore (first %)) @calls)
                             "Failed import does not restore the incomplete graph.")
                         (is (some #{[:event [:graph/switch previous-repo {:persist? false}]]} @calls)
                             "Failed import switches back to the previous graph.")
                         (is (some #{[:dialog-close :import-indicator]} @calls))
                         (is (nil? (:graph/importing @ui)))))
               (p/catch (fn [error]
                          (is false (str error))))
               (p/finally done)))))

(deftest file-graph-import-fetch-failure-after-files-keeps-new-graph
  (async done
         (let [import-file-graph (file-graph-import-fn)
               previous-repo "logseq_db_old"
               graph-name "4k-movies"
               expected-repo (str config/db-version-prefix graph-name)
               ui (atom {:git/current-repo previous-repo})
               calls (atom [])]
           (-> (p/with-redefs [util/electron? (constantly true)
                               state/set-state! (fn [path value]
                                                  (if (vector? path)
                                                    (swap! ui assoc-in path value)
                                                    (swap! ui assoc path value)))
                               state/get-state (fn [path]
                                                 (if (vector? path)
                                                   (get-in @ui path)
                                                   (get @ui path)))
                               state/get-current-repo (fn [] (:git/current-repo @ui))
                               state/pub-event! (fn [event]
                                                  (swap! calls conj [:event event]))
                               repo-handler/new-db!
                               (fn [name _opts]
                                 (let [repo (str config/db-version-prefix name)]
                                   (swap! ui assoc :git/current-repo repo)
                                   (p/resolved repo)))
                               state/<invoke-db-worker
                               (fn [api & _args]
                                 (if (= api :thread-api/import-file-graph)
                                   (do
                                     (swap! ui assoc :graph/importing-state
                                            {:step :finishing
                                             :label :import/finishing
                                             :total 3886
                                             :current-idx 3886})
                                     (p/rejected (js/Error. "Failed to fetch")))
                                   (p/resolved nil)))
                               repo-handler/restore-and-setup-repo!
                               (fn [repo opts]
                                 (swap! calls conj [:restore repo opts])
                                 (p/resolved nil))
                               notification/show! (fn [content status & _]
                                                    (swap! calls conj [:notify status content]))
                               shui/dialog-open! (fn [& _] nil)
                               shui/dialog-close! (fn [id]
                                                    (swap! calls conj [:dialog-close id]))
                               shui-dialog/get-dialog (fn [_] nil)
                               route-handler/redirect-to-home! (fn []
                                                                 (swap! calls conj [:redirect-home]))
                               ui-handler/re-render-root! (fn []
                                                            (swap! calls conj [:rerender]))]
                 (import-file-graph [{:path "logseq/config.edn"
                                      :fs-path "/tmp/graph/logseq/config.edn"}]
                                    {:graph-name graph-name}
                                    {:path "logseq/config.edn"}))
               (p/then (fn [_]
                         (is (some #(= :restore (first %)) @calls)
                             "After files are written, a dropped invoke still restores the new graph.")
                         (is (not-any? #(= [:event [:graph/switch previous-repo {:persist? false}]] %) @calls)
                             "Finished import must not switch away from the new graph.")
                         (is (some #{[:dialog-close :import-indicator]} @calls))
                         (is (some #{[:redirect-home]} @calls))
                         (is (some (fn [[op status]]
                                     (and (= :notify op) (= :success status)))
                                   @calls)
                             "Keep-graph still shows import finished.")
                         (is (not-any? (fn [[op status]]
                                         (and (= :notify op) (contains? #{:warning :error} status)))
                                       @calls)
                             "A dropped RPC must not invent validation or ignored-file notifications.")
                         (is (= expected-repo (:git/current-repo @ui)))
                         (is (nil? (:graph/importing @ui)))))
               (p/catch (fn [error]
                          (is false (str error))))
               (p/finally done)))))
