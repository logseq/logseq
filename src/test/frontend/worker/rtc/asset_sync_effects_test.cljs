(ns frontend.worker.rtc.asset-sync-effects-test
  "This ns include tests abouts asset-sync with other components.
  These tests need to start the asset-sync-loop."
  #_:clj-kondo/ignore
  (:require [clojure.test :as t :refer [deftest is use-fixtures]]
            [frontend.test.helper :include-macros true :as test-helper]
            [frontend.worker.rtc.fixture :as rtc-fixture]
            #_:clj-kondo/ignore
            [spy.core :as spy]))

(use-fixtures :each
  test-helper/db-based-start-and-destroy-db-map-fixture
  rtc-fixture/listen-test-db-to-gen-rtc-ops-fixture
  rtc-fixture/start-and-stop-asset-sync-loop-fixture
  rtc-fixture/clear-op-mem-stores-fixture)


;; FIXME: Re-enable when this test doesn't fail when whole test suite is run
;; e.g. https://github.com/logseq/logseq/actions/runs/7627378707/job/20775904183
#_(deftest asset-sync-loop-init-test
    (let [ws @(:*ws @rtc-fixture/*test-asset-sync-state)
          handler-fn (:handler-fn ws)
          ws-msg (first (spy/last-call handler-fn))]
      (is (= "list-graphs" (:action ws-msg)))))
