(ns electron.mcp-compat-test
  (:require [clojure.string :as string]
            [cljs.test :refer [async deftest is]]
            [electron.mcp-compat :as mcp-compat]
            [promesa.core :as p]))

(defn- recording-api
  [calls result]
  (fn [method args]
    (swap! calls conj [method args])
    result))

(deftest compatibility-routes-preserve-api-contracts
  (let [calls (atom [])
  api (recording-api calls :ok)]
    (is (= :ok (mcp-compat/get-page api #js {"pageName" "Inbox"})))
    (is (= :ok (mcp-compat/list-pages api #js {"expand" true})))
    (is (= :ok (mcp-compat/list-tags api #js {"expand" false})))
    (is (= :ok (mcp-compat/list-properties api #js {"expand" true})))
    (is (= :ok (mcp-compat/search-blocks api #js {"searchTerm" "needle"})))
    (is (= ["logseq.cli.getPageData" ["Inbox"]]
           (first @calls)))
    (is (= "logseq.cli.listPages" (first (second @calls))))
    (is (= true (aget (first (second (second @calls))) "expand")))
    (is (= "logseq.cli.listTags" (first (nth @calls 2))))
    (is (= "logseq.cli.listProperties" (first (nth @calls 3))))
    (is (= ["logseq.app.search" "needle"]
          [(first (nth @calls 4)) (first (second (nth @calls 4)))]))))

(deftest capabilities-reports-only-the-registered-reference-routes
  (let [calls (atom [])
        api (fn [method args]
              (swap! calls conj [method args])
              (case method
                "logseq.App.getAppInfo" #js {"version" "2.0.1" "supportDb" true}
                "logseq.App.checkCurrentIsDbGraph" true
                "logseq.DB.getTagsByName" nil
                #js []))]
    (async done
      (-> (p/then (mcp-compat/capabilities api #js {"include_diagnostics" true})
                  (fn [result]
                    (is (= "2.0.1" (get-in result [:graph :version])))
                    (is (true? (get-in result [:graph :version_matches])))
                    (is (= "unknown" (get-in result [:tools :getTagUUID :state])))
                    (is (some #{"getTagUUID"} (:unknown result)))
                    (is (not (contains? (:tools result) :upsertNodes)))
                    (is (not (contains? (get-in result [:diagnostics :routes]) "upsertNodes")))
                    (is (not-any? #(= "logseq.cli.upsertNodes" (first %)) @calls))
                      (is (some #(and (= "logseq.DB.upsertProperty" (first %))
                                (= "__mcp_capability_probe__/invalid"
                                  (first (second %))))
                            @calls))
                    (is (= 2 (count (filter #(string/starts-with? (first %) "logseq.App.") @calls))))
                    (done)))
          (p/catch (fn [error]
                     (is false (str error))
                    (done)))))))

(deftest capabilities-refuses-non-db-graphs
  (let [api (fn [method _args]
              (case method
                "logseq.App.getAppInfo" #js {"version" "2.0.1" "supportDb" true}
                "logseq.App.checkCurrentIsDbGraph" false
                #js []))]
    (async done
      (-> (p/then (mcp-compat/capabilities api #js {})
                  (fn [_]
                    (is false "capabilities should reject a non-DB graph")
                    (done)))
          (p/catch (fn [error]
                     (is (string/includes? (.-message error) "not a DB graph"))
                     (done)))))))

    (deftest page-uuid-result-resolves-one-live-page
      (is (= {:found true :title "Inbox" :page_uuid "page-1"}
        (mcp-compat/page-uuid-result "Inbox" [{:uuid "page-1"}])))
      (is (= {:found false :title "Missing" :page_uuid nil}
        (mcp-compat/page-uuid-result "Missing" []))))

    (deftest page-uuid-result-refuses-ambiguous-title
      (let [result (mcp-compat/page-uuid-result
          "Twin" [{:uuid "page-1"} {:uuid "page-2"}])]
        (is (= false (:found result)))
        (is (= ["page-1" "page-2"] (:candidates result)))
        (is (= "2 pages share this title; use a UUID" (:reason result)))))

        (deftest tag-uuid-result-preserves-ambiguity
          (is (= {:found true :title "Project" :tag_uuid "tag-1"}
            (mcp-compat/tag-uuid-result "Project" [{:uuid "tag-1"}])))
          (let [result (mcp-compat/tag-uuid-result
              "Project" [{:uuid "tag-1"} {:uuid "tag-2"}])]
            (is (= false (:found result)))
            (is (= ["tag-1" "tag-2"] (:candidates result)))))

            (deftest tag-result-reports-missing-entities
              (is (= {:found true :tag_uuid "tag-1" :uuid "tag-1" :title "Project"}
                (mcp-compat/tag-result "tag-1"
                        [{:uuid "tag-1" :title "Project"}])))
              (is (= {:found false :tag_uuid "missing"}
                (mcp-compat/tag-result "missing" []))))

              (deftest property-ident-result-refuses-ambiguous-definitions
                (is (= {:found true :title "Effort" :ident "plugin.property/Effort"
                  :type "number"}
                 (mcp-compat/property-ident-result
                  "Effort" [{:ident "plugin.property/Effort" :type "number"}])))
                (let [result (mcp-compat/property-ident-result
                  "Effort" [{:ident "plugin.property/Effort"}
                       {:ident "user.property/Effort"}])]
                  (is (= false (:found result)))
                  (is (= ["plugin.property/Effort" "user.property/Effort"]
                   (:candidates result)))))

                  (deftest block-result-rejects-pages-and-missing-uuids
                    (is (= {:found true :block_uuid "block-1"
                      :block {:uuid "block-1" :title "A block"}}
                     (mcp-compat/block-result
                      "block-1" [{:uuid "block-1" :title "A block"}])))
                    (is (= {:found false :block_uuid "page-1" :block nil
                      :reason "target is a page, not a block"}
                     (mcp-compat/block-result
                      "page-1" [{:uuid "page-1" :name "page"}])))
                    (is (= {:found false :block_uuid "missing" :block nil}
                          (mcp-compat/block-result "missing" []))))

                    (deftest duplicate-title-grouping-modes-preserve-their-contracts
                      (is (= "Loom-Weaver" (mcp-compat/grouping-key "Loom-Weaver" "exact")))
                      (is (not= (mcp-compat/grouping-key "Loom-Weaver" "exact")
                           (mcp-compat/grouping-key "Loom Weaver" "exact")))
                      (is (= (mcp-compat/grouping-key "Loom-Weaver" "loose")
                        (mcp-compat/grouping-key "loom weaver" "loose")))
                      (is (= (mcp-compat/grouping-key "Threads" "loose")
                        (mcp-compat/grouping-key "Thread" "loose")))
                      (is (= "class" (mcp-compat/grouping-key "Classes" "loose")))
                      (is (= "its" (mcp-compat/grouping-key "Its" "loose"))))

                    (deftest duplicate-title-fuzzy-groups-near-misses-only-in-fuzzy-mode
                      (let [candidates [{:title "Persuade" :uuid "one"}
                              {:title "Presuade" :uuid "two"}]]
                        (is (= [] (#'mcp-compat/group-title-candidates candidates "loose")))
                        (is (= 1 (count (#'mcp-compat/group-title-candidates candidates "fuzzy"))))))

  (deftest block-tree-result-applies-bounds
    (let [result (mcp-compat/block-tree-result
                  "root"
                  {:uuid "root" :title "Root"}
                  [{:uuid "child" :title "Child" :parent_uuid "root"}]
                  0 10)]
      (is (= true (:found result)))
      (is (= 1 (:node_count result)))
      (is (= true (:truncated result)))
      (is (= [] (get-in result [:block :children])))))

(deftest title-availability-result-classifies-holders
  (is (= {:title "Inbox" :available true :held_by []}
         (mcp-compat/title-availability-result "Inbox" [])))
  (let [result (mcp-compat/title-availability-result
                "Inbox" [{:uuid "page-1" :name "inbox"}])]
    (is (= false (:available result)))
    (is (= "page" (:kind (first (:held_by result)))))))

(deftest list-orphan-tags-queries-unused-tag-entities
  (let [calls (atom [])
        tags #js [#js {"db/id" 17
                       "db/ident" "plugin.tag/Unused"
                       "block/uuid" "tag-1"
                       "block/title" "Unused"}]
        api (fn [method args]
              (swap! calls conj [method args])
              tags)
        operation (mcp-compat/list-orphan-tags api #js {})]
    (async done
      (p/then operation
              (fn [result]
                (let [[method [query]] (first @calls)]
                  (is (= [{:db/id 17
                           :db/ident "plugin.tag/Unused"
                           :block/uuid "tag-1"
                           :block/title "Unused"}]
                         result))
                  (is (= "logseq.DB.datascriptQuery" method))
                  (is (string/includes? query ":block/_tags)")))
                (done))))))

(deftest list-orphan-properties-validates-query-idents
  (let [calls (atom [])
     properties #js [#js {"ident" ":plugin.property/Unused"
              "title" "Unused"
              "logseq.property/type" "number"}
            #js {"ident" ":plugin.property/Used"
              "title" "Used"
              "logseq.property/type" "string"}
            #js {"ident" "unqualified"
              "title" "Unsafe"}]
        api (fn [method args]
              (swap! calls conj [method args])
              (if (= "logseq.DB.getAllProperties" method)
                properties
                (if (string/includes? (first args) ":plugin.property/Used")
                  #js [#js {:uuid "holder-1"}]
                  #js [])))]
    (async done
      (p/then (mcp-compat/list-orphan-properties api #js {})
              (fn [result]
                (is (= [{:ident ":plugin.property/Unused"
                         :title "Unused"
                         :type "number"}]
                       result))
                (is (= ["logseq.DB.getAllProperties"
                        "logseq.DB.datascriptQuery"
                        "logseq.DB.datascriptQuery"]
                       (mapv first @calls)))
                (is (not-any? #(string/includes? (first (second %)) "unqualified")
                              (rest @calls)))
                (done))))))

(deftest list-assets-uses-unverified-attribute-discovery-query
  (let [calls (atom [])
        attributes #js [":logseq.property/asset/url" ":logseq.property/asset/remote-metadata"]
        api (fn [method args]
              (swap! calls conj [method args])
              attributes)]
    (async done
      (p/then (mcp-compat/list-assets api #js {})
              (fn [result]
                (let [[method [query]] (first @calls)]
                  (is (= [":logseq.property/asset/url"
                           ":logseq.property/asset/remote-metadata"]
                         result))
                  (is (= "logseq.DB.datascriptQuery" method))
                  (is (= 1 (count (second (first @calls)))))
                  (is (string/includes? query "clojure.string/includes?"))
                  (is (string/includes? query "\"asset\"")))
                (done))))))

(deftest list-journals-sorts-and-limits-the-cheap-listing
  (let [calls (atom [])
        journals #js [#js {"id" 1 "title" "Older" "journal-day" 20250101}
                      #js {"id" 2 "title" "Newest" "journal-day" 20260101}
                      #js {"id" 3 "title" "Middle" "journal-day" 20250601}]
        api (fn [method args]
              (swap! calls conj [method args])
              journals)]
    (async done
      (p/then (mcp-compat/list-journals api #js {"limit" 2})
              (fn [result]
                (is (= ["Newest" "Middle"] (mapv :title result)))
                (is (= 1 (count @calls)))
                (is (= "logseq.DB.datascriptQuery" (first (first @calls))))
                (done))))))

(deftest list-journals-counts-in-four-queries-and-zero-fills
  (let [calls (atom [])
        journals #js [#js {"id" 1 "title" "Older" "journal-day" 20250101}
                      #js {"id" 2 "title" "Newest" "journal-day" 20260101}]
        api (fn [method args]
              (swap! calls conj [method args])
              (case (count @calls)
                1 journals
                2 #js [#js [1 2]]
                3 #js [#js [1 1]]
                4 #js [#js [1 3]]))]
    (async done
      (p/then (mcp-compat/list-journals api #js {"with_counts" true})
              (fn [result]
                (let [by-title (into {} (map (juxt :title identity) (:journals result)))]
                  (is (= 4 (count @calls)))
                  (is (= 2 (:total result)))
                  (is (= 2 (:counted result)))
                  (is (false? (:truncated result)))
                  (is (= 1 (:content_blocks (by-title "Older"))))
                  (is (= 0 (:own_blocks (by-title "Newest"))))
                  (is (= 0 (:refs (by-title "Newest")))))
                (done))))))

(deftest list-journals-counted-limit-reports-truncation
  (let [calls (atom [])
        journals #js [#js {"id" 1 "title" "Oldest" "journal-day" 20240101}
                      #js {"id" 2 "title" "Middle" "journal-day" 20250101}
                      #js {"id" 3 "title" "Newest" "journal-day" 20260101}]
        api (fn [method args]
              (swap! calls conj [method args])
              (case (count @calls)
                1 journals
                #js []))]
    (async done
      (p/then (mcp-compat/list-journals api #js {"with_counts" true "limit" 1})
              (fn [result]
                (is (= 3 (:total result)))
                (is (= 1 (:counted result)))
                (is (true? (:truncated result)))
                (is (= ["Newest"] (mapv :title (:journals result))))
                (is (= [3] (js->clj (second (second (second @calls))))))
                (done))))))

(deftest list-journals-rejects-non-positive-limits
  (is (thrown-with-msg? js/Error #"limit must be a positive integer"
                        (mcp-compat/list-journals (fn [& _] nil) #js {"limit" 0}))))

(deftest page-stats-counts-subtree-references-and-aliases
  (let [page-uuid "00000000-0000-4000-8000-000000000001"
        calls (atom [])
        tree #js {"id" 10
                  "name" "page"
                  "_parent" #js [#js {"id" 11
                                      "page" #js {"id" 10}
                                      "_parent" #js [#js {"id" 12
                                                          "name" "nested"
                                                          "page" #js {"id" 10}
                                                          "_parent" #js [#js {"id" 13
                                                                              "page" #js {"id" 12}}]}]}
                                 #js {"id" 14 "page" #js {"id" 99}}]}
        api (fn [_method args]
              (let [query (first args)]
                (swap! calls conj query)
                (cond
                  (string/includes? query "pull ?entity [*]")
                  #js {"id" 10 "uuid" page-uuid "name" "page" "title" "Page"}
                  (string/includes? query "block/_parent") tree
                  (string/includes? query "?holder")
                  #js [#js {"uuid" "00000000-0000-4000-8000-000000000002"}]
                  (string/includes? query "?alias")
                  #js [#js {"uuid" "00000000-0000-4000-8000-000000000003"}]
                  (string/includes? query "count ?b") (if (string/includes? query "block/title") 1 4)
                  (string/includes? query "count ?e") (if (string/includes? query "block/refs") 2 1)
                  (string/includes? query "?class :db/ident") 90
                  (string/includes? query "?attr")
                  #js [#js [#js {"ident" "user.property/target"} 20]
                       #js [#js {"ident" "parent"} 21]]
                  :else nil)))]
    (async done
      (p/then (mcp-compat/page-stats api #js {"page_uuid" page-uuid})
              (fn [result]
                (is (= page-uuid (:page_uuid result)))
                (is (= "Page" (:title result)))
                (is (= 4 (:own_blocks result)))
                (is (= 1 (:empty_blocks result)))
                (is (= 3 (:content_blocks result)))
                (is (= 4 (:subtree_blocks result)))
                (is (= 1 (:nested_pages result)))
                (is (= 1 (:true_orphans result)))
                (is (= 2 (:refs result)))
                (is (= 1 (:tag_holders result)))
                (is (= 1 (:property_values result)))
                (is (= "00000000-0000-4000-8000-000000000002" (:is_alias_of result)))
                (is (= ["00000000-0000-4000-8000-000000000003"] (:aliases result)))
                (is (string/includes? (:diagnostic result) "ALIAS RELATION"))
                (is (= 10 (count @calls)))
                (done))))))

(deftest page-stats-validates-page-uuid-before-querying
  (is (thrown-with-msg? js/Error #"page_uuid must be a UUID"
                        (mcp-compat/page-stats (fn [& _] nil) #js {"page_uuid" "not-a-uuid"}))))

(deftest inspect-page-all-returns-each-detail-with-structural-values-filtered
  (let [page-uuid "00000000-0000-4000-8000-000000000011"
        calls (atom [])
        api (fn [_method args]
              (let [query (first args)]
                (swap! calls conj [query args])
                (cond
                  (string/includes? query "pull ?entity [*]")
                  #js {"id" 10 "uuid" page-uuid "name" "home" "title" "Home"}
                     (string/includes? query ":block/parent+ ?page")
                     #js [["block-uuid" "Body" 0]
                       ["child-uuid" "Child" 1]]
                       (string/includes? query "?holder ?attr ?value")
                       #js [#js [#js {"ident" "user.property/score"}
                           #js {"uuid" page-uuid}
                           42]
                         #js [#js {"ident" "block/parent"}
                           #js {"uuid" page-uuid}
                           10]]
                  (string/includes? query "?holder")
                  #js [#js {"uuid" page-uuid "tags" #js [#js {"ident" "user.class/Topic"}]}]
                       (string/includes? query "property.class/properties")
                       #js [#js [#js {"title" "Topic"}
                           #js {"ident" "user.property/score" "title" "Score"}]]
                  (string/includes? query "?class :db/ident") 90
                  (string/includes? query "?e ?a _")
                  #js [#js {"id" 42 "title" "Choice" "value" "green"}]
                  :else nil)))]
    (async done
      (-> (p/then (mcp-compat/inspect-page api #js {"page_uuid" page-uuid "detail" "all"})
                  (fn [result]
                    (is (true? (:found result)))
                    (is (= "Home" (get-in result [:page :title])))
                    (is (= [{:uuid "block-uuid" :title "Body" :order 0 :page_uuid page-uuid}
                            {:uuid "child-uuid" :title "Child" :order 1 :page_uuid page-uuid}]
                           (:blocks result)))
                    (is (= 1 (count (:tags result))))
                    (is (= 1 (count (:properties result))))
                    (is (= 42 (get-in result [:properties 0 :value])))
                    (is (= "Choice" (get-in result [:properties 0 :value_entity :title])))
                    (is (= [{:class {:title "Topic"}
                             :property {:ident "user.property/score" :title "Score"}}]
                           (:declared_properties result)))
                    (is (= 7 (count @calls)))
                    (done)))
          (p/catch (fn [_error]
                     (is false "inspectPage query rejected")
                     (done)))))))

(deftest inspect-page-reports-missing-page-and-block
  (let [page-uuid "00000000-0000-4000-8000-000000000012"]
    (async done
      (-> (p/let [missing (mcp-compat/inspect-page (fn [& _] nil) #js {"page_uuid" page-uuid})
                  block (mcp-compat/inspect-page (fn [& _]
                                                  #js {"id" 12 "uuid" page-uuid "title" "Block"})
                                                #js {"page_uuid" page-uuid})]
            [missing block])
          (p/then (fn [[missing block]]
                    (is (= {:found false :page_uuid page-uuid :page nil} missing))
                    (is (= "target is a block, not a page" (:reason block)))
                    (done)))
          (p/catch (fn [_error]
                     (is false "inspectPage lookup rejected")
                     (done)))))))

(deftest inspect-page-rejects-invalid-detail
  (is (thrown-with-msg? js/Error #"detail must be one of"
                        (mcp-compat/inspect-page (fn [& _] nil)
                                                #js {"page_uuid" "00000000-0000-4000-8000-000000000012"
                                       "detail" "everything"}))))

(deftest find-duplicate-titles-reports-dead-stubs-aliases-and-recycled-pages
  (let [calls (atom [])
        aliases (atom #js [])
        inventory #js [#js {"id" 10
                            "uuid" "00000000-0000-4000-8000-000000000010"
                            "title" "Creativity"
                            "name" "creativity"
                            "tags" #js [#js {"id" 1}]}
                       #js {"id" 11
                            "uuid" "00000000-0000-4000-8000-000000000011"
                            "title" "Creativity"
                            "name" "creativity"
                            "logseq.property/deleted-at" 100
                            "tags" #js [#js {"id" 1}]}]
        api (fn [method args]
              (swap! calls conj [method args])
              (let [query (first args)]
                (cond
                  (string/includes? query ":logseq.class/Page") 1
                  (string/includes? query ":logseq.class/Tag") 2
                  (string/includes? query "pull ?e") inventory
                  (string/includes? query "or-join") @aliases
                  (string/includes? query ":block/title \"\"") #js []
                  (string/includes? query "(count ?block)") #js [#js [10 2] #js [11 0]]
                  (string/includes? query "(count ?holder)") #js []
                  :else nil)))]
    (async done
      (-> (p/let [dead-stub (mcp-compat/find-duplicate-titles api #js {"normalize" "exact"})
                  _ (reset! aliases #js [#js [9 11]])
                  alias-group (mcp-compat/find-duplicate-titles api #js {"normalize" "exact"})
                  _ (reset! aliases #js [])
                  live-only (mcp-compat/find-duplicate-titles
                             api #js {"normalize" "exact" "include_recycled" false})]
            [dead-stub alias-group live-only])
          (p/then (fn [[dead-stub alias-group live-only]]
                    (let [stub-group (first (:groups dead-stub))
                          alias-group (first (:groups alias-group))]
                      (is (= "dead_stub" (:classification stub-group)))
                      (is (= 0 (:rank stub-group)))
                      (is (true? (some :recycled (:members stub-group))))
                      (is (= "alias" (:classification alias-group)))
                      (is (= 5 (:rank alias-group)))
                      (is (= 1 (:titles_examined live-only)))
                      (is (= [] (:groups live-only)))
                      (is (every? #(= "logseq.DB.datascriptQuery" (first %)) @calls)))
                    (done)))
          (p/catch (fn [error]
                     (is false (str error))
                     (done)))))))

(deftest find-duplicate-titles-rejects-unknown-normalization
  (is (thrown-with-msg? js/Error #"normalize must be exact, loose, or fuzzy"
                        (mcp-compat/find-duplicate-titles
                         (fn [& _] nil) #js {"normalize" "aggressive"}))))

(deftest get-property-users-preserves-literals-and-resolves-entities
  (let [calls (atom [])
        api (fn [method args]
              (swap! calls conj [method args])
              (if (string/includes? (first args) "pull ?holder")
                #js [#js [#js {"uuid" "holder-1"} true]
                     #js [#js {"uuid" "holder-2"} 99]
                     #js [#js {"uuid" "holder-3"} "literal"]]
                #js [#js {"id" 99 "title" "Resolved value" "value" "green"}]))]
    (async done
      (p/then (mcp-compat/get-property-users api
                                             #js {"property_ident" ":user.property/flag"})
              (fn [users]
                (is (= 3 (count users)))
                (is (true? (:value (first users))))
                (is (nil? (:value_entity (first users))))
                (is (= "Resolved value" (get-in users [1 :value_entity :title])))
                (is (= "literal" (:value (nth users 2))))
                (is (nil? (:value_entity (nth users 2))))
                (is (= 2 (count @calls)))
                (is (every? #(= "logseq.DB.datascriptQuery" (first %)) @calls))
                (done))))))

(deftest get-property-users-rejects-non-ident-input
  (is (thrown-with-msg? js/Error #"exact namespaced property ident"
                        (mcp-compat/get-property-users (fn [& _] nil)
                                                      #js {"property_ident" "Flag"}))))

(deftest create-property-verifies-assigned-ident-and-stored-type
  (let [calls (atom [])
        response #js {"ident" ":plugin.property._test_plugin/Budget"}
        property #js {"id" 19
                      "uuid" "property-uuid"
                      "ident" ":plugin.property._test_plugin/Budget"
                      "title" "Budget"
                      "logseq.property/type" "number"
                      "db/cardinality" "db.cardinality/one"}
        api (fn [method args]
              (swap! calls conj [method args])
              (if (= method "logseq.DB.upsertProperty") response property))]
    (async done
      (p/then (mcp-compat/create-property api
                                          #js {"title" "Budget"
                                               "schema" #js {"type" "number"}
                                               "options" #js {}
                                               "verbose" true})
              (fn [result]
                (is (true? (:verified result)))
                (is (= ":plugin.property._test_plugin/Budget"
                       (get-in result [:verified_state :ident])))
                (is (= "number" (get-in result [:verified_state :logseq.property/type])))
                (is (= "cardinality is db.cardinality/one" (:diagnostic result)))
                (is (= ["logseq.DB.upsertProperty" "logseq.DB.datascriptQuery"]
                       (mapv first @calls)))
                (done))))))

(deftest create-property-terse-response-retains-ident
  (let [api (fn [method _args]
              (if (= method "logseq.DB.upsertProperty")
                #js {"ident" ":plugin.property._test_plugin/Count"}
                #js {"uuid" "property-uuid"
                     "ident" ":plugin.property._test_plugin/Count"
                     "title" "Count"
                     "logseq.property/type" "number"}))]
    (async done
      (p/then (mcp-compat/create-property api
                                          #js {"title" "Count"
                                               "schema" #js {"type" "number"}
                                               "verbose" false})
              (fn [result]
                (is (true? (:verified result)))
                (is (= ":plugin.property._test_plugin/Count" (:ident result)))
                (is (= "property-uuid" (:uuid result)))
                (is (not (contains? result :verified_state)))
                (done))))))

(deftest create-property-rejects-namespaced-title-before-writing
  (let [calls (atom [])]
    (is (thrown-with-msg? js/Error #"plain title"
                          (mcp-compat/create-property
                           (fn [method args]
                             (swap! calls conj [method args]))
                           #js {"title" "user.property/Budget"
                                "schema" #js {"type" "number"}})))
    (is (empty? @calls))))

(deftest delete-property-refuses-value-loss-without-acknowledgement
  (let [ident ":plugin.property._test_plugin/Flag"
        calls (atom [])
        property #js {"id" 41 "ident" ident "title" "Flag"}
        api (fn [method args]
              (swap! calls conj [method args])
              (when (and (= method "logseq.DB.datascriptQuery")
                         (string/includes? (first args) "pull ?property"))
                property)
              (if (and (= method "logseq.DB.datascriptQuery")
                       (string/includes? (first args) "pull ?holder"))
                #js [#js [#js {"uuid" "holder-1"} true]]
                (when (and (= method "logseq.DB.datascriptQuery")
                           (string/includes? (first args) "pull ?property"))
                  property)))]
    (async done
      (p/then (mcp-compat/delete-property api #js {"property_ident" ident})
              (fn [result]
                (is (false? (:verified result)))
                (is (string/includes? (:diagnostic result) "acknowledge_value_loss=true"))
                (is (some? (:previous_state result)))
                (is (not-any? #(contains? #{"logseq.DB.removeProperty"
                                            "logseq.DB.removeBlock"}
                                          (first %))
                              @calls))
                (done))))))

(deftest delete-property-verifies-removal-and-sweeps-value-blocks
  (let [ident ":plugin.property._test_plugin/Flag"
        calls (atom [])
        property-present (atom true)
        usage-reads (atom 0)
        property #js {"id" 41 "ident" ident "title" "Flag"}
        api (fn [method args]
              (swap! calls conj [method args])
              (case method
                "logseq.DB.removeProperty" (do (reset! property-present false) nil)
                "logseq.DB.removeBlock" nil
                "logseq.DB.datascriptQuery"
                (let [query (first args)]
                  (cond
                    (string/includes? query "created-from-property") #js ["value-block"]
                    (string/includes? query "pull ?holder")
                    (if (= 1 (swap! usage-reads inc))
                      #js [#js [#js {"uuid" "holder-1"} true]]
                      #js [])
                    (string/includes? query "pull ?property")
                    (when @property-present property)
                    :else nil))
                nil))]
    (async done
      (p/then (mcp-compat/delete-property
               api #js {"property_ident" ident "acknowledge_value_loss" true})
              (fn [result]
                (is (true? (:verified result)))
                (is (string/includes? (:diagnostic result) "swept 1 orphaned value block"))
                (is (some #(= "logseq.DB.removeProperty" (first %)) @calls))
                (is (some #(= "logseq.DB.removeBlock" (first %)) @calls))
                (done))))))

(deftest delete-property-rejects-non-ident-before-querying
  (let [calls (atom [])]
    (is (thrown-with-msg? js/Error #"exact namespaced property ident"
                          (mcp-compat/delete-property
                           (fn [method args] (swap! calls conj [method args]))
                           #js {"property_ident" "Flag"})))
    (is (empty? @calls))))

(deftest remove-property-clears-only-the-target-value-and-verifies
  (let [target-uuid "00000000-0000-4000-8000-000000000031"
        ident ":plugin.property._test_plugin/Score"
        calls (atom [])
        present? (atom true)
        api (fn [method args]
              (swap! calls conj [method args])
              (case method
                "logseq.DB.removeBlockProperty" (do (reset! present? false) nil)
                "logseq.DB.datascriptQuery"
                (let [query (first args)]
                  (cond
                    (string/includes? query "block/uuid #uuid")
                    (cond-> {:id 10 :uuid target-uuid :title "Target"}
                      @present? (assoc (keyword ident) 7))
                    (string/includes? query "db/ident")
                    {:id 20 :ident ident :title "Score"}
                    :else nil))
                nil))]
    (async done
      (-> (p/then (mcp-compat/remove-property api
                                             #js {"target_uuid" target-uuid
                                                  "property_ident" ident})
                  (fn [result]
                    (is (true? (:verified result)))
                    (is (= target-uuid (get-in result [:verified_state :uuid])))
                    (is (some #(= "logseq.DB.removeBlockProperty" (first %)) @calls))))
          (p/catch (fn [error]
                     (is false (str error))))
          (p/finally done)))))

(deftest remove-property-reports-a-no-op-removal
  (let [target-uuid "00000000-0000-4000-8000-000000000032"
        ident ":plugin.property._test_plugin/Score"
        api (fn [_method args]
              (if (string/includes? (first args) "db/ident")
                {:id 20 :ident ident :title "Score"}
                (assoc {:id 10 :uuid target-uuid :title "Target"}
                       (keyword ident) 7)))]
    (async done
      (-> (p/then (mcp-compat/remove-property api
                                             #js {"target_uuid" target-uuid
                                                  "property_ident" ident})
                  (fn [_]
                    (is false "removeProperty should fail when the value remains")))
          (p/catch (fn [error]
                     (is (string/includes? (.-message error) "still set on the target"))))
          (p/finally done)))))

(deftest add-property-verifies-a-materialized-literal-value
  (let [target-uuid "00000000-0000-4000-8000-000000000021"
        ident ":plugin.property._test_plugin/Score"
        calls (atom [])
        written? (atom false)
        target (fn []
                 (cond-> {"id" 10 "uuid" target-uuid "title" "Target"}
                   @written? (assoc ident {:id 55})))
        api (fn [method args]
              (swap! calls conj [method args])
              (case method
                "logseq.DB.upsertBlockProperty" (do (reset! written? true) #js {"ok" true})
                "logseq.DB.datascriptQuery"
                (let [query (first args)]
                  (cond
                    (string/includes? query "block/uuid #uuid") (clj->js (target))
                    (string/includes? query "?e ?a _")
                    #js [#js {"id" 55 "logseq.property/value" 5}]
                    (string/includes? query ":db/ident")
                    #js {"id" 20 "ident" ident "title" "Score"
                         "logseq.property/type" "number"
                         "db/cardinality" "db.cardinality/one"}
                    :else nil))
                nil))]
    (async done
            (-> (p/then (mcp-compat/add-property api
                   #js {"target_uuid" target-uuid
                        "property_ident" ident
                        "value" 5})
              (fn [result]
                (is (true? (:verified result)))
                (is (= target-uuid (get-in result [:verified_state :uuid])))
                (is (= "logseq.DB.upsertBlockProperty"
                  (first (nth @calls 2))))
                (done)))
           (p/catch (fn [error]
            (is false (str error))
            (done)))))))

(deftest reference-property-values-must-be-entity-ids
  (is (false? (mcp-compat/valid-reference-property-value? "not-an-entity")))
  (is (true? (mcp-compat/valid-reference-property-value? 859)))
  (is (true? (mcp-compat/valid-reference-property-value? {:id 859})))
  (is (false? (mcp-compat/valid-reference-property-value? true))))

(deftest add-property-skips-a-duplicate-many-value
  (let [target-uuid "00000000-0000-4000-8000-000000000023"
        ident ":plugin.property._test_plugin/Labels"
        calls (atom [])
        api (fn [method args]
              (swap! calls conj [method args])
                  (let [query (first args)]
                 (cond
                   (string/includes? query "block/uuid #uuid")
                   #js {"id" 10 "uuid" target-uuid "title" "Target"
                     ":plugin.property._test_plugin/Labels" #js {"id" 55}}
                   (string/includes? query "?e ?a _")
                   #js [#js {"id" 55 "logseq.property/value" "alpha"}]
                   (string/includes? query "db/ident")
                   #js {"id" 20 "ident" ident "title" "Labels"
                     "logseq.property/type" "default"
                     "db/cardinality" "db.cardinality/many"}
                   :else nil)))]
    (async done
      (-> (p/then (mcp-compat/add-property api
                                           #js {"target_uuid" target-uuid
                                                "property_ident" ident
                                                "value" "alpha"})
                  (fn [result]
                    (is (true? (:verified result)))
                    (is (string/includes? (:diagnostic result) "duplicate"))
                    (is (not-any? #(= "logseq.DB.upsertBlockProperty" (first %)) @calls))
                    (done)))
          (p/catch (fn [error]
                     (is false (str error))
                     (done)))))))

(deftest creat-tag-verifies-the-generated-identity
  (let [calls (atom [])
        tag-uuid "00000000-0000-4000-8000-000000000041"
        response #js {"uuid" tag-uuid "ident" ":plugin.class._test_plugin/Topic"}
        tag #js {"id" 41 "uuid" tag-uuid "ident" ":plugin.class._test_plugin/Topic"
                 "title" "Topic" "tags" #js [#js {"ident" "logseq.class/Tag"}]}
        api (fn [method args]
              (swap! calls conj [method args])
              (case method
                "logseq.DB.createTag" response
                (if (string/includes? (first args) "block/name")
                  #js []
                  tag)))]
    (async done
      (p/then (mcp-compat/create-tag api #js {"title" "Topic"})
              (fn [result]
                (is (true? (:verified result)))
                (is (= tag-uuid (get-in result [:verified_state :uuid])))
                (is (= ":plugin.class._test_plugin/Topic"
                       (get-in result [:verified_state :ident])))
                (is (= ["logseq.DB.datascriptQuery" "logseq.DB.createTag"
                        "logseq.DB.datascriptQuery"]
                       (mapv first @calls)))
                (done))))))

(deftest creat-tag-refuses-an-existing-page-title-before-writing
  (let [calls (atom [])
        api (fn [method args]
              (swap! calls conj [method args])
              #js [#js {"uuid" "existing-page" "title" "Topic" "name" "topic"}])]
    (async done
      (-> (p/then (mcp-compat/create-tag api #js {"title" "Topic"})
                  (fn [_]
                    (is false "creatTag should refuse title collisions")
                    (done)))
          (p/catch (fn [error]
                     (is (string/includes? (.-message error) "already exists"))
                     (is (= 1 (count @calls)))
                     (done)))))))

(deftest delete-tag-requires-detach-acknowledgement-before-writing
  (let [tag-uuid "00000000-0000-4000-8000-000000000051"
        calls (atom [])
        api (fn [method args]
              (swap! calls conj [method args])
              (let [query (first args)]
                (cond
                  (string/includes? query "pull ?tag")
                  {:id 51 :uuid tag-uuid :ident ":plugin.class._test_plugin/Topic"
                   :title "Topic"}
                  (string/includes? query "pull ?child") []
                  (string/includes? query "pull ?holder")
                  [{:uuid "holder-1" :title "Uses Topic"}]
                  :else [])))]
    (async done
      (p/then (mcp-compat/delete-tag api #js {"tag_uuid" tag-uuid})
              (fn [result]
                (is (false? (:verified result)))
                (is (string/includes? (:diagnostic result) "acknowledge_detach=true"))
                (is (some? (:previous_state result)))
                (is (not-any? #(= "logseq.DB.deletePage" (first %)) @calls))
                (done))))))

(deftest delete-tag-requires-child-reparent-acknowledgement
  (let [tag-uuid "00000000-0000-4000-8000-000000000052"
        api (fn [_method args]
              (let [query (first args)]
                (if (string/includes? query "pull ?tag")
                  {:id 52 :uuid tag-uuid :ident ":plugin.class._test_plugin/Parent"
                   :title "Parent"}
                  [{:uuid "child-tag" :title "Child"}])))]
    (async done
      (-> (p/then (mcp-compat/delete-tag api #js {"tag_uuid" tag-uuid})
                  (fn [_]
                    (is false "deleteTag should require child reparent acknowledgement")
                    (done)))
          (p/catch (fn [error]
                     (is (string/includes? (.-message error) "acknowledge_child_reparent=true"))
                     (done)))))))

(deftest delete-tag-verifies-deletion-and-reference-cleanup
  (let [tag-uuid "00000000-0000-4000-8000-000000000053"
        calls (atom [])
        present? (atom true)
        api (fn [method args]
              (swap! calls conj [method args])
              (case method
                "logseq.DB.deletePage" (do (reset! present? false) nil)
                "logseq.DB.datascriptQuery"
                (let [query (first args)]
                  (cond
                    (string/includes? query "pull ?tag")
                    (when @present?
                      {:id 53 :uuid tag-uuid :ident ":plugin.class._test_plugin/Leaf"
                       :title "Leaf"})
                    (string/includes? query "pull ?child") []
                    :else []))
                nil))]
    (async done
      (p/then (mcp-compat/delete-tag
               api #js {"tag_uuid" tag-uuid
                        "acknowledge_child_reparent" true
                        "acknowledge_detach" true
                        "verbose" false})
              (fn [result]
                (is (true? (:verified result)))
                (is (= tag-uuid (:uuid result)))
                (is (some #(= "logseq.DB.deletePage" (first %)) @calls))
                (done))))))

(deftest add-tag-verifies-the-tag-relation-and-preserves-page-identity
  (let [target-uuid "00000000-0000-4000-8000-000000000061"
        tag-uuid "00000000-0000-4000-8000-000000000062"
        calls (atom [])
        added? (atom false)
        target (fn []
                 {:id 61 :uuid target-uuid :name "inbox" :title "Inbox"
                  :tags (cond-> [{:id 1 :ident :logseq.class/Page}]
                          @added? (conj {:id 62 :ident :plugin.class/topic}))})
        api (fn [method args]
              (swap! calls conj [method args])
              (case method
                "logseq.DB.addBlockTag" (do (reset! added? true) nil)
                "logseq.DB.datascriptQuery"
                (let [query (first args)]
                  (cond
                    (string/includes? query "block/uuid #uuid") (target)
                    (string/includes? query "db/ident :logseq.class/Tag") 1
                    (string/includes? query "?tag")
                    {:id 62 :uuid tag-uuid :ident ":plugin.class._test_plugin/topic"
                     :title "Topic" :tags [{:id 1 :ident :logseq.class/Tag}]}
                    :else nil))
                nil))]
            (is (thrown? js/Error
                   (mcp-compat/add-tag api #js {"target_uuid" "invalid" "tag_uuid" tag-uuid})))
            (is (thrown? js/Error
                   (mcp-compat/add-tag api #js {"target_uuid" target-uuid "tag_uuid" "invalid"})))
            (is (empty? @calls))
    (async done
      (-> (p/then (mcp-compat/add-tag api #js {"target_uuid" target-uuid "tag_uuid" tag-uuid})
                  (fn [result]
                    (is (true? (:verified result)))
                    (is (= "inbox" (get-in result [:verified_state :name])))
                    (is (some #(= "logseq.DB.addBlockTag" (first %)) @calls))
                    (done)))
          (p/catch (fn [error]
                     (is false (str "addTag unexpectedly failed: " (.-message error)))
                     (done)))))))

(deftest remove-tag-preserves-other-tags-and-page-identity
  (let [target-uuid "00000000-0000-4000-8000-000000000071"
        tag-uuid "00000000-0000-4000-8000-000000000072"
        calls (atom [])
        removed? (atom false)
        target (fn []
                 {:id 71 :uuid target-uuid :name "inbox" :title "Inbox"
                  :tags (cond-> [{:id 1 :ident :logseq.class/Page}
                                 {:id 73 :ident :plugin.class/keepme}]
                          (not @removed?) (conj {:id 72 :ident :plugin.class/topic}))})
        api (fn [method args]
              (swap! calls conj [method args])
              (case method
                "logseq.DB.removeBlockTag" (do (reset! removed? true) nil)
                "logseq.DB.datascriptQuery"
                (let [query (first args)]
                  (cond
                    (string/includes? query "block/uuid #uuid") (target)
                    (string/includes? query "db/ident :logseq.class/Tag") 1
                    (string/includes? query "?tag")
                    {:id 72 :uuid tag-uuid :ident ":plugin.class._test_plugin/topic"
                     :title "Topic" :tags [{:id 1 :ident :logseq.class/Tag}]}
                    :else nil))
                nil))]
    (is (thrown? js/Error
                 (mcp-compat/remove-tag api #js {"target_uuid" "invalid" "tag_uuid" tag-uuid})))
    (is (thrown? js/Error
                 (mcp-compat/remove-tag api #js {"target_uuid" target-uuid "tag_uuid" "invalid"})))
    (is (empty? @calls))
    (async done
      (-> (p/then (mcp-compat/remove-tag api #js {"target_uuid" target-uuid "tag_uuid" tag-uuid
                                                   "verbose" true})
                  (fn [result]
                    (let [tag-ids (set (map :id (get-in result [:verified_state :tags])))]
                      (is (true? (:verified result)))
                      (is (= "inbox" (get-in result [:verified_state :name])))
                      (is (not (contains? tag-ids 72)))
                      (is (contains? tag-ids 73))
                      (is (some #(= "logseq.DB.removeBlockTag" (first %)) @calls)))
                    (done)))
          (p/catch (fn [error]
                     (is false (str "removeTag unexpectedly failed: " (.-message error)))
                     (done)))))))