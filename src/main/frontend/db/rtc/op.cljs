(ns frontend.db.rtc.op
  (:require [malli.core :as m]
            [frontend.db.rtc.ops-idb-store :as op-store]
            [promesa.core :as p]
            [malli.transform :as mt]))

(def op-schema
  [:multi {:dispatch first}
   ["move"
    [:catn
     [:op :string]
     [:value [:map [:block-uuids [:sequential :string]]]]]]
   ["remove"
    [:catn
     [:op :string]
     [:value [:map [:block-uuids [:sequential :string]]]]]]
   ["update"
    [:catn
     [:op :string]
     [:value [:map
              [:block-uuid :string]
              [:updated-attrs {:optional true}
               [:map {:closed true}
                [:schema {:optional true} :nil]
                [:content {:optional true} :nil]
                [:alias {:optional true} [:map
                                          [:add {:optional true} [:set :uuid]]
                                          [:retract {:optional true} [:set :uuid]]]]
                [:type {:optional true} [:map
                                         [:add {:optional true} [:set :string]]
                                         [:retract {:optional true} [:set :string]]]]]]]]]]
   ["update-page"
    [:catn
     [:op :string]
     [:value [:map [:block-uuid :string]]]]]
   ["remove-page"
    [:catn
     [:op :string]
     [:value [:map [:block-uuid :string]]]]]])
(def ops-schema [:sequential op-schema])

(def ops-from-store-schema [:sequential [:catn
                                         [:epoch :int]
                                         [:op op-schema]]])

(def ops-from-store-decoder (m/decoder ops-from-store-schema mt/json-transformer))
(def ops-from-store-validator (m/validator ops-from-store-schema))
(def ops-coercer (m/coercer ops-schema mt/json-transformer))
(def ops-encoder (m/encoder ops-schema mt/json-transformer))

(defn <add-ops!
  [repo ops]
  (let [ops (ops-coercer ops)]
    (op-store/<add-ops! repo (ops-encoder ops))))

(defn <get-ops&local-tx
  [repo]
  (p/let [all-data (op-store/<get-all-ops repo)]
    (let [all-data-m (into {} all-data)
          local-tx (get all-data-m "local-tx")
          ops (->> all-data
                   (filter (comp number? first))
                   (sort-by first <)
                   ops-from-store-decoder)]
      (assert (ops-from-store-validator ops) ops)
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
