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

(defn- call-idx
  [calls op]
  (->> calls
       (keep-indexed (fn [idx call]
                       (when (= op (first call)) idx)))
       first))

(defn- notify-status?
  [calls status]
  (some (fn [[op notify-status]]
          (and (= :notify op) (= status notify-status)))
        calls))

(def ^:private default-file-graph-files
  [{:path "logseq/config.edn"
    :fs-path "/tmp/graph/logseq/config.edn"}])

(def ^:private default-file-graph-config
  {:path "logseq/config.edn"})

(defn- completed-file-graph-result
  []
  {:run-id "import-1"
   :status :completed-with-errors
   :persisted? true
   :validation {:status :passed :error-count 0}
   :issue-count 1
   :org-file-count 0
   :ignored-files-count 1
   :ignored-assets-count 0
   :ignored-properties-count 0
   :validation-error-count 0
   :notifications [{:msg "Import failed on \"pages/Skip.md\""
                    :level :error}]})

(defn- reject-import-after-step
  [ui step label]
  (fn []
    (swap! ui assoc :graph/importing-state
           {:step step
            :label label
            :total 3886
            :current-idx 3886})
    (p/rejected (js/Error. "Failed to fetch"))))

(defn- run-file-graph-import!
  [{:keys [ui calls files options config-file invoke-import]}]
  (let [import-file-graph (file-graph-import-fn)]
    (is (fn? import-file-graph))
    (p/with-redefs [util/electron? (constantly true)
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
                        (invoke-import)
                        (p/resolved nil)))
                    repo-handler/restore-and-setup-repo!
                    (fn [repo opts]
                      (swap! calls conj [:restore repo opts :importing (:graph/importing @ui)])
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
      (import-file-graph (or files default-file-graph-files)
                         options
                         (or config-file default-file-graph-config)))))

(defn- assert-file-graph-happy-path
  [calls ui expected-repo]
  (let [import-call (first (filter #(= :thread-api/import-file-graph (first %)) calls))
        import-files (nth import-call 3)]
    (is (< (call-idx calls :new-db) (call-idx calls :thread-api/import-file-graph))
        "The new graph is created before worker import.")
    (is (< (call-idx calls :thread-api/import-file-graph) (call-idx calls :restore))
        "Renderer restore happens after worker import.")
    (is (every? #(and (string? (:path %))
                      (string? (:fs-path %))
                      (nil? (:file/content %))
                      (nil? (:asset/payload %)))
                import-files)
        "Electron lazy import sends filesystem paths without file contents.")
    (is (notify-status? calls :error)
        "Worker error notifications from the terminal result are shown.")
    (is (notify-status? calls :info)
        "Ignored-file counts from the terminal result are shown.")
    (is (notify-status? calls :success)
        "Import finished is still shown after a partial import.")
    (is (= :file-graph (last (first (filter #(= :restore (first %)) calls))))
        "Importing stays set during restore so :graph/restored does not start search.")
    (is (= 1 (count (filter #(= :thread-api/search-build-blocks-indice-in-worker (first %))
                            calls)))
        "Search index is rebuilt once after restore.")
    (is (< (call-idx calls :restore)
           (call-idx calls :thread-api/search-build-blocks-indice-in-worker))
        "Search starts after restore.")
    (is (not-any? #(= :reload (first %)) calls))
    (is (some #{[:dialog-close :import-indicator]} calls))
    (is (nil? (:graph/importing ui)))
    (is (= expected-repo (:git/current-repo ui)))))

(deftest file-graph-import-creates-graph-then-restores-once-without-reload
  (async done
         (let [graph-name "Imported"
               expected-repo (str config/db-version-prefix graph-name)
               ui (atom {:git/current-repo "logseq_db_old"})
               calls (atom [])]
           (-> (run-file-graph-import!
                {:ui ui
                 :calls calls
                 :files (conj default-file-graph-files
                              {:path "pages/Home.md"
                               :fs-path "/tmp/graph/pages/Home.md"})
                 :options {:graph-name graph-name}
                 :invoke-import (fn [] (p/resolved (completed-file-graph-result)))})
               (p/then (fn [_]
                         (assert-file-graph-happy-path @calls @ui expected-repo)))
               (p/catch (fn [error]
                          (is false (str error))))
               (p/finally done)))))

(deftest file-graph-import-failure-switches-back-to-previous-graph
  (async done
         (let [previous-repo "logseq_db_old"
               ui (atom {:git/current-repo previous-repo})
               calls (atom [])]
           (-> (run-file-graph-import!
                {:ui ui
                 :calls calls
                 :options {:graph-name "Broken"}
                 :invoke-import (fn [] (p/rejected (js/Error. "import failed")))})
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

(deftest file-graph-import-fetch-failure-while-finishing-switches-back
  (async done
         (let [previous-repo "logseq_db_old"
               ui (atom {:git/current-repo previous-repo})
               calls (atom [])]
           (-> (run-file-graph-import!
                {:ui ui
                 :calls calls
                 :options {:graph-name "4k-movies"}
                 :invoke-import (reject-import-after-step ui :finishing :import/finishing)})
               (p/then (fn [_]
                         (is (not-any? #(= :restore (first %)) @calls)
                             "A drop during Finishing is before sqlite store and refs finalize.")
                         (is (some #{[:event [:graph/switch previous-repo {:persist? false}]]} @calls)
                             "Unfinished import switches back to the previous graph.")
                         (is (notify-status? @calls :error))
                         (is (nil? (:graph/importing @ui)))))
               (p/catch (fn [error]
                          (is false (str error))))
               (p/finally done)))))

(deftest file-graph-import-fetch-failure-after-files-keeps-new-graph
  (async done
         (let [previous-repo "logseq_db_old"
               graph-name "4k-movies"
               expected-repo (str config/db-version-prefix graph-name)
               ui (atom {:git/current-repo previous-repo})
               calls (atom [])]
           (-> (run-file-graph-import!
                {:ui ui
                 :calls calls
                 :options {:graph-name graph-name}
                 :invoke-import (reject-import-after-step ui :validating :import/validating-graph)})
               (p/then (fn [_]
                         (is (some #(= :restore (first %)) @calls)
                             "After the worker persists the graph, a dropped invoke still restores it.")
                         (is (not-any? #(= [:event [:graph/switch previous-repo {:persist? false}]] %) @calls)
                             "Persisted import must not switch away from the new graph.")
                         (is (some #{[:dialog-close :import-indicator]} @calls))
                         (is (some #{[:redirect-home]} @calls))
                         (is (notify-status? @calls :success)
                             "Keep-graph still shows import finished.")
                         (is (not (notify-status? @calls :warning))
                             "A dropped RPC must not invent validation or ignored-file notifications.")
                         (is (not (notify-status? @calls :error))
                             "A dropped RPC must not invent validation or ignored-file notifications.")
                         (is (= expected-repo (:git/current-repo @ui)))
                         (is (nil? (:graph/importing @ui)))))
               (p/catch (fn [error]
                          (is false (str error))))
               (p/finally done)))))
