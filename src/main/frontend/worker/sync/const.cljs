(ns frontend.worker.sync.const
  "RTC constants"
  (:require-macros [frontend.defkeywords :refer [defkeywords]])
  (:require [logseq.melange.bridge.db.property-catalog :as property-catalog]
            [logseq.melange.bridge.db.kv-entity :as kv-entity]))

(defkeywords
  :rtc/ignore-attr-when-syncing
  {:doc "keyword option for RTC. ignore this *attr* when syncing graph. Default false"}
  :rtc/ignore-entity-when-init-upload
  {:doc "keyword option for RTC. ignore this *entity* when initial uploading graph. Default false"})

(def ignore-attrs-when-syncing
  (into #{}
        (keep (fn [[kw config]] (when (get-in config [:rtc :rtc/ignore-attr-when-syncing]) kw)))
        property-catalog/built-in-properties))

(def ignore-entities-when-init-upload
  (into #{}
        (keep (fn [[kw config]] (when (get-in config [:rtc :rtc/ignore-entity-when-init-upload]) kw)))
        kv-entity/kv-entities))

(def encrypt-attr-set
  "block attributes that need to be encrypted"
  #{:block/title :block/name})
