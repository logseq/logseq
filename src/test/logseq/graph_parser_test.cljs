(ns logseq.graph-parser-test
  "TODO: Should I reuse repo-test or split it?"
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.graph-parser :as graph-parser]
            [frontend.test.docs-graph-helper :as docs-graph-helper]
            [datascript.core :as d]))

(defn- get-top-block-properties
  [db]
  (->> (d/q '[:find (pull ?b [*])
              :where
              [?b :block/properties]
              [(missing? $ ?b :block/name)]]
            db)
       (map first)
       (map (fn [m] (zipmap (keys (:block/properties m)) (repeat 1))))
       (apply merge-with +)
       (filter #(>= (val %) 5))
       (into {})))

(defn- get-all-page-properties
  [db]
  (->> (d/q '[:find (pull ?b [*])
              :where
              [?b :block/properties]
              [?b :block/name]]
            db)
       (map first)
       (map (fn [m] (zipmap (keys (:block/properties m)) (repeat 1))))
       (apply merge-with +)
       (into {})))

;; Integration test that test parsing a large graph like docs
(deftest ^:integration parse-and-load-files-to-db
  (let [graph-dir "src/test/docs"
        _ (docs-graph-helper/clone-docs-repo-if-not-exists graph-dir)
        files (docs-graph-helper/build-graph-files graph-dir)
        conn (graph-parser/init-db)
        ; _ (repo-handler/parse-files-and-load-to-db! test-helper/test-db files {:re-render? false})
        _ (graph-parser/parse conn files)
        db @conn]

    ;; Counts assertions help check for no major regressions. These counts should
    ;; only increase over time as the docs graph rarely has deletions
    (testing "Counts"
      (is (= 206 (count files)) "Correct file count")
      (is (= 40888 (count (d/datoms db :eavt))) "Correct datoms count")

      (is (= 3597
             (ffirst
              (d/q '[:find (count ?b)
                     :where [?b :block/path-refs ?bp] [?bp :block/name]] db)))
          "Correct referenced blocks count")
      (is (= 21
             (ffirst
              (d/q '[:find (count ?b)
                     :where [?b :block/content ?content]
                     [(clojure.string/includes? ?content "+BEGIN_QUERY")]]
                   db)))
          "Advanced query count"))

    (testing "Query based stats"
      (is (= (set (map :file/path files))
             (->> (d/q '[:find (pull ?b [* {:block/file [:file/path]}])
                         :where [?b :block/name] [?b :block/file]]
                       db)
                  (map (comp #(get-in % [:block/file :file/path]) first))
                  set))
          "Journal and pages files on disk should equal ones in db")

      (is (= (count (filter #(re-find #"journals/" (:file/path %))
                            files))
             (->> (d/q '[:find (count ?b)
                         :where
                         [?b :block/journal? true]
                         [?b :block/name]
                         [?b :block/file]]
                       db)
                  ffirst))
          "Journal page count on disk equals count in db")

      (is (= {"CANCELED" 2 "DONE" 6 "LATER" 4 "NOW" 5}
             (->> (d/q '[:find (pull ?b [*]) :where [?b :block/marker] ]
                       db)
                  (map first)
                  (group-by :block/marker)
                  (map (fn [[k v]] [k (count v)]))
                  (into {})))
          "Task marker counts")

      (is (= {:markdown 3140 :org 460}
             (->> (d/q '[:find (pull ?b [*]) :where [?b :block/format]] db)
                  (map first)
                  (group-by :block/format)
                  (map (fn [[k v]] [k (count v)]))
                  (into {})))
          "Block format counts")

      (is (= {:title 98 :id 98
              :updated-at 47 :created-at 47
              :collapsed 22
              :card-last-score 6 :card-repeats 6 :card-next-schedule 6
              :card-last-interval 6 :card-ease-factor 6 :card-last-reviewed 6
              :alias 6}
             (get-top-block-properties db))
          "Counts for top block properties")

      (is (= {:title 98
              :alias 6
              :tags 2 :permalink 2
              :name 1 :type 1 :related 1 :sample 1 :click 1 :id 1 :example 1}
             (get-all-page-properties db))
          "Counts for all page properties")

      (is (= {:block/scheduled 2
              :block/priority 4
              :block/deadline 1
              :block/collapsed? 22
              :block/heading-level 57
              :block/repeated? 1}
             (->> [:block/scheduled :block/priority :block/deadline :block/collapsed?
                   :block/heading-level :block/repeated?]
                  (map (fn [attr]
                         [attr
                          (ffirst (d/q [:find (list 'count '?b) :where ['?b attr]]
                                       db))]))
                  (into {})))
          "Counts for blocks with common block attributes")

      (is (= #{"term" "setting" "book" "Templates" "Query" "Query/table" "page"}
             (->> (d/q '[:find (pull ?n [*]) :where [?b :block/namespace ?n]] db)
                  (map (comp :block/original-name first))
                  set))
          "Has correct namespaces"))))
