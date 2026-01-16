(ns frontend.handler.paste-test
  (:require [cljs.test :refer [deftest are is testing]]
            [frontend.test.helper :as test-helper :include-macros true :refer [deftest-async]]
            ["/frontend/utils" :as utils]
            [frontend.state :as state]
            [frontend.commands :as commands]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [promesa.core :as p]
            [frontend.extensions.html-parser :as html-parser]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.paste :as paste-handler]))

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
      (p/with-redefs
        [utils/getClipText (fn [cb] (cb clipboard))
         state/get-input (constantly #js {:value "block"})
         commands/delete-selection! (constantly nil)
         editor-handler/insert (fn [text _] (p/resolved text))]
        (p/let [result (paste-handler/editor-on-paste-raw!)]
          (is (= expected-paste result)))))))

(deftest-async editor-on-paste-raw-with-multi-line
  (let [clipboard "a\n\na"
        expected-paste "a\n\na"]
    (p/with-redefs
      [utils/getClipText (fn [cb] (cb clipboard))
       state/get-input (constantly #js {:value "block"})
       commands/delete-selection! (constantly nil)
       editor-handler/insert (fn [text _] (p/resolved text))]
      (p/let [result (paste-handler/editor-on-paste-raw!)]
        (is (= expected-paste result))))))

(deftest-async editor-on-paste-with-link
  (testing "Formatted paste for special link should paste macro wrapped link"
    (let [clipboard "https://www.youtube.com/watch?v=xu9p5ynlhZk"
          expected-paste "{{video https://www.youtube.com/watch?v=xu9p5ynlhZk}}"]
      (p/with-redefs
        [;; paste-copied-blocks-or-text mocks below
         commands/delete-selection! (constantly nil)
         commands/simple-insert! (fn [_input text] (p/resolved text))
         util/stop (constantly nil)
         util/get-selected-text (constantly "")
         html-parser/convert (constantly nil)]
        (p/let [result ((paste-handler/editor-on-paste! nil)
                        #js {:clipboardData #js {:getData (constantly clipboard)}})]
          (is (= expected-paste result)))))))

(deftest-async editor-on-paste-with-twitter-is-now-x-lol
  (testing "Formatted paste for the site formerly known as twitter link should paste macro wrapped as twitter"
    (let [clipboard "https://x.com/chiefnoah13/status/1792677792506843462"
          expected-paste "{{twitter https://x.com/chiefnoah13/status/1792677792506843462}}"]
      (p/with-redefs
        [commands/delete-selection! (constantly nil)
         commands/simple-insert! (fn [_input text] (p/resolved text))
         util/stop (constantly nil)
         util/get-selected-text (constantly "")
         html-parser/convert (constantly nil)]
        (p/let [result ((paste-handler/editor-on-paste! nil)
                        #js {:clipboardData #js {:getData (constantly clipboard)}})]
          (is (= expected-paste result)))))))

(deftest-async editor-on-paste-with-text-over-link
  (testing "Paste text over a selected formatted link"
    (let [actual-text (atom nil)
          clipboard "logseq"
          selected-text "https://logseq.com"
          block-content (str selected-text " is awesome")
          expected-paste "[logseq](https://logseq.com) is awesome"]
      (p/with-redefs
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
          (is (= expected-paste @actual-text)))))))

(deftest-async editor-on-paste-with-selected-text-and-special-link
  (testing "Formatted paste with special link on selected text pastes a formatted link"
    (let [actual-text (atom nil)
          clipboard "https://www.youtube.com/watch?v=xu9p5ynlhZk"
          selected-text "great song"
          block-content (str selected-text " - Obaluaê!")
          expected-paste "[great song](https://www.youtube.com/watch?v=xu9p5ynlhZk) - Obaluaê!"]
      (p/with-redefs
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
          (is (= expected-paste @actual-text)))))))

(deftest-async editor-on-paste-with-block-ref-in-between-parens
  (let [clipboard "((647f90f4-d733-4ee2-bbf5-907e820a23d3))"
        expected-paste "647f90f4-d733-4ee2-bbf5-907e820a23d3"]
    (p/with-redefs
      [;; paste-copied-blocks-or-text mocks below
       util/stop (constantly nil)
       state/get-input (constantly #js {:value "(())"})
       cursor/pos (constantly 2)
       commands/simple-insert! (fn [_input text] (p/resolved text))]
      (p/let [result ((paste-handler/editor-on-paste! nil)
                      #js {:clipboardData #js {:getData (constantly clipboard)}})]
        (is (= expected-paste result))))))

(deftest-async editor-on-paste-with-copied-blocks
  (let [actual-blocks (atom nil)
        ;; Simplified version of block attributes that are copied
        expected-blocks [{:block/title "Test node"}
                         {:block/title "Notes\nid:: 6422ec75-85c7-4e09-9a4d-2a1639a69b2f"}]
        clipboard "- Test node\n\t- Notes\nid:: 6422ec75-85c7-4e09-9a4d-2a1639a69b2f"]
    (p/with-redefs
      [;; paste-copied-blocks-or-text mocks below
       util/stop (constantly nil)
       state/get-current-repo (constantly "test")
       paste-handler/get-copied-blocks (constantly (p/resolved {:graph "test"
                                                                :blocks expected-blocks}))
       editor-handler/paste-blocks (fn [blocks _] (reset! actual-blocks blocks))]
      (p/let [_ ((paste-handler/editor-on-paste! nil)
                 #js {:clipboardData #js {:getData (constantly clipboard)}})]
        (is (= expected-blocks @actual-blocks))))))

(deftest-async editor-on-paste-with-selection-in-property
  (let [clipboard "after"
        expected-paste "after"
        block-content "test:: before"]
    (p/with-redefs
      [state/get-input (constantly #js {:value block-content})
       ;; paste-copied-blocks-or-text mocks below
       commands/delete-selection! (constantly nil)
       commands/simple-insert! (fn [_input text] (p/resolved text))
       util/stop (constantly nil)
       html-parser/convert (constantly nil)]
      (p/let [result ((paste-handler/editor-on-paste! nil)
                      #js {:clipboardData #js {:getData (constantly clipboard)}})]
        (is (= expected-paste result))))))

(deftest-async editor-on-paste-with-file-pasting
  (let [clipboard "<meta charset='utf-8'><img src=\"https://user-images.githubusercontent.com/38045018/228234385-cbbcc6b2-1168-40da-ab3e-1e506edd5fce.png\"/>"
        files [{:name "image.png" :type "image/png" :size 11836}]
        pasted-file (atom nil)]
    (p/with-redefs
      [state/preferred-pasting-file? (constantly true)
       ;; paste-file-if-exists mocks below
       editor-handler/upload-asset! (fn [_id file & _]
                                     (reset! pasted-file file))
       util/stop (constantly nil)
       state/get-edit-block (constantly {})]
      (p/let [_ ((paste-handler/editor-on-paste! :fake-id)
                 #js {:clipboardData #js {:getData (constantly clipboard)
                                          :files files}})]
        (is (= files (js->clj @pasted-file)))))))
