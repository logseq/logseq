(ns logseq.graph-parser.schema.mldoc
  "Malli schema for mldoc AST")

(defn- field-optional-and-maybe-nil
  [k v]
  [k {:optional true} [:maybe v]])

(def pos-schema
  [:map
   [:start_pos :int]
   [:end_pos :int]])

(def nested-link-schema
  [:schema {:registry {::nested-link
                       [:map
                        [:content :string]
                        [:children [:sequential [:or
                                                 [:tuple [:= "Label"] :string]
                                                 [:tuple [:= "Nested_link"] [:ref ::nested-link]]]]]]}}
   ::nested-link])

(def timestamp-schema
  [:map
   [:date [:map
           [:year :int]
           [:month :int]
           [:day :int]]]
   [:wday :string]
   (field-optional-and-maybe-nil
    :time [:map
           [:hour :int]
           [:min :int]])
   (field-optional-and-maybe-nil
    :repetition
    :any)
   [:active :boolean]])

(def ^:private time-range-schema
  [:map
   [:start [:ref ::timestamp]]
   [:stop [:ref ::timestamp]]])

(def ^:private link-schema
  [:map
   [:url [:or
          [:cat [:= "File"] :string]
          [:cat [:= "Search"] :string]
          [:cat [:= "Complex"] [:map
                                [:protocol :string]
                                [:link :string]]]
          [:cat [:= "Page_ref"] :string]
          [:cat [:= "Block_ref"] :string]
          [:cat [:= "Embed_data"] :string]]]
   [:label [:sequential [:ref ::inline]]]
   (field-optional-and-maybe-nil :title :string)
   [:full_text :string]
   [:metadata :string]])

(def latex-fragment-schema
  [:or
   [:tuple [:= "Inline"] :string]
   [:tuple [:= "Displayed"] :string]])

(def inline-ast-schema
  [:schema {:registry {::timestamp timestamp-schema
                       ::time-range time-range-schema
                       ::link link-schema
                       ::inline
                       [:or
                        [:tuple [:= "Emphasis"]
                         [:tuple
                          [:tuple [:enum "Italic" "Bold" "Underline" "Strike_through" "Highlight"]]
                          [:sequential [:ref ::inline]]]]

                        [:tuple [:= "Break_Line"]]
                        [:tuple [:= "Hard_Break_Line"]]
                        [:tuple [:= "Verbatim"] :string]
                        [:tuple [:= "Code"] :string]
                        [:tuple [:= "Tag"] [:sequential [:ref ::inline]]]
                        [:tuple [:= "Spaces"] :string]
                        [:tuple [:= "Plain"] :string]
                        [:tuple [:= "Link"] [:ref ::link]]
                        [:tuple [:= "Nested_link"] nested-link-schema]
                        [:tuple [:= "Target"] :string]
                        [:tuple [:= "Subscript"] [:sequential [:ref ::inline]]]
                        [:tuple [:= "Superscript"] [:sequential [:ref ::inline]]]
                        [:tuple [:= "Footnote_Reference"] [:map
                                                           [:id :int]
                                                           [:name :string]
                                                           (field-optional-and-maybe-nil
                                                            :definition  [:sequential [:ref ::inline]])]]
                        [:tuple [:= "Cookie"] [:or
                                               [:tuple [:= "Percent"] :int]
                                               [:catn [:label [:= "Absolute"]] [:current :int] [:total :int]]]]
                        [:tuple [:= "Latex_Fragment"] latex-fragment-schema]
                        [:tuple [:= "Macro"] [:map
                                              [:name :string]
                                              [:arguments [:sequential :string]]]]
                        [:tuple [:= "Entity"] [:map
                                               [:name :string]
                                               [:latex :string]
                                               [:latex_mathp :boolean]
                                               [:html :string]
                                               [:ascii :string]
                                               [:unicode :string]]]
                        [:tuple [:= "Timestamp"] [:or
                                                  [:tuple [:= "Scheduled"] [:ref ::timestamp]]
                                                  [:tuple [:= "Deadline"] [:ref ::timestamp]]
                                                  [:tuple [:= "Date"] [:ref ::timestamp]]
                                                  [:tuple [:= "Closed"] [:ref ::timestamp]]
                                                  [:tuple [:= "Clock"] [:or
                                                                        [:tuple [:= "Started"] [:ref ::timestamp]]
                                                                        [:tuple [:= "Stopped"] [:ref ::time-range]]]]
                                                  [:tuple [:= "Range"] [:ref ::time-range]]]]
                        [:tuple [:= "Radio_Target"] :string]
                        [:tuple [:= "Export_Snippet"] :string :string]
                        [:tuple [:= "Inline_Source_Block"] [:map
                                                            [:language :string]
                                                            [:options :string]
                                                            [:code :string]]]
                        [:tuple [:= "Email"] [:map
                                              [:local_part :string]
                                              [:domain :string]]]
                        [:tuple [:= "Inline_Hiccup"] :string]
                        [:tuple [:= "Inline_Html"] :string]]}}
   ::inline])

