(ns frontend.components.rtc.indicator-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.components.rtc.indicator :as indicator]))

(deftest asset-transfer-counts-counts-active-uploads-and-downloads
  (is (= {:upload 2
          :download 1}
         (indicator/asset-transfer-counts
          {"upload-1" {:direction :upload :loaded 0 :total 10}
           "upload-2" {:direction :upload :loaded 5 :total 10}
           "upload-done" {:direction :upload :loaded 10 :total 10}
           "download-1" {:direction :download :loaded 1 :total 10}
           "missing-total" {:direction :download :loaded 1}
           "other" {:direction :other :loaded 0 :total 10}}))))

(deftest asset-status-rows-shows-pending-upload-and-active-transfer-info
  (is (= [{:count 2 :label-key :sync/missing-asset-files}
          {:count 1 :label-key :sync/pending-asset-uploads}
          {:count 1 :label-key :sync/assets-uploading}
          {:count 2 :label-key :sync/assets-downloading}]
         (indicator/asset-status-rows
          {:pending-asset-ops 3
           :missing-asset-upload-files [{:file "assets/missing-1.pdf"}
                                        {:file "assets/missing-2.pdf"}]
           :asset-transfer-counts {:upload 1
                                   :download 2}}))))

(deftest asset-status-rows-hides-zero-counts
  (is (= []
         (indicator/asset-status-rows
          {:pending-asset-ops 0
           :missing-asset-upload-files []
           :asset-transfer-counts {:upload 0
                                   :download 0}}))))

(deftest detail-info-state-is-closed-without-rtc-lock
  (is (= :close
         (:rtc-state (indicator/rtc-state->detail-info {})))))

(defn- class-set
  [opts]
  (let [class-name (indicator/indicator-button-class opts)]
    (is (string? class-name))
    (is (not (re-find #"," class-name)))
    (set (.split class-name " "))))

(def ^:private idle-open-opts
  {:online? true
   :rtc-state :open
   :pending-local-ops 0
   :pending-asset-ops 0
   :pending-server-ops 0})

(deftest checksums-diverged-requires-both-present-and-different
  (is (false? (indicator/checksums-diverged? nil nil)))
  (is (false? (indicator/checksums-diverged? "abc" nil)))
  (is (false? (indicator/checksums-diverged? nil "abc")))
  (is (false? (indicator/checksums-diverged? "abc" "abc")))
  (is (true? (indicator/checksums-diverged? "abc" "def"))))

(deftest checksum-mismatch-detail-only-when-both-checksums-differ
  (is (nil? (indicator/checksum-mismatch-detail
             {:local-checksum "abc"
              :remote-checksum "abc"})))
  (is (nil? (indicator/checksum-mismatch-detail
             {:local-checksum "abc"
              :remote-checksum nil})))
  (is (= {:local-checksum "abc"
          :remote-checksum "def"}
         (indicator/checksum-mismatch-detail
          {:local-checksum "abc"
           :remote-checksum "def"}))))

(deftest detail-info-forwards-local-and-remote-checksums
  (is (= {:local-checksum "abc"
          :remote-checksum "def"}
         (select-keys (indicator/rtc-state->detail-info
                       {:local-checksum "abc"
                        :remote-checksum "def"})
                      [:local-checksum :remote-checksum]))))

(deftest indicator-button-class-is-space-separated
  (is (= #{"cloud" "on" "idle"}
         (class-set idle-open-opts))))

(deftest indicator-button-class-idle-when-checksums-match
  (is (= #{"cloud" "on" "idle"}
         (class-set (assoc idle-open-opts
                           :local-checksum "abc"
                           :remote-checksum "abc")))))

(deftest indicator-button-class-idle-when-checksums-unknown
  (is (= #{"cloud" "on" "idle"}
         (class-set (assoc idle-open-opts
                           :local-checksum "abc"
                           :remote-checksum nil))))
  (is (= #{"cloud" "on" "idle"}
         (class-set (assoc idle-open-opts
                           :local-checksum nil
                           :remote-checksum "abc")))))

(deftest indicator-button-class-not-idle-when-checksums-diverge
  (let [classes (class-set (assoc idle-open-opts
                                  :local-checksum "abc"
                                  :remote-checksum "def"))]
    (is (= #{"cloud" "on" "diverged"} classes))
    (is (not (contains? classes "idle")))))

(deftest indicator-button-class-keeps-pending-counts-ahead-of-checksum-match
  (is (= #{"cloud" "on" "queuing"}
         (class-set (assoc idle-open-opts
                           :pending-local-ops 2
                           :local-checksum "abc"
                           :remote-checksum "abc"))))
  (is (= #{"cloud" "on" "syncing"}
         (class-set (assoc idle-open-opts
                           :pending-server-ops 3
                           :local-checksum "abc"
                           :remote-checksum "abc"))))
  (is (= #{"cloud" "on" "queuing" "diverged"}
         (class-set (assoc idle-open-opts
                           :pending-asset-ops 1
                           :local-checksum "abc"
                           :remote-checksum "def"))))
  (is (= #{"cloud" "on" "syncing" "diverged"}
         (class-set (assoc idle-open-opts
                           :pending-server-ops 1
                           :local-checksum "abc"
                           :remote-checksum "def")))))
