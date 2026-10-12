(ns logseq.db.frontend.schema-mutation-test
  (:require [cljs.test :refer [deftest is]]
            [logseq.db.frontend.schema :as db-schema]))

;; Fails if, in `parse-schema-version`, `first` becomes `last`.
(deftest parse-schema-version-sequential-needs-a-major-test
  (is (= {:major 10 :minor nil} (db-schema/parse-schema-version [10 nil]))
      "a [major minor] pair without a minor still parses")
  (is (thrown-with-msg? js/Error #"Bad schema version"
                        (db-schema/parse-schema-version [nil 1]))
      "a [major minor] pair without a major is rejected"))
