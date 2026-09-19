(ns frontend.components.block.positioned-properties-test
  (:require ["react" :as react]
            ["react-dom/server" :as react-dom-server]
            [cljs.test :refer [deftest is]]
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
  [block properties property-by-uuid & {:keys [config has-hidden-properties?]
                                        :or {config {} has-hidden-properties? false}}]
  (with-redefs [property-component/use-has-hidden-properties (constantly (boolean has-hidden-properties?))
                property-component/hidden-properties-toggle-button
                (fn [_block opts]
                  [:button.bottom-property-hidden-toggle-btn
                   {:data-bottom-pill (boolean (:bottom-pill? opts))}
                   "Show hidden properties"])
                db-hooks/use-resource-snapshot
                (fn [key]
                  (is false (str "Positioned properties must not load another resource: " key))
                  {:status :loading})
                db-hooks/use-blocks (fn [_] (is false "Property definitions must arrive with the block") nil)
                db-hooks/use-block (fn [_] (is false "First paint must not load another block") nil)
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
      config
      (assoc block :block.temp/positioned-properties
             {:block-below (mapv property-by-uuid properties)})
      :block-below))))

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

(deftest hidden-properties-pill-toggle-only-for-zoom-in-root-test
  (let [root-uuid #uuid "22222222-2222-2222-2222-222222222222"
        child-uuid #uuid "33333333-3333-3333-3333-333333333333"
        root {:block/uuid root-uuid :block/title "zoom-in root"}
        child {:block/uuid child-uuid :block/title "nested block"}
        zoom-in-config {:block? true :id (str root-uuid)}]
    (is (true? (#'block/show-block-below-hidden-properties-pill-toggle?
                zoom-in-config root false true))
        "Zoom-in root shows the hidden-properties pill")
    (is (false? (#'block/show-block-below-hidden-properties-pill-toggle?
                 zoom-in-config child false true))
        "Nested outliner blocks hide the hidden-properties pill")
    (is (false? (#'block/show-block-below-hidden-properties-pill-toggle?
                 {:block? false :id (str root-uuid)}
                 root false true))
        "Page outliner does not use the block hidden-properties pill")
    (is (false? (#'block/show-block-below-hidden-properties-pill-toggle?
                 zoom-in-config root true true))
        "Pages keep the icon control instead of the outliner pill")
    (is (false? (#'block/show-block-below-hidden-properties-pill-toggle?
                 zoom-in-config root false false))
        "No pill when there are no hidden properties")))

(deftest properties-area-suppresses-hidden-toggle-when-pill-renders-test
  (let [scheduled-uuid #uuid "55555555-5555-5555-5555-555555555555"
        root-uuid #uuid "22222222-2222-2222-2222-222222222222"
        child-uuid #uuid "33333333-3333-3333-3333-333333333333"
        scheduled {:block/uuid scheduled-uuid
                   :db/ident :logseq.property/scheduled
                   :block/title "Scheduled"}
        with-block-below (fn [block]
                           (assoc block :block.temp/positioned-properties
                                  {:block-below [scheduled]}))
        root {:block/uuid root-uuid :block/title "zoom-in root"}
        child {:block/uuid child-uuid :block/title "nested block"}
        zoom-in-config {:block? true :id (str root-uuid)}
        owns? property-component/block-below-pill-owns-hidden-toggle?]
    (is (true? (owns? (with-block-below root) zoom-in-config))
        "Zoom-in root with a block-below property shows the pill, so the properties area must not add a second toggle")
    (is (true? (#'block/show-block-below-hidden-properties-pill-toggle?
                zoom-in-config (with-block-below root) false true))
        "The pill really renders whenever the properties area suppresses its toggle")
    (is (false? (owns? root zoom-in-config))
        "Zoom-in root without block-below properties has no pill row, the properties area keeps its toggle")
    (is (false? (owns? (assoc root :block.temp/positioned-properties {}) zoom-in-config))
        "Empty positioned properties keep the properties area toggle")
    (is (false? (owns? (with-block-below child) zoom-in-config))
        "Nested blocks never show the pill, the properties area keeps its toggle")
    (is (false? (owns? (with-block-below root) {:block? false :id (str root-uuid)}))
        "Only the block route root hands the toggle to the pill")
    (is (false? (owns? (assoc (with-block-below root) :block/tags [{:db/ident :logseq.class/Page}]) zoom-in-config))
        "Pages keep the properties area toggle")))

(deftest nested-outliner-block-omits-hidden-properties-pill-test
  (let [scheduled-uuid #uuid "55555555-5555-5555-5555-555555555555"
        root-uuid #uuid "88888888-8888-8888-8888-888888888888"
        child-uuid #uuid "99999999-9999-9999-9999-999999999999"
        scheduled-property {:block/uuid scheduled-uuid
                            :db/ident :logseq.property/scheduled
                            :block/title "Scheduled"
                            :logseq.property/type :datetime}
        zoom-in-config {:block? true :id (str root-uuid)}
        nested-markup (render-block-below
                       {:block/uuid child-uuid
                        :block/title "nested block"}
                       [scheduled-uuid]
                       {scheduled-uuid scheduled-property}
                       :config zoom-in-config
                       :has-hidden-properties? true)
        root-markup (render-block-below
                     {:block/uuid root-uuid
                      :block/title "zoom-in root"}
                     [scheduled-uuid]
                     {scheduled-uuid scheduled-property}
                     :config zoom-in-config
                     :has-hidden-properties? true)]
    (is (not (string/includes? nested-markup "bottom-property-hidden-toggle-btn"))
        "Nested outliner blocks do not render Show hidden properties")
    (is (string/includes? root-markup "bottom-property-hidden-toggle-btn")
        "Zoom-in root still renders Show hidden properties")))

(deftest tags-render-on-first-paint-without-loading-tag-blocks-test
  (let [tag {:db/id 1 :block/uuid (random-uuid) :db/ident :user.class/Visible
             :block/title "Visible tag" :block/name "visible tag"}
        hidden (assoc tag :db/id 2 :block/uuid (random-uuid)
                      :block/title "Hidden tag" :logseq.property.class/hide-from-node true)]
    (with-redefs [db-hooks/use-block (fn [_] nil)
                  block/page-inner (fn [_ page _children _label] [:span (:block/title page)])
                  hooks/use-memo (fn [f _] (f))
                  hooks/use-atom (fn [a] [@a (fn [_])])]
      (let [markup (render-static (block/tags-cp {} {:block/raw-title "Block"
                                                    :block/tags [tag hidden]}))]
        (is (string/includes? markup "Visible tag"))
        (is (not (string/includes? markup "Hidden tag")))))))
