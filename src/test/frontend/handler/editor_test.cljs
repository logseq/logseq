(ns frontend.handler.editor-test
  (:require [clojure.test :refer [async deftest is testing use-fixtures]]
            [frontend.commands :as commands]
            [frontend.components.editor :as editor-component]
            [frontend.db :as db]
            [frontend.db.async :as db-async]
            [frontend.db.model :as model]
            [frontend.handler.editor :as editor]
            [frontend.handler.route :as route-handler]
            [frontend.state :as state]
            [frontend.test.helper :as test-helper]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [goog.dom :as gdom]
            [logseq.outliner.core :as outliner-core]
            [promesa.core :as p]))

(use-fixtures :each {:before test-helper/start-test-db!
                     :after (fn []
                              (state/set-current-repo! nil)
                              (test-helper/destroy-test-db!))})

(deftest extract-nearest-link-from-text-test
  (testing "Page, block and tag links"
    (is (= "page1"
           (editor/extract-nearest-link-from-text "[[page1]] [[page2]]" 0))
        "Finds first page link correctly based on cursor position")

    (is (= "page2"
           (editor/extract-nearest-link-from-text "[[page1]] [[page2]]" 10))
        "Finds second page link correctly based on cursor position")

    (is (= "tag"
           (editor/extract-nearest-link-from-text "#tag [[page1]]" 3))
        "Finds tag correctly")

    (is (= "61e057b9-f799-4532-9258-cfef6ce58370"
           (editor/extract-nearest-link-from-text
            "((61e057b9-f799-4532-9258-cfef6ce58370)) #todo" 5))
        "Finds block correctly"))

  (testing "Url links"
    (is (= "https://github.com/logseq/logseq"
           (editor/extract-nearest-link-from-text
            "https://github.com/logseq/logseq is #awesome :)" 0 editor/url-regex))
        "Finds url correctly")

    (is (not= "https://github.com/logseq/logseq"
              (editor/extract-nearest-link-from-text
               "https://github.com/logseq/logseq is #awesome :)" 0))
        "Doesn't find url if regex not passed")

    (is (= "https://github.com/logseq/logseq"
           (editor/extract-nearest-link-from-text
            "[logseq](https://github.com/logseq/logseq) is #awesome :)" 0 editor/url-regex))
        "Finds url in markdown link correctly"))

  (is (= "https://github.com/logseq/logseq"
         (editor/extract-nearest-link-from-text
          "[[https://github.com/logseq/logseq][logseq]] is #awesome :)" 0 editor/url-regex))
      "Finds url in org link correctly"))

