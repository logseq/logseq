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
