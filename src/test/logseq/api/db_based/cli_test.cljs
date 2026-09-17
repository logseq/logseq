(ns logseq.api.db-based.cli-test
  (:require [cljs.test :refer [async deftest is use-fixtures]]
            [frontend.state :as state]
            [frontend.test.helper :as test-helper]
            [logseq.api :as api]
            [logseq.api.db-based :as db-based-api]
            [logseq.api.db-based.cli :as cli-api]
            [logseq.api.test-helper :as api-test]
            [promesa.core :as p]))

(use-fixtures :each {:before api-test/start-plugin-api-db!
                     :after api-test/destroy-plugin-api-db!})

(deftest list-endpoints-return-graph-entities
  (async done
    (test-helper/load-test-files
     [{:page {:block/title "Cli Page"}
       :blocks [{:block/title "cli block"}]}])
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [_ (db-based-api/create-tag "CliTag" nil)
                    _ (db-based-api/upsert-property "cli-prop" nil nil)
                    tags (cli-api/list-tags #js {:expand true})
                    properties (cli-api/list-properties #js {})
                    pages (cli-api/list-pages #js {})
                    page-data (cli-api/get-page-data "Cli Page")
                    missing (cli-api/get-page-data "Missing Page")
                    tag-titles (set (map :block/title (js->clj tags :keywordize-keys true)))
                    property-titles (set (map :block/title (js->clj properties :keywordize-keys true)))
                    page-titles (set (map :block/title (js->clj pages :keywordize-keys true)))]
              (is (contains? tag-titles "CliTag"))
              (is (contains? property-titles "cli-prop"))
              (is (contains? page-titles "Cli Page"))
              (is (= "Cli Page" (aget page-data "entity" "block/title")))
              (is (pos? (count (aget page-data "blocks"))))
              (is (some? (aget missing "error"))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest upsert-nodes-dry-run-summarizes-operations
  (async done
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [summary (cli-api/upsert-nodes
                             #js [#js {:operation "add"
                                       :entityType "page"
                                       :id "p1"
                                       :data #js {:title "Upserted Page"}}
                                  #js {:operation "add"
                                       :entityType "block"
                                       :data #js {:title "Upserted Block"
                                                  :page-id "p1"}}]
                             #js {:dry-run true})]
              (is (re-find #"Dry run" summary))
              (is (re-find #"Added" summary)))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest import-and-export-require-db-graph
  (with-redefs [state/get-current-repo (constantly "file://notes")]
    (is (thrown-with-msg?
         js/Error
         #"This endpoint must be called on a DB graph"
         (api/import_edn "{}")))
    (is (thrown-with-msg?
         js/Error
         #"This endpoint must be called on a DB graph"
         (api/export_edn #js {})))))

(deftest export-edn-surfaces-worker-error
  (async done
    (-> (api-test/with-plugin-api
          (fn []
            (-> (cli-api/export-edn #js {})
                (p/then (fn [_]
                          (is false "export-edn should fail in unit tests")))
                (p/catch (fn [error]
                           (is (re-find #"Export EDN Error" (str error))))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))
