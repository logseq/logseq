(ns frontend.db.rtc.const
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
                                  ]]])

(def general-attr-set
  (into #{} (map first) general-attrs-schema-coll))

(def data-from-ws-schema
  [:map {:closed true}
   [:req-id :string]
   [:t {:optional true} :int]
   [:affected-blocks {:optional true}
    [:map-of :string
     [:multi {:dispatch :op :decode/string #(update % :op keyword)}
      [:move
       (apply conj
              [:map {:closed true}
               [:op :keyword]
               [:self :string]
               [:parents [:sequential :string]]
               [:left :string]
               [:content {:optional true} :string]]
              general-attrs-schema-coll)]
      [:remove
       [:map {:closed true}
        [:op :keyword]
        [:block-uuid :string]]]
      [:update-attrs
       (apply conj
              [:map {:closed true}
               [:op :keyword]
               [:self :string]
               [:parents {:optional true} [:sequential :string]]
               [:left {:optional true} :string]
               [:content {:optional true} :string]]
              general-attrs-schema-coll)]
      [:update-page
       (apply conj
              [:map {:closed true}
               [:op :keyword]
               [:self :string]
               [:page-name :string]]
              general-attrs-schema-coll)]
      [:remove-page
       [:map {:closed true}
        [:op :keyword]
        [:block-uuid :string]]]]]]])
(def data-from-ws-decoder (m/decoder data-from-ws-schema mt/string-transformer))
(def data-from-ws-validator (m/validator data-from-ws-schema))



(def block-type-schema [:enum "property" "class" "whiteboard" "object" "hidden"])
(def op-schema
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
                                     [:retract {:optional true} [:set :uuid]]]]]]]
   [:update-page
    [:cat :keyword
     [:map
      [:block-uuid :uuid]
      [:page-name :string]]]]
   [:remove-page
    [:cat :keyword
     [:map
      [:block-uuid :uuid]]]]])

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
      [:ops [:sequential op-schema]]
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
      [:target-user-uuids [:sequential :uuid]]]]]))
(def data-to-ws-decoder (m/decoder data-to-ws-schema mt/string-transformer))
(def data-to-ws-encoder (m/encoder data-to-ws-schema mt/string-transformer))
(def data-to-ws-validator (m/validator data-to-ws-schema))
