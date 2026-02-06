(ns frontend.handler.export-test
  (:require [cljs.test :refer [are async deftest is use-fixtures]]
            [clojure.string :as string]
            [datascript.core :as d]
            [frontend.db.conn :as conn]
            [frontend.handler.export.text :as export-text]
            [frontend.state :as state]
            [frontend.test.helper :as test-helper :include-macros true :refer [deftest-async]]
            [logseq.cli.common.export.common :as cli-export-common]
            [logseq.cli.common.export.text :as cli-export-text]
            [logseq.cli.common.file :as common-file]
            [logseq.db :as ldb]
            [logseq.db.frontend.property :as db-property]
            [logseq.outliner.property :as outliner-property]
            [promesa.core :as p]))

(defn- unpack-page-content
  "Handles both legacy [title content-string] and new [title {:content ...}] format
   from get-all-page->content. Returns [title content-string]."
  [[title content-or-map]]
  [title (if (map? content-or-map) (:content content-or-map) content-or-map)])

(def test-files
  (let [uuid-1 #uuid "61506710-484c-46d5-9983-3d1651ec02c8"
        uuid-2 #uuid "61506711-5638-4899-ad78-187bdc2eaffc"
        uuid-3 #uuid "61506712-3007-407e-b6d3-d008a8dfa88b"
        uuid-4 #uuid "61506712-b8a7-491d-ad84-b71651c3fdab"
        uuid-asset #uuid "11111111-2222-4333-8444-555555555555"
        uuid-p2 #uuid "97a00e55-48c3-48d8-b9ca-417b16e3a616"
        uuid-p3 #uuid "b1c2d3e4-5678-9abc-def0-1234567890ab"]
    [{:page {:block/title "page1"
             :build/tags [:ExportTag]
             :build/properties {:user.property/url "https://www.example.com"
                                :user.property/stage-r5NYQY4D "R2"
                                :user.property/end-date-YOC048on "2026-02-06"}}
      :blocks
      [{:block/title "1"
        :build/keep-uuid? true
        :block/uuid uuid-1
        :build/children
        [{:block/title "2"
          :build/keep-uuid? true
          :block/uuid uuid-2
          :build/children
          [{:block/title "3"
            :build/keep-uuid? true
            :block/uuid uuid-3}
           {:block/title (str "[[" uuid-3 "]]")}]}]}

       {:block/title "4"
        :build/keep-uuid? true
        :block/uuid uuid-4}]}
     {:page {:block/title "page2"}
      :blocks
      [{:block/title "3"
        :build/keep-uuid? true
        :block/uuid uuid-p2
        :build/children
        [{:block/title "{{embed [[page1]]}}"}]}]}
     {:page {:block/title "page3"}
      :blocks
      [{:block/title (str "block-ref test ((" uuid-3 "))")
        :build/keep-uuid? true
        :block/uuid uuid-p3}
       {:block/title (str "00:33 [[" uuid-3 "]]")}
       {:block/title (str "((" uuid-3 "))")}
       {:block/title (str "[[" uuid-asset "]]")}
       {:block/title (str "((" uuid-asset "))")}
       {:build.test/title "DONE finished task"}
       {:build.test/title "TODO open task"}
       {:block/title "heading property block"
        :build/properties {:logseq.property/heading 2}}]}
     {:page {:build/journal 20250101}
      :blocks
      [{:block/title "journal-block"}]}
     {:page {:block/title "assets-page"}
      :blocks
      [{:block/title "asset-block"
        :build/keep-uuid? true
        :block/uuid uuid-asset
        :build/properties {:logseq.property.asset/type "png"
                           :logseq.property.asset/size 10
                           :logseq.property.asset/checksum "abc123"}}]}]))

(use-fixtures :once
  {:before (fn []
             (async done
                    (test-helper/start-test-db!)
                    (p/let [_ (test-helper/load-test-files test-files)]
                      (d/transact! (conn/get-db (state/get-current-repo) false)
                                   [{:db/id :user.property/stage-r5NYQY4D
                                     :block/title "stage"}
                                    {:db/id :user.property/end-date-YOC048on
                                     :block/title "end-date"}])
                      (done))))
   :after test-helper/destroy-test-db!})

(deftest export-blocks-as-markdown-without-properties
  (are [expect block-uuid-s]
       (= expect
          (string/trim (export-text/export-blocks-as-markdown (state/get-current-repo) [(uuid block-uuid-s)]
                                                              {:remove-options #{:property}})))
    (string/trim "
- 1
\t- 2
\t\t- 3
\t\t- [[3]]")
    "61506710-484c-46d5-9983-3d1651ec02c8"

    (string/trim "
- 3
\t- 1
\t\t- 2
\t\t\t- 3
\t\t\t- [[3]]
\t- 4")
    "97a00e55-48c3-48d8-b9ca-417b16e3a616"))

(deftest export-blocks-as-markdown-level<N
  (are [expect block-uuid-s]
       (= expect (string/trim (export-text/export-blocks-as-markdown (state/get-current-repo) [(uuid block-uuid-s)]
                                                                     {:remove-options #{:property}
                                                                      :other-options {:keep-only-level<=N 2}})))
    (string/trim "
- 1
\t- 2")
    "61506710-484c-46d5-9983-3d1651ec02c8"

    (string/trim "
- 3
\t- 1
\t- 4")
    "97a00e55-48c3-48d8-b9ca-417b16e3a616"))

(deftest export-blocks-as-markdown-newline-after-block
  (are [expect block-uuid-s]
       (= expect (string/trim (export-text/export-blocks-as-markdown (state/get-current-repo) [(uuid block-uuid-s)]
                                                                     {:remove-options #{:property}
                                                                      :other-options {:newline-after-block true}})))
    (string/trim "
- 1

\t- 2

\t\t- 3

\t\t- [[3]]")
    "61506710-484c-46d5-9983-3d1651ec02c8"
    (string/trim "
- 3

\t- 1

\t\t- 2

\t\t\t- 3

\t\t\t- [[3]]

\t- 4")
    "97a00e55-48c3-48d8-b9ca-417b16e3a616"))

(deftest-async export-files-as-markdown
  (p/do!
   (are [expect files]
        (= expect
           (@#'export-text/export-files-as-markdown files {:remove-options #{:property}}))
     [["pages/page1.md" "- 1\n\t- 2\n\t\t- 3\n\t\t- 3\n- 4\n"]]
     [{:path "pages/page1.md" :content "- 1\n\t- 2\n\t\t- 3\n\t\t- 3\n- 4\n" :names ["page1"] :format :markdown}]

     [["pages/page2.md" "- 3\n\t- 1\n\t\t- 2\n\t\t\t- 3\n\t\t\t- 3\n\t- 4\n"]]
     [{:path "pages/page2.md" :content "- 3\n\t- 1\n\t\t- 2\n\t\t\t- 3\n\t\t\t- 3\n\t- 4\n" :names ["page2"] :format :markdown}])))

(deftest export-blocks-as-markdown-obsidian-mode
  (let [result (export-text/export-blocks-as-markdown
                (state/get-current-repo)
                [(uuid "61506710-484c-46d5-9983-3d1651ec02c8")]
                {:other-options {:obsidian-mode? true}})]
    (is (string/includes? result "^61506712-3007-407e-b6d3-d008a8dfa88b"))
    (is (not (string/includes? result "^61506712-b8a7-491d-ad84-b71651c3fdab")))
    (is (string/includes? result "![[page1#^61506712-3007-407e-b6d3-d008a8dfa88b]]"))))

(deftest export-obsidian-e2e-uuid-conversion
  ;; End-to-end test mimicking the real "Export as Markdown (Obsidian)" flow:
  ;; Stage 1: get-all-page->content (transform-content on DB worker)
  ;; Stage 2: export-files-as-markdown (mldoc re-parse + post-processing)
  (let [db (conn/get-db (state/get-current-repo))
        block-uuid "61506712-3007-407e-b6d3-d008a8dfa88b"
        ;; Stage 1: same as what the DB worker does
        page->content (common-file/get-all-page->content db {:obsidian-mode? true})
        ;; Convert to the file format that export-file-as-markdown expects
        files (mapv (fn [entry]
                      (let [[page-title content-or-map] entry]
                        (if (map? content-or-map)
                          (merge {:path (str page-title ".md")
                                  :title page-title
                                  :format :markdown}
                                 content-or-map)
                          {:path (str page-title ".md")
                           :title page-title
                           :content content-or-map
                           :format :markdown})))
                    page->content)
        ;; Stage 2: same as what export-repo-as-markdown! does
        result (@#'export-text/export-files-as-markdown
                files {:other-options {:obsidian-mode? true}})
        find-page (fn [name]
                    (some (fn [[path content]]
                            (when (string/includes? path name) content))
                          result))
        page3-content (find-page "page3")]
    ;; page3 has blocks: "block-ref test ((uuid))", "00:33 [[uuid]]", "((uuid))"
    (is (some? page3-content) "page3 should be in export output")
    (is (string/includes? page3-content (str "![[page1#^" block-uuid "]]"))
        (str "((uuid)) block refs must survive full pipeline. Got: " page3-content))
    ;; All UUID occurrences should be in Obsidian format, not bare ((uuid)) or [[uuid]]
    (is (not (re-find (re-pattern (str "\\(\\(" block-uuid "\\)\\)")) page3-content))
        (str "No bare ((uuid)) refs should remain. Got: " page3-content))
    (is (not (re-find (re-pattern (str "\\[\\[" block-uuid "\\]\\]")) page3-content))
        (str "No bare [[uuid]] refs should remain. Got: " page3-content))))

(deftest export-blocks-as-markdown-obsidian-all-ref-forms
  ;; Tests export-blocks-as-markdown (used for copy/block export) with all
  ;; UUID reference forms: ((uuid)), [[uuid]], and 00:33 [[uuid]].
  (let [db (conn/get-db (state/get-current-repo))
        page3 (ldb/get-page db "page3")
        block-uuid "61506712-3007-407e-b6d3-d008a8dfa88b"
        result (export-text/export-blocks-as-markdown
                (state/get-current-repo)
                [(:block/uuid page3)]
                {:other-options {:obsidian-mode? true}})]
    (is (string/includes? result (str "![[page1#^" block-uuid "]]"))
        (str "All UUID ref forms must be converted. Got: " result))
    (is (not (re-find (re-pattern block-uuid) (string/replace result (str "^" block-uuid) "")))
        (str "No raw UUID refs should remain (excluding ^id anchors). Got: " result))))

(deftest-async export-files-as-markdown-obsidian-frontmatter
  (p/do!
   (let [files [{:path "page1.md" :title "page1" :content "- hello\n" :format :markdown}]
         result (@#'export-text/export-files-as-markdown files {:other-options {:obsidian-mode? true}})
         content (second (first result))]
     (is (string? content))
     (is (string/starts-with? content "---\n"))
     (is (string/includes? content "url: https://www.example.com"))
     (is (string/includes? content "\n#ExportTag\n")))))

(deftest get-all-page->content-includes-journal-pages
  (let [db (conn/get-db (state/get-current-repo))
        journal-title (some->> (d/datoms db :avet :block/journal-day 20250101)
                               first
                               :e
                               (d/entity db)
                               :block/title)
        titles (->> (common-file/get-all-page->content db {:obsidian-mode? true})
                    (map first)
                    set)]
    (is journal-title)
    (is (contains? titles journal-title))))

(deftest obsidian-uuid-ref-rewrite-forms
  (let [db (conn/get-db (state/get-current-repo))
        page-uuid (str (:block/uuid (ldb/get-page db "page1")))
        page2-uuid (str (:block/uuid (ldb/get-page db "page2")))
        block-uuid "61506712-3007-407e-b6d3-d008a8dfa88b"
        rewrite-bare @#'export-text/replace-remaining-uuid-page-refs
        rewrite-alias @#'export-text/replace-alias-uuid-refs]
    ;; Bare UUID refs (post-processing)
    (is (= (str "x ![[page1#^" block-uuid "]] y")
           (rewrite-bare db (str "x [[" block-uuid "]] y"))))
    (is (= (str "x ![[page1#^" block-uuid "]] y")
           (rewrite-bare db (str "x ((" block-uuid ")) y"))))
    (is (= "x [[page1]] y"
           (rewrite-bare db (str "x [[" page-uuid "]] y"))))
    (is (= "x [[page1]] y"
           (rewrite-bare db (str "x ((" page-uuid ")) y"))))
    ;; Mixed refs in one line
    (is (= (str "[[page1]] [[page2]] ![[page1#^" block-uuid "]]")
           (rewrite-bare db (str "[[page1]] [[" page2-uuid "]] [[" block-uuid "]]"))))
    (is (= (str "[[page1]] [[page2]] ![[page1#^" block-uuid "]]")
           (rewrite-bare db (str "[[page1]] ((" page2-uuid ")) ((" block-uuid "))"))))
    ;; Aliased UUID refs (pre-processing)
    (is (= (str "![[page1#^" block-uuid "|游戏]]")
           (rewrite-alias db (str "[游戏](((" block-uuid ")))"))))
    (is (= (str "![[page1#^" block-uuid "|aaa]]")
           (rewrite-alias db (str "[aaa][((" block-uuid "))]"))))))

(deftest-async export-files-as-markdown-obsidian-uuid-conversion
  (p/do!
   (let [db (conn/get-db (state/get-current-repo))
         page2-uuid (str (:block/uuid (ldb/get-page db "page2")))
         block-uuid "61506712-3007-407e-b6d3-d008a8dfa88b"
         content-in (str "- 00:33 [[" block-uuid "]]\n"
                         "- ((" block-uuid "))\n"
                         "- [[" page2-uuid "]]\n"
                         "- ((" page2-uuid "))\n"
                         "- [游戏](((" block-uuid ")))\n"
                         "- [aaa][((" block-uuid "))]\n")
         files [{:path "x.md" :title "page1" :content content-in :format :markdown}]
         result (@#'export-text/export-files-as-markdown files {:other-options {:obsidian-mode? true}})
         content (second (first result))]
     (is (string/includes? content (str "![[page1#^" block-uuid "]]")))
     (is (string/includes? content "[[page2]]"))
     (is (string/includes? content (str "![[page1#^" block-uuid "|游戏]]")))
     (is (string/includes? content (str "![[page1#^" block-uuid "|aaa]]"))))))

(deftest cli-markdown-pipeline-should-convert-block-uuid-refs
  ;; Contract test that mimics the full UI "Export as Markdown (Obsidian)" flow
  ;; using CLI-layer functions:
  ;; Stage 1: get-all-page->content (with obsidian-mode?) → raw content
  ;; Stage 2: export-helper (with *content-config* obsidian-mode?) → rendered md
  ;; Stage 3: replace-remaining-uuid-page-refs → final post-processing
  (let [db (conn/get-db (state/get-current-repo))
        uuid-str "61506712-3007-407e-b6d3-d008a8dfa88b"
        expected-link (str "![[page1#^" uuid-str "]]")
        raw-block-ref (str "((" uuid-str "))")
        content-config {:export-bullet-indentation "\t"
                        :obsidian-mode? true}
        ;; Stage 1: same as what the DB worker does
        files (->> (common-file/get-all-page->content db content-config)
                   (map (fn [entry]
                          (let [[page-title content-or-map] entry]
                            (if (map? content-or-map)
                              (merge {:path (str page-title ".md")
                                      :title page-title
                                      :format :markdown}
                                     content-or-map)
                              {:path (str page-title ".md")
                               :content content-or-map
                               :title page-title
                               :format :markdown}))))
                   vec)
        ;; Stage 2: same as what export-file-as-markdown does (mldoc re-parse)
        exported-files (binding [cli-export-common/*current-db* db
                                 cli-export-common/*content-config* content-config]
                         (mapv (fn [{:keys [path title content]}]
                                 [(or path title) (cli-export-text/export-helper content :markdown nil)])
                               files))
        ;; Stage 3: post-processing (same as export-file-as-markdown line 344)
        replace-remaining @#'export-text/replace-remaining-uuid-page-refs
        exported-files (mapv (fn [[path content]]
                               [path (replace-remaining db content)])
                             exported-files)
        page3-content (some (fn [[path content]]
                              (when (= path "page3.md")
                                content))
                            exported-files)]
    (is page3-content "page3.md must exist in CLI export output")
    (is (string/includes? page3-content expected-link)
        "CLI markdown pipeline must convert ((uuid)) to [[page#^uuid]]")
    (is (not (string/includes? page3-content raw-block-ref))
        "CLI markdown pipeline must not keep raw ((uuid)) after conversion")))

(deftest export-files-as-markdown-obsidian-should-not-depend-on-missing-main-db-state
  ;; Reproduces real UI flow with DB split:
  ;; Stage 1 uses graph db (worker-equivalent) to build page content.
  ;; Stage 2 runs export-files-as-markdown with a db that cannot resolve refs.
  ;; If Stage 1 doesn't convert UUID refs, this will leak raw [[uuid]]/((uuid)).
  (let [block-uuid "61506712-3007-407e-b6d3-d008a8dfa88b"
        repo (state/get-current-repo)
        real-db (conn/get-db repo)
        ;; Stage 1 (worker-equivalent): generate page content with obsidian mode on.
        files (->> (common-file/get-all-page->content real-db {:obsidian-mode? true})
                   (map (fn [entry]
                          (let [[page-title content-or-map] entry]
                            (if (map? content-or-map)
                              (merge {:path (str page-title ".md")
                                      :title page-title
                                      :format :markdown}
                                     content-or-map)
                              {:path (str page-title ".md")
                               :title page-title
                               :content content-or-map
                               :format :markdown}))))
                   (filter #(= "page3.md" (:path %)))
                   vec)
        schema (d/schema (conn/get-db (state/get-current-repo)))
        empty-db (d/empty-db schema)
        result (with-redefs [conn/get-db (fn [& _] empty-db)]
                 (@#'export-text/export-files-as-markdown files {:other-options {:obsidian-mode? true}}))
        page3-content (some (fn [[path content]]
                              (when (= path "Notes/page3.md")
                                content))
                            result)]
    (is page3-content "Notes/page3.md should exist in exported files")
    (is (string/includes? page3-content (str "![[page1#^" block-uuid "]]"))
        (str "Expected UUID conversion to survive missing stage-2 db state, got: " page3-content))
    (is (not (string/includes? page3-content (str "[[" block-uuid "]]")))
        (str "Raw [[uuid]] leaked from stage-1 content: " page3-content))
    (is (not (string/includes? page3-content (str "((" block-uuid "))")))
        (str "Raw ((uuid)) leaked from stage-1 content: " page3-content))))

;; ---------------------------------------------------------------------------
;; Stage 1 (common-file) direct unit tests
;; ---------------------------------------------------------------------------

(deftest stage1-replace-uuid-refs-with-obsidian-refs
  ;; Direct tests for the regex-based UUID conversion in common-file (Stage 1).
  ;; These run against the real test DB where entities exist.
  (let [db (conn/get-db (state/get-current-repo))
        block-uuid "61506712-3007-407e-b6d3-d008a8dfa88b"
        page-uuid (str (:block/uuid (ldb/get-page db "page1")))
        page2-uuid (str (:block/uuid (ldb/get-page db "page2")))
        replace-fn @#'common-file/replace-uuid-refs-with-obsidian-refs]

    ;; ((block-uuid)) -> [[page#^uuid]]
    (is (= (str "ref: ![[page1#^" block-uuid "]]")
           (replace-fn db (str "ref: ((" block-uuid "))")))
        "((block-uuid)) must convert to [[page#^uuid]]")

    ;; [[block-uuid]] -> [[page#^uuid]]
    (is (= (str "ref: ![[page1#^" block-uuid "]]")
           (replace-fn db (str "ref: [[" block-uuid "]]")))
        "[[block-uuid]] must convert to [[page#^uuid]]")

    ;; [[page-uuid]] -> [[PageName]]
    (is (= "ref: [[page1]]"
           (replace-fn db (str "ref: [[" page-uuid "]]")))
        "[[page-uuid]] must convert to [[PageName]]")

    ;; ((page-uuid)) -> [[PageName]]
    (is (= "ref: [[page2]]"
           (replace-fn db (str "ref: ((" page2-uuid "))")))
        "((page-uuid)) must convert to [[PageName]]")

    ;; Multiple different UUIDs in one string
    (is (= (str "[[page1]] and ![[page1#^" block-uuid "]] and [[page2]]")
           (replace-fn db (str "[[" page-uuid "]] and ((" block-uuid ")) and [[" page2-uuid "]]")))
        "Multiple different UUID types in one string must all convert")

    ;; Non-existent UUID preserved as-is
    (let [fake-uuid "deadbeef-dead-beef-dead-beefdeadbeef"]
      (is (= (str "ref: [[" fake-uuid "]]")
             (replace-fn db (str "ref: [[" fake-uuid "]]")))
          "Non-existent UUID in [[]] must be preserved")
      (is (= (str "ref: ((" fake-uuid "))")
             (replace-fn db (str "ref: ((" fake-uuid "))")))
          "Non-existent UUID in (()) must be preserved"))

    ;; [alias](((uuid))) -> [[page#^uuid|alias]]
    (is (= (str "![[page1#^" block-uuid "|label]]")
           (replace-fn db (str "[label](((" block-uuid ")))")))
        "[alias](((uuid))) must convert to [[page#^uuid|alias]]")

    ;; [alias][((uuid))] -> [[page#^uuid|alias]]
    (is (= (str "![[page1#^" block-uuid "|note]]")
           (replace-fn db (str "[note][((" block-uuid "))]")))
        "[alias][((uuid))] must convert to [[page#^uuid|alias]]")

    ;; Non-string input passthrough
    (is (= 42 (replace-fn db 42))
        "Non-string input must pass through unchanged")
    (is (= nil (replace-fn db nil))
        "nil input must pass through unchanged")

    ;; String with no UUID patterns
    (is (= "plain text with [[page name]]" (replace-fn db "plain text with [[page name]]"))
        "String without UUID patterns must pass through unchanged")))

;; ---------------------------------------------------------------------------
;; Cross-page and edge-case scenarios
;; ---------------------------------------------------------------------------

(deftest stage1-cross-page-block-refs
  ;; page3 references a block on page1 via ((uuid)). Verify the cross-page
  ;; conversion produces [[page1#^uuid]] (not [[page3#^uuid]]).
  (let [db (conn/get-db (state/get-current-repo))
        block-uuid "61506712-3007-407e-b6d3-d008a8dfa88b"
        page->content (common-file/get-all-page->content db {:obsidian-mode? true})
        page3-raw (some (fn [entry]
                          (let [[title content] (unpack-page-content entry)]
                            (when (= title "page3") content)))
                        page->content)]
    (is (some? page3-raw) "page3 must exist in Stage 1 output")
    ;; The block lives on page1, so cross-page refs must say page1
    (is (string/includes? page3-raw "page1")
        (str "Cross-page block ref must resolve to block's parent page (page1). Got: " page3-raw))
    (is (not (string/includes? page3-raw (str "((" block-uuid "))")))
        (str "No bare ((uuid)) should remain after Stage 1. Got: " page3-raw))))

(deftest stage1-completeness-no-bare-uuids
  ;; After Stage 1 (get-all-page->content with obsidian-mode?), NO page should
  ;; contain bare [[uuid]] or ((uuid)) patterns for entities that exist in the DB.
  (let [db (conn/get-db (state/get-current-repo))
        page->content (common-file/get-all-page->content db {:obsidian-mode? true})
        uuid-re #"(?:\[\[|\(\()([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})(?:\]\]|\)\))"]
    (doseq [entry page->content
            :let [[page-title content] (unpack-page-content entry)]]
      (let [remaining (re-seq uuid-re content)]
        (is (empty? remaining)
            (str "Stage 1 output for \"" page-title "\" still has bare UUID refs: "
                 (pr-str (mapv first remaining))))))))

(deftest e2e-dangling-uuid-refs-preserved
  ;; UUIDs that don't exist in the DB should not crash and should produce
  ;; some output (preserved or stripped, but never garbled).
  (let [fake-uuid "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
        content-in (str "- ref: ((" fake-uuid "))\n"
                        "- link: [[" fake-uuid "]]\n")
        files [{:path "test.md" :title "test" :content content-in :format :markdown}]
        result (@#'export-text/export-files-as-markdown files {:other-options {:obsidian-mode? true}})
        content (second (first result))]
    (is (string? content) "Export must not crash on dangling UUID refs")
    (is (not (string/blank? content))
        (str "Dangling UUID refs must not produce blank output. Got: " content))))

(deftest e2e-multiple-uuid-types-in-one-block
  ;; A single block containing both page-uuid and block-uuid refs.
  (let [db (conn/get-db (state/get-current-repo))
        block-uuid "61506712-3007-407e-b6d3-d008a8dfa88b"
        page2-uuid (str (:block/uuid (ldb/get-page db "page2")))
        content-in (str "- see [[" page2-uuid "]] and ((" block-uuid "))\n")
        files [{:path "test.md" :title "test" :content content-in :format :markdown}]
        result (@#'export-text/export-files-as-markdown files {:other-options {:obsidian-mode? true}})
        content (second (first result))]
    (is (string/includes? content "[[page2]]")
        (str "Page UUID ref must convert. Got: " content))
    (is (string/includes? content (str "![[page1#^" block-uuid "]]"))
        (str "Block UUID ref must convert. Got: " content))
    (is (not (string/includes? content page2-uuid))
        (str "Raw page UUID must not remain. Got: " content))))

(deftest e2e-page-uuid-ref-conversion
  ;; [[page-uuid]] where uuid belongs to a page should become [[PageName]].
  (let [db (conn/get-db (state/get-current-repo))
        page-uuid (str (:block/uuid (ldb/get-page db "page1")))
        content-in (str "- see [[" page-uuid "]]\n")
        files [{:path "test.md" :title "test" :content content-in :format :markdown}]
        result (@#'export-text/export-files-as-markdown files {:other-options {:obsidian-mode? true}})
        content (second (first result))]
    (is (string/includes? content "[[page1]]")
        (str "[[page-uuid]] must become [[PageName]]. Got: " content))
    (is (not (string/includes? content page-uuid))
        (str "Raw page UUID must not remain. Got: " content))))

(deftest non-obsidian-mode-no-obsidian-format
  ;; Non-obsidian export must NOT produce Obsidian-specific [[page#^uuid]] syntax.
  (let [block-uuid "61506712-3007-407e-b6d3-d008a8dfa88b"
        content-in (str "- ((" block-uuid "))\n")
        files [{:path "test.md" :title "test" :content content-in :format :markdown}]
        result (@#'export-text/export-files-as-markdown files {:remove-options #{:property}})
        content (second (first result))]
    (is (not (string/includes? content "#^"))
        (str "Non-obsidian export must not produce #^ format. Got: " content))))

(deftest obsidian-tag-space-conversion
  (let [tag-fn-frontend @#'export-text/tag->obsidian-hashtag
        tag-fn-worker @#'common-file/tag->obsidian-hashtag]
    (is (= "#Life-Hack" (tag-fn-frontend {:block/title "Life Hack"})))
    (is (= "#Life-Hack" (tag-fn-worker {:block/title "Life Hack"})))))

(deftest obsidian-export-directory-layout
  (let [db (conn/get-db (state/get-current-repo))
        journal-title (some->> (d/datoms db :avet :block/journal-day 20250101)
                               first
                               :e
                               (d/entity db)
                               :block/title)
        files (->> (common-file/get-all-page->content db {:obsidian-mode? true})
                   (mapv (fn [entry]
                           (let [[page-title content-or-map] entry]
                             (if (map? content-or-map)
                               (merge {:path (str page-title ".md")
                                       :title page-title
                                       :format :markdown}
                                      content-or-map)
                               {:path (str page-title ".md")
                                :title page-title
                                :content content-or-map
                                :format :markdown})))))
        result (@#'export-text/export-files-as-markdown files {:other-options {:obsidian-mode? true}})
        paths (set (map first result))]
    (is (contains? paths "Notes/page1.md"))
    (is (contains? paths "Notes/page3.md"))
    (is journal-title)
    (is (contains? paths (str "Daily/" journal-title ".md")))
    (is (every? (fn [path]
                  (or (string/starts-with? path "Notes/")
                      (string/starts-with? path "Daily/")))
                paths))
    (is (= "Attachments/file.png"
           (@#'export-text/attachment-output-path "assets/file.png")))))

(deftest obsidian-export-directory-layout-journal-fallback-by-date-title
  (let [page-output-path @#'export-text/page-output-path]
    (with-redefs [ldb/get-page (fn [_ _] nil)]
      (is (= "Daily/2014-06-27.md"
             (page-output-path {} "2014-06-27" nil)))
      (is (= "Daily/2014-06-27.md"
             (page-output-path {} nil "2014-06-27.md")))
      (is (= "Notes/not-a-journal.md"
             (page-output-path {} "not-a-journal" nil))))))

(deftest-async obsidian-asset-uuid-ref-conversion
  (p/do!
   (let [asset-uuid "11111111-2222-4333-8444-555555555555"
         content-in (str "- [[" asset-uuid "]]\n"
                         "- ((" asset-uuid "))\n")
         files [{:path "x.md" :title "page1" :content content-in :format :markdown}]
         result (@#'export-text/export-files-as-markdown files {:other-options {:obsidian-mode? true}})
         content (second (first result))]
     (is (string/includes? content (str "![](../Attachments/" asset-uuid ".png)")))
     (is (not (string/includes? content (str "[[" asset-uuid "]]"))))
     (is (not (string/includes? content (str "((" asset-uuid "))")))))))

(deftest-async obsidian-task-checkbox-and-property-filtering
  (p/do!
   (let [db (conn/get-db (state/get-current-repo))
         files (->> (common-file/get-all-page->content db {:obsidian-mode? true})
                    (map (fn [entry]
                           (let [[page-title content-or-map] entry]
                             (if (map? content-or-map)
                               (merge {:path (str page-title ".md")
                                       :title page-title
                                       :format :markdown}
                                      content-or-map)
                               {:path (str page-title ".md")
                                :title page-title
                                :content content-or-map
                                :format :markdown}))))
                    (filter #(= "page3.md" (:path %)))
                    vec)
         result (@#'export-text/export-files-as-markdown files {:other-options {:obsidian-mode? true}})
         content (second (first result))]
     (is (re-find #"- \[x\].*finished task" content))
     (is (re-find #"- \[ \].*open task" content))
     (is (not (string/includes? content "Status::")))
     (is (not (string/includes? content "Heading::"))))))

(deftest-async page-frontmatter-literal-keys
  (p/do!
   (let [files [{:path "page1.md" :title "page1" :content "- hello\n" :format :markdown}]
         result (@#'export-text/export-files-as-markdown files {:other-options {:obsidian-mode? true}})
         content (second (first result))]
     (is (string/includes? content "stage: R2"))
     (is (string/includes? content "end-date: 2026-02-06"))
     (is (not (string/includes? content "stage-r5NYQY4D")))
     (is (not (string/includes? content "end-date-YOC048on")))
     (is (false? (@#'export-text/exportable-page-property? :logseq.property.class/extends))))))

(deftest page-frontmatter-literal-keys-fallback-when-property-entity-missing
  (let [fake-db {:db :fake}
        fake-page {:db/id 1 :block/title "fake"}
        frontmatter (with-redefs [ldb/get-page (fn [_ _] fake-page)
                                  db-property/properties (fn [_] {:user.property/stage-r5NYQY4D "R2"})
                                  outliner-property/get-block-classes-properties (fn [_ _] {:classes-properties []})
                                  d/entity (fn [_ _] nil)]
                      (@#'export-text/build-page-frontmatter fake-db "fake"))]
    (is (string/includes? frontmatter "stage: R2"))
    (is (not (string/includes? frontmatter "stage-r5NYQY4D")))))

(deftest stage1-property-key-fallback-strips-random-suffix
  (let [property-key->markdown @#'common-file/property-key->markdown]
    (with-redefs [d/entity (fn [_ _] nil)]
      (is (= "stage" (property-key->markdown {} :user.property/stage-r5NYQY4D)))
      (is (= "end-date" (property-key->markdown {} :user.property/end-date-YOC048on))))))

(deftest page-frontmatter-includes-class-derived-default-property
  (let [fake-db {:db :fake}
        fake-page {:db/id 1 :block/title "fake"}
        property {:db/id 100
                  :db/ident :user.property/inherited
                  :block/title "Inherited"
                  :logseq.property/scalar-default-value "from-tag"}
        entity-map {[:db/ident :user.property/inherited] property
                    :user.property/inherited property}
        frontmatter (with-redefs [ldb/get-page (fn [_ _] fake-page)
                                  db-property/properties (fn [_] {})
                                  outliner-property/get-block-classes-properties
                                  (fn [_ _] {:classes-properties [property]})
                                  d/entity (fn [_ lookup] (get entity-map lookup))]
                      (@#'export-text/build-page-frontmatter fake-db "fake"))]
    (is (string/includes? frontmatter "Inherited: from-tag"))))

(deftest stage1-frontmatter-generation
  ;; Verify that Stage 1 (get-all-page->content) produces frontmatter and tag-header
  ;; in the new map format when obsidian-mode? is true.
  (let [db (conn/get-db (state/get-current-repo))
        page->content (common-file/get-all-page->content db {:obsidian-mode? true})
        page1-entry (some (fn [[title m]] (when (= title "page1") m))
                          page->content)]
    ;; Stage 1 output must be a map in obsidian mode
    (is (map? page1-entry) "Stage 1 obsidian output must be a map")
    (is (string? (:content page1-entry)) "Map must contain :content string")
    ;; Frontmatter should be pre-computed
    (is (some? (:frontmatter page1-entry)) "page1 should have pre-computed frontmatter")
    (is (string/starts-with? (:frontmatter page1-entry) "---\n")
        "Frontmatter must start with YAML delimiter")
    (is (string/includes? (:frontmatter page1-entry) "url: https://www.example.com")
        "Frontmatter must include page properties")
    ;; Tag header should be pre-computed
    (is (some? (:tag-header page1-entry)) "page1 should have pre-computed tag-header")
    (is (string/includes? (:tag-header page1-entry) "#ExportTag")
        "Tag header must include page tags")))
