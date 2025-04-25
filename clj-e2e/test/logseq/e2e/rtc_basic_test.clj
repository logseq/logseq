(ns logseq.e2e.rtc-basic-test
  (:require
   [clojure.test :refer [deftest testing is use-fixtures]]
   [com.climate.claypoole :as cp]
   [logseq.e2e.fixtures :as fixtures :refer [*page1 *page2]]
   [logseq.e2e.util :as util]
   [wally.main :as w]
   [wally.repl :as repl]))

(use-fixtures :once fixtures/open-2-pages)

;; (use-fixtures :once #(fixtures/open-2-pages % :headless false :port 3001))

(deftest rtc-basic-test
  (let [graph-name (str "rtc-graph-" (.toEpochMilli (java.time.Instant/now)))]
    (testing "open 2 app instances"
      (cp/prun!
       2
       #(w/with-page %
          (util/login-test-account))
       [@*page1 @*page2])
      (w/with-page @*page1
        (util/new-graph graph-name true))
      (w/with-page @*page2
        (util/wait-for-remote-graph graph-name)))))

(comment
  (def xxx (future (clojure.test/run-tests)))
  (future-cancel xxx))
