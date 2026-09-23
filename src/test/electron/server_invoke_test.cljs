(ns electron.server-invoke-test
  (:require [cljs.test :refer [async deftest is]]
            [electron.server-invoke :as server-invoke]
            [promesa.core :as p]))

(deftest await-ipc-reply-resolves-when-renderer-answers
  (async done
    (-> (server-invoke/await-ipc-reply!
         {:channel "sync-1"
          :timeout-ms 50
          :handle-once! (fn [_channel handler]
                          (js/setTimeout #(handler nil {:uuid "abc"}) 0))
          :remove-handler! (fn [_channel])})
        (p/then (fn [value]
                  (is (= {:uuid "abc"} value))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest await-ipc-reply-times-out-when-renderer-never-answers
  (async done
    (let [removed (atom [])]
      (-> (server-invoke/await-ipc-reply!
           {:channel "sync-timeout"
            :timeout-ms 20
            :handle-once! (fn [_channel _handler])
            :remove-handler! (fn [channel]
                               (swap! removed conj channel))})
          (p/then (fn [_]
                    (is false "Timed-out invoke must reject")))
          (p/catch (fn [error]
                     (is (server-invoke/api-invoke-timeout? error))
                     (is (= 504 (:status (ex-data error))))
                     (is (= ["sync-timeout"] @removed))))
          (p/finally done)))))
