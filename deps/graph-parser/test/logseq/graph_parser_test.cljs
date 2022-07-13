(ns logseq.graph-parser-test
  (:require [cljs.test :refer [deftest testing is]]
            [logseq.graph-parser :as graph-parser]
            [logseq.db :as ldb]
            [logseq.graph-parser.block :as gp-block]
            [datascript.core :as d]))

(def foo-edn
  "Example exported whiteboard page as an edn exportable."
  '{:blocks
    [{:block/content "foo content",
      :block/format :markdown,
      :block/unordered true}],
    :pages
    ({:block/format :markdown,
      :block/whiteboard? true,
      :block/original-name "my foo whiteboard"})})

(deftest parse-file
  (testing "id properties"
    (let [conn (ldb/start-conn)]
      (graph-parser/parse-file conn "foo.md" "- id:: 628953c1-8d75-49fe-a648-f4c612109098" {})
      (is (= [{:id "628953c1-8d75-49fe-a648-f4c612109098"}]
             (->> (d/q '[:find (pull ?b [*])
                         :in $
                         :where [?b :block/content] [(missing? $ ?b :block/name)]]
                       @conn)
                  (map first)
                  (map :block/properties)))
          "id as text has correct :block/properties"))

    (let [conn (ldb/start-conn)]
      (graph-parser/parse-file conn "foo.md" "- id:: [[628953c1-8d75-49fe-a648-f4c612109098]]" {})
      (is (= [{:id #{"628953c1-8d75-49fe-a648-f4c612109098"}}]
             (->> (d/q '[:find (pull ?b [*])
                         :in $
                         :where [?b :block/content] [(missing? $ ?b :block/name)]]
                       @conn)
                  (map first)
                  (map :block/properties)))
          "id as linked ref has correct :block/properties")))

  (testing "unexpected failure during block extraction"
    (let [conn (ldb/start-conn)
          deleted-page (atom nil)]
      (with-redefs [gp-block/with-pre-block-if-exists (fn stub-failure [& _args]
                                                        (throw (js/Error "Testing unexpected failure")))]
        (try
          (graph-parser/parse-file conn "foo.md" "- id:: 628953c1-8d75-49fe-a648-f4c612109098"
                                   {:delete-blocks-fn (fn [page _file]
                                                        (reset! deleted-page page))})
          (catch :default _)))
      (is (= nil @deleted-page)
          "Page should not be deleted when there is unexpected failure")))

  (testing "parsing whiteboard page"
    (let [conn (ldb/start-conn)]
      (graph-parser/parse-file conn "whiteboard/foo.edn" (pr-str foo-edn) {})
      (is (= {:block/name "foo" :block/file {:file/path "whiteboard/foo.edn"}}
             (let [blocks (d/q '[:find (pull ?b [* {:block/parent
                                                    [:block/name
                                                     {:block/file
                                                      [:file/path]}]}])
                                 :in $
                                 :where [?b :block/content] [(missing? $ ?b :block/name)]]
                               @conn)
                   parent (:block/parent (ffirst blocks))]
               parent))
          "parsed block in the whiteboard page has correct parent page"))))
