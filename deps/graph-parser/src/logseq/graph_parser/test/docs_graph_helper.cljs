(ns logseq.graph-parser.test.docs-graph-helper
  "Helper fns for setting up and running tests against docs graph"
  (:require ["fs" :as fs]
            ["child_process" :as child-process]
            [cljs.test :refer [is testing]]
            [clojure.string :as string]
            [logseq.graph-parser.config :as gp-config]
            [datascript.core :as d]))

;; Helper fns for test setup
;; =========================
(defn- sh
  "Run shell cmd synchronously and print to inherited streams by default. Aims
    to be similar to babashka.tasks/shell"
  [cmd opts]
  (child-process/spawnSync (first cmd)
                           (clj->js (rest cmd))
                           (clj->js (merge {:stdio "inherit"} opts))))

(defn clone-docs-repo-if-not-exists
  [dir branch]
  (when-not (.existsSync fs dir)
    (sh ["git" "clone" "--depth" "1" "-b" branch "-c" "advice.detachedHead=false"
         "https://github.com/logseq/docs" dir] {})))


;; Fns for common test assertions
;; ==============================
(defn get-top-block-properties
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

(defn get-all-page-properties
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

(defn get-block-format-counts
  [db]
  (->> (d/q '[:find (pull ?b [*]) :where [?b :block/format]] db)
       (map first)
       (group-by :block/format)
       (map (fn [[k v]] [k (count v)]))
       (into {})))

(defn- query-assertions
  [db files]
  (testing "Query based stats"
    (is (= (->> files
                ;; logseq files aren't saved under :block/file
                (remove #(string/includes? % (str "/" gp-config/app-name "/")))
                set)
           (->> (d/q '[:find (pull ?b [* {:block/file [:file/path]}])
                       :where [?b :block/name] [?b :block/file]]
                     db)
                (map (comp #(get-in % [:block/file :file/path]) first))
                set))
        "Files on disk should equal ones in db")

    (is (= (count (filter #(re-find #"journals/" %) files))
           (->> (d/q '[:find (count ?b)
                       :where
                       [?b :block/journal? true]
                       [?b :block/name]
                       [?b :block/file]]
                     db)
                ffirst))
        "Journal page count on disk equals count in db")

    (is (= {"CANCELED" 2 "DONE" 6 "LATER" 4 "NOW" 5}
           (->> (d/q '[:find (pull ?b [*]) :where [?b :block/marker]]
                     db)
                (map first)
                (group-by :block/marker)
                (map (fn [[k v]] [k (count v)]))
                (into {})))
        "Task marker counts")

    (is (= {:markdown 3143 :org 460} ;; 2 pages for namespaces are not parsed
           (get-block-format-counts db))
        "Block format counts")

    (is (= {:title 98 :id 98
            :updated-at 47 :created-at 47
            :card-last-score 6 :card-repeats 6 :card-next-schedule 6
            :card-last-interval 6 :card-ease-factor 6 :card-last-reviewed 6
            :alias 6 :logseq.macro-arguments 94 :logseq.macro-name 94 :heading 64}
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
            :block/repeated? 1}
           (->> [:block/scheduled :block/priority :block/deadline :block/collapsed?
                 :block/repeated?]
                (map (fn [attr]
                       [attr
                        (ffirst (d/q [:find (list 'count '?b) :where ['?b attr]]
                                     db))]))
                (into {})))
        "Counts for blocks with common block attributes")

    (is (= #{"term" "setting" "book" "templates" "Query" "Query/table" "page"}
           (->> (d/q '[:find (pull ?n [*]) :where [?b :block/namespace ?n]] db)
                (map (comp :block/original-name first))
                set))
        "Has correct namespaces")))

;; TODO update me to the number of the latest version of doc when namespace is updated
(defn docs-graph-assertions
  "These are common assertions that should pass in both graph-parser and main
  logseq app. It is important to run these in both contexts to ensure that the
  functionality in frontend.handler.repo and logseq.graph-parser remain the
  same"
  [db files]
  ;; Counts assertions help check for no major regressions. These counts should
  ;; only increase over time as the docs graph rarely has deletions
  (testing "Counts"
    (is (= 211 (count files)) "Correct file count")
    (is (= 42110 (count (d/datoms db :eavt))) "Correct datoms count")

    (is (= 3600
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

  (query-assertions db files))