(defn- follow-page-link-result
  [{:keys [page-title existing-page? worker-page?]}]
  (let [events (atom [])
        redirects (atom [])
        worker-page-uuid (random-uuid)
        input-id "edit-block-test"
        input #js {:value (str "Open [[" page-title "]]")}]
    (p/with-redefs [state/get-edit-block (constantly {:block/uuid (random-uuid)})
                    state/get-edit-input-id (constantly input-id)
                    gdom/getElement (fn [id]
                                      (when (= input-id id)
                                        input))
                    cursor/pos (constantly 10)
                    editor/save-current-block! (constantly nil)
                    state/clear-editor-action! (constantly nil)
                    state/clear-edit! (constantly nil)
                    db/get-page (fn [title]
                                  (when (and existing-page? (= page-title title))
                                    {:block/title title
                                     :block/uuid (random-uuid)}))
                    db-async/<get-block (fn [_repo title _opts]
                                          (p/resolved
                                           (when (and worker-page? (= page-title title))
                                             {:block/title title
                                              :block/uuid worker-page-uuid})))
                    state/pub-event! (fn [event]
                                       (swap! events conj event)
                                       (p/resolved nil))
                    route-handler/redirect-to-page! (fn [& args]
                                                      (swap! redirects conj args))]
      (p/let [_ (editor/follow-link-under-cursor!)]
        {:events @events
         :redirects @redirects}))))

(deftest follow-link-under-cursor-opens-existing-page-test
  (async done
    (-> (follow-page-link-result {:page-title "Project"
                                  :existing-page? true})
        (p/then
         (fn [{:keys [events redirects]}]
           (is (empty? events))
           (is (= [["Project"]] redirects))
           (done))))))

(deftest follow-link-under-cursor-creates-missing-page-test
  (async done
    (-> (follow-page-link-result {:page-title "May 15th, 2026"
                                  :existing-page? false})
        (p/then
         (fn [{:keys [events redirects]}]
           (is (= [[:page/create "May 15th, 2026"]] events))
           (is (empty? redirects))
           (done))))))

(deftest follow-link-under-cursor-uses-worker-page-before-creating-test
  (async done
    (-> (follow-page-link-result {:page-title "May 15th, 2026"
                                  :existing-page? false
                                  :worker-page? true})
        (p/then
         (fn [{:keys [events redirects]}]
           (is (empty? events))
           (is (= [["May 15th, 2026"]] redirects))
           (done))))))

(defn- keyup-handler
  "Spied version of editor/keyup-handler"
  [{:keys [value cursor-pos action commands]
    ;; Default to some commands matching which matches default behavior for most
    ;; completion scenarios
    :or {commands [:fake-command]}}]
  ;; Reset editor action in order to test result
  (state/set-editor-action! action)
  ;; Default cursor pos to end of line
  (let [pos (or cursor-pos (count value))
        input #js {:value value}
        command (subs value 1)]
    (with-redefs [editor/get-last-command (constantly command)
                  editor/get-matched-commands (constantly commands)
                  ;; Ignore as none of its behaviors are tested
                  editor/default-case-for-keyup-handler (constantly nil)
                  cursor/pos (constantly pos)]
      ((editor/keyup-handler nil input)
       #js {:key (subs value (dec (count value)))}
       nil))))

(deftest keyup-handler-test
  (testing "Command autocompletion"
    ;; default last matching command is ""
    (keyup-handler {:value "/z"
                    :action :commands
                    :commands []})
    (is (= :commands (state/get-editor-action))
        "Completion stays open if no matches but differs from last success by <= 2 chars")

    (keyup-handler {:value "/zz"
                    :action :commands
                    :commands []})
    (is (= :commands (state/get-editor-action))
        "Completion stays open if no matches but differs from last success by <= 2 chars")

    (keyup-handler {:value "/zzz"
                    :action :commands
                    :commands []})
    (is (= nil (state/get-editor-action))
        "Completion closed if no matches and > 2 chars form last success")

    (keyup-handler {:value "/b"
                    :action :commands
                    :commands [:fake-command]})
    (is (= :commands (state/get-editor-action))
        "Completion stays open if there is a matching command")

    (keyup-handler {:value "/ " :action :commands})
    (is (= nil (state/get-editor-action))
        "Completion closed after a space follows /")

    (keyup-handler {:value "/block " :action :commands})
    (is (= :commands (state/get-editor-action))
        "Completion stays open if space is part of the search term for /"))

  (testing "Tag autocompletion"
    (keyup-handler {:value "foo #b" :action :page-search-hashtag})
    (is (= :page-search-hashtag (state/get-editor-action))
        "Completion stays open for one tag")

    (keyup-handler {:value "text # #bar"
                    :action :page-search-hashtag
                    :cursor-pos 6})
    (is (= :page-search-hashtag (state/get-editor-action))
        "Completion stays open when typing tag before another tag"))
  ;; Reset state
  (state/set-editor-action! nil))

(defn- create-tag-with-alias!
  []
  (test-helper/create-page! "Project Tag" :redirect? false :class? true)
  (test-helper/create-page! "Alias Only" :redirect? false)
  (let [class (db/get-case-page "Project Tag")
        alias (db/get-case-page "Alias Only")]
    (db/transact! test-helper/test-db [{:db/id (:db/id class)
                                        :block/alias #{(:db/id alias)}}])))

(deftest get-matched-classes-includes-class-aliases
  (create-tag-with-alias!)
  (is (= ["Project Tag"]
         (map :block/title (editor/get-matched-classes "Project Tag")))
      "Existing tag title matching still works")
  (is (= ["Alias Only"]
         (map :block/title (editor/get-matched-classes "Alias Only")))
      "Tag aliases stay available as tag completion choices"))

(deftest tag-search-does-not-convert-class-aliases
  (async done
    (create-tag-with-alias!)
    (let [matched-pages (atom nil)]
      (-> (p/with-redefs [db-async/<get-block (fn [_repo _title _opts]
                                                (p/resolved (db/get-page "Alias Only")))]
            (#'editor-component/search-pages "Alias Only" true #(reset! matched-pages %)))
          (.then
           (fn []
             (is (some #(= "Alias Only" (:block/title %)) @matched-pages)
                 "The alias is still selectable from tag completion")
             (is (not-any? :convert-page-to-tag? @matched-pages)
                 "A class alias must not show a redundant Convert action")
             (done)))))))

(defn- default-keyup-result
  [{:keys [value cursor-pos key code action is-processed?]
    :or {code "KeyA"
         is-processed? false}}]
  (let [pos (or cursor-pos (count value))
        input #js {:id "edit-block-test"
                   :value value}
        content (atom nil)
        cursor-pos' (atom nil)
        steps (atom [])]
    (with-redefs [state/get-editor-action (constantly action)
                  state/set-block-content-and-last-pos! (fn [_input-id value' pos']
                                                          (reset! content value')
                                                          (reset! cursor-pos' pos'))
                  state/set-editor-action-data! (constantly nil)
                  state/set-editor-last-pos! (fn [pos']
                                               (reset! cursor-pos' pos'))
                  state/clear-editor-action! (constantly nil)
                  util/get-selected-text (constantly "")
                  cursor/pos (constantly pos)
                  cursor/get-caret-pos (fn [_] {:pos @cursor-pos'})
                  cursor/move-cursor-to (fn [_ pos' & _]
                                          (reset! cursor-pos' pos'))
                  commands/handle-step (fn [step]
                                         (swap! steps conj step))]
      (#'editor/default-case-for-keyup-handler input pos key code is-processed?)
      {:content @content
       :cursor-pos @cursor-pos'
       :steps @steps})))

(deftest default-keyup-handler-normalizes-fullwidth-page-ref-input
  (doseq [[value cursor-pos expected-content expected-pos]
          [["【【" 2 "[[]]" 2]
           ["【【】" 3 "[[]]" 2]
           ["【】【】" 4 "[[]]" 2]
           ["【【】】" 2 "[[]]" 2]
           ;; cursor=1: IME may place cursor early; full pattern must still match
           ["【【】】" 1 "[[]]" 2]
           ["abc【【】】def" 5 "abc[[]]def" 5]
           ["abc【】【】def" 7 "abc[[]]def" 5]]]
    (is (= {:content expected-content
            :cursor-pos expected-pos
            :steps [[:editor/search-page]]}
           (default-keyup-result {:value value
                                  :cursor-pos cursor-pos
                                  :key "Process"
                                  :is-processed? true}))
        (str "Normalizes " value " at cursor " cursor-pos))))

(deftest default-keyup-handler-normalizes-hashtag-fullwidth-page-ref-input
  (is (= {:content "#[[]]"
          :cursor-pos 3
          :steps [[:editor/search-page-hashtag]]}
         (default-keyup-result {:value "#【】【】"
                                :cursor-pos 5
                                :key "Process"
                                :is-processed? true
                                :action :page-search-hashtag}))))

(deftest default-keyup-handler-ignores-non-page-ref-trigger-key
  (is (= {:content nil
          :cursor-pos nil
          :steps []}
         (default-keyup-result {:value "【【】】"
                                :cursor-pos 2
                                :key "a"}))))

(deftest keydown-not-matched-handler-wraps-selected-text-with-single-dollar
  (let [content (atom nil)
        cursor-pos (atom nil)
        selection-range (atom nil)
        input #js {:id "edit-block-test"
                   :value "inline math"
                   :setSelectionRange (fn [start end]
                                        (reset! selection-range [start end]))}
        event #js {:key "$"
                   :ctrlKey false
                   :metaKey false}
        selected "math"]
    (with-redefs [state/get-edit-input-id (constantly "edit-block-test")
                  state/get-input (constantly input)
                  state/get-editor-action (constantly nil)
                  state/set-state! (constantly nil)
                  state/set-block-content-and-last-pos! (fn [_input-id value' pos']
                                                          (reset! content value')
                                                          (reset! cursor-pos pos'))
                  gdom/getElement (constantly input)
                  util/get-selected-text (constantly selected)
                  util/stop (constantly nil)
                  cursor/pos (constantly 7)
                  cursor/move-cursor-to (fn [_ pos' & _]
                                          (reset! cursor-pos pos'))]
      ((editor/keydown-not-matched-handler :markdown) event nil)
      (is (= "inline $math$" @content))
      (is (= 8 @cursor-pos))
      (is (= [8 12] @selection-range)))))

(defn- keydown-dollar-without-selection-result
  [{:keys [value cursor-pos]}]
  (let [content (atom nil)
        cursor-pos' (atom nil)
        input #js {:id "edit-block-test"
                   :value value}
        event #js {:key "$"
                   :ctrlKey false
                   :metaKey false}]
    (with-redefs [state/get-edit-input-id (constantly "edit-block-test")
                  state/get-input (constantly input)
                  state/get-editor-action (constantly nil)
                  state/set-state! (constantly nil)
                  state/set-block-content-and-last-pos! (fn [_input-id value' pos']
                                                          (reset! content value')
                                                          (reset! cursor-pos' pos'))
                  gdom/getElement (constantly input)
                  util/get-selected-text (constantly "")
                  util/stop (constantly nil)
                  cursor/pos (constantly cursor-pos)
                  cursor/move-cursor-to (fn [_ pos' & _]
                                          (reset! cursor-pos' pos'))]
      ((editor/keydown-not-matched-handler :markdown) event nil)
      {:content @content
       :cursor-pos @cursor-pos'})))

(deftest keydown-not-matched-handler-expands-dollar-delimiters-without-selection
  (is (= {:content "inline $$"
          :cursor-pos 8}
         (keydown-dollar-without-selection-result {:value "inline "
                                                   :cursor-pos 7})))
  (is (= {:content "inline $$$$"
          :cursor-pos 9}
         (keydown-dollar-without-selection-result {:value "inline $$"
                                                   :cursor-pos 8}))))

(defn- handle-last-input-handler
  "Spied version of editor/handle-last-input"
  [{:keys [value cursor-pos]}]
  ;; Reset editor action in order to test result
  (state/set-editor-action! nil)
  ;; Default cursor pos to end of line
  (let [pos (or cursor-pos (count value))]
    (with-redefs [state/get-input (constantly #js {:value value})
                  cursor/pos (constantly pos)
                  cursor/move-cursor-backward (constantly nil) ;; ignore if called
                  cursor/get-caret-pos (constantly {})]
      (editor/handle-last-input))))

(deftest handle-last-input-handler-test
  (testing "Command autocompletion"
    (handle-last-input-handler {:value "/"})
    (is (= :commands (state/get-editor-action))
        "Command search if only / has been typed")

    (handle-last-input-handler {:value "some words /"})
    (is (= :commands (state/get-editor-action))
        "Command search on start of new word")

    (handle-last-input-handler {:value "a line\n/"})
    (is (= :commands (state/get-editor-action))
        "Command search on start of a new line")

    (handle-last-input-handler {:value "https://"})
    (is (= nil (state/get-editor-action))
        "No command search in middle of a word")

    (handle-last-input-handler {:value "#blah/"})
    (is (= nil (state/get-editor-action))
        "No command search after a tag search to allow for namespace completion"))

  (testing "Tag autocompletion"
    (handle-last-input-handler {:value "#"
                                :cursor-pos 1})
    (is (= :page-search-hashtag (state/get-editor-action))
        "Page search if only hashtag has been typed")

    (handle-last-input-handler {:value "foo #"
                                :cursor-pos 5})
    (is (= :page-search-hashtag (state/get-editor-action))
        "Page search if hashtag has been typed at EOL")

    (handle-last-input-handler {:value "#Some words"
                                :cursor-pos 1})
    (is (= :page-search-hashtag (state/get-editor-action))
        "Page search if hashtag is at start of line and there are existing words")

    (handle-last-input-handler {:value "foo #"
                                :cursor-pos 5})
    (is (= :page-search-hashtag (state/get-editor-action))
        "Page search if hashtag is at EOL and after a space")

    (handle-last-input-handler {:value "foo #bar"
                                :cursor-pos 5})
    (is (= :page-search-hashtag (state/get-editor-action))
        "Page search if hashtag is in middle of line and after a space")

    (handle-last-input-handler {:value "String#" :cursor-pos 7})
    (is (= nil (state/get-editor-action))
        "No page search if hashtag has been typed at end of a word")

    (handle-last-input-handler {:value "foo#bar" :cursor-pos 4})
    (is (= nil (state/get-editor-action))
        "No page search if hashtag is in middle of word")

    (handle-last-input-handler {:value "`String#gsub and String#`"
                                :cursor-pos (dec (count "`String#gsub and String#`"))})
    (is (= nil (state/get-editor-action))
        "No page search within backticks"))
  ;; Reset state
  (state/set-editor-action! nil))

(deftest save-block!
  (testing "Saving blocks with and without properties"
    (test-helper/load-test-files [{:page {:block/title "foo"}
                                   :blocks [{:block/title "foo"
                                             :build/properties {:logseq.property/heading 1}}]}])
    (let [repo test-helper/test-db
          page-uuid (:block/uuid (db/get-page "foo"))
          block-uuid (:block/uuid (model/get-block-by-page-name-and-block-route-name repo (str page-uuid) "foo"))]
      (editor/save-block! repo block-uuid "# bar")
      (is (= "bar" (:block/title (model/query-block-by-uuid block-uuid))))

      (editor/save-block! repo block-uuid "# bar")
      (is (= "bar" (:block/title (model/query-block-by-uuid block-uuid)))))))

(deftest block-default-collapsed-respects-ignore-block-collapsed-flag
  (with-redefs [db/entity (constantly nil)]
    (is (true? (editor/block-default-collapsed?
                {:block/collapsed? true}
                {})))
    (is (not (editor/block-default-collapsed?
              {:block/collapsed? true}
              {:ignore-block-collapsed? true}))
        "Flashcard review should be able to ignore persisted collapsed state")
    (is (true? (editor/block-default-collapsed?
                {:block/collapsed? false}
                {:ignore-block-collapsed? true
                 :default-collapsed? true}))
        "Ignore flag should not disable other default-collapsed rules")))

(deftest load-children-respects-ignore-block-collapsed-flag
  (is (false? (#'editor/load-children?
               {:block/collapsed? true}
               nil
               false))
      "Collapsed blocks should not load children by default")
  (is (true? (#'editor/load-children?
              {:block/collapsed? true}
              nil
              true))
      "Flashcard answer mode should force loading children for collapsed blocks")
  (is (true? (#'editor/load-children?
              {:block/collapsed? true}
              false
              false))
      "Temporary expanded UI state should load children")
  (is (false? (#'editor/load-children?
               {:block/collapsed? false}
               true
               false))
      "Temporary collapsed UI state should skip children loading"))

(deftest paste-cut-recycled-block-moves-existing-node-out-of-recycle
  (test-helper/load-test-files [{:page {:block/title "Page 1"}
                                 :blocks [{:block/title "source"}]}
                                {:page {:block/title "Page 2"}
                                 :blocks [{:block/title "target"}]}])
  (let [source (test-helper/find-block-by-content "source")
        target (test-helper/find-block-by-content "target")
        recycle-page (db/get-page "Recycle")]
    (outliner-core/delete-blocks! (db/get-db test-helper/test-db false) [source] {})
    (state/set-block-op-type! :cut)
    (editor/paste-blocks [{:block/uuid (:block/uuid source)
                           :block/title "source"}]
                         {:target-block target
                          :sibling? true
                          :keep-uuid? true
                          :ops-only? true})
    (let [source' (db/entity [:block/uuid (:block/uuid source)])]
      (is (= (:db/id (:block/page target)) (:db/id (:block/page source'))))
      (is (= (:db/id (:block/parent target)) (:db/id (:block/parent source'))))
      (is (nil? (:logseq.property/deleted-at source')))
      (is (nil? (:logseq.property.recycle/original-page source')))
      (is (not= (:db/id recycle-page) (:db/id (:block/page source')))))))

(deftest focused-root-block-operation-guards-test
  (let [root-block {:db/id 1}
        focused-root-block {:db/id 1}
        root-child-block {:db/id 2
                          :block/parent {:db/id 1}}
        non-root-block {:db/id 3
                        :block/parent {:db/id 9}}]
    (testing "Root block cannot be indented or outdented when focused"
      (is (false? (#'editor/block-eligible-for-indent-outdent? root-block true focused-root-block)))
      (is (false? (#'editor/block-eligible-for-indent-outdent? root-block false focused-root-block))))
    (testing "A direct child of focused root cannot be outdented but can be indented"
      (is (false? (#'editor/block-eligible-for-indent-outdent? root-child-block false focused-root-block)))
      (is (true? (#'editor/block-eligible-for-indent-outdent? root-child-block true focused-root-block))))
    (testing "Non-root blocks keep normal indent/outdent behavior"
      (is (true? (#'editor/block-eligible-for-indent-outdent? non-root-block true focused-root-block)))
      (is (true? (#'editor/block-eligible-for-indent-outdent? non-root-block false focused-root-block))))
    (testing "Root block cannot move up/down when focused"
      (is (false? (#'editor/block-eligible-for-move-up-down? root-block focused-root-block)))
      (is (true? (#'editor/block-eligible-for-move-up-down? non-root-block focused-root-block))))))
