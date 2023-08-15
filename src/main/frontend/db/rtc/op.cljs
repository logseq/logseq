(ns frontend.db.rtc.op
  (:require [malli.core :as m]
            [frontend.db.rtc.ops-idb-store :as op-store]
            [promesa.core :as p]))

(def op-schema
  [:or
   [:catn
    [:op [:= "move"]]
    [:value [:map [:block-uuids [:sequential :string]]]]]
   [:catn
    [:op [:= "remove"]]
    [:value [:map [:block-uuids [:sequential :string]]]]]
   [:catn
    [:op [:= "update"]]
    [:value [:map [:block-uuid :string]]]]])

(def op-validator (m/validator op-schema))

(defn <move-blocks-op!
  [repo block-uuids]
  (let [op ["move" {:block-uuids (mapv str block-uuids)}]]
    (assert (op-validator op) op)
    (op-store/<add-op! repo op)))

(defn <remove-blocks-op!
  [repo block-uuids]
  (let [op ["remove" {:block-uuids (mapv str block-uuids)}]]
    (assert (op-validator op) "illegal op")
    (op-store/<add-op! repo op)))

(defn <update-block-op!
  [repo block-uuid]
  (let [op ["update" {:block-uuid (str block-uuid)}]]
    (assert (op-validator op) op)
    (op-store/<add-op! repo op)))

(defn <get-ops&local-tx
  [repo]
  (p/let [all-data (op-store/<get-all-ops repo)]
    (let [all-data-m (into {} all-data)
          local-tx (get all-data-m "local-tx")
          ops (->> all-data
                   (filter (comp number? first))
                   (sort-by first <))]
      {:ops ops :local-tx local-tx})))

(defn <clean-ops
  [repo keys]
  (op-store/<clear-ops! repo keys))
