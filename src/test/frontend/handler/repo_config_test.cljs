(ns frontend.handler.repo-config-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.handler.notification :as notification]
            [frontend.handler.repo-config :as repo-config-handler]
            [frontend.state :as state]
            [promesa.core :as p]))

(deftest restore-repo-config-reads-config-through-worker-test
  (async done
    (let [repo "logseq_db_repo_config_worker"
          previous-state (state/get-state)
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
               (state/replace-state! previous-state)
               (done))))))))

(deftest restore-repo-config-falls-back-to-default-when-file-missing-test
  ;; `[:config repo]` is populated with the default config so settings toggles
  ;; reflect defaults instead of staying unset when the file entity is missing
  (async done
    (let [repo "logseq_db_repo_config_missing_file"
          previous-state (state/get-state)
          previous-worker @state/*db-worker]
      (reset! state/*db-worker (fn [& _args] (p/resolved nil)))
      (-> (p/let [config (repo-config-handler/restore-repo-config! repo)]
            (is (true? (:ui/enable-tooltip? config)))
            (is (true? (:ui/enable-tooltip? (state/get-graph-config repo)))))
          (p/catch
           (fn [error]
             (is false (str error))))
          (p/finally
           (fn []
             (reset! state/*db-worker previous-worker)
             (state/replace-state! previous-state)
             (done)))))))

(deftest restore-repo-config-falls-back-to-default-when-file-invalid-test
  ;; An unparsable config.edn also falls back to the default config so
  ;; `[:config repo]` stays populated and settings toggles keep working
  (async done
    (let [repo "logseq_db_repo_config_invalid_file"
          previous-state (state/get-state)
          previous-worker @state/*db-worker
          previous-notification notification/show!]
      ;; Mocks are restored synchronously in p/finally: p/with-redefs restores
      ;; in a microtask that can run after the next test has started
      (set! notification/show! (fn [& _args] nil))
      (reset! state/*db-worker
              (fn [method-k & _args]
                (p/resolved (when (= :thread-api/get-file-content method-k)
                              "{:ui/show-brackets?"))))
      (-> (p/let [config (repo-config-handler/restore-repo-config! repo)]
            (is (true? (:ui/enable-tooltip? config)))
            (is (true? (:ui/enable-tooltip? (state/get-graph-config repo)))))
          (p/catch
           (fn [error]
             (is false (str error))))
          (p/finally
           (fn []
             (set! notification/show! previous-notification)
             (reset! state/*db-worker previous-worker)
             (state/replace-state! previous-state)
             (done)))))))
