(ns logseq.outliner.page-backend-validation-test
  (:require [cljs.test :refer [deftest is]]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.page :as outliner-page]))

(deftest create-page-rejects-hashtag-title
  (let [conn (db-test/create-conn)]
    (doseq [title ["foo#bar" "#tagstyle"]]
      (is (thrown-with-msg?
           js/Error
           #"Page name can't include \"#\"."
           (outliner-page/create! conn title {}))))))
