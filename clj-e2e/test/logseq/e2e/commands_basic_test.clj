(ns logseq.e2e.commands-basic-test
  (:require
   [clojure.string :as string]
   [clojure.test :refer [deftest testing is use-fixtures]]
   [logseq.e2e.assert :as assert]
   [logseq.e2e.block :as b]
   [logseq.e2e.fixtures :as fixtures]
   [logseq.e2e.keyboard :as k]
   [logseq.e2e.locator :as loc]
   [logseq.e2e.util :as util]
   [wally.main :as w]
   [wally.repl :as repl]))

(use-fixtures :once fixtures/open-page)

(use-fixtures :each
  fixtures/new-logseq-page
  fixtures/validate-graph)

(deftest command-trigger-test
  (testing "/command trigger popup"
    (b/new-block "b2")
    (util/press-seq " /")
    (w/wait-for "a.menu-link.chosen:has-text('Node reference')")
    (k/backspace)
    (w/wait-for-not-visible ".ui__popover-content")))

(deftest page-reference-test
  (testing "Page reference"
    (b/new-blocks ["b1" ""])
    (util/input-command "Node reference")
    (util/press-seq "Another page")
    (k/enter)
    (is (= "[[Another page]]" (util/get-edit-content)))
    (util/exit-edit)
    (is (= "Another page" (util/get-text "a.page-ref")))))

(deftest block-reference-test
  (testing "Block reference"
    (b/new-blocks ["block test" ""])
    (util/input-command "Node reference")
    (util/press-seq "block test")
    (util/wait-timeout 300)
    (k/enter)
    (is (string/includes? (util/get-edit-content) "[["))
    (util/exit-edit)
    (is (= "block test" (util/get-text "a.page-ref")))))

(deftest link-test
  (testing "/link"
    (let [add-logseq-link (fn []
                            (util/press-seq "https://logseq.com")
                            (k/tab)
                            (util/press-seq "Logseq")
                            (k/tab)
                            (k/enter))]
      (b/new-block "")
      (util/input-command "link")
      (add-logseq-link)
      (is (= "[Logseq](https://logseq.com)" (util/get-edit-content)))
      (util/press-seq " some content ")
      (util/input-command "link")
      (add-logseq-link)
      (is (= (str "[Logseq](https://logseq.com)"
                  " some content "
                  "[Logseq](https://logseq.com)") (util/get-edit-content))))))

(deftest link-image-test
  (testing "/image link"
    (b/new-block "")
    (util/input-command "image link")
    (util/press-seq "https://logseq.com/test.png")
    (k/tab)
    (util/press-seq "Logseq")
    (k/tab)
    (k/enter)
    (is (= "![Logseq](https://logseq.com/test.png)" (util/get-edit-content)))))

(deftest underline-test
  (testing "/underline"
    (b/new-block "")
    (util/input-command "underline")
    (is (= "<ins></ins>" (util/get-edit-content)))
    (util/press-seq "test")
    (is (= "<ins>test</ins>" (util/get-edit-content)))
    (util/move-cursor-to-end)))

(deftest code-block-test
  (testing "/code block"
    (b/new-block "")
    (util/input-command "code block")
    (w/wait-for ".CodeMirror")
    (util/wait-timeout 100)
    ;; create another block
    (k/shift+enter)))

(deftest math-block-test
  (testing "/math block"
    (b/new-block "")
    (util/input-command "math block")
    (util/press-seq "1 + 2 = 3")
    (util/exit-edit)
    (w/wait-for ".katex")))

(deftest quote-test
  (testing "/quote"
    (b/new-block "")
    (util/input-command "quote")
    (w/wait-for "div[data-node-type='quote']")))

(deftest headings-test
  (testing "/heading"
    (dotimes [i 6]
      (let [heading (str "h" (inc i))
            text (str heading " test ")]
        (b/new-block text)
        (util/input-command heading)
        (is (= text (util/get-edit-content)))
        (util/exit-edit)
        (w/wait-for heading)))))

(deftest status-test
  (testing "task status commands"
    (let [status->icon {"Doing" "InProgress50"
                        "In review" "InReview"
                        "Canceled" "Cancelled"}]
      (doseq [status ["Backlog" "Todo" "Doing" "In review" "Done" "Canceled"]]
        (let [text (str status " test ")]
          (b/new-block text)
          (util/input-command status)
          (is (= text (util/get-edit-content)))
          (util/exit-edit)
          (k/esc)
          (w/wait-for (str ".ls-icon-" (get status->icon status status))))))))

(deftest priority-test
  (testing "task priority commands"
    (let [priority->icon {"No priority" "line-dashed"}]
      (doseq [priority ["No priority" "Low" "Medium" "High" "Urgent"]]
        (let [text (str priority " test ")]
          (b/new-block text)
          (util/input-command priority)
          (is (= text (util/get-edit-content)))
          (util/exit-edit)
          (w/wait-for (str ".ls-icon-" (get priority->icon priority
                                            (str "priorityLvl" priority)))))))))

(deftest scheduled-deadline-test
  (testing "task scheduled and deadline commands"
    (doseq [command ["Scheduled" "Deadline"]]
      (fixtures/create-page)
      (let [text (str command " test ")]
        (b/new-block text)
        (util/input-command command)
        (k/enter)
        (assert/assert-editor-mode)
        ;; FIXME: cannot exit edit by k/esc???
        ;; (util/exit-edit)
        (k/esc)
        (b/new-block "temp fix")
        (util/exit-edit)
        (is (= command (util/get-text ".property-k")))
        (is (= "Today" (util/get-text ".ls-datetime a.page-ref")))))))

