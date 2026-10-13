(ns frontend.worker.markdown-mirror-mutation3-app-test
  "Third-run mutation tests for frontend.worker.markdown-mirror."
  (:require [cljs.test :refer [async deftest is testing]]
            [datascript.core :as d]
            [frontend.worker.markdown-mirror :as markdown-mirror]
            [logseq.db.test.helper :as db-test]
            [promesa.core :as p]))

(def test-repo "logseq_db_graph-xxx")

(def ^:private build-stem-index @#'markdown-mirror/build-stem-index)
(def ^:private update-stem-index @#'markdown-mirror/update-stem-index)
(def ^:private page-id-for-entity @#'markdown-mirror/page-id-for-entity)
(def ^:private not-found-error? @#'markdown-mirror/not-found-error?)
(def ^:private <read-text @#'markdown-mirror/<read-text)
(def ^:private <write-text-atomic! @#'markdown-mirror/<write-text-atomic!)
(def ^:private <delete-file! @#'markdown-mirror/<delete-file!)
(def ^:private leading-space-count @#'markdown-mirror/leading-space-count)
(def ^:private property-line-indent @#'markdown-mirror/property-line-indent)
(def ^:private property-value-line? @#'markdown-mirror/property-value-line?)
(def ^:private content-ref-targets @#'markdown-mirror/content-ref-targets)
(def ^:private status-marker @#'markdown-mirror/status-marker)
(def ^:private tag-token @#'markdown-mirror/tag-token)
(def ^:private built-in-tag? @#'markdown-mirror/built-in-tag?)
(def ^:private mirror-tag-tokens @#'markdown-mirror/mirror-tag-tokens)
(def ^:private content-tag-titles @#'markdown-mirror/content-tag-titles)
(def ^:private token-title @#'markdown-mirror/token-title)
(def ^:private order-list-number? @#'markdown-mirror/order-list-number?)
(def ^:private embed-target @#'markdown-mirror/embed-target)
(def ^:private content-first-line @#'markdown-mirror/content-first-line)
(def ^:private normalize-rendered-match-text @#'markdown-mirror/normalize-rendered-match-text)
(def ^:private code-block? @#'markdown-mirror/code-block?)
(def ^:private block-line-info @#'markdown-mirror/block-line-info)
(def ^:private block-line-infos @#'markdown-mirror/block-line-infos)
(def ^:private property-derived-block? @#'markdown-mirror/property-derived-block?)
(def ^:private outline-children @#'markdown-mirror/outline-children)
(def ^:private block->content-context @#'markdown-mirror/block->content-context)
(def ^:private line-level @#'markdown-mirror/line-level)
(def ^:private mirrorable-pages @#'markdown-mirror/mirrorable-pages)
(def ^:private deleted-page? @#'markdown-mirror/deleted-page?)
(def ^:private merge-job @#'markdown-mirror/merge-job)
(def ^:private <run-job! @#'markdown-mirror/<run-job!)

(defn- fake-platform
  ([] (fake-platform {:runtime :node}))
  ([env]
   (let [files (atom {})
         writes (atom [])
         deletes (atom [])]
     {:platform {:env env
                 :storage {:read-text! (fn [path]
                                         (p/resolved (get @files path)))
                           :write-text-atomic! (fn [path content]
                                                 (swap! writes conj [path content])
                                                 (swap! files assoc path content)
                                                 (p/resolved nil))
                           :delete-file! (fn [path]
                                           (swap! deletes conj path)
                                           (swap! files dissoc path)
                                           (p/resolved nil))}
                 :broadcast {:post-message! (fn [& _] nil)}}
      :files files
      :writes writes
      :deletes deletes})))

(defn- page-path [path]
  (str (markdown-mirror/repo-mirror-dir test-repo) "/" path))

(defn- js-error
  [message data]
  (let [error (js/Error. message)]
    (doseq [[k v] data]
      (aset error (name k) v))
    error))

(defn- first-block [page]
  (-> page :block/_page first))

(def ^:private uuid-1 #uuid "11111111-1111-4111-8111-111111111111")
(def ^:private uuid-2 #uuid "22222222-2222-4222-8222-222222222222")

;; ---------------------------------------------------------------------------
;; normalize-file-stem

;; Fails if, in `normalize-file-stem`, `if` becomes `if-not` or the `(string/replace ascii-control-re "_")` step is dropped.
(deftest normalize-file-stem-replaces-control-chars-and-truncates-test
  (is (= "a_b" (markdown-mirror/normalize-file-stem "a\u0001b")))
  (is (= 160 (count (markdown-mirror/normalize-file-stem (apply str (repeat 200 "x"))))))
  (is (= (apply str (repeat 160 "x"))
         (markdown-mirror/normalize-file-stem (apply str (repeat 160 "x"))))))

;; ---------------------------------------------------------------------------
;; stem index

;; Fails if, in `non-journal-page?`, `and` becomes `or`.
;; Fails if, in `update-stem-index`, `when` becomes `when-not`, the body becomes `nil`, `:block/title` becomes `:block/uuid` or `:block/uuid` becomes `:block/_parent`.
(deftest update-stem-index-moves-renamed-pages-and-ignores-blocks-and-journals-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:block/title "Dup" :block/uuid uuid-2}
                                   :blocks [{:block/title "dup two child"}]}
                                  {:page {:block/title "Dup" :block/uuid uuid-1}
                                   :blocks [{:block/title "dup one child"}]}
                                  {:page {:block/title "Solo"}
                                   :blocks [{:block/title "solo child"}]}
                                  {:page {:build/journal 20240103}
                                   :blocks [{:block/title "j"}]}]})
        db-before @conn
        solo (db-test/find-page-by-title db-before "Solo")
        solo-child (first-block solo)
        dup-two (d/entity db-before [:block/uuid uuid-2])
        journal (db-test/find-journal-by-journal-day db-before 20240103)
        index-before (build-stem-index db-before)
        db-after (:db-after (d/with db-before
                                    [{:db/id (:db/id solo)
                                      :block/title "Renamed" :block/name "renamed"}
                                     {:db/id (:db/id dup-two)
                                      :block/title "Other" :block/name "other"}]))
        index-after (update-stem-index index-before db-before db-after
                                       [(:db/id solo) (:db/id dup-two) (:db/id solo-child)])]
    (is (= #{uuid-1 uuid-2} (get index-before "Dup")))
    (is (not (contains? index-before (:block/title journal))))
    (is (not (contains? index-before "solo child")))
    (is (not (contains? index-after "Solo")))
    (is (= #{(:block/uuid solo)} (get index-after "Renamed")))
    (is (= #{uuid-1} (get index-after "Dup")))
    (is (= #{uuid-2} (get index-after "Other")))
    (is (not (contains? index-after "solo child")))))

;; Fails if, in `pages-with-file-stem`, the `(sort-by (comp str :block/uuid))` step is dropped or `:block/uuid` becomes `:block/_parent`.
(deftest same-title-pages-are-ordered-by-uuid-not-creation-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:block/title "Same" :block/uuid uuid-2}
                                   :blocks [{:block/title "created first"}]}
                                  {:page {:block/title "Same" :block/uuid uuid-1}
                                   :blocks [{:block/title "created second"}]}]})
        page-one (d/entity @conn [:block/uuid uuid-1])
        page-two (d/entity @conn [:block/uuid uuid-2])]
    (is (= "pages/Same.md" (markdown-mirror/page-relative-path @conn page-one)))
    (is (= "pages/Same (2).md" (markdown-mirror/page-relative-path @conn page-two)))))

;; ---------------------------------------------------------------------------
;; page-id-for-entity / affected-page-ids

;; Fails if, in `page-id-for-entity`, `and` becomes `or`, `:block/page` becomes `:block/parent`, `:block/parent` becomes `:block/tags`, `:db/id` becomes `:db/ident` or the `:block/parent` step is dropped.
(deftest page-id-for-entity-resolves-page-through-every-link-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:block/title "Host"}
                                   :blocks [{:block/title "top"
                                             :build/children [{:block/title "nested"}]}]}]})
        page (db-test/find-page-by-title @conn "Host")
        top (db-test/find-block-by-content @conn "top")
        nested (db-test/find-block-by-content @conn "nested")
        tempids (:tempids
                 (d/transact! conn [{:db/id -1 :block/uuid (random-uuid) :block/title "orphan-under-page"
                                     :block/parent (:db/id page)}
                                    {:db/id -2 :block/uuid (random-uuid) :block/title "orphan-under-block"
                                     :block/parent (:db/id top)}
                                    {:db/id -3 :block/uuid (random-uuid) :block/title "orphan-under-nested"
                                     :block/parent (:db/id nested)}
                                    {:db/id -4 :block/uuid (random-uuid) :block/title "parentless"
                                     :block/page (:db/id page)}
                                    {:db/id -5 :block/uuid (random-uuid) :block/title "orphan-under-parentless"
                                     :block/parent -4}]))
        orphan-page {:db/id (get tempids -1)}
        orphan-block {:db/id (get tempids -2)}
        orphan-nested {:db/id (get tempids -3)}
        orphan-parentless {:db/id (get tempids -5)}
        page-id (:db/id page)]
    (is (nil? (:block/page (d/entity @conn (:db/id orphan-page)))))
    (is (= page-id (page-id-for-entity @conn (:db/id page))))
    (is (= page-id (page-id-for-entity @conn (:db/id top))))
    (is (= page-id (page-id-for-entity @conn (:db/id nested))))
    (is (= page-id (page-id-for-entity @conn (:db/id orphan-page))))
    (is (= page-id (page-id-for-entity @conn (:db/id orphan-block))))
    (is (= page-id (page-id-for-entity @conn (:db/id orphan-nested))))
    (is (= page-id (page-id-for-entity @conn (:db/id orphan-parentless))))))

;; Fails if, in `page-id-for-entity`, `:block/page` becomes `:block/parent`.
;; Fails if, in `affected-page-ids`, the `(remove nil?)` step is dropped or `:block/page` becomes `:block/parent`.
(deftest affected-page-ids-of-a-new-nested-block-is-only-its-page-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:block/title "Host"}
                                   :blocks [{:block/title "top"}]}]})
        page (db-test/find-page-by-title @conn "Host")
        top (db-test/find-block-by-content @conn "top")
        report (d/with @conn [{:db/id -1 :block/uuid (random-uuid) :block/title "new child"
                               :block/page (:db/id page) :block/parent (:db/id top)
                               :block/order "a0"}])]
    (is (= #{(:db/id page)} (markdown-mirror/affected-page-ids report)))))

;; Fails if, in `affected-page-ids`, `and` becomes `or` or the `ldb/page?` step is dropped.
(deftest affected-page-ids-ignores-referrers-of-an-edited-block-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:block/title "Host"}
                                   :blocks [{:block/title "target block"}]}
                                  {:page {:block/title "Referrer"}
                                   :blocks [{:block/title "points at it"}]}]})
        host (db-test/find-page-by-title @conn "Host")
        target (db-test/find-block-by-content @conn "target block")
        referrer-block (db-test/find-block-by-content @conn "points at it")
        _ (d/transact! conn [[:db/add (:db/id referrer-block) :block/refs (:db/id target)]])
        report (d/with @conn [{:db/id (:db/id target) :block/title "target block edited"}])]
    (is (= #{(:db/id host)} (markdown-mirror/affected-page-ids report)))))

;; Fails if, in `affected-page-ids`, `:block/title` becomes `:block/uuid` or `:block/name` becomes `:block/order`.
(deftest affected-page-ids-title-only-and-name-only-renames-reach-linking-pages-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:block/title "TargetOld"}
                                   :blocks [{:block/title "target"}]}
                                  {:page {:block/title "Source"}
                                   :blocks [{:block/title "See [[TargetOld]]"}]}]})
        target (db-test/find-page-by-title @conn "TargetOld")
        source (db-test/find-page-by-title @conn "Source")
        title-only (d/with @conn [{:db/id (:db/id target) :block/title "TargetNew"}])
        name-only (d/with @conn [{:db/id (:db/id target) :block/name "targetnew"}])]
    (is (= #{(:db/id target) (:db/id source)}
           (markdown-mirror/affected-page-ids title-only)))
    (is (= #{(:db/id target) (:db/id source)}
           (markdown-mirror/affected-page-ids name-only)))))

;; ---------------------------------------------------------------------------
;; storage error handling

;; Fails if, in `not-found-error?`, `or` becomes `and`, the `.-code` step is dropped or the `.-name` step is dropped.
(deftest not-found-error-recognizes-each-form-test
  (is (true? (not-found-error? (js-error "no such file" {:code "ENOENT"}))))
  (is (true? (not-found-error? (ex-info "gone" {:code :not-found}))))
  (is (true? (not-found-error? (js-error "gone" {:name "NotFoundError"}))))
  (is (true? (not-found-error? (js-error "ENOENT: gone" {}))))
  (is (false? (not-found-error? (js-error "ENOENT without colon" {}))))
  (is (false? (not-found-error? (js-error "denied" {:code "EACCES"})))))

;; Fails if, in `<read-text`, the `:path` key is dropped.
;; Fails if, in `<write-text-atomic!`, the `:path` key is dropped.
;; Fails if, in `<delete-file!`, the `:path` key is dropped.
(deftest missing-storage-functions-reject-with-path-test
  (async done
    (let [bare {:storage {}}]
      (-> (p/let [read-error (-> (<read-text bare "p/read") (p/catch (fn [e] {:rejected e})))
                  write-error (-> (<write-text-atomic! bare "p/write" "c") (p/catch (fn [e] {:rejected e})))
                  delete-error (-> (<delete-file! bare "p/delete") (p/catch (fn [e] {:rejected e})))]
            (is (= {:path "p/read"} (ex-data (:rejected read-error))))
            (is (= {:path "p/write"} (ex-data (:rejected write-error))))
            (is (= {:path "p/delete"} (ex-data (:rejected delete-error)))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

;; ---------------------------------------------------------------------------
;; line helpers

;; Fails if, in `property-line-indent`, `or` becomes `and`, the body becomes `nil`, the `second` step is dropped or the `count` step is dropped.
(deftest property-line-indent-reads-both-property-line-forms-test
  (is (= 2 (property-line-indent "  * notes::")))
  (is (= 3 (property-line-indent "   notes:: x")))
  (is (= 0 (property-line-indent "* notes::")))
  (is (nil? (property-line-indent "- plain block"))))

;; Fails if, in `leading-space-count`, `or` becomes `and` or the body becomes `nil`.
;; Fails if, in `property-value-line?`, `not` becomes `identity` or the body becomes `nil`.
(deftest property-value-line-needs-deeper-indent-and-content-test
  (is (true? (property-value-line? "    - x" 2)))
  (is (false? (property-value-line? "  - x" 2)))
  (is (false? (property-value-line? "      " 0)))
  (is (true? (property-value-line? "    x" 0)))
  (is (false? (property-value-line? "    x" nil))))

;; Fails if, in `status-marker`, the `str` step is dropped, the `string/trim` step is dropped or the `(string/replace #"\s+" "-")` step is dropped.
(deftest status-marker-forms-test
  (is (= "TODO" (status-marker :todo)))
  (is (= "IN-PROGRESS" (status-marker {:block/title "  in   progress "})))
  (is (= "WAITING-HERE" (status-marker {:logseq.property/value "waiting here"})))
  (is (= "5" (status-marker {:logseq.property/value 5})))
  (is (nil? (status-marker {:block/title "  "})))
  (is (nil? (status-marker {}))))

;; Fails if, in `tag-token`, `:block/name` becomes `:block/order`.
(deftest tag-token-forms-test
  (is (= "#foo" (tag-token {:block/name "foo"})))
  (is (= "#Foo" (tag-token {:block/title "Foo" :block/name "other"})))
  (is (= "#[[a b]]" (tag-token {:block/title "a b"})))
  (is (nil? (tag-token {:block/title ""}))))

;; Fails if, in `built-in-tag?`, `or` becomes `and` or the `namespace` step is dropped.
;; Fails if, in `mirror-tag-tokens`, the `sort` step is dropped or the `vec` step is dropped.
(deftest mirror-tag-tokens-are-sorted-vector-without-built-ins-test
  (let [tokens (mirror-tag-tokens {:block/tags [{:block/title "Zeta"}
                                                {:block/title "Alpha"}
                                                {:block/title "Task" :db/ident :logseq.class/Task}]})]
    (is (vector? tokens))
    (is (= ["#Alpha" "#Zeta"] tokens))))

;; Fails if, in `content-ref-targets`, `or` becomes `and`, `when-not` becomes `when`, `=` becomes `not=`, the body becomes `nil`, the `:title` key is dropped or the `:tag?` key is dropped.
;; Fails if, in `content-tag-titles`, `when` becomes `when-not`, the body becomes `nil`, the `(keep (fn [{:keys [title tag?]}]` step is dropped or the `set` step is dropped.
(deftest content-tag-titles-are-lowercased-tags-only-test
  (let [titles (content-tag-titles "#Foo [[Bar]] #[[Baz Qux]]")]
    (is (set? titles))
    (is (= #{"foo" "baz qux"} titles))))

;; Fails if, in `token-title`, `if` becomes `if-not`.
(deftest token-title-strips-hash-and-brackets-test
  (is (= "a b" (token-title "#[[a b]]")))
  (is (= "tag" (token-title "#tag"))))

;; Fails if, in `order-list-number?`, the `string/lower-case` step is dropped.
(deftest order-list-number-is-case-insensitive-test
  (is (true? (order-list-number? {:logseq.property/order-list-type "Number"})))
  (is (true? (order-list-number? {:logseq.property/order-list-type :number})))
  (is (false? (order-list-number? {:logseq.property/order-list-type "bullet"}))))

;; Fails if, in `embed-target`, `and` becomes `or` or `:block/uuid` becomes `:block/_parent`.
(deftest embed-target-needs-uuid-and-non-page-test
  (let [target {:block/uuid uuid-1 :block/title "t"}]
    (is (= target (embed-target {:block/link target})))
    (is (nil? (embed-target {:block/link {:block/title "no uuid"}})))
    (is (nil? (embed-target {:block/link (assoc target :block/tags [{:db/ident :logseq.class/Page}])})))
    (is (nil? (embed-target {:block/link {:block/title "no uuid"
                                          :block/tags [{:db/ident :logseq.class/Page}]}})))
    (is (nil? (embed-target {})))))

;; Fails if, in `content-first-line`, the `string/split-lines` step is dropped or the `string/trim` step is dropped.
(deftest content-first-line-test
  (is (= "a" (content-first-line "  a  \nb")))
  (is (= "" (content-first-line nil)))
  (is (= "" (content-first-line ""))))

;; Fails if, in `normalize-rendered-match-text`, `or` becomes `and`, the `string/lower-case` step is dropped, the `(string/replace simple-hashtag-re "$1...` step is dropped, the `(string/replace #"\s+" " ")` step is dropped or the `string/trim` step is dropped.
(deftest normalize-rendered-match-text-test
  (is (= "foo #[[]] [[]] #[[]]"
         (normalize-rendered-match-text "  Foo   #Tag [[X]] #[[Y]]  ")))
  (is (= "" (normalize-rendered-match-text nil))))

;; Fails if, in `code-block?`, `:db/ident` becomes `:db/id` or `:block/tags` becomes `:block/title`.
(deftest code-block-by-tag-or-display-type-test
  (is (true? (code-block? {:logseq.property.node/display-type :code})))
  (is (true? (code-block? {:block/tags [{:db/ident :logseq.class/Code-block}]})))
  (is (not (code-block? {:block/tags [{:db/ident :logseq.class/Task}] :block/title "x"}))))

;; Fails if, in `property-derived-block?`, `or` becomes `and`, the body becomes `nil` or `:block/closed-value-property` becomes `:block/journal-day`.
;; Fails if, in `outline-children`, the `(remove property-derived-block?)` step is dropped or the `(sort-by :block/order)` step is dropped.
(deftest outline-children-are-ordered-and-without-property-blocks-test
  (is (= ["a" "b"]
         (mapv :block/order
               (outline-children
                {:block/_parent [{:block/order "b"}
                                 {:block/order "c" :logseq.property/created-from-property 1}
                                 {:block/order "a"}
                                 {:block/order "d" :block/closed-value-property 1}]})))))

;; Fails if, in `block->content-context`, the `:preserve-block-refs?` key is dropped or the `:date-formatter` key is dropped.
(deftest block->content-context-test
  (is (= {:export-bullet-indentation "  "
          :excluded-properties #{:logseq.property/status}
          :export-properties-as-list-items? true
          :export-node-property-values-as-page-refs? true
          :export-default-property-values-as-blocks? true
          :preserve-block-refs? true
          :date-formatter "yyyy"}
         (block->content-context {:date-formatter "yyyy"})))
  (is (= "\t" (:export-bullet-indentation (block->content-context {:export-bullet-indentation "\t"})))))

;; Fails if, in `line-level`, `or` becomes `and` or the body becomes `nil`.
(deftest line-level-uses-configured-indentation-test
  (is (= 3 (line-level "    " {})))
  (is (= 2 (line-level "    " {:export-bullet-indentation "    "})))
  (is (= 5 (line-level "    " {:export-bullet-indentation "\t"}))))

;; ---------------------------------------------------------------------------
;; block infos

;; Fails if, in `block-line-info`, `if` becomes `if-not` or `:db/id` becomes `:db/ident`.
(deftest block-line-info-resolves-maps-and-reads-explicit-status-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:block/title "Infos"}
                                   :blocks [{:block/title "explicit status"
                                             :build/properties {:logseq.property/status :logseq.property/status.todo}}
                                            {:block/title "no status"}]}
                                  {:page {:block/title "Other status"}
                                   :blocks [{:block/title "elsewhere"
                                             :build/properties {:logseq.property/status :logseq.property/status.done}}]}]})
        explicit (db-test/find-block-by-content @conn "explicit status")
        plain (db-test/find-block-by-content @conn "no status")
        info (block-line-info @conn {:db/id (:db/id explicit)} "-")
        entity-info (block-line-info @conn explicit "1.")]
    (is (= "explicit status" (:first-line-fragment info)))
    (is (= "TODO" (:status-marker info)))
    (is (= "TODO" (:status-marker entity-info)))
    (is (= "1." (:marker entity-info)))
    (is (nil? (:status-marker (block-line-info @conn plain "-"))))))

;; Fails if, in `block-line-info`, `:db/id` becomes `:db/ident`.
(deftest block-line-info-ignores-a-default-status-from-a-non-task-class-test
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Project {:build/class-properties [:logseq.property/status]}}
               :pages-and-blocks [{:page {:block/title "Projects"}
                                   :blocks [{:block/title "project block"
                                             :build/tags [:Project]}]}]})
        block (db-test/find-block-by-content @conn "project block")]
    (is (= :logseq.property/status.todo (:db/ident (:logseq.property/status block)))
        "the status default applies to members of a class declaring status")
    (is (nil? (:status-marker (block-line-info @conn block "-"))))))

;; Fails if, in `block-line-infos`, the `(into (block-line-infos db (outline-c...` step is dropped.
(deftest block-line-infos-include-nested-children-with-their-own-markers-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:block/title "Nested infos"}
                                   :blocks [{:block/title "p"
                                             :build/children [{:block/title "c"
                                                               :build/properties {:logseq.property/order-list-type "number"}}]}]}]})
        top (db-test/find-block-by-content @conn "p")]
    (is (= [["p" "-"] ["c" "1."]]
           (mapv (juxt :first-line-fragment :marker) (block-line-infos @conn [top]))))))

