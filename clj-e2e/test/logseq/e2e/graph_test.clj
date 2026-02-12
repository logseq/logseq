(ns logseq.e2e.graph-test
  (:require [clojure.test :refer [deftest is]]
            [logseq.e2e.graph]
            [logseq.e2e.util :as util]
            [wally.main :as w]))

(deftest maybe-input-e2ee-password-skips-when-cloud-ready-test
  (let [wait-calls (atom 0)
        input-calls (atom 0)]
    (with-redefs-fn {#'w/visible? (fn [q] (= q "button.cloud.on.idle"))
                     #'util/wait-timeout (fn [_] (swap! wait-calls inc))
                     #'logseq.e2e.graph/input-e2ee-password (fn [] (swap! input-calls inc))}
      (fn []
        ((var logseq.e2e.graph/maybe-input-e2ee-password))
        (is (zero? @wait-calls))
        (is (zero? @input-calls))))))

(deftest maybe-input-e2ee-password-inputs-when-modal-appears-test
  (let [ticks (atom 0)
        input-calls (atom 0)]
    (with-redefs-fn {#'w/visible? (fn [q]
                                    (case q
                                      ".e2ee-password-modal-content" (>= @ticks 2)
                                      "button.cloud.on.idle" false
                                      false))
                     #'util/wait-timeout (fn [_] (swap! ticks inc))
                     #'logseq.e2e.graph/input-e2ee-password (fn [] (swap! input-calls inc))}
      (fn []
        ((var logseq.e2e.graph/maybe-input-e2ee-password))
        (is (= 2 @ticks))
        (is (= 1 @input-calls))))))
