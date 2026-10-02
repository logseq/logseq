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
        api (recording-api calls :ok)
        operations #js []]
    (is (= :ok (mcp-compat/get-page api #js {"pageName" "Inbox"})))
    (is (= :ok (mcp-compat/list-pages api #js {"expand" true})))
    (is (= :ok (mcp-compat/list-tags api #js {"expand" false})))
    (is (= :ok (mcp-compat/list-properties api #js {"expand" true})))
    (is (= :ok (mcp-compat/search-blocks api #js {"searchTerm" "needle"})))
    (is (= :ok (mcp-compat/upsert-nodes api #js {"operations" operations
                                                  "dry-run" true})))
    (is (= ["logseq.cli.getPageData" ["Inbox"]]
           (first @calls)))
    (is (= "logseq.cli.listPages" (first (second @calls))))
    (is (= true (aget (first (second (second @calls))) "expand")))
    (is (= "logseq.cli.listTags" (first (nth @calls 2))))
    (is (= "logseq.cli.listProperties" (first (nth @calls 3))))
    (is (= ["logseq.app.search" "needle"]
           [(first (nth @calls 4)) (first (second (nth @calls 4)))]))
    (is (= "logseq.cli.upsertNodes" (first (nth @calls 5))))
    (is (identical? operations (first (second (nth @calls 5)))))
    (is (= true (aget (second (second (nth @calls 5))) "dry-run")))))

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