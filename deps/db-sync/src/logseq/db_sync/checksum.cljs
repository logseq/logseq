(ns logseq.db-sync.checksum
  (:require [clojure.set :as set]
            [datascript.core :as d]
            [goog.crypt :as crypt]
            [goog.crypt.Sha256]
            [logseq.db :as ldb]
            [logseq.db.common.normalize :refer [eid->lookup]]
            [logseq.db.frontend.property :as db-property]))

(def ^:private local-ignore-attrs
  #{:db/id
    :block/tx-id})

(def ^:private rtc-ignore-attrs
  (into #{}
        (keep (fn [[kw config]]
                (when (get-in config [:rtc :rtc/ignore-attr-when-syncing]) kw)))
        db-property/built-in-properties))

(def ^:private default-ignore-attrs
  (set/union local-ignore-attrs rtc-ignore-attrs))

(def ^:private default-checksum-attrs
  #{:block/uuid
    :block/parent
    :block/page
    :block/title})

(defn- sha256-hex
  [strings]
  (let [hasher (new crypt/Sha256)]
    (doseq [item strings]
      (.update hasher (crypt/stringToUtf8ByteArray item))
      (.update hasher (crypt/stringToUtf8ByteArray "\n")))
    (crypt/byteArrayToHex (.digest hasher))))

(def ^:private initial-checksum
  (sha256-hex ["logseq/db-sync/tx-chain-v1"]))

(defn next-checksum
  [prev-checksum tx-data]
  (let [base (or prev-checksum initial-checksum)
        tx-str (ldb/write-transit-str tx-data)]
    (sha256-hex [base tx-str])))

(defn initial-chain-checksum
  []
  initial-checksum)

(defn filter-tx-data
  [{:keys [db-after db-before tx-data]}]
  (->> tx-data
       (keep
        (fn [[e a v _t added]]
          (when (contains? default-checksum-attrs a)
            (let [op (if added :db/add :db/retract)
                  e' (or (eid->lookup db-before e)
                         (eid->lookup db-after e))
                  v' (if (and (integer? v)
                              (pos? v)
                              (or (= :db.type/ref (:db/valueType (d/entity db-after a)))
                                  (= :db.type/ref (:db/valueType (d/entity db-before a)))))
                       (or (eid->lookup db-before v) (eid->lookup db-after v))
                       v)]
              [op e' a v']))))
       sort
       vec))
