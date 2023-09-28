(ns frontend.db.rtc.const)


(def general-attrs-schema-coll
  [[:updated-at {:optional true} :int]
   [:created-at {:optional true} :int]
   [:alias {:optional true} [:maybe [:sequential :uuid]]]
   [:type {:optional true} [:maybe [:sequential :string]]]
   [:schema {:optional true} [:maybe [:map {:closed false}]]]
   [:tags {:optional true} [:maybe [:sequential :uuid]]]])

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
