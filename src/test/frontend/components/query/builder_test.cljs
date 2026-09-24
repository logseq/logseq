(ns frontend.components.query.builder-test
  (:require ["react" :as react]
            ["react-dom/server" :as react-dom-server]
            [cljs.test :refer [deftest is]]
            [clojure.string :as string]
            [frontend.components.query.builder :as query-builder]
            [frontend.db.hooks :as db-hooks]
            [goog.object :as gobj]
            [io.factorhouse.hsx.core :as hsx]
            [logseq.common.uuid :as common-uuid]
            [logseq.db.frontend.property :as db-property]))

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

(deftest closed-value-choice-items-test
  (is (= [{:value "Backlog"} {:value "Waiting"}]
         (#'query-builder/closed-value-choice-items
          [{:block/title "Backlog"} {:block/title "Waiting"}])))
  (is (= [{:value "1"}]
         (#'query-builder/closed-value-choice-items [{:logseq.property/value 1}])))
  (is (empty? (#'query-builder/closed-value-choice-items [{} nil])))
  (is (= ["Backlog" "Todo" "Doing" "In Review" "Done" "Canceled"]
         (mapv db-property/property-value-content
               (:property/closed-values
                (#'query-builder/built-in-property :logseq.property/status))))
      "built-in closed values should expose :block/title so property-value-content works"))

(deftest property-value-choice-items-prefer-closed-values-test
  (is (= [{:value "Open"} {:value "Closed"}]
         (#'query-builder/property-value-choice-items
          [{:block/title "Open"} {:block/title "Closed"}]
          [{:label "Used only"}])))
  (is (= [{:label "Used only" :value "Used only"}]
         (#'query-builder/property-value-choice-items
          nil
          [{:label "Used only"}]))))

(deftest tags-clause-shows-built-in-task-title-test
  (let [task-uuid (common-uuid/gen-uuid :db-ident-block-uuid :logseq.class/Task)]
    (is (= "Task" (#'query-builder/built-in-title task-uuid)))
    (is (= "Task" (#'query-builder/page-title (str task-uuid))))
    (is (= [:span "#" "Task"]
           (#'query-builder/dsl-human-output [:tags (str task-uuid)])))))

(deftest property-display-title-prefers-block-title-over-db-ident-test
  (let [ident :user.property/n1-FhROePHC]
    (is (= "n1"
           (#'query-builder/property-display-title
            ident
            {:block/title "n1" :db/ident ident})))
    (is (= "n1-FhROePHC"
           (#'query-builder/property-display-title ident nil))
        "An unloaded property keeps the ident name until its title arrives.")
    (is (= "Status"
           (#'query-builder/property-display-title :logseq.property/status nil)))))

(deftest property-clause-shows-property-title-instead-of-db-ident-test
  (let [ident :user.property/n1-FhROePHC
        property-uuid (common-uuid/gen-uuid :db-ident-block-uuid ident)
        render-clause (fn [clause]
                        (render-static
                         (hsx/create-element
                          (#'query-builder/dsl-human-output clause))))]
    (is (= [:span "Status" ": " "Todo"]
           (#'query-builder/dsl-human-output
            [:property :logseq.property/status "Todo"])))
    (with-redefs [db-hooks/use-block
                  (fn [block-uuid]
                    (when (= block-uuid property-uuid)
                      {:block/uuid property-uuid
                       :block/title "n1"
                       :db/ident ident}))]
      (is (= "<span>n1: 1</span>"
             (render-clause [:property ident 1])))
      (is (= "<span>n1: 1</span>"
             (render-clause [:property 'user.property/n1-FhROePHC 1]))))
    (with-redefs [db-hooks/use-block (constantly nil)]
      (is (= "<span>n1-FhROePHC: 1</span>"
             (render-clause [:property ident 1]))
          "A missing property snapshot keeps the ident name."))))
