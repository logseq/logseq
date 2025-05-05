(ns logseq.e2e.commands-test
  (:require
   [clj-time.core :as t]
   [clj-time.local :as tl]
   [clojure.string :as string]
   [clojure.test :refer [deftest testing is use-fixtures]]
   [logseq.e2e.block :as b]
   [logseq.e2e.fixtures :as fixtures]
   [logseq.e2e.keyboard :as k]
   [logseq.e2e.util :as util]
   [wally.main :as w]))

(use-fixtures :once fixtures/open-page)

(use-fixtures :each fixtures/new-logseq-page)

(deftest command-trigger-test
  (testing "/command trigger popup"
    (b/new-block "b2")
    (util/type " /")
    (w/wait-for ".ui__popover-content")
    (is (some? (w/find-one-by-text "span" "Node reference")))
    (k/backspace)
    (w/wait-for-not-visible ".ui__popover-content")))

(deftest node-reference-test
  (testing "Node reference"
    (testing "Page reference"
      (b/new-blocks ["b1" ""])
      (util/input-command "Node eferen")
      (util/type "Another page")
      (k/enter)
      (is (= "[[Another page]]" (util/get-edit-content)))
      (util/exit-edit)
      (is (= "Another page" (util/get-text "a.page-ref"))))
    (testing "Block reference"
      (b/new-block "")
      (util/input-command "Node eferen")
      (util/type "b1")
      (util/wait-timeout 300)
      (k/enter)
      (is (string/includes? (util/get-edit-content) "[["))
      (util/exit-edit)
      (is (= "b1" (util/get-text ".block-ref"))))))

(deftest link-test
  (testing "/link"
    (let [add-logseq-link (fn []
                            (util/type "https://logseq.com")
                            (k/tab)
                            (util/type "Logseq")
                            (k/tab)
                            (k/enter))]
      (b/new-block "")
      (util/input-command "link")
      (add-logseq-link)
      (is (= "[Logseq](https://logseq.com)" (util/get-edit-content)))
      (util/type " some content ")
      (util/input-command "link")
      (add-logseq-link)
      (is (= (str "[Logseq](https://logseq.com)"
                  " some content "
                  "[Logseq](https://logseq.com)") (util/get-edit-content))))))

(deftest link-image-test
  (testing "/image link"
    (b/new-block "")
    (util/input-command "image link")
    (util/type "https://logseq.com/test.png")
    (k/tab)
    (util/type "Logseq")
    (k/tab)
    (k/enter)
    (is (= "![Logseq](https://logseq.com/test.png)" (util/get-edit-content)))))

(deftest underline-test
  (testing "/underline"
    (b/new-block "")
    (util/input-command "underline")
    (is (= "<ins></ins>" (util/get-edit-content)))
    (util/type "test")
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
    (util/type "1 + 2 = 3")
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
        (k/esc)
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
    (is (= ["1." "2." "3."] (w/all-text-contents "span.typed-list")))
    ;; double `enter` convert the next block to bullet block
    (k/enter)
    (k/enter)
    (is (= ["1." "2." "3."] (w/all-text-contents "span.typed-list")))))

(deftest number-children-test
  (testing "number children commands"
    (b/new-blocks ["a" "a1" "a2" "a3" "b"])
    (k/arrow-up)
    (util/repeat-keyboard 3 "Shift+ArrowUp")
    (k/tab)
    (b/jump-to-block "a")
    (util/input-command "number children")
    (is (= ["1." "2." "3."] (w/all-text-contents "span.typed-list")))))