;; ---------------------------------------------------------------------------
;; page order and filtering

;; Fails if, in `mirrorable-pages`, `if` becomes `if-not`, `or` becomes `and`, the `(filter mirrorable-page?)` step is dropped, the `(sort-by (fn [page]` step is dropped, `:block/journal-day` becomes `:block/link` or `:block/uuid` becomes `:block/_parent`.
(deftest mirrorable-pages-order-journals-first-by-day-then-title-then-uuid-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:block/title "b page" :block/uuid uuid-2}
                                   :blocks [{:block/title "x"}]}
                                  {:page {:block/title "b page" :block/uuid uuid-1}
                                   :blocks [{:block/title "y"}]}
                                  {:page {:block/title "A page"}
                                   :blocks [{:block/title "z"}]}
                                  {:page {:block/title "Z journal" :block/name "z journal"
                                          :block/journal-day 20240115
                                          :block/tags #{:logseq.class/Journal}}
                                   :blocks [{:block/title "j1"}]}
                                  {:page {:block/title "A journal" :block/name "a journal"
                                          :block/journal-day 20240201
                                          :block/tags #{:logseq.class/Journal}}
                                   :blocks [{:block/title "j2"}]}]})
        pages (mirrorable-pages @conn)
        key-of (fn [page] (or (:block/journal-day page) (:block/title page)))
        mine (filterv (fn [page] (contains? #{20240115 20240201 "A page" "b page"} (key-of page)))
                      pages)]
    (is (= [[20240115 nil] [20240201 nil] ["A page" nil] ["b page" uuid-1] ["b page" uuid-2]]
           (mapv (fn [page] [(key-of page)
                             (when (= "b page" (:block/title page)) (:block/uuid page))])
                 mine)))
    (testing "built-in pages are excluded except Contents"
      (is (every? (fn [page] (or (not (:logseq.property/built-in? page))
                                 (= "contents" (:block/name page))))
                  pages)))))

