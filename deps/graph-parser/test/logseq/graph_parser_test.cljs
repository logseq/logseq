(ns logseq.graph-parser-test
  (:require [cljs.test :refer [deftest testing is are]]
            [clojure.string :as string]
            [logseq.graph-parser :as graph-parser]
            [logseq.db :as ldb]
            [logseq.graph-parser.block :as gp-block]
            [logseq.graph-parser.property :as gp-property]
            [datascript.core :as d]))

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
          "Page should not be deleted when there is unexpected failure"))))

(defn- test-property-order [num-properties]
  (let [conn (ldb/start-conn)
        properties (mapv #(keyword (str "p" %)) (range 0 num-properties))
        text (->> properties
                  (map #(str (name %) ":: " (name %) "-value"))
                  (string/join "\n"))
        ;; Test page properties and block properties
        body (str text "\n- " text)
        _ (graph-parser/parse-file conn "foo.md" body {})
        properties-orders (->> (d/q '[:find (pull ?b [*])
                                      :in $
                                      :where [?b :block/content] [(missing? $ ?b :block/name)]]
                                    @conn)
                               (map first)
                               (map :block/properties-order))]
    (is (every? vector? properties-orders)
        "Order is persisted as a vec to avoid edn serialization quirks")
    (is (= [properties properties] properties-orders)
        "Property order")))

(deftest properties-order
  (testing "Sort order and persistence of a few properties"
    (test-property-order 4))
  (testing "Sort order and persistence of 10 properties"
    (test-property-order 10)))

(defn- quoted-property-values-test
  [user-config]
  (let [conn (ldb/start-conn)
        _ (graph-parser/parse-file conn
                                   "foo.md"
                                   "- desc:: \"#foo is not a ref\""
                                   {:extract-options {:user-config user-config}})
        block (->> (d/q '[:find (pull ?b [* {:block/refs [*]}])
                       :in $
                       :where [?b :block/properties]]
                     @conn)
                (map first)
                first)]
    (is (= {:desc "\"#foo is not a ref\""}
           (:block/properties block))
        "Quoted value is unparsed")
    (is (= ["desc"]
           (map :block/original-name (:block/refs block)))
        "No refs from property value")))

(deftest quoted-property-values
  (testing "With default config"
    (quoted-property-values-test {}))
  (testing "With :rich-property-values config"
    (quoted-property-values-test {:rich-property-values? true})))

(deftest page-properties-persistence
  (testing "Non-string property values"
    (let [conn (ldb/start-conn)]
      (graph-parser/parse-file conn
                               "lythe-of-heaven.md"
                               "rating:: 8\nrecommend:: true\narchive:: false"
                               {})
      (is (= {:rating 8 :recommend true :archive false}
             (->> (d/q '[:find (pull ?b [*])
                         :in $
                         :where [?b :block/properties]]
                       @conn)
                  (map (comp :block/properties first))
                  first)))))

  (testing "Linkable built-in properties"
    (let [conn (ldb/start-conn)
          _ (graph-parser/parse-file conn
                                     "lol.md"
                                     "alias:: 233\ntags:: fun, facts"
                                     {})
          block (->> (d/q '[:find (pull ?b [:block/properties {:block/alias [:block/name]} {:block/tags [:block/name]}])
                            :in $
                            :where [?b :block/name "lol"]]
                          @conn)
                     (map first)
                     first)]

      (is (= {:block/alias [{:block/name "233"}]
              :block/tags [{:block/name "fun"} {:block/name "facts"}]
              :block/properties {:alias ["233"] :tags ["fun" "facts"]}}
             block))

      (is (every? vector? (vals (:block/properties block)))
          "Linked built-in property values as vectors provides for easier transforms"))))

(defn- property-relationships-test
  "Runs tests on page properties and block properties. file-properties is what is
  visible in a file and db-properties is what is pulled out from the db"
  [file-properties db-properties user-config]
  (let [conn (ldb/start-conn)
        page-content (gp-property/->block-content file-properties)
        ;; Create Block properties from given page ones
        block-property-transform (fn [m] (update-keys m #(keyword (str "block-" (name %)))))
        block-content (gp-property/->block-content (block-property-transform file-properties))
        _ (graph-parser/parse-file conn
                                   "property-relationships.md"
                                   (str page-content "\n- " block-content)
                                   {:extract-options {:user-config user-config}})
        pages (->> (d/q '[:find (pull ?b [* :block/properties])
                          :in $
                          :where [?b :block/name] [?b :block/properties]]
                        @conn)
                   (map first))
        _ (assert (= 1 (count pages)))
        blocks (->> (d/q '[:find (pull ?b [:block/pre-block? :block/properties
                                           {:block/refs [:block/original-name]}])
                           :in $
                           :where [?b :block/properties] [(missing? $ ?b :block/name)]]
                         @conn)
                    (map first)
                    (map (fn [m] (update m :block/refs #(map :block/original-name %)))))
        block-db-properties (block-property-transform db-properties)]

    (is (= db-properties (:block/properties (first pages)))
        "page has expected properties")

    (is (= [true nil] (map :block/pre-block? blocks))
        "page has 2 blocks, one of which is a pre-block")

    (is (= [db-properties block-db-properties]
           (map :block/properties blocks))
        "pre-block/page and block have expected properties")

    ;; has expected refs
    (are [db-props refs]
         (= (->> (vals db-props)
                 ;; ignore string values
                 (mapcat #(if (coll? %) % []))
                 (concat (map name (keys db-props)))
                 set)
            (set refs))
         ; pre-block/page has expected refs
         db-properties (first (map :block/refs blocks))
         ;; block has expected refs
         block-db-properties (second (map :block/refs blocks)))))

(deftest property-relationships
  (let [properties {:single-link "[[bar]]"
                    :multi-link "[[Logseq]] is the fastest #triples #[[text editor]]"
                    :desc "This is a multiple sentence description. It has one [[link]]"
                    :comma-prop "one, two,three"}]
    (testing "With default config"
      (property-relationships-test
       properties
       {:single-link #{"bar"}
        :multi-link #{"Logseq" "is the fastest" "triples" "text editor"}
        :desc #{"This is a multiple sentence description. It has one" "link"}
        :comma-prop #{"one" "two" "three"}}
       {}))

    (testing "With :rich-property-values config"
      (property-relationships-test
       properties
       {:single-link #{"bar"}
        :multi-link #{"Logseq" "triples" "text editor"}
        :desc #{"link"}
        :comma-prop "one, two,three"}
       {:rich-property-values? true}))))
