(ns frontend.worker.rtc.const
  "RTC constants"
  (:require [logseq.common.defkeywords :as common-def :refer [defkeywords]]))

(goog-define RTC-E2E-TEST* false)
(def RTC-E2E-TEST RTC-E2E-TEST*)

(defkeywords
  :rtc/ignore-attr-when-init-upload
  {:doc "keyword option for RTC. ignore this *attr* when initial uploading graph. Default false"}
  :rtc/ignore-attr-when-init-download
  {:doc "keyword option for RTC. ignore this *attr* when initial downloading graph. Default false"}
  :rtc/ignore-attr-when-syncing
  {:doc "keyword option for RTC. ignore this *attr* when syncing graph. Default false"}
  :rtc/ignore-entity-when-init-upload
  {:doc "keyword option for RTC. ignore this *entity* when initial uploading graph. Default false"}
  :rtc/ignore-entity-when-init-download
  {:doc "keyword option for RTC. ignore this *entity* when initial downloading graph. Default false"}

  ;; only blocks(:block/uuid) will be synced, this option is meaningless for now
  ;; :rtc/ignore-entity-when-syncing
  ;; {:doc "keyword option for RTC. ignore this *entity* when syncing graph. Default false"}
  )

(def ignore-attrs-when-init-upload
  (into #{}
        (keep (fn [[kw config]] (when (get-in config [:rtc :rtc/ignore-attr-when-init-upload]) kw)))
        (common-def/get-all-defined-kw->config)))

(def ignore-attrs-when-init-download
  (into #{}
        (keep (fn [[kw config]] (when (get-in config [:rtc :rtc/ignore-attr-when-init-download]) kw)))
        (common-def/get-all-defined-kw->config)))

(def ignore-attrs-when-syncing
  (into #{}
        (keep (fn [[kw config]] (when (get-in config [:rtc :rtc/ignore-attr-when-syncing]) kw)))
        (common-def/get-all-defined-kw->config)))

(def ignore-entities-when-init-upload
  (into #{}
        (keep (fn [[kw config]] (when (get-in config [:rtc :rtc/ignore-entity-when-init-upload]) kw)))
        (common-def/get-all-defined-kw->config)))

(def ignore-entities-when-init-download
  (into #{}
        (keep (fn [[kw config]] (when (get-in config [:rtc :rtc/ignore-entity-when-init-download]) kw)))
        (common-def/get-all-defined-kw->config)))
