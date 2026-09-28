(ns frontend.components.property.property-test
  (:require ["fs" :as fs]
            ["react" :as react]
            ["react-dom/server" :as react-dom-server]
            [cljs.test :refer [async deftest is]]
            [clojure.string :as string]
            [frontend.components.property :as property-component]
            [frontend.components.property.config :as property-config]
            [frontend.components.property.default-value :as property-default-value]
            [frontend.components.property.value :as property-value]
            [frontend.db.async :as db-async]
            [frontend.db.hooks :as db-hooks]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.property :as property-handler]
            [frontend.state :as state]
            [goog.object :as gobj]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]))

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

(deftest pick-user-property-for-name-prefers-exact-then-oldest
  (let [pick #'property-component/pick-user-property-for-name
        older {:db/id 1 :block/title "Foo" :db/ident :user.property/Foo}
        newer {:db/id 2 :block/title "foo" :db/ident :user.property/foo}]
    (is (= older (pick [newer older] "Foo"))
        "Exact title wins over another lc-name match")
    (is (= newer (pick [newer older] "foo"))
        "Exact title wins when the typed name matches a different-cased property")
    (is (= older (pick [newer older] "FOO"))
        "Without an exact title, the oldest user property is reused")
    (is (nil? (pick [] "foo")))))

(deftest add-property-from-dropdown-reuses-user-property-when-tag-shares-name
  (async done
         (let [add #'property-component/<add-property-from-dropdown
               existing-property {:db/id 11
                                  :db/ident :user.property/Foo
                                  :block/title "Foo"
                                  :block/tags [{:db/ident :logseq.class/Property}]}
               tag {:db/id 10
                    :db/ident :user.class/Foo
                    :block/title "Foo"
                    :block/tags [{:db/ident :logseq.class/Tag}]}
               upsert-calls (atom [])]
           (-> (p/with-redefs [state/get-current-repo (constantly "test")
                               db-async/<get-user-properties-by-name
                               (fn [_repo name]
                                 (is (= "foo" name))
                                 (p/resolved [existing-property]))
                               db-async/<get-block
                               (fn [_repo id-or-name & _opts]
                                 (is (not= "foo" id-or-name)
                                     "Must not resolve the typed name to the older tag")
                                 (p/resolved (if (= 11 id-or-name)
                                               existing-property
                                               tag)))
                               db-property-handler/upsert-property!
                               (fn [& args]
                                 (swap! upsert-calls conj args)
                                 (p/resolved existing-property))]
                 (add {:block/uuid (random-uuid)} "foo" {:logseq.property/type :default} {}))
               (p/then (fn [property]
                         (is (= existing-property property))
                         (is (empty? @upsert-calls)
                             "Existing user property is reused without creating another")))
               (p/catch (fn [error]
                          (is false (str error))))
               (p/finally done)))))

(deftest add-property-from-dropdown-creates-property-when-only-tag-exists
  (async done
         (let [add #'property-component/<add-property-from-dropdown
               tag {:db/id 10
                    :db/ident :user.class/Foo
                    :block/title "Foo"
                    :block/tags [{:db/ident :logseq.class/Tag}]}
               created {:db/id 12
                        :db/ident :user.property/foo
                        :block/title "foo"
                        :block/tags [{:db/ident :logseq.class/Property}]}
               upsert-calls (atom [])]
           (-> (p/with-redefs [state/get-current-repo (constantly "test")
                               db-async/<get-user-properties-by-name
                               (fn [_repo _name]
                                 (p/resolved []))
                               db-async/<get-block
                               (fn [_repo id-or-name & _opts]
                                 (p/resolved (cond
                                               (= 12 id-or-name) created
                                               (= "foo" id-or-name) tag
                                               :else nil)))
                               db-property-handler/upsert-property!
                               (fn [property-id schema opts]
                                 (swap! upsert-calls conj [property-id schema opts])
                                 (p/resolved created))]
                 (add {:block/uuid (random-uuid)} "foo" {:logseq.property/type :default} {}))
               (p/then (fn [property]
                         (is (= created property))
                         (is (= [[nil
                                  {:logseq.property/type :default}
                                  {:property-name "foo"}]]
                                @upsert-calls)
                             "Typed name is used; the tag title is not copied onto a new property")))
               (p/catch (fn [error]
                          (is false (str error))))
               (p/finally done)))))

