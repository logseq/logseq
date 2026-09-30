(ns frontend.handler.config-test
  (:require [cljs.test :refer [async deftest is]]
            [clojure.string :as string]
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
          previous-state (state/get-state)]
      (state/swap-state! assoc :git/current-repo repo)
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
               (state/replace-state! previous-state)
               (done))))))))

(deftest set-config-recreates-missing-config-edn-test
  ;; The missing logseq/config.edn file entity must not lock settings writes;
  ;; the file is recreated with the default config as its base
  (async done
    (let [repo "logseq_db_config_missing_file"
          previous-state (state/get-state)
          previous-worker @state/*db-worker
          previous-pub-event state/pub-event!
          file-content (atom nil)]
      (reset! state/*db-worker
              (fn [method-k _repo & [arg1]]
                (case method-k
                  :thread-api/get-file-content (p/resolved @file-content)
                  :thread-api/pull (p/resolved (when @file-content {:db/id 1}))
                  :thread-api/transact (p/resolved (reset! file-content (:file/content (first arg1))))
                  (p/resolved nil))))
      ;; [:shortcut/refresh] publishing touches DOM listeners unavailable in node
      (set! state/pub-event! (fn [& _] nil))
      (state/swap-state! assoc :git/current-repo repo)
      (-> (p/let [_ (config-handler/set-config! :ui/show-brackets? false)
                  content @file-content]
            (is (some? content))
            (is (string/includes? content ":ui/show-brackets? false"))
            (is (string/includes? content ":meta/version 1"))
            ;; restore-repo-config! re-reads the file so [:config repo] updates
            (is (false? (:ui/show-brackets? (state/get-graph-config repo)))))
          (p/catch
           (fn [error]
             (is false (str error))))
          (p/finally
           (fn []
             (reset! state/*db-worker previous-worker)
             (set! state/pub-event! previous-pub-event)
             (state/replace-state! previous-state)
             (done)))))))
