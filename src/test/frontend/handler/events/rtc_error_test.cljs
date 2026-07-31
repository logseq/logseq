(ns frontend.handler.events.rtc-error-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.handler.events.rtc-error :as rtc-error]))

(deftest download-decrypt-failed-detects-worker-error-data-test
  (is (true?
       (rtc-error/download-decrypt-failed?
        (ex-info "db-sync download failed"
                 {:error-message "decrypt-private-key"})))))

(deftest download-decrypt-failed-detects-nested-error-test
  (is (true?
       (rtc-error/download-decrypt-failed?
        (ex-info "db-sync download failed"
                 {:error (ex-info "decrypt-aes-key" {})})))))

(deftest download-decrypt-failed-ignores-other-errors-test
  (is (false?
       (rtc-error/download-decrypt-failed?
        (ex-info "db-sync download failed"
                 {:error-message "snapshot download failed"})))))
