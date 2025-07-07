(ns user
  "fns used on repl"
  (:require [clojure.test :refer [run-tests run-test]]
            [logseq.e2e.block :as b]
            [logseq.e2e.commands-basic-test]
            [logseq.e2e.config :as config]
            [logseq.e2e.fixtures :as fixtures]
            [logseq.e2e.graph :as graph]
            [logseq.e2e.keyboard :as k]
            [logseq.e2e.locator :as loc]
            [logseq.e2e.multi-tabs-basic-test]
            [logseq.e2e.outliner-basic-test]
            [logseq.e2e.plugins-basic-test]
            [logseq.e2e.property-basic-test]
            [logseq.e2e.reference-basic-test]
            [logseq.e2e.rtc-basic-test]
            [logseq.e2e.rtc-extra-test]
            [logseq.e2e.tag-basic-test]
            [logseq.e2e.util :as util]
            [wally.main :as w]
            [wally.repl :as repl]))

;; Use port 3001 for local testing
(reset! config/*port 3001)
;; show ui
(reset! config/*headless false)
(reset! config/*slow-mo 30)

(def *futures (atom {}))

(defn cancel
  [test-name]
  (some-> (get @*futures test-name) future-cancel)
  (swap! *futures dissoc test-name))

(defn run-commands-test
  []
  (->> (future (run-tests 'logseq.e2e.commands-basic-test))
       (swap! *futures assoc :commands-test)))

(defn run-property-basic-test
  []
  (->> (future (run-tests 'logseq.e2e.property-basic-test))
       (swap! *futures assoc :property-test)))

(defn run-outliner-test
  []
  (->> (future (run-tests 'logseq.e2e.outliner-basic-test))
       (swap! *futures assoc :outliner-test)))

(defn run-rtc-basic-test
  []
  (->> (future (run-tests 'logseq.e2e.rtc-basic-test))
       (swap! *futures assoc :rtc-basic-test)))

(defn run-multi-tabs-test
  []
  (->> (future (run-tests 'logseq.e2e.multi-tabs-basic-test))
       (swap! *futures assoc :multi-tabs-test)))

(defn run-reference-test
  []
  (->> (future (run-tests 'logseq.e2e.reference-basic-test))
       (swap! *futures assoc :reference-test)))

(defn run-plugins-test
  []
  (->> (future (run-tests 'logseq.e2e.plugins-basic-test))
       (swap! *futures assoc :plugins-test)))

(defn run-rtc-extra-test
  []
  (->> (future (run-tests 'logseq.e2e.rtc-extra-test))
       (swap! *futures assoc :rtc-extra-test)))

(defn run-tag-basic-test
  []
  (->> (future (run-tests 'logseq.e2e.tag-basic-test))
       (swap! *futures assoc :tag-basic-test)))

(defn run-all-basic-test
  []
  (run-tests 'logseq.e2e.commands-basic-test
             'logseq.e2e.multi-tabs-basic-test
             'logseq.e2e.outliner-basic-test
             'logseq.e2e.rtc-basic-test
             'logseq.e2e.plugins-basic-test
             'logseq.e2e.reference-basic-test
             'logseq.e2e.property-basic-test
             'logseq.e2e.tag-basic-test))

(defn start
  []
  (future
    (fixtures/open-page
     repl/pause
     {:headless false})))

(comment

  ;; You can call or put `(repl/pause)` in any test to pause the tests,
  ;; this allows us to continue experimenting with the current page.
  (repl/pause)

  ;; To resume the tests, close the page/context/browser
  (repl/resume)

  ;; Run specific test
  (future (run-test logseq.e2e.commands-test/new-property-test))

  ;; after the test has been paused, you can do anything with the current page like this
  (repl/with-page
    (w/wait-for (first (util/get-edit-block-container))
                {:state :detached}))

  (run-tests 'logseq.e2e.commands-basic-test
             'logseq.e2e.multi-tabs-basic-test
             'logseq.e2e.outliner-basic-test
             'logseq.e2e.rtc-basic-test)

  (do
    (reset! config/*headless true)
    (reset! config/*slow-mo 10)
    (run-tests 'logseq.e2e.reference-basic-test)
    (dotimes [i 10]
      (run-tests 'logseq.e2e.reference-basic-test)))

  ;;
  )
