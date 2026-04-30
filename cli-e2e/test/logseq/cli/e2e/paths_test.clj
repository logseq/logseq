(ns logseq.cli.e2e.paths-test
  (:require [clojure.test :refer [deftest is]]
            [logseq.cli.e2e.paths :as paths]))

(deftest repo-root-does-not-depend-on-runtime-file-binding
  (let [expected (paths/repo-root)]
    (binding [*file* nil]
      (is (= expected
             (paths/repo-root))))))
