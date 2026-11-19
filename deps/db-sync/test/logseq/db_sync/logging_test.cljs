(ns logseq.db-sync.logging-test
  (:require [cljs.test :refer [async deftest is testing]]
            [lambdaisland.glogi :as log]
            [logseq.db-sync.logging :as logging]
            [logseq.db-sync.node.server :as node-server]
            [promesa.core :as p]))

(defn- logged-levels
  "The levels of the records that reach a root handler while f runs."
  [f]
  (let [records (atom [])
        handler (fn [record] (swap! records conj (:level record)))]
    (log/add-handler handler)
    (try
      (f)
      @records
      (finally
        (log/remove-handler handler)))))

(deftest set-root-level!-filters-records-below-the-level-test
  (try
    (testing "error drops info and keeps error"
      (logging/set-root-level! "error")
      (is (= 1 (count (logged-levels #(do (log/log "logging-test" :info "info message")
                                          (log/log "logging-test" :error "error message")))))
          "only the error record"))
    (testing "the name is case-insensitive"
      (logging/set-root-level! "DEBUG")
      (is (= 1 (count (logged-levels #(log/log "logging-test" :debug "debug message"))))))
    (testing "an unknown name keeps the level it had"
      (logging/set-root-level! "error")
      (logging/set-root-level! "verbose")
      (is (= [] (logged-levels #(log/log "logging-test" :info "info message")))))
    (finally
      (log/set-level :glogi/root :info))))

(deftest node-server-applies-the-configured-log-level-test
  (async done
         (let [stop* (atom nil)]
           (-> (p/let [{:keys [stop!]} (node-server/start! {:port 0
                                                            :data-dir (str "tmp/db-sync-logging-test/" (random-uuid))
                                                            :log-level "error"})
                       _ (reset! stop* stop!)]
                 (is (= [] (logged-levels #(log/log "logging-test" :info "info message")))
                     "a server started with :log-level error drops info records"))
               (p/catch (fn [e] (is false (str e))))
               (p/finally (fn []
                            (log/set-level :glogi/root :info)
                            (-> (p/let [_ (when-let [stop! @stop*] (stop!))])
                                (p/finally done))))))))
