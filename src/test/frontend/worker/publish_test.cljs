(ns frontend.worker.publish-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.worker.publish :as worker-publish]
            [logseq.melange.bridge.db.test-helper :as db-test]))

(deftest publish-payload-includes-embedded-blocks
  (testing "embedded blocks and their children are included in publish payload"
    (let [target-uuid (random-uuid)
          child-uuid (random-uuid)
          embed-uuid (random-uuid)
          conn (db-test/create-conn-with-blocks
                [{:page {:block/title "Page A"}
                  :blocks [{:block/title "Embed"
                            :block/uuid embed-uuid
                            :build/keep-uuid? true}]}
                 {:page {:block/title "Page B"}
                  :blocks [{:block/title "Target"
                            :block/uuid target-uuid
                            :build/keep-uuid? true
                            :build/children [{:block/title "Child"
                                              :block/uuid child-uuid
                                              :build/keep-uuid? true}]}]}])
          db @conn
          embed-eid (:db/id (d/entity db [:block/uuid embed-uuid]))
          target-eid (:db/id (d/entity db [:block/uuid target-uuid]))
          _ (d/transact! conn [{:db/id embed-eid :block/link target-eid}])
          db @conn
          page-a (db-test/find-page-by-title db "Page A")
          payload (#'worker-publish/build-publish-page-payload db page-a)
          datom-eids (->> (:datoms payload) (map first) set)
          child-eid (:db/id (d/entity db [:block/uuid child-uuid]))]
      (is (contains? datom-eids target-eid))
      (is (contains? datom-eids child-eid)))))

(deftest publish-payload-traverses-nested-embeds
  (testing "embedded blocks can include linked blocks that also embed others"
    (let [first-uuid (random-uuid)
          second-uuid (random-uuid)
          embed-uuid (random-uuid)
          conn (db-test/create-conn-with-blocks
                [{:page {:block/title "Root Page"}
                  :blocks [{:block/title "Embed"
                            :block/uuid embed-uuid
                            :build/keep-uuid? true}]}
                 {:page {:block/title "First Page"}
                  :blocks [{:block/title "First"
                            :block/uuid first-uuid
                            :build/keep-uuid? true
                            :build/children [{:block/title "First child"
                                              :build/keep-uuid? true}]}]}
                 {:page {:block/title "Second Page"}
                  :blocks [{:block/title "Second"
                            :block/uuid second-uuid
                            :build/keep-uuid? true}]}])
          db @conn
          embed-eid (:db/id (d/entity db [:block/uuid embed-uuid]))
          first-eid (:db/id (d/entity db [:block/uuid first-uuid]))
          second-eid (:db/id (d/entity db [:block/uuid second-uuid]))
          first-child (db-test/find-block-by-content db "First child")
          _ (d/transact! conn [{:db/id embed-eid :block/link first-eid}
                               {:db/id (:db/id first-child) :block/link second-eid}])
          db @conn
          root-page (db-test/find-page-by-title db "Root Page")
          payload (#'worker-publish/build-publish-page-payload db root-page)
          datom-eids (->> (:datoms payload) (map first) set)
          first-eid (:db/id (d/entity db [:block/uuid first-uuid]))
          second-eid (:db/id (d/entity db [:block/uuid second-uuid]))]
      (is (contains? datom-eids first-eid))
      (is (contains? datom-eids second-eid)))))

(deftest publish-payload-excludes-comments
  (testing "comment threads are not included in publish payload data"
    (let [target-uuid (random-uuid)
          comments-area-uuid (random-uuid)
          comment-uuid (random-uuid)
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "Page A"}
                   :blocks [{:block/title "Target"
                             :block/uuid target-uuid
                             :build/keep-uuid? true
                             :build/children [{:block/title "Comments"
                                               :block/uuid comments-area-uuid
                                               :build/keep-uuid? true
                                               :build/tags [:logseq.class/Comments]
                                               :build/children [{:block/title "Private reply"
                                                                 :block/uuid comment-uuid
                                                                 :build/keep-uuid? true
                                                                 :build/tags [:logseq.class/Comment]}]}]}]}]})
          db @conn
          page-a (db-test/find-page-by-title db "Page A")
          comments-area-eid (:db/id (d/entity db [:block/uuid comments-area-uuid]))
          comment-eid (:db/id (d/entity db [:block/uuid comment-uuid]))
          payload (#'worker-publish/build-publish-page-payload db page-a)
          datom-eids (->> (:datoms payload) (map first) set)
          search-contents (set (map :block_content (:blocks payload)))]
      (is (not (contains? datom-eids comments-area-eid)))
      (is (not (contains? datom-eids comment-eid)))
      (is (not (contains? search-contents "Comments")))
      (is (not (contains? search-contents "Private reply"))))))
