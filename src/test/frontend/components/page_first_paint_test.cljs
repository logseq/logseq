(ns frontend.components.page-first-paint-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.components.page :as page]))

(def ^:private tag-page
  {:block/title "Tag"
   :block/tags [{:db/ident :logseq.class/Tag}]})

(def ^:private plain-page
  {:block/title "Notes"
   :block/tags [{:db/ident :logseq.class/Page}]})

(deftest class-pages-paint-the-objects-table-before-children-test
  (is (>= (#'page/class-page-below-fold-delay-ms) 400)
      "Linked refs must wait so they cannot steal the first table snapshot batch.")
  (is (true? (#'page/defer-class-page-below-fold? tag-page {}))
      "Tags and Movies must paint class-objects before children and linked refs.")
  (is (false? (#'page/defer-class-page-below-fold? tag-page {:sidebar? true})))
  (is (false? (#'page/defer-class-page-below-fold? tag-page {:tag-dialog? true})))
  (is (false? (#'page/defer-class-page-below-fold? plain-page {}))
      "Ordinary pages still load their block tree on first paint."))
