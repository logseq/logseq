(ns logseq.outliner.paste-refs-test
  "Pasting blocks whose :block/refs repeat the same new-page ref (e.g. an
  OG-exported page that links [[internet]] many times) must create one page."
  (:require [cljs.test :refer [deftest is]]
            [clojure.string :as string]
            [datascript.core :as d]
            [frontend.util.entity :as entity]
            [frontend.worker.plain-value :as worker-plain]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.page :as outliner-page]))

(defn- page-count
  [db name]
  (count (d/q '[:find [?e ...]
                :in $ ?name
                :where [?e :block/name ?name]]
              db name)))

(defn- page-ref-map
  "A new-page ref map like paste.cljs produces for an unresolved [[title]]:
  file-style :block/type \"page\" with a fresh uuid per occurrence."
  [title]
  {:block/uuid (random-uuid)
   :block/title title
   :block/name title
   :block/type "page"})

(def ^:private paste-opts
  {:sibling? true
   :outliner-op :paste
   :outliner-real-op :paste-text
   :keep-uuid? true})

(defn- paste-blocks!
  [conn blocks]
  (let [target (db-test/find-block-by-content @conn "anchor")]
    (outliner-core/insert-blocks! conn blocks target paste-opts)))

(defn- conn-with-target []
  (db-test/create-conn-with-blocks
   [{:page {:block/title "target"}
     :blocks [{:block/title "anchor"}]}]))

(deftest insert-same-block-repeated-page-refs-creates-one-page
  (let [conn (conn-with-target)]
    (paste-blocks!
     conn
     [{:block/uuid (random-uuid)
       :block/title "see [[internet]] and [[internet]]"
       :block/refs [(page-ref-map "internet")
                    (page-ref-map "internet")]}])
    (is (= 1 (page-count @conn "internet")))
    (let [block (db-test/find-block-by-content @conn "see [[internet]] and [[internet]]")
          ref-uuids (into #{} (map :block/uuid) (:block/refs block))]
      (is (= 1 (count ref-uuids))))))

(deftest insert-cross-block-repeated-page-refs-creates-one-page
  (let [conn (conn-with-target)]
    (paste-blocks!
     conn
     [{:block/uuid (random-uuid)
       :block/title "see [[internet]]"
       :block/refs [(page-ref-map "internet")]}
      {:block/uuid (random-uuid)
       :block/title "again [[internet]]"
       :block/refs [(page-ref-map "internet")]}])
    (is (= 1 (page-count @conn "internet")))))

(deftest insert-case-distinct-class-refs-creates-both
  ;; Classes are case-sensitive: #Movie and #movie must create two classes
  ;; even though both refs share :block/name "movie".
  (let [conn (conn-with-target)
        class-ref (fn [title]
                    {:block/uuid (random-uuid)
                     :block/title title
                     :block/name (string/lower-case title)
                     :block/type "page"})]
    (paste-blocks!
     conn
     [{:block/uuid (random-uuid)
       :block/title "#Movie and #movie"
       :block/tags [(class-ref "Movie")
                    (class-ref "movie")]
       :block/refs [(class-ref "Movie")
                    (class-ref "movie")]}])
    (is (= 2 (page-count @conn "movie")))))

(deftest all-pages-classifies-paste-created-pages-as-pages
  (let [conn (conn-with-target)]
    (paste-blocks!
     conn
     [{:block/uuid (random-uuid)
       :block/title "see [[internet]]"
       :block/refs [(page-ref-map "internet")]}])
    (let [eid (first (d/q '[:find [?e ...]
                            :where [?e :block/name "internet"]]
                          @conn))
          block-map (worker-plain/entity-forward-map @conn (d/entity @conn eid) {})]
      (is (entity/page? block-map)))))

(deftest delete-paste-created-pages
  (let [conn (conn-with-target)]
    (paste-blocks!
     conn
     [{:block/uuid (random-uuid)
       :block/title "see [[internet]]"
       :block/refs [(page-ref-map "internet")]}])
    (let [eids (d/q '[:find [?e ...]
                      :where [?e :block/name "internet"]]
                    @conn)
          results (mapv (fn [eid]
                          (outliner-page/delete! conn (:block/uuid (d/entity @conn eid))))
                        eids)
          remaining (d/q '[:find [?e ...]
                           :where
                           [?e :block/name "internet"]
                           [(missing? $ ?e :logseq.property/deleted-at)]]
                         @conn)]
      (is (every? true? results))
      (is (empty? remaining)))))
