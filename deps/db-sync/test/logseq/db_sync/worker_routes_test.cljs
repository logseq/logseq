(ns logseq.db-sync.worker-routes-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.db-sync.worker.routes.index :as routes]
            [logseq.db-sync.worker.routes.semantic :as semantic-routes]))

(deftest match-route-graphs-test
  (testing "graphs routes"
    (let [match (routes/match-route "GET" "/graphs")]
      (is (= :graphs/list (:handler match))))
    (let [match (routes/match-route "POST" "/graphs")]
      (is (= :graphs/create (:handler match))))
    (let [match (routes/match-route "GET" "/graphs/graph-1/access")]
      (is (= :graphs/access (:handler match)))
      (is (= "graph-1" (get-in match [:path-params :graph-id]))))
    (let [match (routes/match-route "GET" "/graphs/graph-2/members")]
      (is (= :graph-members/list (:handler match)))
      (is (= "graph-2" (get-in match [:path-params :graph-id]))))
    (let [match (routes/match-route "POST" "/graphs/graph-3/members")]
      (is (= :graph-members/create (:handler match))))
    (let [match (routes/match-route "PUT" "/graphs/graph-4/members/user-9")]
      (is (= :graph-members/update (:handler match)))
      (is (= "graph-4" (get-in match [:path-params :graph-id])))
      (is (= "user-9" (get-in match [:path-params :member-id]))))
    (let [match (routes/match-route "DELETE" "/graphs/graph-5")]
      (is (= :graphs/delete (:handler match)))
      (is (= "graph-5" (get-in match [:path-params :graph-id]))))))

(deftest match-route-e2ee-test
  (testing "e2ee routes"
    (let [match (routes/match-route "GET" "/e2ee/user-keys")]
      (is (= :e2ee/user-keys-get (:handler match))))
    (let [match (routes/match-route "POST" "/e2ee/user-keys")]
      (is (= :e2ee/user-keys-post (:handler match))))
    (let [match (routes/match-route "GET" "/e2ee/user-public-key")]
      (is (= :e2ee/user-public-key-get (:handler match))))
    (let [match (routes/match-route "GET" "/e2ee/graphs/graph-7/aes-key")]
      (is (= :e2ee/graph-aes-key-get (:handler match)))
      (is (= "graph-7" (get-in match [:path-params :graph-id]))))
    (let [match (routes/match-route "POST" "/e2ee/graphs/graph-8/aes-key")]
      (is (= :e2ee/graph-aes-key-post (:handler match)))
      (is (= "graph-8" (get-in match [:path-params :graph-id]))))
    (let [match (routes/match-route "POST" "/e2ee/graphs/graph-9/grant-access")]
      (is (= :e2ee/grant-access (:handler match)))
      (is (= "graph-9" (get-in match [:path-params :graph-id]))))))

(deftest match-route-method-mismatch-test
  (testing "method mismatch returns nil"
    (is (nil? (routes/match-route "GET" "/graphs/graph-1/members/user-9")))
    (is (nil? (routes/match-route "PUT" "/e2ee/user-keys")))))

(deftest semantic-internal-routes-ignore-public-only-operations-test
  (is (nil? (semantic-routes/match-internal "GET" "/api/v1/graphs")))
  (is (= :semantic/pages-list
         (:handler (semantic-routes/match-internal "GET" "/semantic/pages")))))

(deftest semantic-block-api-exposes-timestamps-test
  (let [document (semantic-routes/openapi-document "https://issuer.example")
        block-properties (get-in document [:components :schemas :BlockResponse :properties])]
    (is (= {:type "integer"} (:created-at block-properties)))
    (is (= {:type "integer"} (:updated-at block-properties)))
    (is (= {:type "array" :items {:$ref "#/components/schemas/EntitySummary"}}
           (:tags block-properties)))
    (is (= {:type "array" :items {:$ref "#/components/schemas/EntitySummary"}}
           (:references block-properties)))
    (is (= {:$ref "#/components/schemas/PropertyChoice"}
           (:status block-properties)))
    (is (= {:type "string"} (:asset-type block-properties)))
    (is (= {:type "integer"} (:asset-size block-properties)))
    (is (= {:type "string"} (:asset-checksum block-properties)))))

