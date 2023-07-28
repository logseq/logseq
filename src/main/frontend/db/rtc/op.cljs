(ns frontend.db.rtc.op
  (:require [electron.ipc :as ipc]
            [malli.core :as m]
            [cljs.core.async :as async]
            [cljs.core.async.interop :refer [p->c]]
            [frontend.components.select :as select]))

(def op-schema
  [:or
   [:catn
    [:op [:= "move"]]
    [:value [:map
             [:block-uuid :string]
             [:target-uuid :string]
             [:sibling? :boolean]]]]
   [:catn
    [:op [:= "remove"]]
    [:value [:map
             [:block-uuids [:sequential :string]]]]]
   [:catn
    [:op [:= "update"]]
    [:value [:map
             [:block-uuid :string]
             [:content {:optional true} :string]]]]])

(def op-validator (m/validator op-schema))


(defn <move-block-op!
  [repo block-uuid target-uuid sibling?]
  (let [op ["move" {:block-uuid (str block-uuid)
                    :target-uuid (str target-uuid)
                    :sibling? sibling?}]]
    (assert (op-validator op) "illegal op")
    (p->c (ipc/ipc :rtc/add-ops repo (pr-str op)))))

(defn <remove-blocks-op!
  [repo block-uuids]
  (let [op ["remove" {:block-uuids (mapv str block-uuids)}]]
    (assert (op-validator op) "illegal op")
    (p->c (ipc/ipc :rtc/add-ops repo (pr-str op)))))

(defn <update-block-op!
  [repo block-uuid attrs-map]
  (let [op ["update" (merge {:block-uuid (str block-uuid)}
                            (select-keys attrs-map [:content]))]]
    (assert (op-validator op) "illegal op")
    (p->c (ipc/ipc :rtc/add-ops repo (pr-str op)))))

(defn <get-ops&local-tx
  [repo]
  (p->c (ipc/ipc :rtc/get-ops&local-tx repo)))

(defn <clean-ops
  [repo]
  (p->c (ipc/ipc :rtc/clean-ops repo)))

(defn <init
  [repo]
  (p->c (ipc/ipc :rtc/init repo)))
