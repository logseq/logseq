(ns frontend.handler.export-property-test
  (:require [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [cljs.test :refer [deftest is]]
            [clojure.string :as string]
            [datascript.core :as d]
            [frontend.handler.export.common :as export-common]
            [frontend.state :as state]
            [frontend.worker.export :as worker-export]
            [logseq.common.export.file :as common-file]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.test.helper :as db-test]))

(def ^:private block-export-context
  {:export-bullet-indentation "  "
   :export-properties-as-list-items? true
   :export-node-property-values-as-page-refs? true
   :export-default-property-values-as-blocks? true
   :preserve-block-refs? true})

(defn- export-page
  [conn title]
  (let [page (db-test/find-page-by-title @conn title)]
    (common-file/block->content
     @conn
     (:block/uuid page)
     {:include-page-properties? true}
     block-export-context)))

(deftest block-properties-content-uses-property-title-and-time-for-datetime
  (let [datetime-ms (tc/to-long (t/date-time 2026 5 14 9 30))
        expected-datetime (date-time-util/format
                           (t/to-default-time-zone (tc/from-long datetime-ms))
                           "MMM do, yyyy HH:mm")
        properties (array-map
                    :logseq.property/deadline datetime-ms
                    :user.property/P1-MoCeM8Tf "hello")]
    (with-redefs [db-property/properties (constantly properties)
                  db-property/sort-properties (fn [prop-entities] prop-entities)
                  d/entity (fn [_db lookup]
                             (case lookup
                               :logseq.property/deadline {:db/ident :logseq.property/deadline
                                                          :block/title "deadline"
                                                          :logseq.property/type :datetime}
                               :user.property/P1-MoCeM8Tf {:db/ident :user.property/P1-MoCeM8Tf
                                                           :block/title "P1"
                                                           :logseq.property/type :default}
                               nil))]
      (is (= (str "  deadline:: " expected-datetime "\n"
                  "  P1:: hello")
             (@#'common-file/block-properties-content nil {} 1 {} {}))))))

(deftest default-property-value-children-are-exported
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:user.property/notes {:logseq.property/type :default}}
               :pages-and-blocks [{:page {:block/title "Text Prop Children"
                                           :build/properties
                                           {:user.property/notes
                                            {:build/property-value :block
                                             :block/title "page value"
                                             :build/children [{:block/title "page value child"}]}}}
                                   :blocks [{:block/title "body"
                                             :build/properties
                                             {:user.property/notes
                                              {:build/property-value :block
                                               :block/title "block value"
                                               :build/children
                                               [{:block/title "child of value"
                                                 :build/children [{:block/title "grandchild"}]}]}}}
                                            {:block/title "after"}]}]})]
    (is (= (str "* notes::\n"
                "  - page value\n"
                "    - page value child\n"
                "- body\n"
                "  * notes::\n"
                "    - block value\n"
                "      - child of value\n"
                "        - grandchild\n"
                "- after")
           (export-page conn "Text Prop Children")))))

(deftest url-property-value-children-are-not-exported
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:user.property/website {:logseq.property/type :url}}
               :pages-and-blocks [{:page {:block/title "Url Prop Children"}
                                   :blocks [{:block/title "body"
                                             :build/properties
                                             {:user.property/website
                                              {:build/property-value :block
                                               :block/title "https://example.com"
                                               :build/children [{:block/title "should not appear"}]}}}
                                            {:block/title "after"}]}]})
        content (export-page conn "Url Prop Children")]
    (is (= (str "- body\n"
                "  * website:: https://example.com\n"
                "- after")
           content))
    (is (not (string/includes? content "should not appear")))))

