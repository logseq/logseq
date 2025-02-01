(ns frontend.worker.rtc.malli-schema
  "Malli schema for rtc"
  (:require [logseq.db.frontend.malli-schema :as db-malli-schema]
            [malli.core :as m]
            [malli.transform :as mt]
            [malli.util :as mu]))

(def block-pos-schema
  [:catn
   [:parent-uuid [:maybe :uuid]]
   [:order [:maybe db-malli-schema/block-order]]])

(def av-schema
  [:cat
   :keyword
   [:or
    :uuid   ;; reference type
    :string ;; all other type value convert to string by transit
    ]
   :int     ;; t
   :boolean ;; add(true) or retract
   ])

(def to-ws-op-schema
  [:multi {:dispatch first :decode/string #(update % 0 keyword)}
   [:move
    [:cat :keyword
     [:map
      [:block-uuid :uuid]
      [:pos block-pos-schema]]]]
   [:remove
    [:cat :keyword
     [:map
      [:block-uuids [:sequential :uuid]]]]]
   [:update-page
    [:cat :keyword
     [:map
      [:block-uuid :uuid]
      [:page-name :string]
      [:block/title :string]]]]
   [:remove-page
    [:cat :keyword
     [:map
      [:block-uuid :uuid]]]]
   [:update
    [:cat :keyword
     [:map
      [:block-uuid :uuid]
      [:db/ident {:optional true} :keyword]
      [:pos block-pos-schema]
      [:av-coll [:sequential av-schema]]
      [:card-one-attrs {:optional true} [:sequential :keyword]]]]]
   [:update-schema
    [:cat :keyword
     [:map
      [:block-uuid :uuid]
      [:db/ident :keyword]
      [:db/valueType :keyword]
      [:db/cardinality {:optional true} :keyword]
      [:db/index {:optional true} :boolean]]]]])

(comment
  (def to-ws-ops-validator (m/validator [:sequential to-ws-op-schema])))

(def to-ws-ops-decoder (m/decoder [:sequential to-ws-op-schema] mt/string-transformer))

(def ^:private extra-attr-map-schema
  [:map-of
   :keyword
   [:or
    [:or :uuid :string]
    [:sequential [:or :uuid :string]]]])

(def data-from-ws-schema
  "TODO: split this mix schema to multiple ones"
  [:map
   [:req-id :string]
   [:profile {:optional true} :map]
   [:t {:optional true} :int]
   [:t-before {:optional true} :int]
   [:failed-ops {:optional true} [:sequential to-ws-op-schema]]
   [:s3-presign-url {:optional true} :string]
   [:server-schema-version {:optional true} :int]
   [:server-builtin-db-idents {:optional true} [:set :keyword]]
   [:server-only-db-ident-blocks {:optional true} [:maybe :string] ;;transit
    ]
   [:users {:optional true} [:sequential
                             [:map {:closed true}
                              [:user/uuid :uuid]
                              [:user/name :string]
                              [:user/email :string]
                              [:user/online? :boolean]
                              [:user/avatar {:optional true} :string]
                              [:graph<->user/user-type :keyword]]]]
   [:online-users {:optional true} [:sequential
                                    [:map {:closed true}
                                     [:user/uuid :uuid]
                                     [:user/name :string]
                                     [:user/email :string]
                                     [:user/avatar {:optional true} :string]]]]
   [:refed-blocks {:optional true}
    [:maybe
     [:sequential
      [:map
       [:block/uuid :uuid]
       [:db/ident {:optional true} :keyword]
       [:block/order {:optional true} db-malli-schema/block-order]
       [:block/parent {:optional true} :uuid]
       [::m/default extra-attr-map-schema]]]]]
   [:affected-blocks {:optional true}
    [:map-of :uuid
     [:multi {:dispatch :op :decode/string #(update % :op keyword)}
      [:move
       [:map {:closed true}
        [:op :keyword]
        [:self :uuid]
        [:parents [:sequential :uuid]]
        [:block/order {:optional true} db-malli-schema/block-order]
        [:hash {:optional true} :int]
        [:db/ident {:optional true} :keyword]]]
      [:remove
       [:map
        [:op :keyword]
        [:block-uuid :uuid]]]
      [:update-attrs
       [:map
        [:op :keyword]
        [:self :uuid]
        [:parents {:optional true} [:sequential :uuid]]
        [:block/order {:optional true} db-malli-schema/block-order]
        [:hash {:optional true} :int]
        [:db/ident {:optional true} :keyword]
        [::m/default extra-attr-map-schema]]]
      [:move+update-attrs
       [:map
        [:op :keyword]
        [:self :uuid]
        [:parents {:optional true} [:sequential :uuid]]
        [:block/order {:optional true} db-malli-schema/block-order]
        [:hash {:optional true} :int]
        [:db/ident {:optional true} :keyword]
        [::m/default extra-attr-map-schema]]]
      [:update-page
       [:map
        [:op :keyword]
        [:self :uuid]
        [:block/title :string]
        [:db/ident {:optional true} :keyword]
        [:block/order {:optional true} db-malli-schema/block-order]
        [::m/default extra-attr-map-schema]]]
      [:remove-page
       [:map
        [:op :keyword]
        [:block-uuid :uuid]]]]]]
   [:asset-uuid->url {:optional true} [:map-of :uuid :string]]
   [:uploaded-assets {:optional true} [:map-of :uuid :map]]
   [:ex-data {:optional true} [:map [:type :keyword]]]
   [:ex-message {:optional true} :string]])

(def data-from-ws-coercer (m/coercer data-from-ws-schema mt/string-transformer))
(def data-from-ws-validator (m/validator data-from-ws-schema))

(defn- with-shared-schema-attrs
  [malli-schema]
  (let [[head api-schema-seq] (split-at 2 malli-schema)]
    (vec
     (concat
      head
      (map
       (fn [api-schema]
         (let [[api-name [type']] api-schema]
           (if (= :map type')
             [api-name (vec (concat (second api-schema) [[:req-id :string]
                                                         [:action :string]
                                                         [:profile {:optional true} :boolean]]))]
             api-schema)))
       api-schema-seq)))))

(def ^:large-vars/data-var data-to-ws-schema
  (mu/closed-schema
   (with-shared-schema-attrs
     [:multi {:dispatch :action}
      ["list-graphs"
       [:map]]
      ["register-graph-updates"
       [:map
        [:graph-uuid :string]]]
      ["apply-ops"
       [:or
        [:map
         [:req-id :string]
         [:action :string]
         [:profile {:optional true} :boolean]
         [:graph-uuid :string]
         [:ops [:sequential to-ws-op-schema]]
         [:t-before :int]]
        [:map
         [:req-id :string]
         [:action :string]
         [:profile {:optional true} :boolean]
         [:s3-key :string]]]]
      ["presign-put-temp-s3-obj"
       [:map]]
      ["upload-graph"
       [:map
        [:s3-key :string]
        [:graph-name :string]]]
      ["download-graph"
       [:map
        [:graph-uuid :string]]]
      ["download-info-list"
       [:map
        [:graph-uuid :string]]]
      ["snapshot-list"
       [:map
        [:graph-uuid :string]]]
      ["snapshot-graph"
       [:map
        [:graph-uuid :string]]]
      ["grant-access"
       [:map
        [:graph-uuid :uuid]
        [:target-user-uuids {:optional true} [:sequential :uuid]]
        [:target-user-emails {:optional true} [:sequential :string]]]]
      ["get-users-info"
       [:map
        [:graph-uuid :uuid]]]
      ["inject-users-info"
       [:map
        [:graph-uuid :uuid]]]
      ["delete-graph"
       [:map
        [:graph-uuid :uuid]]]
      ["query-block-content-versions"
       [:map
        [:graph-uuid :string]
        [:block-uuids [:sequential :uuid]]]]
      ["calibrate-graph-skeleton"
       [:map
        [:graph-uuid :string]
        [:t :int]
        [:schema-version :int]
        [:db-ident-blocks [:sequential
                           [:map
                            [:db/ident :keyword]
                            [::m/default extra-attr-map-schema]]]]]]
      ["get-graph-skeleton"
       [:map
        [:graph-uuid :string]]]
      ["get-assets-upload-urls"
       [:map
        [:graph-uuid :string]
        [:asset-uuid->metadata [:map-of :uuid [:map-of :string :string]]]]]
      ["get-assets-download-urls"
       [:map
        [:graph-uuid :string]
        [:asset-uuids [:sequential :uuid]]]]
      ["delete-assets"
       [:map
        [:graph-uuid :string]
        [:asset-uuids [:sequential :uuid]]]]
      ["get-user-devices"
       [:map]]
      ["add-user-device"
       [:map
        [:device-name :string]]]
      ["remove-user-device"
       [:map
        [:device-uuid :uuid]]]
      ["update-user-device-name"
       [:map
        [:device-uuid :uuid]
        [:device-name :string]]]
      ["add-device-public-key"
       [:map
        [:device-uuid :uuid]
        [:key-name :string]
        [:public-key :string]]]
      ["remove-device-public-key"
       [:map
        [:device-uuid :uuid]
        [:key-name :string]]]
      ["sync-encrypted-aes-key"
       [:map
        [:device-uuid->encrypted-aes-key [:map-of :uuid :string]]
        [:graph-uuid :uuid]]]])))

(def data-to-ws-encoder (m/encoder data-to-ws-schema (mt/transformer
                                                      mt/string-transformer
                                                      (mt/key-transformer {:encode m/-keyword->string}))))
(def data-to-ws-coercer (m/coercer data-to-ws-schema mt/string-transformer nil
                                   #(do
                                      (prn ::data-to-ws-schema %)
                                      (m/-fail! ::data-to-ws-schema %))))
