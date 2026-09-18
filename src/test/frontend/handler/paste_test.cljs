(ns frontend.handler.paste-test
  (:require ["/frontend/utils" :as utils]
            [cljs.test :refer [deftest are is testing]]
            [frontend.commands :as commands]
            [frontend.db.async :as db-async]
            [frontend.extensions.html-parser :as html-parser]
            [frontend.format.block :as block]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.paste :as paste-handler]
            [frontend.state :as state]
            [frontend.test.helper :as test-helper :include-macros true :refer [deftest-async]]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [logseq.graph-parser.block :as gp-block]
            [promesa.core :as p]))

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

(deftest-async editor-on-paste-embed-block-uses-worker-loaded-link
  (let [linked-block-id #uuid "11111111-1111-1111-1111-111111111111"
        current-block-id #uuid "22222222-2222-2222-2222-222222222222"
        inserted-opts (atom nil)
        clear-edit? (atom false)
        loaded-blocks (atom [])]
    (p/with-redefs
     [util/stop (constantly nil)
      state/get-current-repo (constantly "test")
      paste-handler/get-copied-blocks (constantly (p/resolved {:graph "test"
                                                               :embed-block? true
                                                               :blocks [{:block/uuid linked-block-id
                                                                         :block/properties {:ignored true}}]}))
      utils/getCopiedBlocksFromMemory (constantly nil)
      state/get-block-op-type (constantly nil)
      state/get-edit-block (constantly {:block/uuid current-block-id})
      db-async/<get-block-parents (fn [repo db-id depth]
                                    (is (= "test" repo))
                                    (is (= 7 db-id))
                                    (is (= 100 depth))
                                    (p/resolved []))
      db-async/<get-block (fn [repo block-id opts]
                            (swap! loaded-blocks conj block-id)
                            (is (= "test" repo))
                            (is (= {:children? false} opts))
                            (p/resolved
                             (case block-id
                               #uuid "22222222-2222-2222-2222-222222222222"
                               {:db/id 7
                                :block/uuid current-block-id}

                               #uuid "11111111-1111-1111-1111-111111111111"
                               {:db/id 42
                                :block/uuid linked-block-id})))
      editor-handler/api-insert-new-block! (fn [_content opts]
                                             (reset! inserted-opts opts)
                                             (p/resolved nil))
      state/clear-edit! (fn [] (reset! clear-edit? true))]
      (p/let [_ ((paste-handler/editor-on-paste! nil)
                 #js {:clipboardData #js {:getData (constantly "copied")}})]
        (is (= {:block-uuid current-block-id
                :sibling? true
                :outliner-op :paste
                :replace-empty-target? true
                :other-attrs {:block/link 42}}
               @inserted-opts))
        (is (= [current-block-id linked-block-id] @loaded-blocks))
        (is @clear-edit?)))))

(deftest editing-display-type-block-uses-state-block
  (with-redefs [state/get-edit-block (constantly {:db/id 1
                                                  :logseq.property.node/display-type :code})]
    (is (true? (#'paste-handler/editing-display-type-block?)))))

(deftest-async paste-text-parseable-preserves-standalone-display-blocks
  (let [actual-blocks (atom [])
        code-clipboard "```sql\nSELECT value\nFROM records\n```"
        math-clipboard "$$\nE = mc^2\n$$"
        parsed-blocks {code-clipboard
                       [{:block/title "SELECT value\nFROM records"
                         :block/uuid #uuid "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
                         :logseq.property.node/display-type :code
                         :logseq.property.code/lang "sql"
                         :block/level 1}]
                       math-clipboard
                       [{:block/title "E = mc^2"
                         :block/uuid #uuid "cccccccc-cccc-cccc-cccc-cccccccccccc"
                         :logseq.property.node/display-type :math
                         :block/level 1}]}]
    (p/with-redefs
     [state/get-current-repo (constantly "test")
      state/get-edit-block (constantly {:db/id 10})
      db-async/<get-block-page-info
      (fn [& _] (p/resolved {:db/id 1 :block/name "paste target"}))
      block/extract-blocks (fn [_ast text & _] (get parsed-blocks text))
      gp-block/with-parent-and-order (fn [_ blocks] blocks)
      editor-handler/paste-blocks (fn [blocks _opts]
                                    (swap! actual-blocks into blocks)
                                    (p/resolved nil))]
      (p/let [_ (#'paste-handler/paste-text-parseable :markdown code-clipboard)
              _ (#'paste-handler/paste-text-parseable :markdown math-clipboard)]
        (is (= [{:block/title "SELECT value\nFROM records"
                 :logseq.property.node/display-type :code
                 :logseq.property.code/lang "sql"}
                {:block/title "E = mc^2"
                 :logseq.property.node/display-type :math}]
               (mapv #(select-keys % [:block/title
                                      :logseq.property.node/display-type
                                      :logseq.property.code/lang])
                     @actual-blocks)))))))

(deftest-async paste-text-parseable-preserves-og-copied-heading-page-refs
  (let [actual-blocks (atom nil)
        date-page-uuid #uuid "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
        parsed-blocks [{:block/title "## [[2026-06-15]]"
                        :block/uuid #uuid "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
                        :block/refs [{:block/title "2026-06-15"
                                      :block/uuid date-page-uuid}]
                        :logseq.property/heading 2
                        :block/level 1}]]
    (p/with-redefs [state/get-current-repo (constantly "test")
                    state/get-edit-block (constantly {:db/id 10})
                    db-async/<get-block-page-info
                    (fn [_repo _block-ref]
                      (p/resolved {:db/id 1
                                   :block/name "paste target"}))
                    block/extract-blocks (fn [& _] parsed-blocks)
                    gp-block/with-parent-and-order (fn [_ blocks] blocks)
                    editor-handler/paste-blocks (fn [blocks _opts]
                                                  (reset! actual-blocks blocks)
                                                  (p/resolved nil))]
      (p/let [_ (#'paste-handler/paste-text-parseable :markdown "- ## [[2026-06-15]]")]
        (is (= [{:block/title (str "[[" date-page-uuid "]]")
                 :logseq.property/heading 2}]
               (mapv #(select-keys % [:block/title :logseq.property/heading])
                     @actual-blocks)))))))

(deftest-async paste-text-parseable-resolves-page-refs-through-worker-test
  (let [actual-blocks (atom nil)
        page-uuid #uuid "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
        parsed-blocks [{:block/title "## [[Existing Page]]"
                        :block/uuid #uuid "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
                        :block/refs [{:block/title "Existing Page"}]
                        :logseq.property/heading 2
                        :block/level 1}]
        calls (atom [])]
    (p/with-redefs [state/get-current-repo (constantly "test")
                    state/get-edit-block (constantly {:db/id 10})
                    state/get-date-formatter (constantly "yyyy-MM-dd")
                    db-async/<get-block-page-info
                    (fn [repo block-ref]
                      (swap! calls conj [:get-block-page-info repo block-ref])
                      (p/resolved {:db/id 1
                                   :block/name "paste target"}))
                    state/<invoke-db-worker
                    (fn [& args]
                      (swap! calls conj (vec args))
                      (case (first args)
                        :thread-api/pull
                        (p/resolved {:block/uuid page-uuid
                                     :block/title "Existing Page"
                                     :block/name "existing page"})))
                    block/extract-blocks (fn [& _] parsed-blocks)
                    gp-block/with-parent-and-order (fn [_ blocks] blocks)
                    editor-handler/paste-blocks (fn [blocks _opts]
                                                  (reset! actual-blocks blocks)
                                                  (p/resolved nil))]
      (p/let [_ (#'paste-handler/paste-text-parseable :markdown "- ## [[Existing Page]]")]
        (is (= [[:get-block-page-info "test" 10]
                [:thread-api/pull "test" [:block/uuid :block/title :block/name] [:block/name "existing page"]]]
               @calls))
        (is (= [{:block/title (str "[[" page-uuid "]]")
                 :logseq.property/heading 2}]
               (mapv #(select-keys % [:block/title :logseq.property/heading])
                     @actual-blocks)))))))

(deftest-async paste-text-parseable-does-not-create-empty-page-ref
  (let [actual-blocks (atom nil)
        parsed-blocks [{:block/title "## [[2026-06-15]]"
                        :block/uuid #uuid "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
                        :block/refs [{:block/title "2026-06-15"}]
                        :logseq.property/heading 2
                        :block/level 1}]]
    (p/with-redefs [state/get-current-repo (constantly "test")
                    state/get-edit-block (constantly {:db/id 10})
                    state/get-date-formatter (constantly "yyyy-MM-dd")
                    db-async/<get-block-page-info
                    (fn [_repo _block-ref]
                      (p/resolved {:db/id 1
                                   :block/name "paste target"}))
                    state/<invoke-db-worker
                    (fn [& _] (p/resolved nil))
                    block/extract-blocks (fn [& _] parsed-blocks)
                    gp-block/with-parent-and-order (fn [_ blocks] blocks)
                    editor-handler/paste-blocks (fn [blocks _opts]
                                                  (reset! actual-blocks blocks)
                                                  (p/resolved nil))]
      (p/let [_ (#'paste-handler/paste-text-parseable :markdown "- ## [[2026-06-15]]")]
        (is (= [{:block/title "[[00000001-2026-0615-0000-000000000000]]"
                 :logseq.property/heading 2}]
               (mapv #(select-keys % [:block/title :logseq.property/heading])
                     @actual-blocks)))))))

(deftest-async editor-on-paste-prefers-blocks-from-memory-when-clipboard-custom-type-is-missing
  (let [actual-blocks (atom nil)
        expected-blocks [{:block/title "Memory cache block"}]
        clipboard-blocks-str (pr-str {:graph "test"
                                      :blocks expected-blocks})
        clipboard "fallback text"]
    (p/with-redefs
     [util/stop (constantly nil)
      state/get-current-repo (constantly "test")
      paste-handler/get-copied-blocks (fn []
                                        (throw (js/Error. "should not read async clipboard when memory cache has payload")))
      utils/getCopiedBlocksFromMemory (fn [text]
                                        (when (= text clipboard)
                                          clipboard-blocks-str))
      editor-handler/paste-blocks (fn [blocks _] (reset! actual-blocks blocks))]
      (p/let [_ ((paste-handler/editor-on-paste! nil)
                 #js {:clipboardData #js {:getData (fn [k]
                                                     (cond
                                                       (= k "text") clipboard
                                                       :else ""))}})]
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

(deftest-async editor-on-paste-firefox-html-with-line-breaks
  (testing "Firefox paste with soft line breaks should not create unwanted line breaks"
    (let [clipboard-html "<meta charset='utf-8'><p>Delegated access\n management means you can select a subset of roles for a given project \nand allow the granted organization to self-manage those roles for their \nusers.</p>"
          expected-paste "Delegated access management means you can select a subset of roles for a given project and allow the granted organization to self-manage those roles for their users."]
      (p/with-redefs
       [commands/delete-selection! (constantly nil)
        commands/simple-insert! (fn [_input text] (p/resolved text))
        util/stop (constantly nil)
        util/get-selected-text (constantly "")]
        (p/let [result ((paste-handler/editor-on-paste! nil)
                        #js {:clipboardData #js {:getData (fn [type]
                                                            (if (= type "text/html")
                                                              clipboard-html
                                                              expected-paste))}})]
          (is (= expected-paste result)))))))
