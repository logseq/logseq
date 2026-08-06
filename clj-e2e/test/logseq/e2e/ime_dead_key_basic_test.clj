(ns logseq.e2e.ime-dead-key-basic-test
  "Dead-key (international keyboard layout) input: autopair parity and
   corruption regressions. Event shapes calibrated against a real macOS
   international-layout trace: the composition commit synthesizes a keydown
   carrying the resolved char with keyCode 229. Prints each scenario's event
   trace to ease debugging."
  (:require [clojure.string :as string]
            [clojure.test :refer [deftest testing is use-fixtures]]
            [jsonista.core :as json]
            [logseq.e2e.assert :as assert]
            [logseq.e2e.block :as b]
            [logseq.e2e.fixtures :as fixtures]
            [logseq.e2e.ime :as ime]
            [logseq.e2e.util :as util]
            [wally.main :as w]))

(use-fixtures :once fixtures/open-page)
(use-fixtures :each fixtures/new-logseq-page)

(def ^:private logger-js
  "(() => {
     const el = document.querySelector('.editor-wrapper textarea');
     if (!el) throw new Error('editor textarea not found');
     window.__ime_events = [];
     const rec = (e) => window.__ime_events.push({
       type: e.type,
       key: e.key,
       keyCode: e.keyCode,
       isComposing: e.isComposing,
       data: e.data,
       inputType: e.inputType,
       value: el.value,
       selectionStart: el.selectionStart});
     ['keydown','keyup','compositionstart','compositionupdate','compositionend','beforeinput','input']
       .forEach((t) => el.addEventListener(t, rec, true));
   })()")

(defn- start-recording!
  []
  (w/eval-js logger-js))

(defn- recorded-events
  []
  (json/read-value (w/eval-js "JSON.stringify(window.__ime_events)")
                   json/keyword-keys-object-mapper))

(defn- print-trace!
  [scenario]
  (println "=== trace:" scenario)
  (doseq [e (recorded-events)]
    (prn e))
  (println "=== textarea value:" (pr-str (util/get-edit-content)))
  (println "=== end trace:" scenario))

(defn- fresh-block!
  []
  (b/new-blocks [""])
  (start-recording!))

(deftest single-backtick-dead-key-test
  (testing "dead ` + space autopairs like a plain ` keydown"
    (fresh-block!)
    (ime/backtick+space!)
    (print-trace! "backtick+space")
    (is (= "``" (util/get-edit-content)) "textarea after dead ` + space")))

(deftest inline-code-sequence-test
  (testing "dead ` + space, type code, dead ` + space skips over the closing pair"
    (fresh-block!)
    (ime/backtick+space!)
    (util/press-seq "code")
    (ime/backtick+space!)
    (print-trace! "`code`")
    (is (= "`code`" (util/get-edit-content))
        "textarea after full inline-code sequence")
    (util/exit-edit)
    (is (= ["code"] (util/get-page-blocks-contents)) "rendered inline code text")))

(deftest tilde-composes-accent-test
  (testing "n + dead ~ + a + o => não, accents must not trigger autopair"
    (fresh-block!)
    (util/press-seq "n")
    (ime/tilde+a!)
    (util/press-seq "o")
    (print-trace! "não")
    (is (= "não" (util/get-edit-content)) "textarea after composing ã")
    (util/exit-edit)
    (is (= ["não"] (util/get-page-blocks-contents)) "saved block content")))

(deftest double-dead-key-test
  (testing "dead ~ twice then space behaves like typing ~~ on a US layout"
    (fresh-block!)
    (ime/dead-key-twice! "~" "Backquote" 192)
    (ime/commit-with-space! "~")
    (print-trace! "~~ via double dead key")
    (is (= "~~" (util/get-edit-content)) "textarea after double dead ~")))