(def ^:private list-item-schema
  [:map
   [:content [:sequential [:ref ::block]]]
   [:items [:sequential [:ref ::list-item]]]
   (field-optional-and-maybe-nil
    :number :int)
   [:name [:sequential [:ref ::inline]]]
   (field-optional-and-maybe-nil
    :checkbox :boolean)
   [:indent :int]
   [:ordered :boolean]])

(def ^:private heading-schema
  [:map
   [:title [:sequential [:ref ::inline]]]
   [:tags [:sequential :string]]
   (field-optional-and-maybe-nil
    :marker :string)
   [:level :int]
   (field-optional-and-maybe-nil
    :numbering [:sequential :int])
   (field-optional-and-maybe-nil
    :priority :string)
   [:anchor :string]
   [:meta :map]
   (field-optional-and-maybe-nil
    :size :int)])

(def block-ast-schema
  [:schema {:registry {::inline inline-ast-schema
                       ::list-item list-item-schema
                       ::block
                       [:or
                        [:tuple [:= "Paragraph"] [:sequential [:ref ::inline]]]
                        [:tuple [:= "Paragraph_Sep"] :int]
                        [:tuple [:= "Heading"] heading-schema]
                        [:tuple [:= "List"] [:sequential [:ref ::list-item]]]
                        [:tuple [:= "Directive"] :string :string]
                        [:tuple [:= "Results"]]
                        [:tuple [:= "Example"] [:sequential :string]]
                        [:tuple [:= "Src"] [:map
                                            [:lines [:sequential :string]]
                                            (field-optional-and-maybe-nil
                                             :language :string)
                                            (field-optional-and-maybe-nil
                                             :options [:sequential :string])
                                            [:pos_meta pos-schema]]]
                        [:tuple [:= "Quote"] [:sequential [:ref ::block]]]
                        [:catn
                         [:label [:= "Export"]]
                         [:type :string]
                         [:options [:maybe [:sequential :string]]]
                         [:content :string]]
                        [:tuple [:= "CommentBlock"] [:sequential :string]]
                        [:catn
                         [:label [:= "Custom"]]
                         [:type :string]
                         [:options [:maybe :string]]
                         [:result [:sequential [:ref ::block]]]
                         [:content :string]]
                        [:tuple [:= "Latex_Fragment"] latex-fragment-schema]
                        [:catn
                         [:label [:= "Latex_Environment"]]
                         [:name :string]
                         [:options [:maybe :string]]
                         [:content :string]]
                        [:tuple [:= "Displayed_Math"] :string]
                        [:tuple [:= "Drawer"] :string [:sequential :string]]
                        [:tuple [:= "Property_Drawer"]
                         [:sequential
                          [:catn [:k :string] [:v :string] [:other-info [:sequential [:ref ::inline]]]]]]
                        [:tuple [:= "Footnote_Definition"] :string [:sequential [:ref ::inline]]]
                        [:tuple [:= "Horizontal_Rule"]]
                        [:tuple [:= "Table"]
                         [:map
                          (field-optional-and-maybe-nil
                           :header [:sequential [:sequential [:ref ::inline]]])
                          [:groups [:sequential [:sequential [:sequential [:sequential [:ref ::inline]]]]]]
                          [:col_groups [:sequential :int]]]]
                        [:tuple [:= "Comment"] :string]
                        [:tuple [:= "Raw_Html"] :string]
                        [:tuple [:= "Hiccup"] :string]

                        ;; this block type is not from mldoc,
                        ;; but from `logseq.graph-parser.mldoc/collect-page-properties`
                        [:tuple [:= "Properties"] [:sequential :any]]]}}
   ::block])

(def block-ast-with-pos-coll-schema
  [:sequential [:cat block-ast-schema [:maybe pos-schema]]])

(def block-ast-coll-schema
  [:sequential block-ast-schema])
