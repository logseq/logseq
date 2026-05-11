(ns frontend.handler.worker-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.handler.worker :as worker-handler]
            [frontend.state :as state]
            [promesa.core :as p]))

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

(deftest db-worker-ui-request-resolve-passes-request-id-and-result-test
  (async done
    (let [calls (atom [])
          wrapped-worker (fn [qkw & args]
                           (swap! calls conj [qkw args])
                           (p/resolved {:ok true}))]
      (with-redefs [worker-handler/<db-worker-ui-action
                    (fn [_action _payload]
                      (p/resolved {:password "pw"}))]
        (-> (worker-handler/handle :db-worker/ui-request
                                   wrapped-worker
                                   {:request-id "req-1"
                                    :action :request-e2ee-password
                                    :payload {:reason :decrypt-user-rsa-private-key}})
            (p/then (fn [_]
                      (is (= [[:thread-api/resolve-ui-request ["req-1" {:password "pw"}]]]
                             @calls))
                      (done)))
            (p/catch (fn [error]
                       (is nil (str "unexpected error: " error))
                       (done))))))))

(deftest db-worker-ui-request-reject-passes-request-id-and-error-test
  (async done
    (let [calls (atom [])
          wrapped-worker (fn [qkw & args]
                           (swap! calls conj [qkw args])
                           (p/resolved {:ok true}))]
      (with-redefs [worker-handler/<db-worker-ui-action
                    (fn [_action _payload]
                      (p/rejected (ex-info "boom" {:code :boom :x 1})))]
        (-> (worker-handler/handle :db-worker/ui-request
                                   wrapped-worker
                                   {:request-id "req-2"
                                    :action :request-e2ee-password
                                    :payload {:reason :decrypt-user-rsa-private-key}})
            (p/then (fn [_]
                      (is (= [[:thread-api/reject-ui-request
                               ["req-2"
                                {:code :boom
                                 :message "boom"
                                 :data {:code :boom
                                        :x 1}}]]]
                             @calls))
                      (done)))
            (p/catch (fn [error]
                       (is nil (str "unexpected error: " error))
                       (done))))))))
