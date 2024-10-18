(ns frontend.handler.paste-test
  (:require [cljs.test :refer [deftest are is testing]]
            [frontend.test.helper :as test-helper :include-macros true :refer [deftest-async]]
            [goog.object :as gobj]
            ["/frontend/utils" :as utils]
            [frontend.state :as state]
            [frontend.commands :as commands]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
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
  (testing "Formatted paste for special link should paste macro wrapped link"
    (let [clipboard "https://www.youtube.com/watch?v=xu9p5ynlhZk"
          expected-paste "{{video https://www.youtube.com/watch?v=xu9p5ynlhZk}}"]
      (test-helper/with-reset
        reset
        [;; paste-copied-blocks-or-text mocks below
         commands/delete-selection! (constantly nil)
         commands/simple-insert! (fn [_input text] (p/resolved text))
         util/stop (constantly nil)
         util/get-selected-text (constantly "")
         html-parser/convert (constantly nil)]
        (p/let [result ((paste-handler/editor-on-paste! nil)
                        #js {:clipboardData #js {:getData (constantly clipboard)}})]
          (is (= expected-paste result))
          (reset))))))

(deftest-async editor-on-paste-with-twitter-is-now-x-lol
  (testing "Formatted paste for the site formerly known as twitter link should paste macro wrapped as twitter"
    (let [clipboard "https://x.com/chiefnoah13/status/1792677792506843462"
          expected-paste "{{twitter https://x.com/chiefnoah13/status/1792677792506843462}}"]
      (test-helper/with-reset
        reset
        [commands/delete-selection! (constantly nil)
         commands/simple-insert! (fn [_input text] (p/resolved text))
         util/stop (constantly nil)
         util/get-selected-text (constantly "")
         html-parser/convert (constantly nil)]
        (p/let [result ((paste-handler/editor-on-paste! nil)
                        #js {:clipboardData #js {:getData (constantly clipboard)}})]
          (is (= expected-paste result))
          (reset))))))

(deftest-async editor-on-paste-with-text-over-link
  (testing "Paste text over a selected formatted link"
    (let [actual-text (atom nil)
          clipboard "logseq"
          selected-text "https://logseq.com"
          block-content (str selected-text " is awesome")
          expected-paste "[logseq](https://logseq.com) is awesome"]
      (test-helper/with-reset
        reset
        [;; paste-copied-blocks-or-text mocks below
         util/stop (constantly nil)
         util/get-selected-text (constantly selected-text)
         editor-handler/get-selection-and-format
         (constantly {:selection-start 0 :selection-end (count selected-text)
                      :selection selected-text :format :markdown :value block-content})
         state/set-edit-content! (fn [_ new-value] (reset! actual-text new-value))
         cursor/move-cursor-to (constantly nil)]
        (p/let [_ ((paste-handler/editor-on-paste! nil)
                   #js {:clipboardData #js {:getData (constantly clipboard)}})]
          (is (= expected-paste @actual-text))
          (reset))))))

(deftest-async editor-on-paste-with-selected-text-and-special-link
  (testing "Formatted paste with special link on selected text pastes a formatted link"
    (let [actual-text (atom nil)
          clipboard "https://www.youtube.com/watch?v=xu9p5ynlhZk"
          selected-text "great song"
          block-content (str selected-text " - Obaluaê!")
          expected-paste "[great song](https://www.youtube.com/watch?v=xu9p5ynlhZk) - Obaluaê!"]
      (test-helper/with-reset
        reset
        [;; paste-copied-blocks-or-text mocks below
         util/stop (constantly nil)
         util/get-selected-text (constantly selected-text)
         editor-handler/get-selection-and-format
         (constantly {:selection-start 0 :selection-end (count selected-text)
                      :selection selected-text :format :markdown :value block-content})
         state/set-edit-content! (fn [_ new-value] (reset! actual-text new-value))
         cursor/move-cursor-to (constantly nil)]
        (p/let [_ ((paste-handler/editor-on-paste! nil)
                   #js {:clipboardData #js {:getData (constantly clipboard)}})]
          (is (= expected-paste @actual-text))
          (reset))))))

(deftest-async editor-on-paste-with-block-ref-in-between-parens
  (let [clipboard "((647f90f4-d733-4ee2-bbf5-907e820a23d3))"
        expected-paste "647f90f4-d733-4ee2-bbf5-907e820a23d3"]
    (test-helper/with-reset
      reset
      [;; paste-copied-blocks-or-text mocks below
       util/stop (constantly nil)
       state/get-input (constantly #js {:value "(())"})
       cursor/pos (constantly 2)
       commands/simple-insert! (fn [_input text] (p/resolved text))]
      (p/let [result ((paste-handler/editor-on-paste! nil)
                      #js {:clipboardData #js {:getData (constantly clipboard)}})]
        (is (= expected-paste result))
        (reset)))))

(deftest-async editor-on-paste-with-copied-blocks
  (let [actual-blocks (atom nil)
        ;; Simplified version of block attributes that are copied
        expected-blocks [{:block/content "Test node"}
                         {:block/content "Notes\nid:: 6422ec75-85c7-4e09-9a4d-2a1639a69b2f"}]
        clipboard "- Test node\n\t- Notes\nid:: 6422ec75-85c7-4e09-9a4d-2a1639a69b2f"]
    (test-helper/with-reset
      reset
      [;; paste-copied-blocks-or-text mocks below
       util/stop (constantly nil)
       paste-handler/get-copied-blocks (constantly (p/resolved expected-blocks))
       editor-handler/paste-blocks (fn [blocks _] (reset! actual-blocks blocks))]
      (p/let [_ ((paste-handler/editor-on-paste! nil)
                 #js {:clipboardData #js {:getData (constantly clipboard)}})]
        (is (= expected-blocks @actual-blocks))
        (reset)))))

(deftest-async editor-on-paste-with-selection-in-property
  (let [clipboard "after"
        expected-paste "after"
        block-content "test:: before"]
    (test-helper/with-reset
      reset
      [state/get-input (constantly #js {:value block-content})
       ;; paste-copied-blocks-or-text mocks below
       commands/delete-selection! (constantly nil)
       commands/simple-insert! (fn [_input text] (p/resolved text))
       util/stop (constantly nil)
       html-parser/convert (constantly nil)]
      (p/let [result ((paste-handler/editor-on-paste! nil)
                      #js {:clipboardData #js {:getData (constantly clipboard)}})]
             (is (= expected-paste result))
             (reset)))))

(deftest-async editor-on-paste-with-file-pasting
  (let [clipboard "<meta charset='utf-8'><img src=\"https://user-images.githubusercontent.com/38045018/228234385-cbbcc6b2-1168-40da-ab3e-1e506edd5fce.png\"/>"
        files [{:name "image.png" :type "image/png" :size 11836}]
        pasted-file (atom nil)]
    (test-helper/with-reset
      reset
      [state/preferred-pasting-file? (constantly true)
       ;; paste-file-if-exists mocks below
       editor-handler/upload-asset (fn [_id file & _]
                                     (reset! pasted-file file))
       util/stop (constantly nil)
       state/get-edit-block (constantly {})]
      (p/let [_ ((paste-handler/editor-on-paste! :fake-id)
                      #js {:clipboardData #js {:getData (constantly clipboard)
                                               :files files}})]
             (is (= files (js->clj @pasted-file)))
             (reset)))))
