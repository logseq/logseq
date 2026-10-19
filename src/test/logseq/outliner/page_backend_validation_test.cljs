(ns logseq.outliner.page-backend-validation-test
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.op :as outliner-op]
            [logseq.outliner.page :as outliner-page]))

(deftest create-page-rejects-hashtag-title
  (let [conn (db-test/create-conn)]
    (doseq [title ["foo#bar" "#tagstyle"]]
      (is (thrown-with-msg?
           js/Error
           #"Page name can't include \"#\"."
           (outliner-page/create! conn title {}))))))

(deftest refused-page-title-save-must-not-block-a-sibling-view-insert
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "Slash Test"}
                :blocks [{:block/title "Slash Test"}]}])
        page (ldb/get-page @conn "Slash Test")
        view-uuid (random-uuid)
        insert-op [:insert-blocks [[{:block/uuid view-uuid
                                     :block/title "Unlinked references"}]
                                   (:block/uuid page)
                                   {:outliner-op :create-view
                                    :keep-uuid? true}]]
        save-op [:save-block [{:block/uuid (:block/uuid page)
                               :block/title "Slash Test/x"}
                              {}]]]
    (is (thrown-with-msg?
         js/Error
         #"Page name can't include \"/\"."
         (outliner-op/apply-ops! conn [save-op insert-op]
                                 {:outliner-op :insert-blocks
                                  :source-outliner-op :create-view})))
    (is (nil? (d/entity @conn [:block/uuid view-uuid]))
        "A refused title save in the same apply-ops call rolls back the view insert")
    (outliner-op/apply-ops! conn [insert-op]
                            {:outliner-op :insert-blocks
                             :source-outliner-op :create-view})
    (is (some? (d/entity @conn [:block/uuid view-uuid]))
        "The same view insert succeeds when it is not batched with the refused save")
    (is (= "Slash Test" (:block/title (d/entity @conn (:db/id page)))))))