;; TODO: java "MMMM d, yyyy" vs js "MMM do, yyyy"
(deftest date-time-test
  (testing "date time commands"
    (util/input-command "today")
    (let [text (util/get-edit-content)]
      (and (string/starts-with? text "[[")
           (string/ends-with? text "]]")))
    (b/new-block "")
    (util/input-command "yesterday")
    (let [text (util/get-edit-content)]
      (and (string/starts-with? text "[[")
           (string/ends-with? text "]]")))
    (b/new-block "")
    (util/input-command "tomorrow")
    (let [text (util/get-edit-content)]
      (and (string/starts-with? text "[[")
           (string/ends-with? text "]]")))
    ;; FIXME:
    ;; (b/new-block "")
    ;; (util/input-command "time")
    ;; (let [text (util/get-edit-content)
    ;;       t (tl/local-now)]
    ;;   (is (= text (str (t/hour t) ":" (t/minute t)))))
    (b/new-block "")
    (util/input-command "date picker")
    (let [text (util/get-edit-content)]
      (and (string/starts-with? text "[[")
           (string/ends-with? text "]]")))))

(deftest number-list-test
  (testing "number list commands"
    (util/input-command "number list")
    (b/new-blocks ["a" "b" "c"])
    (assert/assert-have-count "span.typed-list" 3)
    (is (= ["1." "2." "3."] (w/all-text-contents "span.typed-list")))
    ;; double `enter` convert the next block to bullet block
    (k/enter)
    (assert/assert-have-count "span.typed-list" 4)
    (util/wait-timeout 60)
    (k/enter)
    (assert/assert-have-count "span.typed-list" 3)
    (is (= ["1." "2." "3."] (w/all-text-contents "span.typed-list")))))

(deftest number-children-test
  (testing "number children commands"
    (b/new-blocks ["a" "a1" "a2" "a3" "b"])
    (k/arrow-up)
    (w/wait-for "textarea:text('a3')")
    (util/repeat-keyboard 3 "Shift+ArrowUp")
    (k/tab)
    (b/jump-to-block "a")
    (util/input-command "number children")
    (assert/assert-have-count "span.typed-list" 3)
    (is (= ["1." "2." "3."] (w/all-text-contents "span.typed-list")))))

(deftest query-test
  (testing "query"
    (b/new-blocks ["[[foo]] block" "[[foo]] another" ""])
    (util/input-command "query")
    (let [btn (util/-query-last "button:text('filter')")]
      (w/click btn)
      (util/input "page reference")
      (w/click "a.menu-link:has-text('page reference')")
      (w/click "a.menu-link:has-text('foo')")
      (assert/assert-is-visible "div:text('Live query (2)')"))))

(deftest advanced-query-test
  (testing "query"
    (b/new-blocks ["[[bar]] block" "[[bar]] another" ""])
    (util/input-command "advanced query")
    (w/click ".ls-query-setting")
    (w/click "pre.CodeMirror-line")
    (util/input "{:query [:find (pull ?b [*])
:where [?b :block/refs ?r]
[?r :block/title \"bar\"]]}")
    (k/esc)
    (is (some? (w/find-one-by-text "div" "Live query (2)")))))

(deftest calculator-test
  (testing "calculator"
    (b/new-block "")
    (util/input-command "calculator")
    (util/input "1 + 2")
    (w/wait-for "div.extensions__code-calc-output-line")
    (is (= "3" (util/get-text "div.extensions__code-calc-output-line")))))

(deftest template-test
  (testing "template"
    (b/new-block "template 1")
    (util/set-tag "Template")
    (b/new-blocks ["block 1" "block 2" "block 3" "test"])
    (k/arrow-up)
    (w/wait-for "textarea:text('block 3')")
    (util/repeat-keyboard 3 "Shift+ArrowUp")
    (k/tab)
    (b/jump-to-block "test")
    (util/input-command "template")
    (util/input "template 1")
    (w/wait-for "a.menu-link.chosen:has-text('template 1')")
    (k/enter)
    (doseq [text ["block 1" "block 2" "block 3"]]
      (assert/assert-have-count
       (loc/or (format ".ls-block .block-title-wrap:text('%s')" text)
               (format ".ls-block textarea:text('%s')" text))
       2))))

(deftest embed-html-test
  (testing "embed html"
    (b/new-block "")
    (util/input-command "embed html")
    (util/press-seq "<div id=\"embed-test\">test</div>")
    (util/exit-edit)
    (is (= "test" (util/get-text "#embed-test")))))

(deftest embed-video-test
  (testing "embed video"
    (b/new-block "")
    (util/input-command "embed video")
    (util/press-seq "https://www.youtube.com/watch?v=7xTGNNLPyMI")
    (util/exit-edit)
    (w/wait-for "iframe")))

(deftest embed-tweet-test
  (testing "embed tweet"
    (b/new-block "")
    (util/input-command "embed tweet")
    (util/press-seq "https://x.com/logseq/status/1784914564083314839")
    (util/exit-edit)
    (w/wait-for "iframe")))

(deftest cloze-test
  (testing "cloze"
    (b/new-block "")
    (util/input-command "cloze")
    (util/press-seq "hidden answer")
    (util/exit-edit)
    (w/click "a.cloze")
    (w/wait-for "a.cloze-revealed")))
