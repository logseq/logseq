(ns frontend.handler.events.rtc-error-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.context.i18n :as i18n]
            [frontend.handler.events.rtc-error :as rtc-error]
            [frontend.handler.notification :as notification]
            [frontend.state :as state]))

(deftest e2ee-decrypt-failed-detects-invalid-password-code-test
  (is (true?
       (rtc-error/e2ee-decrypt-failed?
        (ex-info "db-sync download failed"
                 {:code :db-sync/invalid-e2ee-password})))))

(deftest e2ee-decrypt-failed-detects-nested-error-test
  (is (true?
       (rtc-error/e2ee-decrypt-failed?
        (ex-info "db-sync download failed"
                 {:error (ex-info "decrypt-aes-key" {})})))))

(deftest e2ee-decrypt-failed-ignores-other-errors-test
  (is (false?
       (rtc-error/e2ee-decrypt-failed?
        (ex-info "db-sync download failed"
                 {:error-message "snapshot download failed"})))))

(deftest download-failure-detail-includes-fetch-pull-stage-test
  (is (= "fetch-pull: fetch failed"
         (rtc-error/download-failure-detail
          (ex-info "db-sync download failed"
                   {:stage :fetch-pull
                    :error-message "fetch failed"})))))

(deftest download-failure-detail-includes-pre-worker-start-error-test
  (is (= "db-worker-node failed to start"
         (rtc-error/download-failure-detail
          (ex-info "db-worker-node failed to start"
                   {:code :server-start-failed})))))

(deftest download-failure-detail-includes-cause-after-fetch-message-test
  (is (= "fetch-pull: fetch failed: self-signed certificate"
         (rtc-error/download-failure-detail
          (ex-info "db-sync download failed"
                   {:stage :fetch-pull
                    :error-message "fetch failed"
                    :error-cause "self-signed certificate"})))))

(deftest notify-download-failure-completes-progress-and-shows-error-test
  (let [events (atom [])
        notifications (atom [])]
    (with-redefs [state/pub-event! (fn [event]
                                     (swap! events conj event)
                                     nil)
                  notification/show! (fn [content status clear?]
                                       (swap! notifications conj [content status clear?])
                                       nil)]
      (rtc-error/notify-download-failure!
       "graph-1"
       (ex-info "db-sync download failed"
                {:stage :fetch-pull
                 :error-message "fetch failed"})))
    (is (= [[:rtc/log {:type :rtc.log/download
                       :sub-type :download-completed
                       :graph-uuid "graph-1"
                       :message "Graph snapshot download failed"}]]
           @events))
    (is (= [[(i18n/t :sync/download-error "fetch-pull: fetch failed") :error false]]
           @notifications))))

(deftest notify-download-failure-keeps-wrong-password-toast-test
  (let [notifications (atom [])]
    (with-redefs [state/pub-event! (fn [_event] nil)
                  notification/show! (fn [content status clear?]
                                       (swap! notifications conj [content status clear?])
                                       nil)]
      (rtc-error/notify-download-failure!
       "graph-1"
       (ex-info "db-sync download failed"
                {:code :db-sync/invalid-e2ee-password
                 :stage :prepare-e2ee
                 :error-message "decrypt-aes-key"})))
    (is (= [[(i18n/t :encryption/wrong-password) :error false]]
           @notifications))))

(deftest notify-download-failure-surfaces-pre-worker-start-error-test
  (testing "runtime start failures still clear progress and toast the real error"
    (let [events (atom [])
          notifications (atom [])]
      (with-redefs [state/pub-event! (fn [event]
                                       (swap! events conj event)
                                       nil)
                    notification/show! (fn [content status clear?]
                                         (swap! notifications conj [content status clear?])
                                         nil)]
        (rtc-error/notify-download-failure!
         "graph-1"
         (ex-info "db-worker-node failed to start"
                  {:code :server-start-failed})))
      (is (= :download-completed
             (get-in @events [0 1 :sub-type])))
      (is (= [[(i18n/t :sync/download-error "db-worker-node failed to start") :error false]]
             @notifications)))))
