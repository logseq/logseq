(ns frontend.components.imports-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.components.imports]
            [frontend.handler.notification :as notification]
            [logseq.db :as ldb]))

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
