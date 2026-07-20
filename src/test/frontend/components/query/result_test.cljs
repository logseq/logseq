(ns frontend.components.query.result-test
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
            [frontend.components.query.result :as query-result]
            [frontend.db.hooks :as db-hooks]))

(defn- source-for
  [relative-file]
  (.toString
   (fs/readFileSync (node-path/join (.cwd js/process) relative-file) "utf8")))

(defn- form-source
  [source marker]
  (let [start (string/index-of source marker)
        end (when start
              (or (some->> ["\n(hsx/defc "
                            "\n(defn"
                            "\n(def "
                            "\n(declare "]
                           (keep #(string/index-of source % (inc start)))
                           seq
                           (apply min))
                  (count source)))]
    (when (and start end)
      (subs source start end))))

(deftest custom-query-subscribes-to-serialized-worker-resources-test
  (let [current-block-uuid (random-uuid)
        dsl-row-uuid (random-uuid)
        datalog-row-uuid (random-uuid)
        resource-keys (atom [])
        dsl-query {:query "(task TODO)"
                   :remove-block-children? false
                   :result-transform '(partial sort-by :block/title)}
        datalog-form '[:find (pull ?block [:block/uuid])
                       :in $ ?day %
                       :where
                       [?block :block/journal-day ?day]
                       (journal-block ?block)]
        rules '[[(journal-block ?block)
                 [?block :block/journal-day]]]
        datalog-query {:query datalog-form
                       :inputs [:today]
                       :rules rules}]
    (with-redefs [db-hooks/use-resource
                  (fn [resource-key]
                    (swap! resource-keys conj resource-key)
                    {:rows [(if (= :dsl (get-in resource-key [1 :kind]))
                              dsl-row-uuid
                              datalog-row-uuid)]})]
      (is (= [dsl-row-uuid]
             (query-result/use-query-result
              {:dsl-query? true
               :cards? true
               :current-block-uuid current-block-uuid
               :block/uuid current-block-uuid}
              dsl-query)))
      (is (= [datalog-row-uuid]
             (query-result/use-query-result
              {:dsl-query? false
               :today-day 20260721
               :current-block-uuid current-block-uuid
               :block/uuid current-block-uuid}
              datalog-query)))
      (is (= [[:query
               {:kind :dsl
                :query "(task TODO)"
                :cards? true
                :current-block-uuid current-block-uuid
                :remove-block-children? false
                :result-transform-edn
                "(partial sort-by :block/title)"}]
              [:query
               {:kind :datalog
                :query datalog-form
                :inputs [:today]
                :rules rules
                :today-day 20260721
                :current-block-uuid current-block-uuid}]]
             @resource-keys)))))

(deftest query-rendering-owns-no-query-execution-or-result-transform-test
  (let [result-source
        (source-for "src/main/frontend/components/query/result.cljs")
        query-source
        (source-for "src/main/frontend/components/query.cljs")
        run-source (form-source result-source "(defn use-query-result")
        custom-query-source (form-source query-source "(hsx/defc custom-query*")]
    (is (some? run-source))
    (is (some? custom-query-source))
    (when run-source
      (is (string/includes? run-source "[:query"))
      (is (string/includes? run-source "db-hooks/use-resource")))
    (testing "query execution and transformation stay in the worker"
      (doseq [forbidden ["[frontend.db.query-custom"
                         "[frontend.db.query-dsl"
                         "[frontend.db.query-react"
                         "[frontend.modules.outliner.tree"
                         "[frontend.search"
                         "db-hooks/use-query"
                         "query-custom/custom-query"
                         "query-dsl/query"
                         "query-react/custom-query-result-transform"
                         "search/block-search"
                         "tree/filter-top-level-blocks"
                         "(defn transform-query-result"]]
        (is (not (string/includes? result-source forbidden))
            (str "Renderer query execution remains: " forbidden))))
    (when custom-query-source
      (doseq [forbidden ["query-result/transform-query-result"
                         "react/set-q-collapsed!"
                         "ldb/hidden?"
                         ":db/id"]]
        (is (not (string/includes? custom-query-source forbidden))
            (str "Query rendering retains a local result copy: " forbidden))))
    (doseq [source [result-source query-source]
            forbidden ["query-error" "*query-error"]]
      (is (not (string/includes? source forbidden))
          (str "Query rendering retains dead error compatibility state: " forbidden)))
    (is (not (string/includes? query-source
                               "[frontend.db.react :as react]")))))
