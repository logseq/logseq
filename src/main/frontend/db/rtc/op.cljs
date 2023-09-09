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
    [:value [:map [:block-uuid :string]]]]
   [:catn
    [:op [:= "update-page"]]
    [:value [:map [:block-uuid :string]]]]
   [:catn
    [:op [:= "remove-page"]]
    [:value [:map [:block-uuid :string]]]]])

(def op-validator (m/validator op-schema))

(defn <add-ops!
  [repo ops]
  (assert (every? op-validator ops) ops)
  (op-store/<add-ops! repo ops))

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


(defn <update-local-tx!
  [repo t]
  {:pre [(pos-int? t)]}
  (op-store/<update-local-tx! repo t))

(defn <update-graph-uuid!
  [repo graph-uuid]
  {:pre [(some? graph-uuid)]}
  (op-store/<update-graph-uuid! repo graph-uuid))

(defn <get-graph-uuid
  [repo]
  (op-store/<get-graph-uuid repo))

(defn <get-local-tx
  [repo]
  (op-store/<get-local-tx repo))
