(ns frontend.components.block.positioned-properties-test
  (:require ["react" :as react]
            ["react-dom/server" :as react-dom-server]
            [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
            [frontend.components.block :as block]
            [frontend.components.property :as property-component]
            [frontend.components.property.value :as property-value]
            [frontend.db.hooks :as db-hooks]
            [goog.object :as gobj]
            [logseq.shui.hooks :as hooks]))

(defn- render-static
  [element]
  (let [previous-react (gobj/get js/globalThis "React")]
    (gobj/set js/globalThis "React" react)
    (try
      (.renderToStaticMarkup react-dom-server element)
      (finally
        (if (some? previous-react)
          (gobj/set js/globalThis "React" previous-react)
          (js-delete js/globalThis "React"))))))

(defn- render-block-below
  [block properties property-by-uuid]
  (with-redefs [property-component/use-has-hidden-properties (constantly false)
                db-hooks/use-blocks (fn [property-uuids]
                                      (mapv property-by-uuid property-uuids))
                db-hooks/use-block (fn [property-uuid]
                                     (property-by-uuid property-uuid))
                property-component/property-key-cp (fn [_block property _opts]
                                                     [:span.property-key (:block/title property)])
                property-value/property-value (fn [_block property _opts]
                                                [:span.property-value (:db/ident property)])
                hooks/use-ref (fn [_] #js {:current nil})
                hooks/use-memo (fn [f _deps] (f))
                hooks/use-atom (fn [a] [@a (fn [_])])
                hooks/use-state (fn [init] [init (fn [_])])
                hooks/use-effect! (fn [_f _deps] nil)]
    (render-static
     (block/block-positioned-properties
      {}
      (assoc block :block.temp/positioned-properties {:block-below properties})
      :block-below))))

(deftest hidden-block-below-property-skips-icon
  (testing "icon is never a visible block-below pill"
    (is (true? (#'block/hidden-block-below-property? :logseq.property/icon)))
    (is (true? (#'block/hidden-block-below-property? {:db/ident :logseq.property/icon})))
    (is (false? (#'block/hidden-block-below-property? {:db/ident :logseq.property/scheduled}))))
  (testing "icon-only lists collapse to no visible pills"
    (is (= []
           (#'block/visible-block-below-property-uuids
            [{:db/ident :logseq.property/icon}
             :logseq.property/icon])))
    (is (= [{:db/ident :logseq.property/scheduled}]
           (#'block/visible-block-below-property-uuids
            [{:db/ident :logseq.property/icon}
             {:db/ident :logseq.property/scheduled}]))))
  (testing "empty pill lists still render when another bottom control is present"
    (is (false? (#'block/show-block-below-properties-row? [] {})))
    (is (true? (#'block/show-block-below-properties-row?
                []
                {:show-add-property-button? true})))
    (is (true? (#'block/show-block-below-properties-row?
                [:logseq.property/scheduled]
                {})))))

(deftest icon-only-block-does-not-emit-bottom-properties-row
  (let [icon-uuid #uuid "11111111-1111-1111-1111-111111111111"
        block-uuid #uuid "22222222-2222-2222-2222-222222222222"
        icon-property {:block/uuid icon-uuid
                       :db/ident :logseq.property/icon
                       :block/title "Icon"
                       :logseq.property/type :map}
        markup (render-block-below
                {:block/uuid block-uuid
                 :block/title "icon block"}
                [icon-uuid]
                {icon-uuid icon-property})]
    (is (not (string/includes? markup "bottom-properties-row"))
        "An icon-only block must not emit a focusable bottom-properties row")
    (is (not (string/includes? markup "data-bottom-properties-row"))
        "An icon-only block is not a keyboard navigation stop")))

(deftest icon-map-block-does-not-emit-bottom-properties-row
  (let [icon-uuid #uuid "33333333-3333-3333-3333-333333333333"
        block-uuid #uuid "44444444-4444-4444-4444-444444444444"
        icon-property {:block/uuid icon-uuid
                       :db/ident :logseq.property/icon
                       :block/title "Icon"
                       :logseq.property/type :map}
        markup (render-block-below
                {:block/uuid block-uuid
                 :block/title "icon block"}
                [icon-property]
                {icon-uuid icon-property})]
    (is (not (string/includes? markup "bottom-properties-row"))
        "Icon property maps are filtered before the bottom row mounts")))

(deftest scheduled-block-below-property-still-renders
  (let [scheduled-uuid #uuid "55555555-5555-5555-5555-555555555555"
        icon-uuid #uuid "66666666-6666-6666-6666-666666666666"
        block-uuid #uuid "77777777-7777-7777-7777-777777777777"
        scheduled-property {:block/uuid scheduled-uuid
                            :db/ident :logseq.property/scheduled
                            :block/title "Scheduled"
                            :logseq.property/type :datetime}
        icon-property {:block/uuid icon-uuid
                       :db/ident :logseq.property/icon
                       :block/title "Icon"
                       :logseq.property/type :map}
        markup (render-block-below
                {:block/uuid block-uuid
                 :block/title "dated block"}
                [icon-uuid scheduled-uuid]
                {icon-uuid icon-property
                 scheduled-uuid scheduled-property})]
    (is (string/includes? markup "bottom-properties-row")
        "Real block-below properties still mount a bottom-properties row")
    (is (string/includes? markup (str "data-bottom-properties-row=\"" block-uuid "\""))
        "The row is owned by the current block uuid")
    (is (string/includes? markup "Scheduled")
        "The scheduled pill is visible")
    (is (not (string/includes? markup "Icon"))
        "Icon is not rendered as a bottom pill")))
