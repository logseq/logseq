(ns frontend.handler.config-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.handler.config :as config-handler]
            [frontend.handler.db-based.editor :as db-editor-handler]
            [frontend.handler.repo-config :as repo-config-handler]
            [frontend.state :as state]
            [promesa.core :as p]))

(deftest set-config-reads-current-config-through-worker-test
  (async done
    (let [repo "logseq_db_config_worker"
          worker-calls (atom [])
          saved-files (atom [])
          previous-state @state/state]
      (swap! state/state assoc :git/current-repo repo)
      (p/with-redefs [config-handler/<get-file-content
                      (fn [repo' path]
                        (swap! worker-calls conj [:thread-api/get-file-content repo' path])
                        (p/resolved "{:ui/show-brackets? false}"))
                      repo-config-handler/read-repo-config
                      (fn [content]
                        (is (= "{:ui/show-brackets? false}" content))
                        {:ui/show-brackets? false})
                      db-editor-handler/save-file!
                      (fn [path content]
                        (swap! saved-files conj [path content])
                        (p/resolved nil))]
        (-> (p/let [_ (config-handler/set-config! :ui/show-brackets? true)]
              (is (= [[:thread-api/get-file-content repo "logseq/config.edn"]]
                     @worker-calls))
              (is (= [["logseq/config.edn" "{:ui/show-brackets? true}"]]
                     @saved-files)))
            (p/catch
             (fn [error]
               (is false (str error))))
            (p/finally
             (fn []
               (reset! state/state previous-state)
               (done))))))))
