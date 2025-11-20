(ns logseq.e2e.rtc-basic-test
  (:require
   [clojure.test :refer [deftest testing is use-fixtures]]
   [com.climate.claypoole :as cp]
   [logseq.e2e.assert :as assert]
   [logseq.e2e.block :as b]
   [logseq.e2e.fixtures :as fixtures :refer [*page1 *page2]]
   [logseq.e2e.graph :as graph]
   [logseq.e2e.page :as page]
   [logseq.e2e.rtc :as rtc]
   [logseq.e2e.util :as util]
   [wally.main :as w]
   [wally.repl :as repl]))

(use-fixtures :once fixtures/open-2-pages)

(use-fixtures :each fixtures/validate-graph)

(deftest rtc-basic-test
  (let [graph-name (str "rtc-graph-" (.toEpochMilli (java.time.Instant/now)))
        page-names (map #(str "rtc-test-page" %) (range 4))]
    (testing "open 2 app instances, add a rtc graph, check this graph available on other instance"
      (cp/prun!
       2
       #(w/with-page %
          (util/login-test-account))
       [@*page1 @*page2])
      (w/with-page @*page1
        (graph/new-graph graph-name true))
      (w/with-page @*page2
        (graph/wait-for-remote-graph graph-name)
        (graph/switch-graph graph-name true)))
    (testing "logseq pages add/delete"
      (doseq [page-name page-names]
        (let [{:keys [_local-tx remote-tx]}
              (w/with-page @*page1
                (rtc/with-wait-tx-updated
                  (page/new-page page-name)))]
          (w/with-page @*page2
            (rtc/wait-tx-update-to remote-tx)
            (util/search-and-click page-name)))
        (testing "Page reference created"
          (let [test-page (str "random page " (random-uuid))
                block-title (format "test ref [[%s]]" test-page)
                {:keys [_local-tx remote-tx]}
                (w/with-page @*page1
                  (rtc/with-wait-tx-updated
                    (b/new-block block-title)))]
            (w/with-page @*page2
              (rtc/wait-tx-update-to remote-tx)
              (util/search-and-click test-page)
              (w/wait-for ".references .ls-block")
             ;; ensure ref exists
              (let [refs (w/all-text-contents ".references .ls-block .block-title-wrap")]
                (is (= refs [block-title])))))))
      (let [*last-remote-tx (atom nil)]
        (doseq [page-name page-names]
          (let [{:keys [_local-tx remote-tx]}
                (w/with-page @*page1
                  (rtc/with-wait-tx-updated
                    (page/delete-page page-name)))]
            (reset! *last-remote-tx remote-tx)))
        (w/with-page @*page2
          (rtc/wait-tx-update-to @*last-remote-tx)
          (doseq [page-name page-names]
            (util/search page-name)
            (assert/assert-is-hidden (w/get-by-test-id page-name))))))
    (testing "cleanup"
      (w/with-page @*page2
        (graph/remove-remote-graph graph-name)))))
