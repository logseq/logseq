(ns logseq.api.db-test
  (:require [cljs.test :refer [async deftest is use-fixtures]]
            [frontend.db.query-custom :as query-custom]
            [frontend.db.query-dsl :as query-dsl]
            [frontend.state :as state]
            [frontend.test.helper :as test-helper]
            [logseq.api.db :as api-db]
            [logseq.api.test-helper :as api-test]
            [promesa.core :as p]))

(use-fixtures :each {:before api-test/start-plugin-api-db!
                     :after api-test/destroy-plugin-api-db!})

(deftest datascript-query-runs-against-test-db
  (async done
    (test-helper/load-test-files
     [{:page {:block/title "Query Page"}
       :blocks [{:block/title "query-target"}]}])
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [result (api-db/datascript_query
                            "[:find ?title :where [?b :block/title ?title]]")
                    titles (set (map first (js->clj result)))]
              (is (contains? titles "query-target")))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest datascript-query-resolves-current-page-input
  (async done
    (test-helper/load-test-files
     [{:page {:block/title "Current Query Page"}
       :blocks [{:block/title "on current page"}]}])
    (let [page (test-helper/find-page-by-title "Current Query Page")]
      (-> (api-test/with-plugin-api
            (fn []
              (p/with-redefs [state/get-current-page (constantly (str (:block/uuid page)))]
                (p/let [result (api-db/datascript_query
                                "[:find ?title :in $ ?page :where [?p :block/name ?page] [?b :block/page ?p] [?b :block/title ?title]]"
                                ":current-page")
                        titles (set (map first (js->clj result)))]
                  (is (contains? titles "on current page"))))))
          (p/catch (fn [error]
                     (is false (str error))))
          (p/finally done)))))

(deftest dsl-and-custom-query-normalize-results
  (async done
    (-> (p/with-redefs [query-dsl/query (fn [_repo query-string]
                                          (p/resolved [[{:block/title query-string}]]))
                        query-custom/custom-query (fn [query]
                                                    (p/resolved [[{:block/title (str (:query query))}]]))]
          (p/let [dsl-result (api-db/q "(page Query Page)")
                  custom-result (api-db/custom_query "[:find ?b :where [?b :block/title]]")]
            (is (= "(page Query Page)" (aget dsl-result 0 "title")))
            (is (some? custom-result))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest set-file-content-validates-path-and-type
  (is (thrown-with-msg?
       js/Error
       #"content should be a string"
       (api-db/set_file_content "logseq/custom.css" 1)))
  (is (thrown-with-msg?
       js/Error
       #"Invalid path"
       (api-db/set_file_content "secrets/config.edn" "nope"))))

(deftest file-content-round-trip
  (async done
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [_ (api-db/set_file_content "logseq/custom.css" "body { color: red; }")
                    content (api-db/get_file_content "logseq/custom.css")]
              (is (= "body { color: red; }" content)))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))
