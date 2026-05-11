(ns logseq.common.version-test
  (:require [cljs.test :refer [deftest is]]
            [clojure.string :as string]
            [logseq.common.version :as version]))

(deftest format-version-includes-build-time-and-revision
  (is (= (str "Build time: " (version/build-time) "\n"
              "Revision: " (version/revision))
         (version/format-version)))
  (is (string/includes? (version/format-version) "Build time: "))
  (is (string/includes? (version/format-version) "Revision: ")))
