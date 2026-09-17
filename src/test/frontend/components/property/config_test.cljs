(ns frontend.components.property.config-test
  (:require ["react" :as react]
            ["react-dom/server" :as react-dom-server]
            [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
            [frontend.components.property.config :as property-config]
            [frontend.components.views :as views]
            [goog.object :as gobj]
            [io.factorhouse.hsx.core :as hsx]))

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

(deftest closed-choice-scope-opts-test
  (let [owner-class {:db/id 123 :block/tags [{:db/ident :logseq.class/Tag}]}
        owner-page {:db/id 456 :block/tags []}]
    (testing "Closed choice scope opts stay global when the toggle is off"
      (is (= {}
             (property-config/->closed-choice-scope-opts {:owner-block owner-class
                                                          :scoped-to-owner? false}))
          "No scoped-class-id when toggle is off"))

    (testing "Create can opt into class-scoped choice"
      (is (= {:scoped-class-id 123}
             (property-config/->closed-choice-scope-opts {:owner-block owner-class
                                                          :scoped-to-owner? true}))
          "scoped-class-id is included only when toggle is on"))

    (testing "Non-class owner never sets scoped-class-id"
      (is (= {}
             (property-config/->closed-choice-scope-opts {:owner-block owner-page
                                                          :scoped-to-owner? true}))))))

(deftest remove-choice-scope-for-owner-tag-tx-data-test
  (testing "Retract scope only for current owner tag"
    (let [choice {:db/id 11
                  :logseq.property/choice-classes [{:db/id 21} {:db/id 22}]}
          owner-block {:db/id 22}]
      (is (= [[:db/retract 11 :logseq.property/choice-classes 22]]
             (property-config/->remove-choice-scope-for-owner-tag-tx-data
              {:choice choice :owner-block owner-block})))))

  (testing "No tx-data when current owner tag is not in scoped classes"
    (let [choice {:db/id 11
                  :logseq.property/choice-classes [{:db/id 21}]}
          owner-block {:db/id 22}]
      (is (= []
             (property-config/->remove-choice-scope-for-owner-tag-tx-data
              {:choice choice :owner-block owner-block}))))))

(deftest use-choice-in-owner-tag-tx-data-test
  (testing "Add owner tag to scoped choice from another tag"
    (let [choice {:db/id 11
                  :logseq.property/choice-classes [{:db/id 21}]}
          owner-block {:db/id 22}]
      (is (= [[:db/add 11 :logseq.property/choice-classes 22]]
             (property-config/->use-choice-in-owner-tag-tx-data
              {:choice choice :owner-block owner-block})))))

  (testing "No tx-data for global choice"
    (is (= []
           (property-config/->use-choice-in-owner-tag-tx-data
            {:choice {:db/id 11}
             :owner-block {:db/id 22}}))))

  (testing "No tx-data when owner is already in scoped classes"
    (let [choice {:db/id 11
                  :logseq.property/choice-classes [{:db/id 21} {:db/id 22}]}
          owner-block {:db/id 22}]
      (is (= []
             (property-config/->use-choice-in-owner-tag-tx-data
              {:choice choice :owner-block owner-block}))))))

(deftest choice-scoped-from-other-tags?-test
  (testing "True when choice is scoped and current owner tag is not included"
    (is (true?
         (property-config/choice-scoped-from-other-tags?
          {:choice {:logseq.property/choice-classes [{:db/id 21}]}
           :owner-block {:db/id 22 :block/tags [{:db/ident :logseq.class/Tag}]}}))))

  (testing "False for global choice"
    (is (false?
         (property-config/choice-scoped-from-other-tags?
          {:choice {}
           :owner-block {:db/id 22 :block/tags [{:db/ident :logseq.class/Tag}]}}))))

  (testing "False when current owner tag is in scope"
    (is (false?
         (property-config/choice-scoped-from-other-tags?
          {:choice {:logseq.property/choice-classes [{:db/id 21} {:db/id 22}]}
           :owner-block {:db/id 22 :block/tags [{:db/ident :logseq.class/Tag}]}})))))

(deftest choice-deletable?-test
  (testing "Non-class choices are deletable"
    (is (true?
         (property-config/choice-deletable?
          {:owner-class? false
           :global-choice? true
           :scoped-choice-from-other-tags? false
           :choice {:db/id 11 :block/title "Quick Tip"}}))))

  (testing "Global non-empty choices stay protected in a tag panel"
    (is (false?
         (property-config/choice-deletable?
          {:owner-class? true
           :global-choice? true
           :scoped-choice-from-other-tags? false
           :choice {:db/id 11 :block/title "Quick Tip"}}))))

  (testing "Global empty choices can be deleted from a tag panel"
    (is (true?
         (property-config/choice-deletable?
          {:owner-class? true
           :global-choice? true
           :scoped-choice-from-other-tags? false
           :choice {:db/id 11 :block/title ""}}))))

  (testing "Choices scoped to other tags are not deletable"
    (is (false?
         (property-config/choice-deletable?
          {:owner-class? true
           :global-choice? false
           :scoped-choice-from-other-tags? true
           :choice {:db/id 11 :block/title ""}})))))

(deftest property-dropdown-renders-sort-actions-for-built-in-table-columns-test
  (testing "Name/Created/Updated table columns are stubs without :block/uuid"
    (doseq [column-id [:block/title :block/created-at :block/updated-at]]
      (let [property (#'views/column-property {:id column-id})]
        (is (some? property)
            (str column-id " should resolve to a built-in property stub"))
        (is (nil? (:block/uuid property))
            (str column-id " stubs are not worker block entities")))))

  (testing "Opening a table column menu must not subscribe to a missing property uuid"
    (let [property (#'views/column-property {:id :block/title})
          markup (render-static
                  (hsx/create-element
                   (property-config/property-dropdown
                    property
                    nil
                    {:with-title? false
                     :more-options [[:div.ls-table-sort-asc "Sort ascending"]
                                    [:div.ls-table-sort-desc "Sort descending"]]})))]
      (is (string/includes? markup "Sort ascending"))
      (is (string/includes? markup "Sort descending"))
      (is (nil? (:db/id property))
          "Stub columns have no db/id, so table headers omit pin"))))
