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