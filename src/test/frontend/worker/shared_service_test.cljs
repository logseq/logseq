(ns frontend.worker.shared-service-test
  (:require [cljs.test :refer [deftest is async]]
            [frontend.worker.platform :as platform]
            [frontend.worker.shared-service :as shared-service]
            [promesa.core :as p]))

(defn- test-platform
  [runtime]
  {:env {:runtime runtime}
   :storage {}
   :kv {}
   :broadcast {}
   :websocket {}
   :crypto {}
   :timers {}
   :sqlite {}})

(deftest node-proxy-remote-invoke-applies-args
  (async done
    (let [prev-platform (try
                          (platform/current)
                          (catch :default _ nil))
          received (atom nil)
          target #js {"remoteInvoke" (fn [& args]
                                       (reset! received args)
                                       :ok)}]
      (platform/set-platform! (test-platform :node))
      (-> (p/let [service (shared-service/<create-service
                           "test-service"
                           target
                           (fn [_] (p/resolved nil))
                           #{}
                           {:import? false})
                  args (list "thread-api/foo" true #js [1 2])
                  remote-invoke (aget (:proxy service) "remoteInvoke")]
            (is (fn? remote-invoke))
            (when (fn? remote-invoke)
              (remote-invoke args))
            (let [[method direct-pass? payload] @received]
              (is (= "thread-api/foo" method))
              (is (= true direct-pass?))
              (is (= [1 2] (js->clj payload)))))
          (p/finally (fn []
                       (when prev-platform
                         (platform/set-platform! prev-platform))))
          (p/then (fn [] (done)))))))