(deftest strikethrough-sequence-test
  (testing "~~strike~~ via dead keys"
    (fresh-block!)
    (ime/tilde+space!)
    (ime/tilde+space!)
    (util/press-seq "strike")
    (ime/tilde+space!)
    (ime/tilde+space!)
    (print-trace! "~~strike~~")
    (is (= "~~strike~~" (util/get-edit-content))
        "textarea after strikethrough sequence")))

(deftest triple-backtick-codeblock-test
  (testing "dead ` + space three times converts the block into a code block"
    (fresh-block!)
    (ime/backtick+space!)
    (ime/backtick+space!)
    (ime/backtick+space!)
    ;; no print-trace! here: the conversion replaces the block textarea
    (assert/assert-is-visible ".CodeMirror")))

(deftest vanishing-text-test
  (testing "content typed after a dead-key commit persists after leaving the block"
    (fresh-block!)
    (ime/backtick+space!)
    (util/press-seq "asd")
    (print-trace! "vanishing text")
    (util/exit-edit)
    (let [contents (remove string/blank? (util/get-page-blocks-contents))]
      (println "=== persisted contents:" (pr-str contents))
      (is (= ["asd"] contents)
          "the typed content must survive leaving the block"))))

(deftest slow-composition-test
  (testing "composition held open across the 450ms auto-save debounce"
    (fresh-block!)
    (util/press-seq "antes ")
    (ime/dead-key! "`" "Backquote" 192)
    ;; keep the composition open long enough for the pending auto-save to fire
    (util/wait-timeout 1500)
    (ime/commit-with-space! "`")
    (util/press-seq "depois")
    (print-trace! "slow composition")
    (is (= "antes `depois`" (util/get-edit-content))
        "textarea after slow composition")))

(deftest composition-with-action-popup-test
  (testing "dead key composition while the [[ ]] page-search popup is open"
    (fresh-block!)
    (util/press-seq "[")
    (util/press-seq "[")
    (w/wait-for ".ui__popover-content")
    (ime/tilde+a!)
    (util/press-seq "o")
    (print-trace! "composition inside [[ ]]")
    (is (= "[[ão]]" (util/get-edit-content))
        "textarea after composing inside page-search")))

(deftest other-dead-keys-insert-cleanly-test
  (testing "dead keys without a no-selection autopair insert their char cleanly"
    (fresh-block!)
    ;; ^ only autopairs with a selection, so parity means no pair here
    (ime/caret+space!)
    (ime/acute+space!)
    (print-trace! "^ and ´ commits")
    (is (= "^´" (util/get-edit-content)) "textarea after ^ and ´ commits")
    (util/exit-edit)
    (is (= ["^´"] (util/get-page-blocks-contents)) "saved block content")))

(deftest double-caret-highlight-test
  (testing "dead ^ + space twice creates the ^^ highlight pair like a US layout"
    (fresh-block!)
    (ime/caret+space!)
    (ime/caret+space!)
    (util/press-seq "hl")
    (print-trace! "^^hl^^")
    (is (= "^^hl^^" (util/get-edit-content))
        "textarea after double dead ^ and typed text")))

(deftest unbalanced-markers-render-test
  (testing "unbalanced ` and ~~ must not hide text when rendered"
    (b/new-blocks ["antes `x depois"])
    (b/new-block "antes ~~x depois")
    (util/exit-edit)
    (let [contents (util/get-page-blocks-contents)]
      (println "=== rendered unbalanced contents:" (pr-str contents))
      (is (= ["antes `x depois" "antes ~~x depois"] contents)
          "unbalanced markers keep the raw text visible"))))

(deftest interleaved-typing-test
  (testing "normal typing interleaved with dead keys must not duplicate chars"
    (fresh-block!)
    (util/press-seq "antes ")
    (ime/backtick+space!)
    (util/press-seq "x")
    (ime/backtick+space!)
    (util/press-seq " depois")
    (print-trace! "interleaved")
    (is (= "antes `x` depois" (util/get-edit-content))
        "textarea after interleaved sequence")))