(deftest semantic-create-operations-accept-client-uuids-test
  (let [document (semantic-routes/openapi-document "https://issuer.example")
        schemas (get-in document [:components :schemas])
        create-task (get-in document [:paths "/api/v1/graphs/{graph-id}/tasks" :post])
        task-schema (get-in create-task [:requestBody :content "application/json" :schema])
        asset-parameters (get-in document [:paths "/api/v1/graphs/{graph-id}/assets" :post :parameters])]
    (is (= {:type "string" :format "uuid"}
           (get-in schemas [:BlockTree :properties :uuid])))
    (is (= {:type "string" :format "uuid"}
           (get-in task-schema [:properties :uuid])))
    (is (= {:type "string" :format "uuid"}
           (:schema (first (filter #(= "uuid" (:name %)) asset-parameters)))))))

(deftest semantic-search-block-response-exposes-journal-context-test
  (let [document (semantic-routes/openapi-document "https://issuer.example")
        result-properties (get-in document [:components :schemas :SearchResultResponse :properties])]
    (is (= {:type "string"} (:page-id result-properties)))
    (is (= {:type "integer"} (:created-at result-properties)))
    (is (= {:type "integer"} (:updated-at result-properties)))
    (is (= {:type "integer"} (:journal-day result-properties)))
    (is (= {:type "string"} (:journal-title result-properties)))))

(deftest semantic-block-list-route-test
  (let [public (semantic-routes/match-public "GET" "/api/v1/graphs/graph-1/blocks")
        internal (semantic-routes/match-internal "GET" "/semantic/blocks")]
    (is (= :semantic/blocks-list (:handler public)))
    (is (= "graph-1" (get-in public [:path-params :graph-id])))
    (is (= :semantic/blocks-list (:handler internal)))))

(deftest semantic-move-blocks-route-test
  (is (= :semantic/blocks-move
         (:handler (semantic-routes/match-public "POST" "/api/v1/graphs/graph-1/block-moves"))))
  (is (= :semantic/blocks-move
         (:handler (semantic-routes/match-internal "POST" "/semantic/block-moves"))))
  (is (nil? (semantic-routes/match-public "POST" "/api/v1/graphs/graph-1/blocks/block-1/move"))))

(deftest semantic-reverse-reference-routes-test
  (is (= :semantic/tags-objects
         (:handler (semantic-routes/match-public
                    "GET" "/api/v1/graphs/graph-1/tags/tag-1/objects"))))
  (is (= :semantic/tags-objects
         (:handler (semantic-routes/match-internal "GET" "/semantic/tags/tag-1/objects"))))
  (is (= :semantic/pages-references
         (:handler (semantic-routes/match-public
                    "GET" "/api/v1/graphs/graph-1/pages/page-1/references"))))
  (is (= :semantic/pages-references
         (:handler (semantic-routes/match-internal "GET" "/semantic/pages/page-1/references")))))

(deftest semantic-block-reference-route-test
  (is (= :semantic/blocks-references
         (:handler (semantic-routes/match-public
                    "GET" "/api/v1/graphs/graph-1/blocks/block-1/references"))))
  (is (= :semantic/blocks-references
         (:handler (semantic-routes/match-internal
                    "GET" "/semantic/blocks/block-1/references")))))

(deftest semantic-task-routes-test
  (doseq [[method handler] [["GET" :semantic/tasks-list]
                            ["POST" :semantic/tasks-create]]]
    (is (= handler
           (:handler (semantic-routes/match-public method "/api/v1/graphs/graph-1/tasks"))))
    (is (= handler
           (:handler (semantic-routes/match-internal method "/semantic/tasks"))))))

(deftest semantic-asset-collection-routes-test
  (doseq [[method handler] [["GET" :semantic/assets-list]
                            ["POST" :semantic/assets-create]]]
    (is (= handler
           (:handler (semantic-routes/match-public method "/api/v1/graphs/graph-1/assets"))))
    (is (= handler
           (:handler (semantic-routes/match-internal method "/semantic/assets"))))))

(deftest encrypted-semantic-write-allowlist-test
  (doseq [[method path expected]
          [["POST" "/api/v1/graphs/graph-1/capture" true]
           ["POST" "/api/v1/graphs/graph-1/tasks" true]
           ["POST" "/api/v1/graphs/graph-1/assets" true]
           ["PATCH" "/api/v1/graphs/graph-1/blocks/block-1" true]
           ["PUT" "/api/v1/graphs/graph-1/blocks/block-1/properties/status-id" true]
           ["GET" "/api/v1/graphs/graph-1/blocks" false]
           ["DELETE" "/api/v1/graphs/graph-1/blocks/block-1" false]
           ["DELETE" "/api/v1/graphs/graph-1/blocks/block-1/properties/status-id" false]]]
    (is (= expected
           (true? (:e2ee-safe-write? (semantic-routes/match-public method path))))
        (str method " " path))))
