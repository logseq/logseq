(ns frontend.worker.rtc.const
  "RTC constants/schema"
  (:require [malli.util :as mu]
            [malli.core :as m]
            [malli.transform :as mt]))


(def general-attrs-schema-coll
  [[:updated-at {:optional true} :int]
   [:created-at {:optional true} :int]
   [:alias {:optional true} [:maybe [:sequential :uuid]]]
   [:type {:optional true} [:maybe [:sequential :string]]]
   [:schema {:optional true} [:maybe :string]]
   [:tags {:optional true} [:maybe [:sequential :uuid]]]
   [:properties {:optional true} [:maybe :string ; transit-json-string
                                  ]]
   [:link {:optional true} [:maybe :uuid]]
   [:journal-day {:optional true} [:maybe :int]]])

(def general-attr-set
  (into #{} (map first) general-attrs-schema-coll))

(def block-type-schema [:enum "property" "class" "whiteboard" "hidden" "closed value"])

(def to-ws-op-schema
  [:multi {:dispatch first :decode/string #(update % 0 keyword)}
   [:move
    [:cat :keyword
     [:map
      [:block-uuid :uuid]
      [:target-uuid :uuid]
      [:sibling? :boolean]]]]
   [:remove
    [:cat :keyword
     [:map
      [:block-uuids [:sequential :uuid]]]]]

   [:update
    [:cat :keyword
     [:map
      [:block-uuid :uuid]
      [:target-uuid {:optional true} :uuid]
      [:sibling? {:optional true} :boolean]
      [:content {:optional true} :string]
      [:updated-at {:optional true} :int]
      [:created-at {:optional true} :int]
      [:tags {:optional true} [:map
                               [:add {:optional true} [:maybe [:set :uuid]]]
                               [:retract {:optional true} [:maybe [:set :uuid]]]]]
      [:alias {:optional true} [:map
                                [:add {:optional true} [:maybe [:set :uuid]]]
                                [:retract {:optional true} [:maybe [:set :uuid]]]]]
      [:type {:optional true} [:map
                               [:add {:optional true} [:maybe [:set block-type-schema]]]
                               [:retract {:optional true} [:maybe [:set block-type-schema]]]]]
      [:schema {:optional true} :string ;transit-string
       ]
      [:properties {:optional true} [:map
                                     [:add {:optional true} [:sequential [:cat :uuid :string ;; transit-string
                                                                          ]]]
                                     [:retract {:optional true} [:set :uuid]]]]
      [:link {:optional true} :uuid]
      [:journal-day {:optional true} :int]]]]
   [:update-page
    [:cat :keyword
     [:map
      [:block-uuid :uuid]
      [:page-name :string]
      [:original-name :string]]]]
   [:remove-page
    [:cat :keyword
     [:map
      [:block-uuid :uuid]]]]])

(def to-ws-ops-validator (m/validator [:sequential to-ws-op-schema]))
(def to-ws-ops-decoder (m/decoder [:sequential to-ws-op-schema] mt/string-transformer))

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
       (apply conj
              [:map {:closed true}
               [:op :keyword]
               [:self :uuid]
               [:parents [:sequential :uuid]]
               [:left :uuid]
               [:content {:optional true} :string]]
              general-attrs-schema-coll)]
      [:remove
       [:map {:closed true}
        [:op :keyword]
        [:block-uuid :uuid]]]
      [:update-attrs
       (apply conj
              [:map {:closed true}
               [:op :keyword]
               [:self :uuid]
               [:parents {:optional true} [:sequential :uuid]]
               [:left {:optional true} :uuid]
               [:content {:optional true} :string]]
              general-attrs-schema-coll)]
      [:update-page
       (apply conj
              [:map {:closed true}
               [:op :keyword]
               [:self :uuid]
               [:page-name :string]
               [:original-name :string]]
              general-attrs-schema-coll)]
      [:remove-page
       [:map {:closed true}
        [:op :keyword]
        [:block-uuid :uuid]]]]]]
   [:ex-data {:optional true} [:map [:type :keyword]]]
   [:ex-message {:optional true} :any]])

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
    ["full-download-graph"
     [:map
      [:req-id :string]
      [:action :string]
      [:graph-uuid :string]]]
    ["full-upload-graph"
     [:map
      [:req-id :string]
      [:action :string]
      [:s3-key :string]]]
    ["grant-access"
     [:map
      [:req-id :string]
      [:action :string]
      [:graph-uuid :uuid]
      [:target-user-uuids {:optional true} [:sequential :uuid]]
      [:target-user-emails {:optional true} [:sequential :string]]]]
    ["query-block-content-versions"
     [:map
      [:req-id :string]
      [:action :string]
      [:graph-uuid :string]
      [:block-uuids [:sequential :uuid]]]]
    ["query-blocks"
     [:map
      [:req-id :string]
      [:action :string]
      [:graph-uuid :uuid]
      [:block-uuids [:sequential :uuid]]]]
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