(deftest restore-closed-values-uses-row-identities-when-snapshot-omits-them-test
  (let [restore #'property-component/restore-closed-values
        choice-uuid (random-uuid)
        choice {:block/uuid choice-uuid :block/title "Choice after"}
        snapshot {:db/ident :user.property/reactive-priority
                  :logseq.property/type :default}]
    (is (nil? (:property/closed-values snapshot)))
    (is (= [choice]
           (:property/closed-values (restore snapshot [choice-uuid] [choice])))
        "Hydrated choice entities win when the row watched them.")
    (is (= [{:block/uuid choice-uuid}]
           (:property/closed-values (restore snapshot [choice-uuid] nil)))
        "Compact UUIDs still make select-type? true while choices load.")
    (is (= [{:db/id 1}]
           (:property/closed-values
            (restore (assoc snapshot :property/closed-values [{:db/id 1}])
                     [choice-uuid]
                     [choice])))
        "A snapshot that already has closed-values is left alone.")))

(deftest display-property-resource-value-is-authoritative-test
  (let [value-uuid (random-uuid)
        value-entity {:block/uuid value-uuid :block/title "canonical"}
        restore #'property-component/restore-resource-entity-values]
    (is (= "new" (restore "new" {}))
        "Scalar resource values remain authoritative.")
    (is (= value-entity (restore value-uuid {value-uuid value-entity}))
        "Entity UUIDs resolve from canonical block snapshots.")
    (is (= [value-entity]
           (restore [value-uuid] {value-uuid value-entity}))
        "Entity collections retain their resource-owned shape.")))

(deftest property-configuration-subscribes-to-current-property-data-test
  (let [property-uuid (random-uuid)
        owner-uuid (random-uuid)
        property {:block/uuid property-uuid
                  :db/ident :user.property/choices}
        owner {:block/uuid owner-uuid}
        calls (atom [])]
    (with-redefs [db-hooks/use-block
                  (fn [block-uuid]
                    (swap! calls conj block-uuid)
                    (cond
                      (= block-uuid property-uuid)
                      (assoc property :property/closed-values [{:db/id 1}])

                      (= block-uuid owner-uuid)
                      owner))]
      (render-static (property-config/property-dropdown property owner {}))
      (is (= [property-uuid owner-uuid] @calls)
          "Property configuration must subscribe instead of retaining popup snapshots."))))

(deftest default-value-editor-subscribes-to-current-property-data-test
  (let [property-uuid (random-uuid)
        property {:block/uuid property-uuid
                  :db/ident :user.property/default}
        calls (atom [])]
    (with-redefs [db-hooks/use-block
                  (fn [block-uuid]
                    (swap! calls conj block-uuid)
                    property)]
      (render-static (property-default-value/default-value-config property))
      (is (= [property-uuid] @calls)
          "The default-value editor must own a live property subscription."))))

(deftest default-value-property-pull-pattern-avoids-virtual-closed-values-test
  (is (= '[*] property-default-value/default-value-property-pull-pattern)
      "Datascript pull rejects :property/closed-values; the submenu must use a wildcard pull."))

(deftest removing-status-from-task-view-preserves-task-tag-test
  (async done
         (let [block-id (random-uuid)
               calls* (atom [])
               block {:block/uuid block-id}
               status-property {:db/ident :logseq.property/status}
               on-chosen (#'property-component/property-input-on-chosen
                          block (atom nil) (atom nil) nil
                          {:remove-property? true
                           :view-parent {:db/ident :logseq.class/Task}})]
           (-> (p/with-redefs [db-async/<get-block (fn [& _] (p/resolved status-property))
                               property-value/batch-operation? (constantly false)
                               property-value/get-operating-blocks (fn [_] [block])
                               property-handler/batch-remove-block-property!
                               (fn [& args] (swap! calls* conj args))
                               shui/popup-hide! (constantly nil)]
                 (on-chosen {:value :logseq.property/status
                             :property status-property}))
               (p/then (fn []
                         (is (= [[[block-id]
                                 :logseq.property/status
                                 {:preserve-task-tag? true}]]
                                @calls*))))
               (p/catch (fn [error]
                          (is false (str error))))
               (p/finally done)))))

(deftest choosing-existing-closed-value-property-reuses-picker-data-test
  (async done
         (let [block {:block/uuid (random-uuid)}
               property {:block/uuid (random-uuid)
                         :db/ident :user.property/priority
                         :block/tags [{:db/ident :logseq.class/Property}]
                         :logseq.property/type :default
                         :property/closed-values
                         [{:block/uuid (random-uuid)
                           :block/title "High"}]}
               *property (atom nil)
               *property-key (atom nil)
               *show-new-property-config? (atom true)
               on-chosen (#'property-component/property-input-on-chosen
                          block *property *property-key
                          *show-new-property-config? {})]
           (-> (p/with-redefs [db-async/<get-block
                               (fn [& _]
                                 (throw (js/Error. "Picker data must avoid a second block fetch")))
                               property-value/batch-operation? (constantly false)]
                 (on-chosen {:value (:block/uuid property)
                             :label "Priority"
                             :property property}))
               (p/then (fn []
                         (is (= property @*property))
                         (is (= "Priority" @*property-key))
                         (is (false? @*show-new-property-config?))))
               (p/catch (fn [error]
                          (is false (str error))))
               (p/finally done)))))

(deftest toggle-hidden-properties-visibility-test
  (let [block-uuid (random-uuid)]
    (is (false? (property-component/hidden-properties-visible? block-uuid)))
    (property-component/toggle-hidden-properties-visibility! block-uuid)
    (is (true? (property-component/hidden-properties-visible? block-uuid)))
    (property-component/toggle-hidden-properties-visibility! block-uuid)
    (is (false? (property-component/hidden-properties-visible? block-uuid)))))

(deftest show-property-panel-edit-button-test
  (is (false? (#'property-component/show-property-panel-edit-button?
               {:logseq.property/type :date}
               {}))
      "Date edit button should be hidden outside bottom properties")
  (is (false? (#'property-component/show-property-panel-edit-button?
               {:logseq.property/type :datetime}
               {}))
      "Datetime edit button should be hidden outside bottom properties")
  (is (true? (#'property-component/show-property-panel-edit-button?
              {:logseq.property/type :datetime}
              {:property-position :block-below}))
      "Datetime edit button should be shown for bottom properties"))

(deftest show-property-panel-bullet-for-closed-value-test
  (is (true?
       (boolean
        (#'property-component/show-property-panel-bullet?
         {:logseq.property/type :default
          :property/closed-values [{:db/id 1}]}
         {:db/id 1}))))
  (is (false?
       (#'property-component/show-property-panel-bullet?
        {:logseq.property/type :default}
        {:db/id 1}))))

(deftest url-property-wrapping-rule-must-not-target-the-bullet-test
  (let [css (str (fs/readFileSync "src/main/frontend/components/property.css" "utf8"))
        rule (->> (string/split-lines css)
                  (filter #(and (string/includes? % "[data-property-type=url]")
                                (string/includes? % ".property-value-panel a")))
                  first)]
    (is (some? rule)
        "The URL value-panel wrapping rule should still exist in property.css")
    (is (string/includes? rule ":not(.bullet-link-wrap)")
        (str "The URL wrapping rule must exclude the block bullet's anchor. It applies "
             "min-width:0, which lets the inline-flex bullet collapse and pulls it out of "
             "line with the other properties (db-test#1239)."))
    (is (string/includes? rule ":not(.block-control)")
        "The same rule must exclude the block control anchor for the same reason")))

(deftest page-title-property-surface-hides-outliner-add-property-test
  (is (true? (#'property-component/page-title-property-surface? {:page-title? true}))
      "The current page title can add properties")
  (is (true? (#'property-component/page-title-property-surface? {:sidebar-properties? true}))
      "Sidebar page properties can add properties")
  (is (true? (#'property-component/page-title-property-surface? {:tag-dialog? true}))
      "Tag dialog can add properties")
  (is (false? (#'property-component/page-title-property-surface? {:in-block-container? true}))
      "A page nested in the outliner cannot add properties"))
