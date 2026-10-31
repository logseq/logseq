(ns electron.db-worker-prestart-test
  "A worker start in flight is shared: the startup prestart and the renderer's
  own runtime call for the same graph start one worker."
  (:require [cljs.test :refer [async deftest is]]
            [electron.db-worker :as db-worker]
            [promesa.core :as p]))

(defn- runtime
  [repo n]
  {:repo repo
   :n n
   :base-url (str "http://127.0.0.1/" repo)})

(deftest concurrent-starts-of-one-graph-start-one-worker
  (async done
    (let [start-calls (atom 0)
          gate (p/deferred)
          manager (db-worker/create-manager
                   {:start-daemon! (fn [repo _opts]
                                     (let [n (swap! start-calls inc)]
                                       (p/then gate (fn [_] (runtime repo n)))))
                    :stop-daemon! (fn [_] (p/resolved true))})
          prestart (db-worker/ensure-started! manager "graph-a" :window-1)
          renderer (db-worker/ensure-started! manager "graph-a" :window-1)]
      (p/resolve! gate true)
      (-> (p/let [a prestart
                  b renderer]
            (is (= 1 @start-calls))
            (is (= a b)))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally (fn [] (done)))))))

(deftest a-failed-start-in-flight-lets-the-waiting-call-start-again
  (async done
    (let [start-calls (atom 0)
          gate (p/deferred)
          manager (db-worker/create-manager
                   {:start-daemon! (fn [repo _opts]
                                     (let [n (swap! start-calls inc)]
                                       (if (= 1 n)
                                         (p/then gate (fn [_] (throw (ex-info "spawn failed" {}))))
                                         (p/resolved (runtime repo n)))))
                    :stop-daemon! (fn [_] (p/resolved true))})
          ;; which of the two calls runs the first start is up to the scheduler: that
          ;; one fails, the other one waits for it and then starts the worker itself
          settle (fn [call] (p/catch call (fn [e] {:failed (ex-message e)})))
          first-call (settle (db-worker/ensure-started! manager "graph-a" :window-1))
          second-call (settle (db-worker/ensure-started! manager "graph-a" :window-1))]
      (p/resolve! gate true)
      (-> (p/let [a first-call
                  b second-call]
            (is (= #{{:failed "spawn failed"} 2} (set [(if (:failed a) a (:n a)) (if (:failed b) b (:n b))])))
            (is (= 2 @start-calls)))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally (fn [] (done)))))))

(deftest a-call-for-another-graph-while-a-start-is-in-flight-switches-the-window
  (async done
    (let [starts (atom [])
          stops (atom [])
          gate (p/deferred)
          manager (db-worker/create-manager
                   {:start-daemon! (fn [repo _opts]
                                     (swap! starts conj repo)
                                     (p/then gate (fn [_] (runtime repo (count @starts)))))
                    :stop-daemon! (fn [rt] (swap! stops conj (:repo rt)) (p/resolved true))})
          prestart (db-worker/ensure-started! manager "graph-a" :window-1)]
      (-> (p/let [_ (p/resolve! gate true)
                  _ prestart
                  b (db-worker/ensure-started! manager "graph-b" :window-1)]
            (is (= ["graph-a" "graph-b"] @starts))
            (is (= ["graph-a"] @stops))
            (is (= "graph-b" (:repo b))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally (fn [] (done)))))))
