(ns logseq.graph-parser-test
  (:require [cljs.test :refer [deftest testing is are]]
            [clojure.string :as string]
            [logseq.graph-parser :as graph-parser]
            [logseq.db :as ldb]
            [logseq.db.default :as default-db]
            [logseq.graph-parser.block :as gp-block]
            [logseq.graph-parser.property :as gp-property]
            [datascript.core :as d]))

(def foo-edn
  "Example exported whiteboard page as an edn exportable."
  '{:blocks
    ({:block/content "foo content a",
      :block/format :markdown
      :block/parent {:block/uuid #uuid "16c90195-6a03-4b3f-839d-095a496d9acd"}},
     {:block/content "foo content b",
      :block/format :markdown
      :block/parent {:block/uuid #uuid "16c90195-6a03-4b3f-839d-095a496d9acd"}}),
    :pages
    ({:block/format :markdown,
      :block/name "foo"
      :block/original-name "Foo"
      :block/uuid #uuid "16c90195-6a03-4b3f-839d-095a496d9acd"
      :block/properties {:title "my whiteboard foo"}})})

(def foo-conflict-edn
  "Example exported whiteboard page as an edn exportable."
  '{:blocks
    ({:block/content "foo content a",
      :block/format :markdown},
     {:block/content "foo content b",
      :block/format :markdown}),
    :pages
    ({:block/format :markdown,
      :block/name "foo conflicted"
      :block/original-name "Foo conflicted"
      :block/uuid #uuid "16c90195-6a03-4b3f-839d-095a496d9acd"})})

(def bar-edn
  "Example exported whiteboard page as an edn exportable."
  '{:blocks
    ({:block/content "foo content a",
      :block/format :markdown
      :block/parent {:block/uuid #uuid "71515b7d-b5fc-496b-b6bf-c58004a34ee3"
                     :block/name "foo"}},
     {:block/content "foo content b",
      :block/format :markdown
      :block/parent {:block/uuid #uuid "71515b7d-b5fc-496b-b6bf-c58004a34ee3"
                     :block/name "foo"}}),
    :pages
    ({:block/format :markdown,
      :block/name "bar"
      :block/original-name "Bar"
      :block/uuid #uuid "71515b7d-b5fc-496b-b6bf-c58004a34ee3"})})

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
          "id as text has correct :block/properties")))

  (testing "unexpected failure during block extraction"
    (let [conn (ldb/start-conn)
          deleted-page (atom nil)]
      (with-redefs [gp-block/with-pre-block-if-exists (fn stub-failure [& _args]
                                                        (throw (js/Error "Testing unexpected failure")))]
        (try
          (graph-parser/parse-file conn "foo.md" "- id:: 628953c1-8d75-49fe-a648-f4c612109098"
                                   {:delete-blocks-fn (fn [_db page _file _uuids]
                                                        (reset! deleted-page page))})
          (catch :default _)))
      (is (= nil @deleted-page)
          "Page should not be deleted when there is unexpected failure")))

  (testing "parsing whiteboard page"
    (let [conn (ldb/start-conn)]
      (graph-parser/parse-file conn "/whiteboards/foo.edn" (pr-str foo-edn) {})
      (let [blocks (d/q '[:find (pull ?b [* {:block/page
                                             [:block/name
                                              :block/original-name
                                              :block/type
                                              {:block/file
                                               [:file/path]}]}])
                          :in $
                          :where [?b :block/content] [(missing? $ ?b :block/name)]]
                        @conn)
            parent (:block/page (ffirst blocks))]
        (is (= {:block/name "foo"
                :block/original-name "Foo"
                :block/type "whiteboard"
                :block/file {:file/path "/whiteboards/foo.edn"}}
               parent)
            "parsed block in the whiteboard page has correct parent page"))))

  (testing "Loading whiteboard pages that same block/uuid should throw an error."
    (let [conn (ldb/start-conn)]
      (graph-parser/parse-file conn "/whiteboards/foo.edn" (pr-str foo-edn) {})
      (is (thrown-with-msg?
           js/Error
           #"Conflicting upserts"
           (graph-parser/parse-file conn "/whiteboards/foo-conflict.edn" (pr-str foo-conflict-edn) {})))))

  (testing "Loading whiteboard pages should ignore the :block/name property inside :block/parent."
    (let [conn (ldb/start-conn)]
      (graph-parser/parse-file conn "/whiteboards/foo.edn" (pr-str foo-edn) {})
      (graph-parser/parse-file conn "/whiteboards/bar.edn" (pr-str bar-edn) {})
      (let [pages (d/q '[:find ?name
                         :in $
                         :where
                         [?b :block/name ?name]
                         [?b :block/type "whiteboard"]]
                       @conn)]
        (is (= pages #{["foo"] ["bar"]}))))))

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

(deftest quoted-property-values
  (let [conn (ldb/start-conn)
        _ (graph-parser/parse-file conn
                                   "foo.md"
                                   "- desc:: \"#foo is not a ref\""
                                   {:extract-options {:user-config {}}})
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

(deftest non-string-property-values
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

(deftest linkable-built-in-properties
  (let [conn (ldb/start-conn)
        _ (graph-parser/parse-file conn
                                   "lol.md"
                                   (str "alias:: 233\ntags:: fun, facts"
                                        "\n- "
                                        "alias:: 666\ntags:: block, facts")
                                   {})
        page-block (->> (d/q '[:find (pull ?b [:block/properties {:block/alias [:block/name]} {:block/tags [:block/name]}])
                               :in $
                               :where [?b :block/name "lol"]]
                             @conn)
                        (map first)
                        first)
        block (->> (d/q '[:find (pull ?b [:block/properties])
                          :in $
                          :where
                          [?b :block/properties]
                          [(missing? $ ?b :block/pre-block?)]
                          [(missing? $ ?b :block/name)]]
                        @conn)
                   (map first)
                   first)]

    (is (= {:block/alias [{:block/name "233"}]
            :block/tags [{:block/name "fun"} {:block/name "facts"}]
            :block/properties {:alias #{"233"} :tags #{"fun" "facts"}}}
           page-block)
        "page properties, alias and tags are correct")
    (is (every? set? (vals (:block/properties page-block)))
        "Linked built-in property values as sets provides for easier transforms")

    (is (= {:block/properties {:alias #{"666"} :tags #{"block" "facts"}}}
           block)
        "block properties are correct")))

(defn- property-relationships-test
  "Runs tests on page properties and block properties. file-properties is what is
  visible in a file and db-properties is what is pulled out from the db"
  [file-properties db-properties user-config]
  (let [conn (ldb/start-conn)
        page-content (gp-property/->block-content file-properties)
        ;; Create Block properties from given page ones
        block-property-transform (fn [m] (update-keys m #(keyword (str "block-" (name %)))))
        block-file-properties (block-property-transform file-properties)
        block-content (gp-property/->block-content block-file-properties)
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
        blocks (->> (d/q '[:find (pull ?b [:block/pre-block?
                                           :block/properties
                                           :block/properties-text-values
                                           {:block/refs [:block/original-name]}])
                           :in $
                           :where [?b :block/properties] [(missing? $ ?b :block/name)]]
                         @conn)
                    (map first)
                    (map (fn [m] (update m :block/refs #(map :block/original-name %)))))
        block-db-properties (block-property-transform db-properties)]

    (testing "Page properties"
      (is (= db-properties (:block/properties (first pages)))
          "page has expected properties")

      (is (= file-properties (:block/properties-text-values (first pages)))
          "page has expected full text of properties"))

    (testing "Pre-block and block properties"
      (is (= [true nil] (map :block/pre-block? blocks))
          "page has 2 blocks, one of which is a pre-block")

      (is (= [db-properties block-db-properties]
             (map :block/properties blocks))
          "pre-block/page and block have expected properties")

      (is (= [file-properties block-file-properties]
             (map :block/properties-text-values blocks))
          "pre-block/page and block have expected full text of properties")

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
        block-db-properties (second (map :block/refs blocks))))))

(deftest property-relationships
  (let [properties {:single-link "[[bar]]"
                    :multi-link "[[Logseq]] is the fastest #triples #[[text editor]]"
                    :desc "This is a multiple sentence description. It has one [[link]]"
                    :comma-prop "one, two,three"}]
    (property-relationships-test
     properties
     {:single-link #{"bar"}
      :multi-link #{"Logseq" "triples" "text editor"}
      :desc #{"link"}
      :comma-prop "one, two,three"}
     {})))

(deftest invalid-properties
  (let [conn (ldb/start-conn)
        properties {"foo" "valid"
                    "[[foo]]" "invalid"
                    "some,prop" "invalid"
                    "#blarg" "invalid"}
        body (str (gp-property/->block-content properties)
                  "\n- " (gp-property/->block-content properties))]
    (graph-parser/parse-file conn "foo.md" body {})

    (is (= [{:block/properties {:foo "valid"}
             :block/invalid-properties #{"[[foo]]" "some,prop" "#blarg"}}]
           (->> (d/q '[:find (pull ?b [*])
                       :in $
                       :where
                       [?b :block/properties]
                       [(missing? $ ?b :block/pre-block?)]
                       [(missing? $ ?b :block/name)]]
                     @conn)
                (map first)
                (map #(select-keys % [:block/properties :block/invalid-properties]))))
        "Has correct (in)valid block properties")

    (is (= [{:block/properties {:foo "valid"}
             :block/invalid-properties #{"[[foo]]" "some,prop" "#blarg"}}]
           (->> (d/q '[:find (pull ?b [*])
                       :in $
                       :where [?b :block/properties] [?b :block/name]]
                     @conn)
                (map first)
                (map #(select-keys % [:block/properties :block/invalid-properties]))))
        "Has correct (in)valid page properties")))

(deftest correct-page-names-created-from-title
  (testing "from title"
    (let [conn (ldb/start-conn)
          built-in-pages (set (map string/lower-case default-db/built-in-pages-names))]
      (graph-parser/parse-file conn
                               "foo.md"
                               "title:: core.async"
                               {})
      (is (= #{"core.async"}
             (->> (d/q '[:find (pull ?b [*])
                         :in $
                         :where [?b :block/name]]
                       @conn)
                  (map (comp :block/name first))
                  (remove built-in-pages)
                  set)))))

  (testing "from cased org title"
    (let [conn (ldb/start-conn)
          built-in-pages (set default-db/built-in-pages-names)]
      (graph-parser/parse-file conn
                               "foo.org"
                               ":PROPERTIES:
:ID:       72289d9a-eb2f-427b-ad97-b605a4b8c59b
:END:
#+tItLe: Well parsed!"
                               {})
      (is (= #{"Well parsed!"}
             (->> (d/q '[:find (pull ?b [*])
                         :in $
                         :where [?b :block/name]]
                       @conn)
                  (map (comp :block/original-name first))
                  (remove built-in-pages)
                  set))))))

(deftest correct-page-names-created-from-page-refs
  (testing "for file, mailto, web and other uris in markdown"
    (let [conn (ldb/start-conn)
          built-in-pages (set (map string/lower-case default-db/built-in-pages-names))]
      (graph-parser/parse-file conn
                               "foo.md"
                               (str "- [title]([[bar]])\n"
                                    ;; all of the uris below do not create pages
                                    "- ![image.png](../assets/image_1630480711363_0.png)\n"
                                    "- [Filename.txt](file:///E:/test/Filename.txt)\n"
                                    "- [mail](mailto:test@test.com?subject=TestSubject)\n"
                                    "- [onenote link](onenote:https://d.docs.live.net/b2127346582e6386a/blablabla/blablabla/blablabla%20blablabla.one#Etat%202019&section-id={133DDF16-9A1F-4815-9A05-44303784442E6F94}&page-id={3AAB677F0B-328F-41D0-AFF5-66408819C085}&end)\n"
                                    "- [lock file](deps/graph-parser/yarn.lock)"
                                    "- [example](https://example.com)"))
      (is (= #{"foo" "bar"}
             (->> (d/q '[:find (pull ?b [*])
                         :in $
                         :where [?b :block/name]]
                       @conn)
                  (map (comp :block/name first))
                  (remove built-in-pages)
                  set)))))

(testing "for web and page uris in org"
    (let [conn (ldb/start-conn)
          built-in-pages (set (map string/lower-case default-db/built-in-pages-names))]
      (graph-parser/parse-file conn
                               "foo.org"
                               (str "* [[bar][title]]\n"
                                    ;; all of the uris below do not create pages
                                    "* [[https://example.com][example]]\n"
                                    "* [[../assets/conga_parrot.gif][conga]]"))
      (is (= #{"foo" "bar"}
             (->> (d/q '[:find (pull ?b [*])
                         :in $
                         :where [?b :block/name]]
                       @conn)
                  (map (comp :block/name first))
                  (remove built-in-pages)
                  set))))))

(deftest duplicated-ids
  (testing "duplicated block ids in same file"
    (let [conn (ldb/start-conn)
          extract-block-ids (atom #{})
          parse-opts {:extract-options {:extract-block-ids extract-block-ids}}
          block-id #uuid "63f199bc-c737-459f-983d-84acfcda14fe"]
      (graph-parser/parse-file conn
                               "foo.md"
                               "- foo
id:: 63f199bc-c737-459f-983d-84acfcda14fe
- bar
id:: 63f199bc-c737-459f-983d-84acfcda14fe
"
                               parse-opts)
      (let [blocks (:block/_parent (d/entity @conn [:block/name "foo"]))]
        (is (= 2 (count blocks)))
        (is (= 1 (count (filter #(= (:block/uuid %) block-id) blocks)))))))

  (testing "duplicated block ids in multiple files"
    (let [conn (ldb/start-conn)
          extract-block-ids (atom #{})
          parse-opts {:extract-options {:extract-block-ids extract-block-ids}}
          block-id #uuid "63f199bc-c737-459f-983d-84acfcda14fe"]
      (graph-parser/parse-file conn
                               "foo.md"
                               "- foo
id:: 63f199bc-c737-459f-983d-84acfcda14fe
bar
- test"
                               parse-opts)
      (graph-parser/parse-file conn
                               "bar.md"
                               "- bar
id:: 63f199bc-c737-459f-983d-84acfcda14fe
bar
- test
"
                               parse-opts)
      (is (= "foo"
             (-> (d/entity @conn [:block/uuid block-id])
                 :block/page
                 :block/name)))
      (let [bar-block (first (:block/_parent (d/entity @conn [:block/name "bar"])))]
        (is (some? (:block/uuid bar-block)))
        (is (not= (:block/uuid bar-block) block-id))))))
