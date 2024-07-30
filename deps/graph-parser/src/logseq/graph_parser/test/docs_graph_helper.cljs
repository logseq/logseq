(ns logseq.graph-parser.test.docs-graph-helper
  "Helper fns for setting up and running tests against docs graph"
  (:require ["fs" :as fs]
            ["child_process" :as child-process]
            [cljs.test :refer [is testing]]
            [clojure.string :as string]
            [logseq.common.config :as common-config]
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
              [?b :block/type "journal"]
              [?b :block/name]
              [?b :block/file]]
            db)
       ffirst))

(defn- get-counts-for-common-attributes [db]
  (->> [:block/scheduled :block/priority :block/deadline :block/collapsed?
        :block/repeated?]
       (map (fn [attr]
              [attr
               (ffirst (d/q [:find (list 'count '?b) :where ['?b attr]]
                            db))]))
       (into {})))

(defn- query-assertions
  [db graph-dir files]
  (testing "Query based stats"
    (is (= (->> files
                ;; logseq files aren't saved under :block/file
                (remove #(string/includes? % (str graph-dir "/" common-config/app-name "/")))
                ;; edn files being listed in docs by parse-graph aren't graph files
                (remove #(and (not (common-config/whiteboard? %)) (string/ends-with? % ".edn")))
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

    (is (= {"CANCELED" 2 "DONE" 6 "LATER" 4 "NOW" 5 "WAIT" 1 "IN-PROGRESS" 1 "CANCELLED" 1 "TODO" 19}
           (->> (d/q '[:find (pull ?b [*]) :where [?b :block/marker]]
                     db)
                (map first)
                (group-by :block/marker)
                (map (fn [[k v]] [k (count v)]))
                (into {})))
        "Task marker counts")

    (is (= {:markdown 7325 :org 500} (get-block-format-counts db))
        "Block format counts")

    (is (= {:rangeincludes 13, :description 137, :updated-at 46, :tags 5,
            :logseq.order-list-type 16, :query-table 8, :logseq.macro-arguments 105,
            :parent 14, :logseq.tldraw.shape 79, :card-last-score 5, :card-repeats 5,
            :name 16, :card-next-schedule 5, :ls-type 79, :card-last-interval 5, :type 166,
            :template 5, :domainincludes 7, :title 114, :alias 62, :supports 6, :id 145,
            :url 30, :card-ease-factor 5, :logseq.macro-name 105, :created-at 46,
            :card-last-reviewed 5, :platforms 79, :initial-version 16, :heading 315}
           (get-top-block-properties db))
        "Counts for top block properties")

    (is (= {:rangeincludes 13, :description 117, :tags 5, :unique 2, :meta 2, :parent 14,
            :ls-type 1, :type 147, :source 1, :domainincludes 7, :sameas 4, :title 113, :author 1,
            :alias 62, :logseq.tldraw.page 1, :supports 6, :url 30, :platforms 78,
            :initial-version 15, :full-title 1}
           (get-all-page-properties db))
        "Counts for all page properties")

    (is (= {:block/scheduled 2
            :block/priority 4
            :block/deadline 1
            :block/collapsed? 90
            :block/repeated? 1}
           (get-counts-for-common-attributes db))
        "Counts for blocks with common block attributes")

    (let [no-name (->> (d/q '[:find (pull ?n [*]) :where [?b :block/namespace ?n]] db)
                       (filter (fn [x]
                                 (when-not (:block/title (first x))
                                   x))))
          all-namespaces (->> (d/q '[:find (pull ?n [*]) :where [?b :block/namespace ?n]] db)
                              (map (comp :block/title first))
                              set)]
      (is (= #{"term" "setting" "book" "templates" "page" "Community" "Tweet"
               "Whiteboard" "Whiteboard/Tool" "Whiteboard/Tool/Shape" "Whiteboard/Object" "Whiteboard/Action Bar"}
             all-namespaces)
          (str "Has correct namespaces: " no-name)))

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
    (is (= 340 (count files)) "Correct file count")
    (is (= 33
           (ffirst
            (d/q '[:find (count ?b)
                   :where [?b :block/title ?content]
                   [(clojure.string/includes? ?content "+BEGIN_QUERY")]]
                 db)))
        "Advanced query count"))

  (query-assertions db graph-dir files))
