(ns frontend.components.editor-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.editor :as editor]
            [frontend.context.i18n :refer [t]]))

(defn- slash-cmd
  [name group]
  [name [:editor/noop] "doc" :icon/x group])

(defn- command-names
  [commands]
  (mapv first commands))

(defn- sample-slash-commands
  []
  (let [clear-heading (t :editor.slash/clear-heading)]
    {:clear-heading clear-heading
     :commands [(slash-cmd "Node reference" (t :editor.slash/group-basic))
                (slash-cmd "Link" (t :editor.slash/group-format))
                (slash-cmd clear-heading (t :editor.slash/group-heading))
                (slash-cmd "Heading 1" (t :editor.slash/group-heading))]}))

(deftest filter-commands-clear-heading-visibility
  (let [{:keys [clear-heading commands]} (sample-slash-commands)]
    (testing "hides Clear heading on non-heading blocks"
      (is (= ["Node reference" "Link" "Heading 1"]
             (command-names (editor/filter-commands false false commands)))))
    (testing "keeps Clear heading on heading blocks"
      (is (= ["Node reference" "Link" clear-heading "Heading 1"]
             (command-names (editor/filter-commands false true commands)))))))

(deftest slash-group-headings-not-hidden-by-clear-heading-filter
  (testing "contextual Clear heading filter must not count as a user search filter"
    (let [{:keys [commands]} (sample-slash-commands)
          search-matched commands
          matched (or (editor/filter-commands false false search-matched) [])]
      (is (seq matched)
          "non-heading blocks still have slash commands after hiding Clear heading")
      (is (not= (command-names matched) (command-names commands))
          "Clear heading is removed contextually on non-heading blocks")
      (is (false? (editor/slash-commands-search-filtered? search-matched commands))
          "Clearing the heading command on a normal block must not set filtered? and hide group headings"))))

(deftest slash-group-headings-hide-when-user-searches
  (testing "typed slash search still hides group headings"
    (let [{:keys [commands]} (sample-slash-commands)
          search-matched (filterv #(= "Node reference" (first %)) commands)]
      (is (true? (editor/slash-commands-search-filtered? search-matched commands))
          "a narrowed search result is a real user filter"))))
