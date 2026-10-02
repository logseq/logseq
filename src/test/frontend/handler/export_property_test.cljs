(ns frontend.handler.export-property-test
  (:require [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [cljs.test :refer [deftest is]]
            [clojure.string :as string]
            [datascript.core :as d]
            [frontend.handler.export.common :as export-common]
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
             (@#'common-file/block-properties-content nil {} "  " {}))))))

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

(deftest selected-block-text-export-includes-default-property-value-children
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:user.property/qa-transfer-note {:logseq.property/type :default}
                            :user.property/qa-website {:logseq.property/type :url}}
               :pages-and-blocks
               [{:page {:block/title "QA-Text-Transfer"}
                 :blocks [{:block/title "QA transfer owner"
                           :build/properties
                           {:user.property/qa-transfer-note
                            {:build/property-value :block
                             :block/title "QA property value"
                             :build/children
                             [{:block/title "QA value child"
                               :build/children [{:block/title "QA value grandchild"}]}]}
                            :user.property/qa-website
                            {:build/property-value :block
                             :block/title "https://example.com"
                             :build/children [{:block/title "url value child"}]}}
                           :build/children [{:block/title "QA ordinary child"}]}
                          {:block/title "QA transfer control"}]}]})
        owner (db-test/find-block-by-content @conn "QA transfer owner")
        control (db-test/find-block-by-content @conn "QA transfer control")
        content-config (export-common/get-content-config)
        content (worker-export/export-blocks-as-format
                 @conn
                 [(:block/uuid owner) (:block/uuid control)]
                 :markdown
                 {:remove-options #{}}
                 content-config)]
    (is (true? (:export-default-property-values-as-blocks? content-config)))
    (is (string/includes? content "QA property value"))
    (is (string/includes? content "QA value child"))
    (is (string/includes? content "QA value grandchild"))
    (is (string/includes? content "QA ordinary child"))
    (is (string/includes? content "QA transfer control"))
    (is (string/includes? content "https://example.com"))
    (is (not (string/includes? content "url value child")))))

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
