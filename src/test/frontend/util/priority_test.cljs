(ns frontend.util.priority-test
  (:require [cljs.test :refer [are deftest]]
            [frontend.util.priority :as priority]))

(deftest add-or-update-priority-markdown
  (are [content priority expect] (= expect (priority/add-or-update-priority content :markdown priority))
    "test content" "[#A]" "[#A] test content"
    "" "[#A]" "[#A] "
    "[#A] xxx" "[#B]" "[#B] xxx"
    "## xxx" "[#A]" "## [#A] xxx"
    "## TODO xxx" "[#A]" "## TODO [#A] xxx"
    "## TODO [#B] xxx" "[#A]" "## TODO [#A] xxx"
    ))

(deftest add-or-update-marker-org
  (are [content priority expect] (= expect (priority/add-or-update-priority content :org priority))
    "test content" "[#A]" "[#A] test content"
    "" "[#A]" "[#A] "
    "[#A] xxx" "[#B]" "[#B] xxx"))

#_(cljs.test/run-tests)
