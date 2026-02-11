(ns electron.db-worker-manager-test
  (:require [cljs.test :refer [async deftest is]]
            [electron.db-worker :as db-worker]
            [promesa.core :as p]))

(defn- runtime
  [repo]
  {:repo repo
   :base-url (str "http://127.0.0.1/" repo)
   :auth-token (str "token-" repo)})

(deftest ensure-started-is-idempotent-for-same-window
  (async done
    (let [start-calls (atom [])
          manager (db-worker/create-manager
                   {:start-daemon! (fn [repo]
                                     (swap! start-calls conj repo)
                                     (p/resolved (runtime repo)))
                    :stop-daemon! (fn [_] (p/resolved true))})]
      (-> (p/let [a (db-worker/ensure-started! manager "graph-a" :window-1)
                  b (db-worker/ensure-started! manager "graph-a" :window-1)]
            (is (= 1 (count @start-calls)))
            (is (= a b)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn [] (done)))))))

(deftest ensure-started-reuses-daemon-across-windows
  (async done
    (let [start-calls (atom [])
          manager (db-worker/create-manager
                   {:start-daemon! (fn [repo]
                                     (swap! start-calls conj repo)
                                     (p/resolved (runtime repo)))
                    :stop-daemon! (fn [_] (p/resolved true))})]
      (-> (p/let [_ (db-worker/ensure-started! manager "graph-a" :window-1)
                  _ (db-worker/ensure-started! manager "graph-a" :window-2)]
            (is (= ["graph-a"] @start-calls)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn [] (done)))))))

(deftest ensure-started-switches-window-repo-and-stops-previous-daemon
  (async done
    (let [start-calls (atom [])
          stop-calls (atom [])
          manager (db-worker/create-manager
                   {:start-daemon! (fn [repo]
                                     (swap! start-calls conj repo)
                                     (p/resolved (runtime repo)))
                    :stop-daemon! (fn [rt]
                                    (swap! stop-calls conj (:repo rt))
                                    (p/resolved true))})]
      (-> (p/let [_ (db-worker/ensure-started! manager "graph-a" :window-1)
                  _ (db-worker/ensure-started! manager "graph-b" :window-1)]
            (is (= ["graph-a" "graph-b"] @start-calls))
            (is (= ["graph-a"] @stop-calls)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn [] (done)))))))

(deftest ensure-stopped-stops-only-on-last-window
  (async done
    (let [stop-calls (atom [])
          manager (db-worker/create-manager
                   {:start-daemon! (fn [repo] (p/resolved (runtime repo)))
                    :stop-daemon! (fn [rt]
                                    (swap! stop-calls conj (:repo rt))
                                    (p/resolved true))})]
      (-> (p/let [_ (db-worker/ensure-started! manager "graph-a" :window-1)
                  _ (db-worker/ensure-started! manager "graph-a" :window-2)
                  _ (db-worker/ensure-stopped! manager "graph-a" :window-1)
                  _ (is (empty? @stop-calls))
                  _ (db-worker/ensure-stopped! manager "graph-a" :window-2)]
            (is (= ["graph-a"] @stop-calls)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn [] (done)))))))

(deftest ensure-window-stopped-releases-active-runtime-by-window
  (async done
    (let [stop-calls (atom [])
          manager (db-worker/create-manager
                   {:start-daemon! (fn [repo] (p/resolved (runtime repo)))
                    :stop-daemon! (fn [rt]
                                    (swap! stop-calls conj (:repo rt))
                                    (p/resolved true))})]
      (-> (p/let [_ (db-worker/ensure-started! manager "graph-a" :window-1)
                  _ (db-worker/ensure-started! manager "graph-a" :window-2)
                  _ (db-worker/ensure-window-stopped! manager :window-1)
                  _ (is (empty? @stop-calls))
                  _ (db-worker/ensure-window-stopped! manager :window-2)]
            (is (= ["graph-a"] @stop-calls)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn [] (done)))))))

(deftest stop-all-stops-every-active-graph
  (async done
    (let [stop-calls (atom [])
          manager (db-worker/create-manager
                   {:start-daemon! (fn [repo] (p/resolved (runtime repo)))
                    :stop-daemon! (fn [rt]
                                    (swap! stop-calls conj (:repo rt))
                                    (p/resolved true))})]
      (-> (p/let [_ (db-worker/ensure-started! manager "graph-a" :window-1)
                  _ (db-worker/ensure-started! manager "graph-b" :window-2)
                  _ (db-worker/stop-all! manager)]
            (is (= #{"graph-a" "graph-b"} (set @stop-calls))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn [] (done)))))))

(deftest ensure-started-restarts-unhealthy-cached-runtime
  (async done
    (let [start-count (atom 0)
          stop-calls (atom [])
          created-runtimes (atom [])
          manager (db-worker/create-manager
                   {:start-daemon! (fn [repo]
                                     (let [idx (swap! start-count inc)
                                           rt {:repo repo
                                               :base-url (str "http://127.0.0.1:910" idx)
                                               :auth-token (str "token-" idx)}]
                                       (swap! created-runtimes conj rt)
                                       (p/resolved rt)))
                    :stop-daemon! (fn [rt]
                                    (swap! stop-calls conj (:base-url rt))
                                    (p/resolved true))
                    :runtime-ready? (fn [rt]
                                      ;; first runtime reported unhealthy, restarted runtime healthy
                                      (p/resolved (not= (:base-url rt) "http://127.0.0.1:9101")))})]
      (-> (p/let [rt1 (db-worker/ensure-started! manager "graph-a" :window-1)
                  rt2 (db-worker/ensure-started! manager "graph-a" :window-1)]
            (is (= "http://127.0.0.1:9101" (:base-url rt1)))
            (is (= "http://127.0.0.1:9102" (:base-url rt2)))
            (is (= 2 @start-count))
            (is (= ["http://127.0.0.1:9101"] @stop-calls)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn [] (done)))))))
