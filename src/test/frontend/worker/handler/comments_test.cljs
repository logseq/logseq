(ns frontend.worker.handler.comments-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.worker.handler.comments :as worker-comments]
            [logseq.db :as ldb]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.db.test.helper :as db-test]))

(def ^:private comments-blocks-property :logseq.property.comments/blocks)

(defn- block
  [db title]
  (db-test/find-block-by-content db title))

(defn- block-uuid
  [db title]
  (:block/uuid (block db title)))

(defn- conn-with-single-comment-thread
  []
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "Page"}
                 :blocks [{:block/title "Target"
                           :build/children [{:block/title "Comments"
                                             :build/tags [:logseq.class/Comments]
                                             :build/children [{:block/title "Reply"}]}]}]}]})]
    (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
    conn))

(defn- conn-with-multi-comment-thread
  []
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "Page"}
                 :blocks [{:block/title "First"}
                          {:block/title "Second"}
                          {:block/title "Comments"
                           :build/tags [:logseq.class/Comments]}]}]})
        first-block (block @conn "First")
        second-block (block @conn "Second")
        comments-area (block @conn "Comments")]
    (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
    (d/transact! conn [{:db/id (:db/id comments-area)
                        comments-blocks-property [(:db/id first-block) (:db/id second-block)]}])
    conn))

(deftest ensure-comments-area-updates-existing-thread-atomically
  (let [conn (conn-with-single-comment-thread)
        target (block @conn "Target")
        ensure! (some-> (resolve 'frontend.worker.handler.comments/ensure-comments-area!) deref)]
    (is (fn? ensure!))
    (when (fn? ensure!)
      (let [result (ensure! conn (:block/uuid target))
            comments-area (d/entity @conn [:block/uuid (:block/uuid result)])]
        (is (= "Comments" (:block/title result)))
        (is (= #{(:block/uuid target)}
               (set (map :block/uuid (get comments-area comments-blocks-property)))))))))

(deftest ensure-comments-area-is-idempotent
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "Page"}
                 :blocks [{:block/title "Target"}]}]})
        target (block @conn "Target")
        ensure! (some-> (resolve 'frontend.worker.handler.comments/ensure-comments-area!) deref)]
    (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
    (is (fn? ensure!))
    (when (fn? ensure!)
      (let [first-result (ensure! conn (:block/uuid target))
            second-result (ensure! conn (:block/uuid target))]
        (is (= (:block/uuid first-result) (:block/uuid second-result)))
        (is (= 1 (count (filter #(= "Comments" (:block/title %))
                                (ldb/get-children @conn (:db/id target))))))))))

(deftest ensure-comments-area-for-blocks-reuses-matching-thread
  (let [conn (conn-with-multi-comment-thread)
        first-block (block @conn "First")
        second-block (block @conn "Second")
        comments-area (block @conn "Comments")
        ensure! (some-> (resolve 'frontend.worker.handler.comments/ensure-comments-area-for-blocks!) deref)]
    (is (fn? ensure!))
    (when (fn? ensure!)
      (let [result (ensure! conn [(:block/uuid first-block) (:block/uuid second-block)])]
        (is (= (:block/uuid comments-area)
               (:block/uuid result)))))))

(deftest delete-comment-removes-thread-when-deleting-last-reply
  (let [conn (conn-with-single-comment-thread)
        reply (block @conn "Reply")
        comments-area-uuid (block-uuid @conn "Comments")
        delete! (some-> (resolve 'frontend.worker.handler.comments/delete-comment!) deref)]
    (is (fn? delete!))
    (when (fn? delete!)
      (delete! conn (:block/uuid reply))
      (is (nil? (d/entity @conn [:block/uuid comments-area-uuid]))))))

(deftest delete-comment-keeps-thread-when-another-reply-exists
  (let [conn (conn-with-single-comment-thread)
        comments-area (block @conn "Comments")
        first-reply (block @conn "Reply")
        delete! (some-> (resolve 'frontend.worker.handler.comments/delete-comment!) deref)]
    (d/transact! conn [{:block/title "Second reply"
                        :block/uuid (random-uuid)
                        :block/parent (:db/id comments-area)
                        :block/page (get-in comments-area [:block/page :db/id])}])
    (is (fn? delete!))
    (when (fn? delete!)
      (delete! conn (:block/uuid first-reply))
      (testing "the thread survives and only the selected reply is recycled"
        (is (not (ldb/recycled? (d/entity @conn [:block/uuid (:block/uuid comments-area)]))))
        (is (nil? (d/entity @conn [:block/uuid (:block/uuid first-reply)])))))))

(deftest get-comment-thread-block-uuids-finds-comment-targets
  (let [conn (conn-with-multi-comment-thread)
        first-block (block @conn "First")
        second-block (block @conn "Second")]
    (is (= (set (map (comp str :block/uuid) [first-block second-block]))
           (set
            (worker-comments/get-comment-thread-block-uuids
             @conn
             [(:block/uuid first-block) (:block/uuid second-block)]))))))

(deftest get-comment-threads-for-block-loads-thread-blocks
  (let [conn (conn-with-single-comment-thread)
        target (block @conn "Target")
        comments-area (block @conn "Comments")]
    (d/transact! conn [{:db/id (:db/id comments-area)
                        comments-blocks-property (:db/id target)}])
    (is (= [(:block/uuid comments-area)]
           (mapv :block/uuid
                 (worker-comments/get-comment-threads-for-block
                  @conn
                  (:block/uuid target)))))
    (is (= [(block-uuid @conn "Reply")]
           (mapv :block/uuid
                 (:block/children
                  (first
                   (worker-comments/get-comment-threads-for-block
                    @conn
                    (:block/uuid target)))))))))
