(ns frontend.worker.rtc.const
  "RTC constants/schema"
  (:require [malli.util :as mu]
            [malli.core :as m]
            [malli.transform :as mt]))

(def general-attrs-schema-coll
  [[:updated-at {:optional true} :int]
   [:created-at {:optional true} :int]
   [:created-by {:optional true} :string]
   [:alias {:optional true} [:maybe [:sequential :uuid]]]
   [:type {:optional true} [:maybe [:sequential :string]]]
   [:schema {:optional true} [:maybe :string]]
   [:tags {:optional true} [:maybe [:sequential :uuid]]]
   [:properties {:optional true} [:maybe :string ; transit-json-string
                                  ]]
   [:link {:optional true} [:maybe :uuid]]
   [:journal-day {:optional true} [:maybe :int]]
   [:ident {:optional true} [:maybe :string]]])

(def general-attr-set
  (into #{} (map first) general-attrs-schema-coll))

;; (def block-type-schema [:enum "property" "class" "whiteboard" "hidden" "closed value" "macro"])

;; (def block-pos-type-schema
;;   [:enum :sibling :child :no-order])

(def block-pos-schema
  ":sibling:  sibling of target-block(:target-uuid)
  :child: child of target-block(:target-uuid)
  :no-order: this block doesn't have :block/order attr
  :no-parent-sibling: this block doesn't have :block/parent,
                      and it's sibling of target-uuid(if nil, it's the first one)"
  [:catn
   [:target-uuid [:maybe :uuid]]
   [:pos [:enum :sibling :child :no-order :no-parent-sibling]]])

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
      [:original-name :string]]]]
   [:remove-page
    [:cat :keyword
     [:map
      [:block-uuid :uuid]]]]
   [:update
    [:cat :keyword
     [:map
      [:block-uuid :uuid]
      [:pos block-pos-schema]
      [:av-coll [:sequential av-schema]]]]]])

(def to-ws-ops-validator (m/validator [:sequential to-ws-op-schema]))
(def to-ws-ops-decoder (m/decoder [:sequential to-ws-op-schema] mt/string-transformer))

(def ^:private extra-attr-map-schema
  [:map-of
   :keyword
   [:or
    [:or :uuid :string]
    [:sequential [:or :uuid :string]]]])

(def data-from-ws-schema
  [:map
   [:req-id :string]
   [:t {:optional true} :int]
   [:t-before {:optional true} :int]
   [:failed-ops {:optional true} [:sequential to-ws-op-schema]]
   [:s3-presign-url {:optional true} :string]
   [:affected-blocks {:optional true}
    [:map-of :uuid
     [:multi {:dispatch :op :decode/string #(update % :op keyword)}
      [:move
       [:map
        [:op :keyword]
        [:self :uuid]
        [:parents [:sequential :uuid]]
        [:left [:maybe :uuid]]   ;nil when it's :no-order block
        [:hash {:optional true} :int]
        [::m/default extra-attr-map-schema]]]
      [:remove
       [:map
        [:op :keyword]
        [:block-uuid :uuid]]]
      [:update-attrs
       [:map
        [:op :keyword]
        [:self :uuid]
        [:parents {:optional true} [:sequential :uuid]]
        [:left {:optional true} [:maybe :uuid]] ;nil when it's :no-order block
        [:hash {:optional true} :int]
        [::m/default extra-attr-map-schema]]]
      [:update-page
       [:map
        [:op :keyword]
        [:self :uuid]
        [:page-name :string]
        [:block/original-name :string]
        [::m/default extra-attr-map-schema]]]
      [:remove-page
       [:map
        [:op :keyword]
        [:block-uuid :uuid]]]]]]
   [:ex-data {:optional true} [:map [:type :keyword]]]
   [:ex-message {:optional true} :string]])

(def data-from-ws-coercer (m/coercer data-from-ws-schema mt/string-transformer))
(def data-from-ws-validator (m/validator data-from-ws-schema))

(def data-to-ws-schema
  (mu/closed-schema
   [:multi {:dispatch :action}
    ["list-graphs"
     [:map
      [:req-id :string]
      [:action :string]]]
    ["register-graph-updates"
     [:map
      [:req-id :string]
      [:action :string]
      [:graph-uuid :string]]]
    ["apply-ops"
     [:map
      [:req-id :string]
      [:action :string]
      [:graph-uuid :string]
      [:ops [:sequential to-ws-op-schema]]
      [:t-before :int]]]
    ["presign-put-temp-s3-obj"
     [:map
      [:req-id :string]
      [:action :string]]]
    ["upload-graph"
     [:map
      [:req-id :string]
      [:action :string]
      [:s3-key :string]
      [:graph-name :string]]]
    ["download-graph"
     [:map
      [:req-id :string]
      [:action :string]
      [:graph-uuid :string]]]
    ["download-info-list"
     [:map
      [:req-id :string]
      [:action :string]
      [:graph-uuid :string]]]
    ["snapshot-list"
     [:map
      [:req-id :string]
      [:action :string]
      [:graph-uuid :string]]]
    ["snapshot-graph"
     [:map
      [:req-id :string]
      [:action :string]
      [:graph-uuid :string]]]
    ["grant-access"
     [:map
      [:req-id :string]
      [:action :string]
      [:graph-uuid :uuid]
      [:target-user-uuids {:optional true} [:sequential :uuid]]
      [:target-user-emails {:optional true} [:sequential :string]]]]
    ["get-users-info"
     [:map
      [:req-id :string]
      [:action :string]
      [:graph-uuid :uuid]]]
    ["delete-graph"
     [:map
      [:req-id :string]
      [:action :string]
      [:graph-uuid :uuid]]]
    ["query-block-content-versions"
     [:map
      [:req-id :string]
      [:action :string]
      [:graph-uuid :string]
      [:block-uuids [:sequential :uuid]]]]
    ["query-block-tree"
     [:map
      [:req-id :string]
      [:action :string]
      [:graph-uuid :string]
      [:root-block-uuid :uuid]]]
    ["update-assets"
     [:map
      [:req-id :string]
      [:action :string]
      [:graph-uuid :uuid]
      [:create {:optional true} [:sequential
                                 [:map
                                  [:asset-uuid :uuid]
                                  [:asset-name :string]]]]
      [:delete {:optional true} [:sequential :uuid]]]]]))
(def data-to-ws-encoder (m/encoder data-to-ws-schema mt/string-transformer))
(def data-to-ws-coercer (m/coercer data-to-ws-schema mt/string-transformer))