;; Fails if, in `deleted-page?`, `or` becomes `and`.
(deftest deleted-page-is-missing-or-not-mirrorable-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:block/title "Normal"}
                                   :blocks [{:block/title "x"}]}]})]
    (is (true? (deleted-page? nil)))
    (is (true? (deleted-page? (d/entity @conn :logseq.class/Task))))
    (is (false? (deleted-page? (db-test/find-page-by-title @conn "Normal"))))))

;; Fails if, in `merge-job`, `or` becomes `and`.
(deftest merge-job-keeps-the-first-old-path-test
  (is (= {:old-path "a" :x 1} (merge-job {:old-path "a"} {:old-path "b" :x 1})))
  (is (= {:old-path "b"} (merge-job {:old-path nil} {:old-path "b"})))
  (is (= {:old-path "a"} (merge-job {:old-path "a"} {:old-path nil}))))

;; ---------------------------------------------------------------------------
;; results of mirror-page!

;; Fails if, in `<write-if-changed!`, the `:path` key is dropped.
;; Fails if, in `invalid-file-name-result`, the `:repo` key is dropped or the `:page-uuid` key is dropped.
;; Fails if, in `<mirror-page!`, the `:repo` key is dropped, the `:page-id` key is dropped, the `:journal-day` key is dropped, the `:page-uuid` key is dropped, `:block/journal-day` becomes `:block/link` or the `:status` key is dropped.
(deftest mirror-page-results-carry-their-diagnostics-test
  (async done
    (let [{:keys [platform]} (fake-platform)
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Only"}
                                     :blocks [{:block/title "body"}]}
                                    {:page {:block/title "CON"}
                                     :blocks [{:block/title "reserved"}]}
                                    {:page {:block/title "May 7th, 2024" :block/name "may 7th, 2024"
                                            :block/journal-day 20240507
                                            :block/tags #{:logseq.class/Journal}}
                                     :blocks [{:block/title "first"}]}
                                    {:page {:block/title "May 07, 2024" :block/name "may 07, 2024"
                                            :block/journal-day 20240507
                                            :block/tags #{:logseq.class/Journal}}
                                     :blocks [{:block/title "second"}]}]})
          only (db-test/find-page-by-title @conn "Only")
          reserved (db-test/find-page-by-title @conn "CON")
          journal (db-test/find-journal-by-journal-day @conn 20240507)
          task-class (d/entity @conn :logseq.class/Task)
          path (page-path "pages/Only.md")]
      (-> (p/let [written (markdown-mirror/<mirror-page! test-repo @conn (:db/id only) {:platform platform})
                  unchanged (markdown-mirror/<mirror-page! test-repo @conn (:db/id only) {:platform platform})
                  invalid (markdown-mirror/<mirror-page! test-repo @conn (:db/id reserved) {:platform platform})
                  duplicate (markdown-mirror/<mirror-page! test-repo @conn (:db/id journal) {:platform platform})
                  excluded (markdown-mirror/<mirror-page! test-repo @conn (:db/id task-class) {:platform platform})
                  missing (markdown-mirror/<mirror-page! test-repo @conn 999999 {:platform platform})
                  unsupported (markdown-mirror/<mirror-page! test-repo @conn (:db/id only)
                                                             {:platform (:platform (fake-platform {:runtime :browser}))})]
            (is (= {:status :written :path path} written))
            (is (= {:status :skipped :reason :unchanged :path path} unchanged))
            (is (= {:status :error :reason :invalid-file-name :repo test-repo
                    :page-uuid (:block/uuid reserved)}
                   invalid))
            (is (= {:status :error :reason :duplicate-journal-day :repo test-repo
                    :journal-day 20240507 :page-uuid (:block/uuid journal)}
                   duplicate))
            (is (= {:status :skipped :reason :excluded-page :repo test-repo
                    :page-id (:db/id task-class)}
                   excluded))
            (is (= {:status :skipped :reason :missing-page :repo test-repo :page-id 999999}
                   missing))
            (is (= {:status :skipped :reason :unsupported-runtime} unsupported)))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

;; Fails if, in `<write-if-changed!`, the `:path` key is dropped.
;; Fails if, in `<mirror-repo!`, the `:status` key is dropped, the `:reason` key is dropped, the `:count` key is dropped or the `:results` key is dropped.
(deftest mirror-repo-reports-completed-count-and-results-test
  (async done
    (let [{:keys [platform]} (fake-platform)
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Only"}
                                     :blocks [{:block/title "body"}]}]})]
      (-> (p/let [result (markdown-mirror/<mirror-repo! test-repo @conn {:platform platform})
                  unsupported (markdown-mirror/<mirror-repo!
                               test-repo @conn
                               {:platform (:platform (fake-platform {:runtime :browser}))})]
            (is (= :completed (:status result)))
            (is (pos? (:count result)))
            (is (= (count (:results result)) (:count result)))
            (is (some #(= (page-path "pages/Only.md") (:path %)) (:results result)))
            (is (= {:status :skipped :reason :unsupported-runtime} unsupported)))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

;; ---------------------------------------------------------------------------
;; rendering

;; Fails if, in `decorate-rendered-content`, `not` becomes `identity`.
(deftest code-block-content-lines-that-look-like-blocks-stay-in-the-code-block-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Code Lines"}
                                     :blocks [{:block/title "(a)\n- after\n(b)"
                                               :build/tags [:logseq.class/Code-block]
                                               :build/properties {:logseq.property.node/display-type :code
                                                                  :logseq.property.code/lang "clojure"}}
                                              {:block/title "after"
                                               :build/properties {:logseq.property/status :logseq.property/status.todo}}]}]})
          page (db-test/find-page-by-title @conn "Code Lines")]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
          (p/then (fn [_]
                    (is (= (str "id:: " (:block/uuid page) "\n\n"
                                "- ```clojure\n"
                                "  (a)\n"
                                "  - after\n"
                                "  (b)\n"
                                "  ```\n"
                                "- TODO after")
                           (get @files (page-path "pages/Code Lines.md"))))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

;; Fails if, in `decorate-rendered-content`, `and` becomes `or`.
(deftest non-code-block-starting-with-a-fence-does-not-open-a-code-block-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Fence Text"}
                                     :blocks [{:block/title "``` just text"}
                                              {:block/title "second"
                                               :build/properties {:logseq.property/status :logseq.property/status.todo}}]}]})
          page (db-test/find-page-by-title @conn "Fence Text")]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
          (p/then (fn [_]
                    (is (= (str "id:: " (:block/uuid page) "\n\n"
                                "- ``` just text\n"
                                "- TODO second")
                           (get @files (page-path "pages/Fence Text.md"))))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

;; Fails if, in `decorate-block-line`, the `:init-level` key is dropped.
(deftest nested-embed-renders-at-the-embedding-blocks-indentation-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          target-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
          embed-uuid #uuid "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Source"}
                                     :blocks [{:block/title "wrap"
                                               :build/children [{:block/title ""
                                                                 :block/uuid embed-uuid
                                                                 :build/keep-uuid? true}]}]}
                                    {:page {:block/title "Target Page"}
                                     :blocks [{:block/title "Target"
                                               :block/uuid target-uuid
                                               :build/keep-uuid? true
                                               :build/children [{:block/title "Target child"}]}]}]})
          embed-eid (:db/id (d/entity @conn [:block/uuid embed-uuid]))
          target-eid (:db/id (d/entity @conn [:block/uuid target-uuid]))
          _ (d/transact! conn [{:db/id embed-eid :block/link target-eid}])
          page (db-test/find-page-by-title @conn "Source")]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
          (p/then (fn [_]
                    (is (= (str "id:: " (:block/uuid page) "\n\n"
                                "- wrap\n"
                                "  - Target\n"
                                "    - Target child")
                           (get @files (page-path "pages/Source.md"))))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

;; ---------------------------------------------------------------------------
;; tx reports and jobs

(defn- edit-report
  [conn title]
  (let [page (db-test/find-page-by-title @conn "Page A")]
    (d/with @conn [{:db/id (:db/id (first-block page)) :block/title title}])))

(def ^:private page-a-blocks
  {:pages-and-blocks [{:page {:block/title "Page A"}
                       :blocks [{:block/title "hello"}]}]})

;; Fails if, in `<handle-tx-report!`, the `:status` key is dropped, the `:reason` key is dropped or the `:count` key is dropped.
(deftest handle-tx-report-results-test
  (async done
    (let [{:keys [platform]} (fake-platform)
          conn (db-test/create-conn-with-blocks page-a-blocks)
          report (edit-report conn "edited")]
      (markdown-mirror/set-enabled! test-repo false)
      (-> (p/let [disabled (markdown-mirror/<handle-tx-report! test-repo conn report {:platform platform})
                  _ (markdown-mirror/set-enabled! test-repo true)
                  unsupported (markdown-mirror/<handle-tx-report!
                               test-repo conn report
                               {:platform (:platform (fake-platform {:runtime :browser}))})
                  from-disk (markdown-mirror/<handle-tx-report!
                             test-repo conn (assoc report :tx-meta {:from-disk? true})
                             {:platform platform})
                  queued (markdown-mirror/<handle-tx-report!
                          test-repo conn report
                          {:platform platform :defer? true :debounce-ms 60000})]
            (is (= {:status :skipped :reason :disabled-or-unsupported} disabled))
            (is (= {:status :skipped :reason :disabled-or-unsupported} unsupported))
            (is (= {:status :skipped :reason :from-disk} from-disk))
            (is (= {:status :queued :count 1} queued)))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (markdown-mirror/set-enabled! test-repo false)
                       (done)))))))

