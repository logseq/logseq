(ns logseq.publish.common-test
  (:require [cljs.test :refer [async deftest is testing]]
            [logseq.publish.common :as publish-common]
            [promesa.core :as p]))

(deftest merge-headers-overrides-and-preserves-values
  (let [headers (publish-common/merge-headers #js {"a" "1" "keep" "ok"}
                                              #js {"a" "2" "b" "3"})]
    (is (= "2" (.get headers "a")))
    (is (= "3" (.get headers "b")))
    (is (= "ok" (.get headers "keep")))))

(deftest parse-meta-header-valid-and-invalid-json
  (testing "valid json meta header is parsed into keywordized map"
    (let [request (js/Request. "https://publish.example/pages"
                               #js {:headers #js {"x-publish-meta" "{\"content_hash\":\"h\",\"graph\":\"g\",\"page_uuid\":\"p\"}"}})
          meta (publish-common/parse-meta-header request)]
      (is (= "h" (:content_hash meta)))
      (is (= "g" (:graph meta)))
      (is (= "p" (:page_uuid meta)))))
  (testing "invalid json returns nil"
    (let [request (js/Request. "https://publish.example/pages"
                               #js {:headers #js {"x-publish-meta" "{not-json"}})]
      (is (nil? (publish-common/parse-meta-header request))))))

(deftest valid-meta-requires-core-fields
  (is (some? (publish-common/valid-meta? {:content_hash "h" :graph "g" :page_uuid "p"})))
  (is (nil? (publish-common/valid-meta? {:content_hash "h" :graph "g"})))
  (is (nil? (publish-common/valid-meta? nil))))

(deftest get-sql-rows-handles-supported-shapes
  (is (= [] (publish-common/get-sql-rows nil)))
  (is (= [{"a" 1}]
         (js->clj (publish-common/get-sql-rows #js {:rows #js [#js {"a" 1}]})
                  :keywordize-keys false)))
  (let [row (js-obj)]
    (aset row "rows" #js [#js {"b" 2}])
    (is (= [{"rows" [{"b" 2}]}]
           (js->clj (publish-common/get-sql-rows #js [row])
                    :keywordize-keys false)))))

(deftest json-error-response-helpers-set-status
  (async done
    (-> (p/let [unauthorized (publish-common/unauthorized)
                forbidden (publish-common/forbidden)
                bad-request (publish-common/bad-request "bad")
                not-found (publish-common/not-found)
                unauthorized-body (.json unauthorized)
                forbidden-body (.json forbidden)
                bad-request-body (.json bad-request)
                not-found-body (.json not-found)]
          (is (= 401 (.-status unauthorized)))
          (is (= 403 (.-status forbidden)))
          (is (= 400 (.-status bad-request)))
          (is (= 404 (.-status not-found)))
          (is (= "unauthorized" (aget unauthorized-body "error")))
          (is (= "forbidden" (aget forbidden-body "error")))
          (is (= "bad" (aget bad-request-body "error")))
          (is (= "not found" (aget not-found-body "error")))
          (done))
        (p/catch (fn [error]
                   (is nil (str error))
                   (done))))))

(deftest normalize-etag-removes-double-quotes
  (is (= "abc" (publish-common/normalize-etag "\"abc\"")))
  (is (= "abc" (publish-common/normalize-etag "abc")))
  (is (nil? (publish-common/normalize-etag nil))))

(deftest encode-path-encodes-path-segments
  (is (= "with%20space/plus%2Bsign" (publish-common/encode-path "with space/plus+sign"))))

(deftest short-id-for-page-is-deterministic-and-fixed-length
  (async done
    (-> (p/let [a (publish-common/short-id-for-page "graph-1" "page-1")
                b (publish-common/short-id-for-page "graph-1" "page-1")
                c (publish-common/short-id-for-page "graph-1" "page-2")]
          (is (= 10 (count a)))
          (is (= a b))
          (is (not= a c))
          (done))
        (p/catch (fn [error]
                   (is nil (str error))
                   (done))))))

(deftest hash-and-verify-password-roundtrip
  (async done
    (-> (p/let [hashed (publish-common/hash-password "secret-value")
                ok? (publish-common/verify-password "secret-value" hashed)
                wrong? (publish-common/verify-password "wrong-value" hashed)]
          (is (string? hashed))
          (is (true? ok?))
          (is (false? wrong?))
          (done))
        (p/catch (fn [error]
                   (is nil (str error))
                   (done))))))

(deftest verify-password-rejects-invalid-hash-format
  (is (false? (publish-common/verify-password "secret" "not-a-valid-hash"))))
