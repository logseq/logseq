(ns frontend.handler.paste-test
  (:require [cljs.test :refer [deftest are is testing]]
            [frontend.test.helper :as test-helper :include-macros true :refer [deftest-async]]
            [goog.object :as gobj]
            ["/frontend/utils" :as utils]
            [frontend.state :as state]
            [frontend.commands :as commands]
            [frontend.util :as util]
            [promesa.core :as p]
            [frontend.extensions.html-parser :as html-parser]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.paste :as paste-handler]))

(deftest try-parse-as-json-result-parse-test
  (are [x y] (let [result (#'paste-handler/try-parse-as-json x)
                   obj-result (if (object? result) result #js{})]
               (gobj/get obj-result "foo") ;; This op shouldn't throw
               (gobj/getValueByKeys obj-result "foo" "bar") ;; This op shouldn't throw
               (gobj/equals result y))
    "{\"number\": 1234}" #js{:number 1234}
    "1234" 1234
    "null" nil
    "true" true
    "[1234, 5678]" #js[1234 5678]
    ;; invalid JSON
    "{number: 1234}" #js{}))

(deftest try-parse-as-json-result-get-test
  (are [x y z] (let [result (#'paste-handler/try-parse-as-json x)
                     obj-result (if (object? result) result #js{})]
                 (and (gobj/equals (gobj/get obj-result "foo") y)
                      (gobj/equals (gobj/getValueByKeys obj-result "foo" "bar") z)))
    "{\"foo\": {\"bar\": 1234}}" #js{:bar 1234} 1234
    "{\"number\": 1234}" nil nil
    "1234" nil nil
    "null" nil nil
    "true" nil nil
    "[{\"number\": 1234}]" nil nil
    ;; invalid JSON
    "{number: 1234}" nil nil))

(deftest selection-within-link-test
  (are [x y] (= (#'paste-handler/selection-within-link? x) y)
    {:format :markdown
     :value "[logseq](https://logseq.com)"
     :selection-start 0
     :selection-end 28
     :selection "[logseq](https://logseq.com)"} true
    {:format :markdown
     :value "[logseq](https://logseq.com)"
     :selection-start 1
     :selection-end 27
     :selection "logseq](https://logseq.com"} true
    {:format :markdown
     :value "[logseq](https://logseq.com)"
     :selection-start 1
     :selection-end 7
     :selection "logseq"} true
    {:format :markdown
     :value "[logseq](https://logseq.com)"
     :selection-start 9
     :selection-end 27
     :selection "https://logseq.com"} true
    {:format :markdown
     :value "[logseq](https://logseq.com) is awesome"
     :selection-start 32
     :selection-end 39
     :selection "awesome"} false
    {:format :markdown
     :value "[logseq](https://logseq.com) is awesome"
     :selection-start 9
     :selection-end 39
     :selection "https://logseq.com) is awesome"} false
    {:format :markdown
     :value "[logseq](https://logseq.com) is developed with [Clojure](https://clojure.org)"
     :selection-start 9
     :selection-end 76
     :selection "https://logseq.com) is developed with [Clojure](https://clojure.org"} false))

(deftest-async editor-on-paste-raw-with-link
  (testing "Raw paste for link should just paste link"
    (let [clipboard "https://www.youtube.com/watch?v=xu9p5ynlhZk"
          expected-paste "https://www.youtube.com/watch?v=xu9p5ynlhZk"]
      (test-helper/with-reset
        reset
        [utils/getClipText (fn [cb] (cb clipboard))
         state/get-input (constantly #js {:value "block"})
         commands/delete-selection! (constantly nil)
         editor-handler/insert (fn [text _] (p/resolved text))]
        (p/let [result (paste-handler/editor-on-paste-raw!)]
               (is (= expected-paste result))
               (reset))))))

(deftest-async editor-on-paste-raw-with-multi-line
  (let [clipboard "a\n\na"
        expected-paste "a\n\na"]
    (test-helper/with-reset
      reset
      [utils/getClipText (fn [cb] (cb clipboard))
       state/get-input (constantly #js {:value "block"})
       commands/delete-selection! (constantly nil)
       editor-handler/insert (fn [text _] (p/resolved text))]
      (p/let [result (paste-handler/editor-on-paste-raw!)]
             (is (= expected-paste result))
             (reset)))))

(deftest-async editor-on-paste-with-link
  (testing "Formatted paste for link should paste macro wrapped link"
    (let [clipboard "https://www.youtube.com/watch?v=xu9p5ynlhZk"
          expected-paste "{{video https://www.youtube.com/watch?v=xu9p5ynlhZk}}"]
      (test-helper/with-reset
        reset
        [utils/getClipText (fn [cb] (cb clipboard))
         state/get-input (constantly #js {:value "block"})
         ;; paste-copied-blocks-or-text mocks below
         commands/delete-selection! (constantly nil)
         commands/simple-insert! (fn [_input text] (p/resolved text))
         util/stop (constantly nil)
         html-parser/convert (constantly nil)]
        (p/let [result ((paste-handler/editor-on-paste! nil)
                        #js {:clipboardData #js {:getData (constantly clipboard)}})]
               (is (= expected-paste result))
               (reset))))))

(deftest-async editor-on-paste-with-selection-in-property
  (let [clipboard "after"
        expected-paste "after"
        block-content "test:: before"]
    (test-helper/with-reset
      reset
      [utils/getClipText (fn [cb] (cb clipboard))
       state/get-input (constantly #js {:value block-content})
       ;; paste-copied-blocks-or-text mocks below
       commands/delete-selection! (constantly nil)
       commands/simple-insert! (fn [_input text] (p/resolved text))
       util/stop (constantly nil)
       html-parser/convert (constantly nil)]
      (p/let [result ((paste-handler/editor-on-paste! nil)
                      #js {:clipboardData #js {:getData (constantly clipboard)}})]
             (is (= expected-paste result))
             (reset)))))
