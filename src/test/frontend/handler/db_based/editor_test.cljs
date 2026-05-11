(ns frontend.handler.db-based.editor-test
  (:require [clojure.test :refer [deftest is testing]]
            [frontend.handler.db-based.editor :as db-editor-handler]))

(deftest wrap-parse-block-markdown-heading-test
  (testing "normal blocks save markdown heading syntax as heading property"
    (is (= {:block/title "Heading"
            :logseq.property/heading 1}
           (select-keys (db-editor-handler/wrap-parse-block
                         {:block/title "# Heading"})
                        [:block/title :logseq.property/heading]))))

  (testing "raw display-type blocks preserve leading hash text"
    (doseq [display-type [:code :math]]
      (is (= {:block/title "# shell comment"
              :logseq.property.node/display-type display-type}
             (select-keys (db-editor-handler/wrap-parse-block
                           {:block/title "# shell comment"
                            :logseq.property.node/display-type display-type})
                          [:block/title
                           :logseq.property/heading
                           :logseq.property.node/display-type]))
          (str "Preserves content for " display-type)))))
