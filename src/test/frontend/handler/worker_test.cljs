(ns frontend.handler.worker-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.handler.worker :as worker-handler]
            [frontend.state :as state]))

(deftest handle-message-reports-comlink-worker-throw-with-extra-data-test
  (let [captured-events (atom [])
        logged-errors (atom [])
        logged-stacks (atom [])
        worker (js-obj)
        worker-error {:message "Non-transact outliner ops contain numeric entity ids"
                      :data {:stage :forward-outliner-ops
                             :index 0}
                      :cause {:data {:op :save-block}}
                      :stack "Error: Non-transact outliner ops contain numeric entity ids"}
        event #js {:data #js {:type "HANDLER"
                              :name "throw"
                              :value #js {:isError true
                                          :value (clj->js worker-error)}}}
        orig-console-error (.-error js/console)
        orig-console-log (.-log js/console)]
    (aset js/console "error" (fn [& args] (swap! logged-errors conj args)))
    (aset js/console "log" (fn [& args] (swap! logged-stacks conj args)))
    (try
      (with-redefs [state/pub-event! (fn [payload]
                                       (swap! captured-events conj payload))]
        (worker-handler/handle-message! worker nil)
        ((.-onmessage worker) event)
        (is (= 1 (count @captured-events)))
        (let [[event-type payload] (first @captured-events)]
          (is (= :capture-error event-type))
          (is (= true (get-in payload [:payload :worker-error?])))
          (is (= {:stage "forward-outliner-ops"
                  :index 0}
                 (get-in payload [:extra :worker-error-data])))
          (is (= {:op "save-block"}
                 (get-in payload [:extra :worker-cause-data])))
          (is (= (:message worker-error)
                 (ex-message (:error payload))))
          (is (empty? @logged-errors))
          (is (empty? @logged-stacks))))
      (finally
        (aset js/console "error" orig-console-error)
        (aset js/console "log" orig-console-log)))))
