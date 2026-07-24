(ns frontend.handler.repo-config-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.handler.repo-config :as repo-config-handler]
            [frontend.state :as state]
            [promesa.core :as p]))

(deftest restore-repo-config-reads-config-through-worker-test
  (async done
    (let [repo "logseq_db_repo_config_worker"
          previous-state @state/state
          worker-calls (atom [])]
      (p/with-redefs [repo-config-handler/<get-file-content
                      (fn [repo' path]
                        (swap! worker-calls conj [:thread-api/get-file-content repo' path])
                        (p/resolved "{:ui/show-brackets? false}"))]
        (-> (p/let [config (repo-config-handler/restore-repo-config! repo)]
              (is (= {:ui/show-brackets? false} config))
              (is (= [[:thread-api/get-file-content repo "logseq/config.edn"]]
                     @worker-calls))
              (is (= {:ui/show-brackets? false}
                     (state/get-graph-config repo))))
            (p/catch
             (fn [error]
               (is false (str error))))
            (p/finally
             (fn []
               (reset! state/state previous-state)
               (done))))))))
