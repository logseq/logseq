(ns frontend.util.marker-test
  (:require [cljs.test :refer [are deftest]]
            [frontend.util.marker :as marker]))

(deftest add-or-update-marker-markdown
  (are [content marker expect] (= expect (marker/add-or-update-marker content :markdown marker))
    "test content" "TODO" "TODO test content"
    "\nxxx\n" "TODO" "TODO xxx\n"
    "## xxx" "TODO" "## TODO xxx"
    "## [#A] xxx" "TODO" "## TODO [#A] xxx"
    "" "TODO" "TODO "
    "todo" "TODO" "TODO todo"
    "TODO xxx" "DONE" "DONE xxx"
    "TODO" "DONE" "DONE "
    "## TODO [#A] xxx" "DONE" "## DONE [#A] xxx"
    "#test content" "TODO" "TODO #test content"
    "TODO #test content" "DONE" "DONE #test content"))

(deftest add-or-update-marker-org
  (are [content marker expect] (= expect (marker/add-or-update-marker content :org marker))
    "test content" "TODO" "TODO test content"
    "\nxxx\n" "TODO" "TODO xxx\n"
    "" "TODO" "TODO "
    "todo" "TODO" "TODO todo"
    "TODO xxx" "DONE" "DONE xxx"
    "TODO" "DONE" "DONE "))

#_(cljs.test/run-tests)
