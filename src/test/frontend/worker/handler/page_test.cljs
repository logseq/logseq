(ns frontend.worker.handler.page-test
  (:require [clojure.test :refer [deftest is]]
            [datascript.core :as d]
            [frontend.worker.handler.page :as worker-page]
            [logseq.common.config :as common-config]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]))

(deftest eligible-for-recent-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "Eligible page"}
                 :blocks [{:block/title "A block"}]}
                {:page {:block/title "Hidden page"
                        :build/properties {:logseq.property/hide? true}}}
                {:page {:block/title "Recycled page"
                        :build/properties {:logseq.property/deleted-at 1712000000000}}}
                {:page {:block/title "Child of hidden page"}}
                {:page {:block/title "Blank title page"}}]})
        page-id #(:db/id (ldb/get-page @conn %))
        _ (d/transact! conn [[:db/add (page-id "Child of hidden page") :block/parent (page-id "Hidden page")]
                             [:db/add (page-id "Blank title page") :block/title " "]])
        db @conn
        page #(ldb/get-page db %)]
    (doseq [[label entity eligible?]
            [["eligible page" (page "Eligible page") true]
             ["block" (db-test/find-block-by-content db "A block") false]
             ["hidden page" (page "Hidden page") false]
             ["page under a hidden page" (page "Child of hidden page") false]
             ["page in the recycle bin" (page "Recycled page") false]
             ["page with a blank title" (page "blank title page") false]
             ["Recycle page" (page common-config/recycle-page-name) false]
             ["hidden property" (d/entity db :logseq.property/hide?) false]]]
      (is (some? entity) label)
      (is (= eligible? (worker-page/eligible-for-recent? entity)) label))))
