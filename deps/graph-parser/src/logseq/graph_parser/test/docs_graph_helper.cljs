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

(defn- get-journal-page-count [db]
  (->> (d/q '[:find (count ?b)
              :where
              [?b :block/journal? true]
              [?b :block/name]
              [?b :block/file]]
            db)
       ffirst))

(defn- query-assertions
  [db graph-dir files]
  (testing "Query based stats"
    (is (= (->> files
                ;; logseq files aren't saved under :block/file
                (remove #(string/includes? % (str graph-dir "/" gp-config/app-name "/")))
                ;; edn files being listed in docs by parse-graph aren't graph files
                (remove #(and (not (gp-config/whiteboard? %)) (string/ends-with? % ".edn")))
                set)
           (->> (d/q '[:find (pull ?b [* {:block/file [:file/path]}])
                       :where [?b :block/name] [?b :block/file]]
                     db)
                (map (comp #(get-in % [:block/file :file/path]) first))
                set))
        "Files on disk should equal ones in db")

    (is (= (count (filter #(re-find #"journals/" %) files))
           (get-journal-page-count db))
        "Journal page count on disk equals count in db")

    (is (= {"CANCELED" 2 "DONE" 6 "LATER" 4 "NOW" 5 "TODO" 22}
           (->> (d/q '[:find (pull ?b [*]) :where [?b :block/marker]]
                     db)
                (map first)
                (group-by :block/marker)
                (map (fn [[k v]] [k (count v)]))
                (into {})))
        "Task marker counts")

    (is (= {:markdown 5499 :org 457} (get-block-format-counts db))
        "Block format counts")

    (is (= {:description 81, :updated-at 46, :tags 5, :logseq.macro-arguments 104
            :logseq.tldraw.shape 79, :card-last-score 6, :card-repeats 6,
            :card-next-schedule 6, :ls-type 79, :card-last-interval 6, :type 107,
            :template 5, :title 114, :alias 41, :supports 5, :id 145, :url 5,
            :card-ease-factor 6, :logseq.macro-name 104, :created-at 46,
            :card-last-reviewed 6, :platforms 51, :initial-version 8, :heading 226}
           (get-top-block-properties db))
        "Counts for top block properties")

    (is (= {:description 77, :tags 5, :permalink 1, :ls-type 1, :type 104,
            :related 1, :source 1, :title 113, :author 1, :sample 1, :alias 41,
            :logseq.tldraw.page 1, :supports 5, :url 5, :platforms 50,
            :initial-version 7, :full-title 1}
           (get-all-page-properties db))
        "Counts for all page properties")

    (is (= {:block/scheduled 2
            :block/priority 4
            :block/deadline 1
            :block/collapsed? 80
            :block/repeated? 1}
           (->> [:block/scheduled :block/priority :block/deadline :block/collapsed?
                 :block/repeated?]
                (map (fn [attr]
                       [attr
                        (ffirst (d/q [:find (list 'count '?b) :where ['?b attr]]
                                     db))]))
                (into {})))
        "Counts for blocks with common block attributes")

    (is (= #{"term" "setting" "book" "templates" "Query table" "page"
             "Whiteboard" "Whiteboard/Tool" "Whiteboard/Tool/Shape" "Whiteboard/Object"
             "Whiteboard/Property" "Community" "Tweet"}
           (->> (d/q '[:find (pull ?n [*]) :where [?b :block/namespace ?n]] db)
                (map (comp :block/original-name first))
                set))
        "Has correct namespaces")

    (is (empty? (->> (d/q '[:find ?n :where [?b :block/name ?n]] db)
                     (map first)
                     (filter #(string/includes? % "___"))))
        "Block names don't have the slash/triple-lowbar delimiter")))

(defn docs-graph-assertions
  "These are common assertions that should pass in both graph-parser and main
  logseq app. It is important to run these in both contexts to ensure that the
  functionality in frontend.handler.repo and logseq.graph-parser remain the
  same"
  [db graph-dir files]
  ;; Counts assertions help check for no major regressions. These counts should
  ;; only increase over time as the docs graph rarely has deletions
  (testing "Counts"
    (is (= 303 (count files)) "Correct file count")
    (is (= 69499 (count (d/datoms db :eavt))) "Correct datoms count")

    (is (= 5866
           (ffirst
            (d/q '[:find (count ?b)
                   :where [?b :block/path-refs ?bp] [?bp :block/name]] db)))
        "Correct referenced blocks count")
    (is (= 23
           (ffirst
            (d/q '[:find (count ?b)
                   :where [?b :block/content ?content]
                   [(clojure.string/includes? ?content "+BEGIN_QUERY")]]
                 db)))
        "Advanced query count"))

  (query-assertions db graph-dir files))