;; Fails if, in `schedule-flush!`, `when-not` becomes `when`, `or` becomes `and` or the body becomes `nil`.
(deftest deferred-flush-runs-after-the-debounce-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          conn (db-test/create-conn-with-blocks page-a-blocks)
          report (edit-report conn "edited")]
      (markdown-mirror/set-enabled! test-repo false)
      (markdown-mirror/set-enabled! test-repo true)
      (-> (p/let [_ (markdown-mirror/<handle-tx-report!
                     test-repo conn report
                     {:platform platform :defer? true :debounce-ms 20})
                  _ (p/delay 300)]
            (is (some? (get @files (page-path "pages/Page A.md")))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (markdown-mirror/set-enabled! test-repo false)
                       (done)))))))

;; Fails if, in `<run-job!`, `and` becomes `or`, the `:status` key is dropped, the `:path` key is dropped or the `:reason` key is dropped.
;; Fails if, in `<mirror-page!`, the `:reason` key is dropped.
(deftest run-job-results-test
  (async done
    (let [{:keys [platform deletes]} (fake-platform)
          conn (db-test/create-conn-with-blocks page-a-blocks)]
      (-> (p/let [deleted (<run-job! platform {:delete? true :old-path "m/old.md"} {})
                  no-old (<run-job! platform {:delete? true} {})
                  _ (reset! deletes [])
                  missing (<run-job! platform {:repo test-repo :db @conn :page-id 999999
                                               :old-path "m/old.md" :new-path "m/new.md"}
                                     {})]
            (is (= {:status :deleted :path "m/old.md"} deleted))
            (is (= {:status :skipped :reason :missing-old-path} no-old))
            (is (= :missing-page (:reason missing)))
            (is (empty? @deletes) "a skipped page for another reason must not delete the old path"))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))
