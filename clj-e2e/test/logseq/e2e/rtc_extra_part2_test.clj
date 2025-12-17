(ns logseq.e2e.rtc-extra-part2-test
  (:require [clojure.string :as string]
            [clojure.test :refer [deftest testing is use-fixtures run-test]]
            [logseq.e2e.block :as b]
            [logseq.e2e.const :refer [*page1 *page2]]
            [logseq.e2e.fixtures :as fixtures]
            [logseq.e2e.page :as page]
            [logseq.e2e.rtc :as rtc]
            [logseq.e2e.util :as util]
            [wally.main :as w]
            [wally.repl :as repl]))

(use-fixtures :once
  fixtures/open-2-pages
  (partial fixtures/prepare-rtc-graph-fixture "rtc-extra-part2-test-graph"))

(use-fixtures :each
  fixtures/new-logseq-page-in-rtc)

;;; https://github.com/logseq/db-test/issues/651
(deftest issue-651-block-title-double-transit-encoded-test
  (testing "
1. create pages named \"bbb\", \"aaa\", and turn these pages into tag
2. set \"bbb\" parent to \"aaa\"
3. create a new page \"ccc\", and create a simple query with filter tags = aaa/bbb
wait for 5-10 seconds, will found that \"aaa/bbb\" became \"aaa/<encrypted-string>\"
"
    (w/with-page @*page1
      (page/new-page "aaa")
      (page/convert-to-tag "aaa")
      (page/new-page "bbb")
      (page/convert-to-tag "bbb" :extends ["aaa"])
      (page/new-page "ccc")
      (b/new-block "")
      (util/input-command "query")
      (w/click (util/-query-last "button:text('filter')"))
      (util/input "tags")
      (w/click "a.menu-link:has-text('tags')")
      (w/click "a.menu-link:has-text('bbb')")
      (util/wait-timeout 5000)          ;as described in issue-url
      )
    (let [{:keys [remote-tx]}
          (w/with-page @*page1
            (rtc/with-wait-tx-updated
              (b/new-block "done")))]
      (w/with-page @*page2
        (rtc/wait-tx-update-to remote-tx)))

;; check 'aaa/bbb' still exists
    (w/with-page @*page1
      (page/goto-page "aaa/bbb"))
    (w/with-page @*page2
      (page/goto-page "aaa/bbb"))

    (rtc/validate-graphs-in-2-pw-pages)))
