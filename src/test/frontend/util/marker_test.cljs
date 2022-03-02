(ns frontend.util.marker-test
  (:require [cljs.test :refer [are deftest]]
            [frontend.util.marker :as marker]
            [clojure.string :as string]))

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
    "## TODO [#A] xxx" "DONE" "## DONE [#A] xxx"))

(deftest add-or-update-marker-org
  (are [content marker expect] (= expect (marker/add-or-update-marker content :org marker))
    "test content" "TODO" "TODO test content"
    "\nxxx\n" "TODO" "TODO xxx\n"
    "" "TODO" "TODO "
    "todo" "TODO" "TODO todo"
    "TODO xxx" "DONE" "DONE xxx"
    "TODO" "DONE" "DONE "))

(defn set-marker
  [marker content format new-marker]
  (let [old-header-marker (when (not= format :org)
                            (re-find (marker/header-marker-pattern true marker) content))
        new-header-marker (when old-header-marker
                            (string/replace old-header-marker marker new-marker))
        marker (or old-header-marker marker)
        new-marker (or new-header-marker new-marker)
        new-content (->
                     (if marker
                       (string/replace-first content (re-pattern (str "^" marker)) new-marker)
                       (str new-marker " " content))
                     (string/triml))]
    new-content))

(deftest set-marker-org
  (are [marker content new-marker expect] (= expect (set-marker marker content :org new-marker))
    "TODO" "TODO content" "DOING" "DOING content"
    "TODO" "## TODO content" "DOING" "## TODO content"
    "DONE" "DONE content" "" "content"))

(deftest set-marker-markdown
  (are [marker content new-marker expect] (= expect (set-marker marker content :markdown new-marker))
    "TODO" "TODO content" "DOING" "DOING content"
    "TODO" "## TODO content" "DOING" "## DOING content"
    "DONE" "DONE content" "" "content"))

#_(cljs.test/run-tests)
