(ns logseq.e2e.rtc-basic-test
  (:require
   [clojure.test :refer [deftest testing is use-fixtures]]
   [com.climate.claypoole :as cp]
   [logseq.e2e.api :refer [ls-api-call!]]
   [logseq.e2e.assert :as assert]
   [logseq.e2e.block :as b]
   [logseq.e2e.const :refer [*page1 *page2]]
   [logseq.e2e.fixtures :as fixtures]
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
      (testing "remote graph refresh waits until the button is enabled"
        (w/with-page @*page2
          (graph/goto-all-graphs)
          (w/wait-for "button:not([disabled]):has-text(\"Refresh\")" {:timeout 30000})
          (.setDefaultTimeout (w/get-page) 50)
          (try
            (w/eval-js
             "() => {
                const span = Array.from(document.querySelectorAll('span'))
                  .find((node) => node.textContent.trim() === 'Refresh');
                const button = span.closest('button');
                button.disabled = true;
                setTimeout(() => { button.disabled = false; }, 500);
              }")
            (graph/refresh-all-remote-graphs)
            (finally
              (.setDefaultTimeout (w/get-page) 10000)))))
      (w/with-page @*page1
        (graph/new-graph graph-name true false))
      (w/with-page @*page2
        (graph/wait-for-remote-graph graph-name)
        (graph/switch-graph graph-name true true)))
    (testing "logseq pages add/delete"
      (doseq [page-name page-names]
        (let [{:keys [_local-tx remote-tx]}
              (w/with-page @*page1
                (rtc/with-wait-tx-updated
                  (page/new-page page-name)))]
          (w/with-page @*page2
            (rtc/wait-tx-update-to remote-tx)
            (util/search-and-click page-name))))
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
            (let [deleted-page (ls-api-call! :editor.getPage page-name)]
              (is (number? (get deleted-page ":logseq.property/deleted-at")))
              (is (= "Recycle" (get-in deleted-page ["parent" "title"]))))))))
    (testing "Page reference created"
      (let [page-name "test-page-reference"
            {:keys [_local-tx remote-tx]}
            (w/with-page @*page1
              (rtc/with-wait-tx-updated
                (page/new-page page-name)))]
        (w/with-page @*page2
          (rtc/wait-tx-update-to remote-tx)))
      (let [test-page (str "random page " (random-uuid))
            block-title (format "test ref [[%s]]" test-page)
            {:keys [_local-tx remote-tx]}
            (w/with-page @*page1
              (rtc/with-wait-tx-updated
                (b/new-block block-title)
                (b/new-block "add new-block to ensure last block saved")))]
        (w/with-page @*page2
          (rtc/wait-tx-update-to remote-tx)
          (util/search-and-click test-page)
          (w/wait-for ".references .ls-block")
          ;; ensure ref exists
          (let [refs (w/all-text-contents ".references .ls-block .block-title-wrap")]
            (is (= refs [block-title]))))))

    (testing "cleanup"
      (w/with-page @*page2
        (graph/remove-remote-graph graph-name)))))
