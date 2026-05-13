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
  (is (= [{:count 3 :label-key :sync/pending-asset-uploads}
          {:count 1 :label-key :sync/assets-uploading}
          {:count 2 :label-key :sync/assets-downloading}]
         (indicator/asset-status-rows
          {:pending-asset-ops 3
           :asset-transfer-counts {:upload 1
                                   :download 2}}))))

(deftest asset-status-rows-hides-zero-counts
  (is (= []
         (indicator/asset-status-rows
          {:pending-asset-ops 0
           :asset-transfer-counts {:upload 0
                                   :download 0}}))))