(deftest selected-block-text-export-preserves-property-value-hierarchy
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:user.property/notes {:logseq.property/type :default}
                            :user.property/summary {:logseq.property/type :default}}
               :pages-and-blocks
               [{:page {:block/title "Page A"}
                 :blocks [{:block/title "Owner"
                           :build/properties
                           {:user.property/notes
                            {:build/property-value :block
                             :block/title "Value"
                             :build/children
                             [{:block/title "Value child"
                               :build/children [{:block/title "Value grandchild"}]}]}
                            :user.property/summary "Second value"}
                           :build/children [{:block/title "Ordinary child"}]}
                          {:block/title "Control"}]}]})
        owner (db-test/find-block-by-content @conn "Owner")
        control (db-test/find-block-by-content @conn "Control")]
    (doseq [indent ["\t" "  " "    " "        "]]
      (with-redefs [state/get-export-bullet-indentation (constantly indent)]
        (let [content (worker-export/export-blocks-as-format
                       @conn [(:block/uuid owner) (:block/uuid control)] :markdown
                       {:remove-options #{}} (export-common/get-content-config))]
          (is (= [[0 "Owner"] [1 "Value"] [2 "Value child"] [3 "Value grandchild"]
                  [1 "Second value"] [1 "Ordinary child"] [0 "Control"]]
                 (->> (string/split-lines content)
                      (keep (fn [line]
                              (when-let [[_ tabs title] (re-matches #"(\t*)- (.*)" line)]
                                [(count tabs) title])))
                      vec))))))))

(deftest selected-block-export-removes-properties-recursively
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:user.property/notes {:logseq.property/type :default}}
               :pages-and-blocks
               [{:page {:block/title "Page A"}
                 :blocks [{:block/title "Owner"
                           :build/children
                           [{:block/title "Child"
                             :build/properties
                             {:user.property/notes
                              {:build/property-value :block
                               :block/title "Value"
                               :build/children [{:block/title "Value child"}]}}}]}]}]})
        owner (db-test/find-block-by-content @conn "Owner")]
    (is (= "- Owner\n\t- Child\n"
           (worker-export/export-blocks-as-format
            @conn [(:block/uuid owner)] :markdown
            {:remove-options #{:property}} (export-common/get-content-config))))))

(deftest selected-block-export-filters-collapsed-property-values
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:user.property/notes {:logseq.property/type :default}
                            :user.property/summary {:logseq.property/type :default}}
               :pages-and-blocks
               [{:page {:block/title "Page A"}
                 :blocks [{:block/title "Owner"
                           :build/properties
                           {:user.property/notes
                            {:build/property-value :block
                             :block/title "Collapsed value"
                             :build/children [{:block/title "Hidden child"}]}
                            :user.property/summary
                            {:build/property-value :block
                             :block/title "Expanded value"
                             :build/children
                             [{:block/title "Collapsed child"
                               :block/collapsed? true
                               :build/children [{:block/title "Hidden grandchild"}]}]}}}]}]})
        owner (db-test/find-block-by-content @conn "Owner")
        collapsed-value (db-test/find-block-by-content @conn "Collapsed value")]
    (d/transact! conn [{:db/id (:db/id collapsed-value) :block/collapsed? true}])
    (doseq [open-only? [false true]]
      (let [content (worker-export/export-blocks-as-format
                     @conn [(:block/uuid owner)] :markdown
                     {:other-options {:open-blocks-only open-only?}}
                     (export-common/get-content-config))]
        (is (= (not open-only?) (string/includes? content "Hidden child")))
        (is (= (not open-only?) (string/includes? content "Hidden grandchild")))
        (is (string/includes? content "Collapsed value"))
        (is (string/includes? content "Collapsed child"))))))

(deftest highlighted-export-preserves-code-and-math-content
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "Highlight export"}
                 :blocks [{:block/title "plain text"
                           :build/properties {:logseq.property/background-color "red"}}
                          {:block/title "const x = 1;"
                           :build/properties {:logseq.property/background-color "red"
                                              :logseq.property.node/display-type :code
                                              :logseq.property.code/lang "javascript"}}
                          {:block/title "x^2"
                           :build/properties {:logseq.property/background-color "red"
                                              :logseq.property.node/display-type :math}}]}]})
        page (db-test/find-page-by-title @conn "Highlight export")
        content (common-file/block->content
                 @conn (:block/uuid page) {:include-properties? false}
                 (assoc block-export-context :encode-highlight-as-mark? true))]
    (is (= (str "- ^^plain text^^\n"
                "- ```javascript\n  const x = 1;\n  ```\n"
                "- $$\n  x^2\n  $$")
           content))))
