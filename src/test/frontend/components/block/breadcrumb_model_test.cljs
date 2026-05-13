(ns frontend.components.block.breadcrumb-model-test
  (:require [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
            [frontend.components.block.breadcrumb-model :as model]))

;; ---------------------------------------------------------------------------
;; normalize-breadcrumb-text
;; ---------------------------------------------------------------------------

(deftest normalize-breadcrumb-text-test
  (testing "returns nil for nil input"
    (is (nil? (model/normalize-breadcrumb-text nil))))

  (testing "returns nil for empty string"
    (is (nil? (model/normalize-breadcrumb-text ""))))

  (testing "returns nil for blank string"
    (is (nil? (model/normalize-breadcrumb-text "   "))))

  (testing "returns first non-empty line from multi-line input"
    (is (= "First line" (model/normalize-breadcrumb-text "First line\nSecond line"))))

  (testing "skips leading blank lines"
    (is (= "Hello" (model/normalize-breadcrumb-text "\n\nHello\nWorld"))))

  (testing "strips markdown bold markers"
    (is (= "bold text" (model/normalize-breadcrumb-text "**bold text**"))))

  (testing "strips markdown italic markers"
    (is (= "italic" (model/normalize-breadcrumb-text "*italic*"))))

  (testing "strips heading markers"
    (is (= "Heading" (model/normalize-breadcrumb-text "## Heading"))))

  (testing "strips inline code markers"
    (is (= "code" (model/normalize-breadcrumb-text "`code`"))))

  (testing "strips markdown link to text only"
    (is (= "link text" (model/normalize-breadcrumb-text "[link text](https://example.com)"))))

  (testing "truncates text over 160 chars with ellipsis"
    (let [long-text (apply str (repeat 200 "a"))
          result (model/normalize-breadcrumb-text long-text)]
      (is (= 161 (count result)))  ;; 160 chars + "…" (1 char)
      (is (string/ends-with? result "…"))))

  (testing "skips markdown fence markers"
    (is (nil? (model/normalize-breadcrumb-text "```clojure\n```"))))

  (testing "skips org begin/end markers and returns inner text"
    (is (= "Release checklist"
           (model/normalize-breadcrumb-text "#+BEGIN_NOTE\nRelease checklist\n#+END_NOTE"))))

  (testing "skips standalone query expressions"
    (is (nil? (model/normalize-breadcrumb-text "{{query (task TODO)}}"))))

  (testing "returns text as-is when under 160 chars"
    (is (= "short" (model/normalize-breadcrumb-text "short")))))

;; ---------------------------------------------------------------------------
;; detect-block-type
;; ---------------------------------------------------------------------------

(deftest detect-block-type-test
  (testing "page? true always returns :page"
    (is (= :page (model/detect-block-type "anything" true))))

  (testing "detects code block by markdown fence"
    (is (= :code (model/detect-block-type "```clojure\n(foo)" false))))

  (testing "detects code block by org-mode src"
    (is (= :code (model/detect-block-type "#+BEGIN_SRC clojure\n(foo)" false))))

  (testing "detects query block"
    (is (= :query (model/detect-block-type "{{query (task TODO)}}" false))))

  (testing "detects note block"
    (is (= :note (model/detect-block-type "#+BEGIN_NOTE\nsome note" false))))

  (testing "detects quote block"
    (is (= :quote (model/detect-block-type "#+BEGIN_QUOTE\nsome quote" false))))

  (testing "returns :block for plain text"
    (is (= :block (model/detect-block-type "Hello world" false))))

  (testing "returns nil for nil raw-title when not page"
    (is (nil? (model/detect-block-type nil false)))))

;; ---------------------------------------------------------------------------
;; block->breadcrumb-segment — basic shape
;; ---------------------------------------------------------------------------

(deftest block->breadcrumb-segment-basic-test
  (testing "returns nil for nil entity"
    (is (nil? (model/block->breadcrumb-segment nil))))

  (testing "page entity has :type :page and :page? true"
    (let [seg (model/block->breadcrumb-segment
               {:db/id 1
                :block/uuid #uuid "00000000-0000-0000-0000-000000000001"
                :block/name "my-page"
                :block/title "My Page"})]
      (is (= :page (:type seg)))
      (is (true? (:page? seg)))
      (is (= "My Page" (:text seg)))))

  (testing "plain block has :type :block"
    (let [seg (model/block->breadcrumb-segment
               {:db/id 1
                :block/uuid #uuid "00000000-0000-0000-0000-000000000001"
                :block/raw-title "Hello world"})]
      (is (= :block (:type seg)))
      (is (false? (:page? seg)))
      (is (= "Hello world" (:text seg)))))

  (testing "empty block has nil :text but non-nil full-text empty string"
    (let [seg (model/block->breadcrumb-segment
               {:db/id 1
                :block/uuid #uuid "00000000-0000-0000-0000-000000000001"
                :block/raw-title ""})]
      (is (nil? (:text seg)))
      (is (= "" (:full-text seg)))))

  (testing "block with icon preserves icon value"
    (let [seg (model/block->breadcrumb-segment
               {:db/id 1
                :block/uuid #uuid "00000000-0000-0000-0000-000000000001"
                :block/raw-title "Decorated"
                :logseq.property/icon {:type :emoji :id "🌟"}})]
      (is (= {:type :emoji :id "🌟"} (:icon seg)))))

  (testing "plain block text is unchanged"
    (let [seg (model/block->breadcrumb-segment
               {:db/id 1
                :block/uuid #uuid "00000000-0000-0000-0000-000000000001"
                :block/raw-title "plain text"})]
      (is (= "plain text" (:text seg)))))

  (testing "block uuid page refs are resolved to page title refs"
    (let [ref-uuid #uuid "00000000-0000-0000-0000-000000000002"
          seg (model/block->breadcrumb-segment
               {:db/id 1
                :block/uuid #uuid "00000000-0000-0000-0000-000000000001"
                :block/raw-title (str "See [[" ref-uuid "]]")
                :block/refs [{:db/id 2
                              :block/uuid ref-uuid
                              :block/name "aaa"
                              :block/title "aaa"}]})]
      (is (= "See [[aaa]]" (:text seg)))
      (is (= "See [[aaa]]" (:full-text seg)))))

  (testing "block uuid tag refs are resolved to tag labels"
    (let [ref-uuid #uuid "00000000-0000-0000-0000-000000000002"
          seg (model/block->breadcrumb-segment
               {:db/id 1
                :block/uuid #uuid "00000000-0000-0000-0000-000000000001"
                :block/raw-title (str "Tagged #[[" ref-uuid "]]")
                :block/refs [{:db/id 2
                              :block/uuid ref-uuid
                              :block/name "aaa"
                              :block/title "aaa"}]})]
      (is (= "Tagged #aaa" (:text seg)))
      (is (= "Tagged #aaa" (:full-text seg)))))

  (testing "unloaded uuid refs stay unchanged in partial UI db"
    (let [ref-uuid #uuid "00000000-0000-0000-0000-000000000002"
          seg (model/block->breadcrumb-segment
               {:db/id 1
                :block/uuid #uuid "00000000-0000-0000-0000-000000000001"
                :block/raw-title (str "See [[" ref-uuid "]]")
                :block/refs [{:db/id 2
                              :block/uuid ref-uuid}]})]
      (is (= (str "See [[" ref-uuid "]]") (:text seg)))
      (is (= (str "See [[" ref-uuid "]]") (:full-text seg))))))

(deftest block->breadcrumb-segment-title-ref-ids-test
  (testing "returns uuid refs from the breadcrumb label line"
    (let [visible-uuid #uuid "00000000-0000-0000-0000-000000000002"
          hidden-uuid #uuid "00000000-0000-0000-0000-000000000003"
          seg (model/block->breadcrumb-segment
               {:db/id 1
                :block/uuid #uuid "00000000-0000-0000-0000-000000000001"
                :block/raw-title (str "See [[" visible-uuid "]]\nIgnore [[" hidden-uuid "]]")})]
      (is (= [visible-uuid]
             (vec (:title-ref-ids seg))))))

  (testing "includes tag-style uuid refs"
    (let [ref-uuid #uuid "00000000-0000-0000-0000-000000000002"
          seg (model/block->breadcrumb-segment
               {:db/id 1
                :block/uuid #uuid "00000000-0000-0000-0000-000000000001"
                :block/raw-title (str "Tagged #[[" ref-uuid "]]")})]
      (is (= [ref-uuid]
             (vec (:title-ref-ids seg)))))))

;; ---------------------------------------------------------------------------
;; block->breadcrumb-segment — structural type detection
;; ---------------------------------------------------------------------------

(deftest ^:large-vars/cleanup-todo block->breadcrumb-segment-type-test
  (testing "code block entity has :type :code via raw-title fence"
    (let [seg (model/block->breadcrumb-segment
               {:db/id 1
                :block/uuid #uuid "00000000-0000-0000-0000-000000000001"
                :block/raw-title "```clojure\n(foo bar)"})]
      (is (= :code (:type seg)))))

  (testing "DB code block entity has :type :code via display-type property"
    (let [seg (model/block->breadcrumb-segment
               {:db/id 1
                :block/uuid #uuid "00000000-0000-0000-0000-000000000001"
                :block/raw-title "(foo bar)"
                :logseq.property.node/display-type :code})]
      (is (= :code (:type seg)))))

  (testing "DB quote block entity has :type :quote via display-type property"
    (let [seg (model/block->breadcrumb-segment
               {:db/id 1
                :block/uuid #uuid "00000000-0000-0000-0000-000000000001"
                :block/raw-title "some quote"
                :logseq.property.node/display-type :quote})]
      (is (= :quote (:type seg)))))

  (testing "DB math block entity maps to :type :math via display-type property"
    (let [seg (model/block->breadcrumb-segment
               {:db/id 1
                :block/uuid #uuid "00000000-0000-0000-0000-000000000001"
                :block/raw-title "e=mc^2"
                :logseq.property.node/display-type :math})]
      (is (= :math (:type seg)))
      (is (= "e=mc^2" (:text seg)))))

  (testing "display-type takes precedence over raw-title pattern"
    (let [seg (model/block->breadcrumb-segment
               {:db/id 1
                :block/uuid #uuid "00000000-0000-0000-0000-000000000001"
                :block/raw-title "{{query (task TODO)}}"
                :logseq.property.node/display-type :code})]
      (is (= :code (:type seg)))))

  (testing "query block entity has :type :query"
    (let [seg (model/block->breadcrumb-segment
               {:db/id 1
                :block/uuid #uuid "00000000-0000-0000-0000-000000000001"
                :block/raw-title "{{query (task TODO)}}"})]
      (is (= :query (:type seg)))
      (is (nil? (:text seg)))))

  (testing "query block with a title keeps title as usable summary"
    (let [seg (model/block->breadcrumb-segment
               {:db/id 1
                :block/uuid #uuid "00000000-0000-0000-0000-000000000001"
                :block/raw-title "Open tasks\n{{query (task TODO)}}"})]
      (is (= :query (:type seg)))
      (is (= "Open tasks" (:text seg)))))

  (testing "note block skips wrapper and uses first inner text"
    (let [seg (model/block->breadcrumb-segment
               {:db/id 1
                :block/uuid #uuid "00000000-0000-0000-0000-000000000001"
                :block/raw-title "#+BEGIN_NOTE\nRelease checklist\n#+END_NOTE"})]
      (is (= :note (:type seg)))
      (is (= "Release checklist" (:text seg)))))

  (testing "quote block skips wrapper and uses first inner text"
    (let [seg (model/block->breadcrumb-segment
               {:db/id 1
                :block/uuid #uuid "00000000-0000-0000-0000-000000000001"
                :block/raw-title "#+BEGIN_QUOTE\nWe shape our tools\n#+END_QUOTE"})]
      (is (= :quote (:type seg)))
      (is (= "We shape our tools" (:text seg)))))

  (testing "code block without a useful comment has icon-only summary"
    (let [seg (model/block->breadcrumb-segment
               {:db/id 1
                :block/uuid #uuid "00000000-0000-0000-0000-000000000001"
                :block/raw-title "```clojure\n(defn foo [])\n```"})]
      (is (= :code (:type seg)))
      (is (nil? (:text seg)))))

  (testing "code block can use a short comment as summary"
    (let [seg (model/block->breadcrumb-segment
               {:db/id 1
                :block/uuid #uuid "00000000-0000-0000-0000-000000000001"
                :block/raw-title "```clojure\n;; Parse breadcrumbs\n(defn foo [])\n```"})]
      (is (= :code (:type seg)))
      (is (= "Parse breadcrumbs" (:text seg)))))

  (testing "DB query block detected via :logseq.class/Query tag"
    (let [seg (model/block->breadcrumb-segment
               {:db/id 1
                :block/uuid #uuid "00000000-0000-0000-0000-000000000001"
                :block/raw-title "some query content"
                :block/tags [{:db/ident :logseq.class/Query}]})]
      (is (= :query (:type seg)))))

  (testing "DB Cards block detected via :logseq.class/Cards tag"
    (let [seg (model/block->breadcrumb-segment
               {:db/id 1
                :block/uuid #uuid "00000000-0000-0000-0000-000000000001"
                :block/raw-title "cards content"
                :block/tags [{:db/ident :logseq.class/Cards}]})]
      (is (= :query (:type seg)))))

  (testing "tag-type is overridden by display-type"
    (let [seg (model/block->breadcrumb-segment
               {:db/id 1
                :block/uuid #uuid "00000000-0000-0000-0000-000000000001"
                :block/raw-title "some content"
                :logseq.property.node/display-type :code
                :block/tags [{:db/ident :logseq.class/Query}]})]
      (is (= :code (:type seg))))))

;; ---------------------------------------------------------------------------
;; segments->full-title
;; ---------------------------------------------------------------------------

(deftest segments->full-title-test
  (testing "joins segment texts with /"
    (is (= "My Page / Parent / Child"
           (model/segments->full-title
            [{:text "My Page"} {:text "Parent"} {:text "Child"}]))))

  (testing "falls back to full-text when text is nil"
    (is (= "My Page / Full label"
           (model/segments->full-title
            [{:text "My Page"} {:text nil :full-text "Full label"}]))))

  (testing "skips nils"
    (is (= "A / C"
           (model/segments->full-title
            [{:text "A"} {:text nil :full-text nil} {:text "C"}])))))

;; ---------------------------------------------------------------------------
;; build-breadcrumb-view
;; ---------------------------------------------------------------------------

(defn- make-segs
  "Build a vector of minimal segment maps with labels :s0 :s1 ..."
  [n]
  (vec (for [i (range n)]
         {:db/id 1
          :block/uuid (random-uuid)
          :type (if (zero? i) :page :block)
          :text (str "Seg" i)
          :full-text (str "Segment " i)
          :page? (zero? i)})))

(deftest build-breadcrumb-view-test
  (testing "empty segments return all-empty result"
    (let [result (model/build-breadcrumb-view [] {:max-visible 4 :nearest-count 2 :show-page? true})]
      (is (= [] (:visible-prefix result)))
      (is (= [] (:hidden result)))
      (is (= [] (:visible-suffix result)))
      (is (false? (:overflow? result)))))

  (testing "1-segment path: no overflow"
    (let [segs (make-segs 1)
          result (model/build-breadcrumb-view segs {:max-visible 4 :nearest-count 2 :show-page? true})]
      (is (= segs (:visible-prefix result)))
      (is (false? (:overflow? result)))))

  (testing "2-segment path within budget: no overflow"
    (let [segs (make-segs 2)
          result (model/build-breadcrumb-view segs {:max-visible 4 :nearest-count 2 :show-page? true})]
      (is (false? (:overflow? result)))
      (is (= segs (:visible-prefix result)))))

  (testing "5-segment path with max-visible 4: overflows"
    (let [segs (make-segs 5)
          result (model/build-breadcrumb-view segs {:max-visible 4 :nearest-count 2 :show-page? true})]
      (is (true? (:overflow? result)))
      ;; prefix = first 1 (page), suffix = last 2 (nearest parents), hidden = middle 2
      (is (= [(nth segs 0)] (:visible-prefix result)))
      (is (= [(nth segs 3) (nth segs 4)] (:visible-suffix result)))
      (is (= [(nth segs 1) (nth segs 2)] (:hidden result)))))

  (testing "20-segment path with default budget: overflows"
    (let [segs (make-segs 20)
          result (model/build-breadcrumb-view segs {:max-visible 4 :nearest-count 2 :show-page? true})]
      (is (true? (:overflow? result)))
      (is (= 1 (count (:visible-prefix result))))
      (is (= 2 (count (:visible-suffix result))))
      (is (= 17 (count (:hidden result))))))

  (testing "show-page? false drops the first segment"
    (let [segs (make-segs 5)
          result (model/build-breadcrumb-view segs {:max-visible 4 :nearest-count 2 :show-page? false})]
      ;; after dropping page, 4 remain, max-visible 4 => no overflow
      (is (false? (:overflow? result)))))

  (testing "search-result variant: max-visible 3, nearest-count 1"
    (let [segs (make-segs 5)
          opts (model/variant-options :search-result)
          result (model/build-breadcrumb-view segs opts)]
      (is (true? (:overflow? result)))
      ;; prefix = 1 page, suffix = 1 nearest, hidden = 3 middle
      (is (= 1 (count (:visible-prefix result))))
      (is (= 1 (count (:visible-suffix result))))
      (is (= 3 (count (:hidden result)))))))
