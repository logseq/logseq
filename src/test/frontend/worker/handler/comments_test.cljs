(ns frontend.worker.handler.comments-test
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [frontend.worker.handler.comments :as worker-comments]
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
  (db-test/create-conn-with-blocks
   {:pages-and-blocks
    [{:page {:block/title "Page"}
      :blocks [{:block/title "Target"
                :build/children [{:block/title "Comments"
                                  :build/tags [:logseq.class/Comments]
                                  :build/children [{:block/title "Reply"}]}]}]}]}))

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
    (d/transact! conn [{:db/id (:db/id comments-area)
                        comments-blocks-property [(:db/id first-block) (:db/id second-block)]}])
    conn))

(deftest resolve-comments-area-adds-missing-target-property
  (let [conn (conn-with-single-comment-thread)
        db @conn
        target (block db "Target")
        result (worker-comments/resolve-comments-area db (:block/uuid target))]
    (is (= :existing (:action result)))
    (is (= "Comments" (get-in result [:comments-area :block/title])))
    (is (= {:block-id (:db/id (block db "Comments"))
            :property comments-blocks-property
            :value #{[:block/uuid (:block/uuid target)]}}
           (:target-property result)))))

(deftest resolve-comments-area-for-blocks-reuses-matching-thread
  (let [conn (conn-with-multi-comment-thread)
        first-block (block @conn "First")
        second-block (block @conn "Second")
        comments-area (block @conn "Comments")
        result (worker-comments/resolve-comments-area-for-blocks
                @conn
                [(:block/uuid first-block) (:block/uuid second-block)])]
    (is (= :existing (:action result)))
    (is (= (:block/uuid comments-area)
           (get-in result [:comments-area :block/uuid])))))

(deftest get-comment-delete-targets-promotes-last-reply-delete-to-thread
  (let [conn (conn-with-single-comment-thread)
        db @conn
        reply (block db "Reply")
        result (worker-comments/get-comment-delete-targets db (:block/uuid reply))]
    (is (= [(block-uuid db "Comments")]
           (mapv :block/uuid result)))
    (is (= [(block-uuid db "Reply")]
           (mapv :block/uuid (:block/children (first result)))))))

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
