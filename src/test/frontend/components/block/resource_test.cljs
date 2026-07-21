(ns frontend.components.block.resource-test
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]))

(defn- block-source
  []
  (.toString
   (fs/readFileSync
    (node-path/join (.cwd js/process)
                    "src/main/frontend/components/block.cljs")
    "utf8")))

(defn- comments-source
  []
  (.toString
   (fs/readFileSync
    (node-path/join (.cwd js/process)
                    "src/main/frontend/components/block/comments.cljs")
    "utf8")))

(defn- form-source
  [source marker]
  (let [start (string/index-of source marker)
        end (when start
              (or (some->> ["\n(hsx/defc "
                            "\n(defn"
                            "\n(def "
                            "\n(declare "]
                           (keep #(string/index-of source % (inc start)))
                           seq
                           (apply min))
                  (count source)))]
    (when (and start end)
      (subs source start end))))

(defn- hook-names
  [source]
  (set (re-seq #"db-hooks/[a-z-]+" source)))

(def ^:private local-derived-read-markers
  ["block.temp/"
   "db-async/"
   "react/q"
   "db-hooks/use-query"
   "rfx/use-entity"
   "hooks/use-effect"
   "hooks/use-state"
   "hooks/use-atom"])

(defn- assert-no-local-derived-read!
  [source]
  (doseq [marker local-derived-read-markers]
    (is (not (string/includes? source marker))
        (str "Unexpected local graph read: " marker))))

(deftest positioned-properties-render-from-the-canonical-block-revision-test
  (let [source (block-source)
        positioned-source (form-source source "(hsx/defc block-positioned-properties")]
    (is (some? positioned-source))
    (when positioned-source
      (is (string/includes? positioned-source
                            ":block.temp/positioned-properties"))
      (is (string/includes? positioned-source "position"))
      (is (empty? (hook-names positioned-source))))))

(deftest positioned-property-rows-hydrate-only-their-property-uuid-test
  (let [source (block-source)
        row-source (form-source source "(hsx/defc positioned-property-row")]
    (is (some? row-source)
        "Every positioned property is rendered through one UUID row boundary.")
    (when row-source
      (is (string/includes? row-source "property-uuid"))
      (is (string/includes? row-source
                            "(db-hooks/use-block property-uuid)"))
      (is (= #{"db-hooks/use-block"} (hook-names row-source)))
      (assert-no-local-derived-read! row-source))))

(deftest reactions-subscribe-to-a-final-summary-resource-test
  (let [source (block-source)
        reactions-source (form-source source "(hsx/defc loaded-block-reactions")
        wrapper-source (form-source source "(defn block-reactions")]
    (is (some? reactions-source))
    (when reactions-source
      (is (string/includes? reactions-source ":block-reactions"))
      (is (string/includes? reactions-source ":block/uuid"))
      (is (string/includes? reactions-source "current-user-uuid"))
      (is (= #{"db-hooks/use-resource"} (hook-names reactions-source)))
      (is (not (string/includes? reactions-source "reaction/summarize"))
          "The worker resource returns the final render summary.")
      (assert-no-local-derived-read! reactions-source))
    (is (some? wrapper-source))
    (is (string/includes? wrapper-source "(uuid? (:block/uuid block))"))
    (is (not (string/includes? wrapper-source "db-hooks/use-resource")))))

(deftest reference-count-renders-from-the-canonical-block-revision-test
  (let [source (block-source)
        refs-source (form-source source "(hsx/defc block-refs-count")]
    (is (some? refs-source))
    (when refs-source
      (is (string/includes? refs-source ":block.temp/refs-count"))
      (is (empty? (hook-names refs-source))))))

(deftest comment-thread-button-subscribes-to-thread-uuids-test
  (let [source (block-source)
        button-source (form-source source "(hsx/defc block-comment-thread-button")
        thread-source (form-source source "(hsx/defc subscribed-comment-thread")]
    (is (some? button-source)
        "Comment presence and ordered threads share one mounted resource consumer.")
    (when button-source
      (is (string/includes? button-source ":block-comment-threads"))
      (is (string/includes? button-source "block-uuid"))
      (is (string/includes? button-source "thread-uuids"))
      (is (= #{"db-hooks/use-resource"} (hook-names button-source)))
      (assert-no-local-derived-read! button-source))
    (is (some? thread-source)
        "A comment entity is hydrated only at its UUID row boundary.")
    (when thread-source
      (is (string/includes? thread-source "thread-uuid"))
      (is (string/includes? thread-source
                            "(db-hooks/use-block thread-uuid)"))
      (is (= #{"db-hooks/use-block"} (hook-names thread-source)))
      (assert-no-local-derived-read! thread-source))))

(deftest block-container-does-not-own-comment-or-reference-loaders-test
  (let [source (block-source)
        container-source
        (form-source
         source
         "(hsx/defc ^:large-vars/cleanup-todo block-container-inner-aux")]
    (is (some? container-source))
    (when container-source
      (testing "reference count belongs to its mounted resource component"
        (is (not (string/includes? container-source
                                   "db-async/<get-block-refs-count")))
        (is (not (string/includes? container-source
                                   ":block.temp/refs-count"))))
      (testing "comment presence and hydration have no local cache or fallback"
        (doseq [forbidden [":block.temp/comment-thread-present?"
                           "schedule-comment-thread-presence-check!"
                           "hydrate-comment-thread!"
                           "hydrated-comment-thread"]]
          (is (not (string/includes? container-source forbidden))
              (str "Unexpected local comment loader: " forbidden)))))))

(deftest comment-thread-children-render-as-subscribed-uuid-rows-test
  (let [source (comments-source)
        area-source (form-source source "(hsx/defc comments-area-view")
        row-source (form-source source "(hsx/defc subscribed-comment-row")]
    (is (some? area-source))
    (when area-source
      (is (string/includes? area-source ":block-comment-summary"))
      (is (string/includes? area-source "comment-uuids"))
      (is (= #{"db-hooks/use-resource"} (hook-names area-source)))
      (is (not (string/includes? area-source "comments-model/comments-summary"))))
    (is (some? row-source))
    (when row-source
      (is (string/includes? row-source "comment-uuid"))
      (is (string/includes? row-source "(db-hooks/use-block comment-uuid)"))
      (is (= #{"db-hooks/use-block"} (hook-names row-source))))))

(deftest task-time-subscribes-and-hydrates-status-uuids-at-row-boundaries-test
  (let [source (block-source)
        task-time-source (form-source source "(hsx/defc task-spent-time-cp")
        history-row-source (form-source source "(hsx/defc status-history-row")]
    (is (some? task-time-source))
    (when task-time-source
      (is (string/includes? task-time-source ":block-task-time"))
      (is (string/includes? task-time-source ":block/uuid"))
      (is (string/includes? task-time-source ":history"))
      (is (string/includes? task-time-source ":seconds"))
      (is (= #{"db-hooks/use-resource"} (hook-names task-time-source)))
      (assert-no-local-derived-read! task-time-source))
    (is (some? history-row-source)
        "Status history crosses the resource boundary as status UUIDs.")
    (when history-row-source
      (is (string/includes? history-row-source "status-uuid"))
      (is (string/includes? history-row-source
                            "(db-hooks/use-block status-uuid)"))
      (is (= #{"db-hooks/use-block"} (hook-names history-row-source)))
      (assert-no-local-derived-read! history-row-source))))

(deftest sync-conflicts-use-only-the-sync-state-provider-test
  (let [source (block-source)
        warning-source (form-source source "(hsx/defc sync-conflicts-warning-button")]
    (is (some? warning-source))
    (when warning-source
      (is (string/includes? warning-source
                            "rfx/use-sub [:sync/block-conflicts"))
      (is (empty? (hook-names warning-source))
          "Sync conflicts are not a DB render resource.")
      (doseq [forbidden [":block.temp/sync-conflicts"
                         "hooks/use-effect"
                         ":thread-api/db-sync-get-block-conflicts"
                         "state/set-sync-block-conflicts!"
                         "db-async/"
                         "react/q"]]
        (is (not (string/includes? warning-source forbidden))
            (str "Unexpected mount-time conflict loader: " forbidden))))))
