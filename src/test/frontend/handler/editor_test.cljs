(ns frontend.handler.editor-test
  (:require [clojure.test :refer [async deftest is testing use-fixtures]]
            [frontend.commands :as commands]
            [frontend.components.editor :as editor-component]
            [frontend.db :as db]
            [frontend.db.async :as db-async]
            [frontend.db.model :as model]
            [frontend.handler.assets :as assets-handler]
            [frontend.handler.editor :as editor]
            [frontend.handler.route :as route-handler]
            [frontend.modules.outliner.op :as outliner-op]
            [frontend.state :as state]
            [frontend.test.helper :as test-helper]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [goog.dom :as gdom]
            [logseq.db :as ldb]
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

(defn- delete-block-at-zero-pos-result
  [block]
  (let [deleted? (atom false)
        stopped? (atom false)
        input #js {:value ""}]
    (with-redefs [state/get-input (constantly input)
                  cursor/pos (constantly 0)
                  util/stop (fn [_] (reset! stopped? true))
                  state/get-current-repo (constantly test-helper/test-db)
                  state/get-edit-block (constantly block)
                  db/entity (fn [_] block)
                  ldb/get-left-sibling (constantly nil)
                  editor/get-state (constantly {:config {}})
                  editor/delete-block! (fn [_] (reset! deleted? true))]
      (#'editor/delete-block-when-zero-pos! nil)
      {:deleted? @deleted?
       :stopped? @stopped?})))

(deftest delete-block-when-zero-pos-keeps-asset-block-test
  (testing "Backspace at the start of an asset block does not delete the block"
    (is (= {:deleted? false
            :stopped? true}
           (delete-block-at-zero-pos-result
            {:db/id 1
             :block/uuid #uuid "11111111-1111-1111-1111-111111111111"
             :block/title ""
             :block/page {:db/id 10}
             :logseq.property.asset/type "png"})))))

(deftest delete-block-when-zero-pos-keeps-comments-block-test
  (testing "Backspace at the start of a Comments block does not delete the block"
    (is (= {:deleted? false
            :stopped? true}
           (delete-block-at-zero-pos-result
            {:db/id 1
             :block/uuid #uuid "11111111-1111-1111-1111-111111111111"
             :block/title ""
             :block/page {:db/id 10}
             :block/tags [{:db/ident :logseq.class/Comments}]})))))

(deftest delete-block-when-zero-pos-keeps-regular-empty-block-behavior-test
  (testing "Backspace at the start of a regular empty block still deletes it"
    (is (= {:deleted? true
            :stopped? true}
           (delete-block-at-zero-pos-result
            {:db/id 1
             :block/uuid #uuid "11111111-1111-1111-1111-111111111111"
             :block/title ""
             :block/page {:db/id 10}})))))

(deftest move-to-prev-block-edit-fn-focuses-merged-asset-title-test
  (let [asset-block {:db/id 1
                     :block/uuid #uuid "11111111-1111-1111-1111-111111111111"
                     :block/title ""
                     :logseq.property.asset/type "png"}
        sibling-dom #js {:getAttribute #({"blockid" (str (:block/uuid asset-block))
                                          "containerid" nil} %)}
        edit-calls (atom [])]
    (with-redefs [db/entity (fn [lookup-ref]
                              (when (contains? #{[:block/uuid (:block/uuid asset-block)]
                                                 (:db/id asset-block)}
                                               lookup-ref)
                                asset-block))
                  editor/edit-block! (fn [block pos opts]
                                       (swap! edit-calls conj {:block block
                                                               :pos pos
                                                               :opts opts}))]
      (let [{:keys [new-content pos edit-block-f]} (#'editor/move-to-prev-block
                                                    test-helper/test-db
                                                    sibling-dom
                                                    "after")]
        (is (= "after" new-content))
        (is (= 0 pos))
        (edit-block-f)
        (is (= [{:block asset-block
                 :pos 0
                 :opts {:custom-content "after"
                        :tail-len 5
                        :container-id nil}}]
               @edit-calls))))))

(defn- handle-last-input-handler
  "Spied version of editor/handle-last-input"
  [{:keys [value cursor-pos editor-config]}]
  ;; Reset editor action in order to test result
  (state/set-editor-action! nil)
  ;; Default cursor pos to end of line
  (let [pos (or cursor-pos (count value))]
    (with-redefs [state/get-input (constantly #js {:value value})
                  state/get-editor-args (constantly [nil nil editor-config])
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

    (handle-last-input-handler {:value "/"
                                :editor-config {:comment-editor? true}})
    (is (= nil (state/get-editor-action))
        "No command search in comment editors")

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

  (testing "Comment editors do not open tag autocompletion"
    (handle-last-input-handler {:value "#"
                                :cursor-pos 1
                                :editor-config {:comment-editor? true}})
    (is (= nil (state/get-editor-action))
        "No tag search in comment editors"))
  ;; Reset state
  (state/set-editor-action! nil))

(deftest comment-editor-quote-trigger-does-not-convert-draft-block
  (let [input #js {:id "edit-block-test"
                   :value ">"}
        events (atom [])]
    (with-redefs [cursor/pos (constantly 1)
                  state/get-editor-args (constantly [nil nil {:comment-editor? true}])
                  state/set-edit-content! (fn [& _])
                  state/pub-event! (fn [event] (swap! events conj event))
                  editor/default-case-for-keyup-handler (fn [& _])]
      ((editor/keyup-handler nil input) #js {:key ">"} nil)
      (is (empty? @events)
          "Comment editor > should stay plain text instead of converting the draft to a quote block"))))

(deftest comment-editor-collapse-expand-shortcuts-do-not-touch-draft-blocks
  (let [draft-uuid #uuid "6a073572-fefe-44c5-8b43-267ccc715077"
        expanded (atom [])
        collapsed (atom [])]
    (with-redefs [state/editing? (constantly true)
                  state/get-editor-args (constantly [nil nil {:comment-editor? true}])
                  state/get-edit-block (constantly {:block/uuid draft-uuid})
                  editor/expand-block! (fn [block-id] (swap! expanded conj block-id))
                  editor/collapse-block! (fn [block-id] (swap! collapsed conj block-id))
                  util/stop (constantly nil)]
      (editor/expand! nil)
      (editor/collapse! nil)
      (is (empty? @expanded)
          "Comment editor expand shortcut should not expand synthetic draft blocks")
      (is (empty? @collapsed)
          "Comment editor collapse shortcut should not collapse synthetic draft blocks"))))

(deftest db-based-save-assets-honors-explicit-target-block
  (async done
    (let [draft-uuid #uuid "8789a99e-5147-41a1-a836-4e0a6f03fe9e"
          asset-uuid #uuid "146b4102-b3d4-4e74-9044-a1c4c3a93326"
          target-block {:block/uuid #uuid "aa2b426a-7357-452d-a5cc-f1d9117b1772"
                        :block/title "Comments"}
          inserted (atom nil)]
      (-> (p/with-redefs [assets-handler/ensure-assets-dir! (fn [_repo]
                                                              (p/resolved ["/tmp/repo" "assets"]))
                          model/get-today-journal-title (constantly "Today")
                          model/get-journal-page (constantly {:block/uuid #uuid "f43caf78-18c4-4724-99d2-b2f61f697a0e"})
                          state/get-edit-block (constantly {:block/uuid draft-uuid
                                                            :block/title ""})
                          state/get-edit-content (constantly "")
                          state/get-editor-args (constantly [nil nil {:comment-editor? true
                                                                      :comment-asset-target-block target-block}])
                          editor/new-asset-block (fn [_repo _file opts]
                                                   (p/resolved {:block/uuid (or (:block/uuid opts) asset-uuid)}))
                          outliner-op/insert-blocks! (fn [blocks target opts]
                                                       (reset! inserted {:blocks blocks
                                                                         :target target
                                                                         :opts opts}))
                          db/entity (fn [lookup]
                                      (when (= lookup [:block/uuid asset-uuid])
                                        {:block/uuid asset-uuid}))]
            (editor/db-based-save-assets! "repo" [#js {:name "image.jpeg"}]
                                          :target-block target-block))
          (p/then (fn [_]
                    (is (= target-block (:target @inserted)))
                    (is (= {:bottom? true
                            :keep-uuid? true
                            :replace-empty-target? false
                            :sibling? false}
                           (:opts @inserted)))))
          (p/finally done)))))

(deftest db-based-save-assets-ignores-stale-comment-target-without-explicit-target
  (async done
    (let [asset-uuid #uuid "6b326622-8fe8-463f-b625-70e5329d92d5"
          edit-block {:block/uuid #uuid "f387fbb5-ef2a-41f7-9b99-f49b91a61cde"
                      :block/title "Current block"}
          stale-comment-target {:block/uuid #uuid "4da73880-13d5-4952-86fc-eb1be04bb030"
                                :block/title "Stale comments"}
          inserted (atom nil)]
      (-> (p/with-redefs [assets-handler/ensure-assets-dir! (fn [_repo]
                                                              (p/resolved ["/tmp/repo" "assets"]))
                          model/get-today-journal-title (constantly "Today")
                          model/get-journal-page (constantly {:block/uuid #uuid "f43caf78-18c4-4724-99d2-b2f61f697a0e"})
                          state/get-edit-block (constantly edit-block)
                          state/get-edit-content (constantly "Current block")
                          state/get-editor-args (constantly [nil nil {:comment-editor? true
                                                                      :comment-asset-target-block stale-comment-target}])
                          editor/new-asset-block (fn [_repo _file opts]
                                                   (p/resolved {:block/uuid (or (:block/uuid opts) asset-uuid)}))
                          outliner-op/insert-blocks! (fn [blocks target opts]
                                                       (reset! inserted {:blocks blocks
                                                                         :target target
                                                                         :opts opts}))
                          db/entity (fn [lookup]
                                      (when (= lookup [:block/uuid asset-uuid])
                                        {:block/uuid asset-uuid}))]
            (editor/db-based-save-assets! "repo" [#js {:name "image.jpeg"}]))
          (p/then (fn [_]
                    (is (= edit-block (:target @inserted)))
                    (is (= {:bottom? true
                            :keep-uuid? true
                            :replace-empty-target? true
                            :sibling? true}
                           (:opts @inserted)))))
          (p/finally done)))))

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
                        :block/parent {:db/id 9}}
        comments-area {:db/id 4
                       :block/tags [{:db/ident :logseq.class/Comments}]}
        comment-block {:db/id 5
                       :block/parent comments-area}]
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
      (is (true? (#'editor/block-eligible-for-move-up-down? non-root-block focused-root-block))))
    (testing "Comment area and comment blocks cannot be indented, outdented, or moved up/down"
      (is (false? (#'editor/block-eligible-for-indent-outdent? comments-area true focused-root-block)))
      (is (false? (#'editor/block-eligible-for-indent-outdent? comment-block true focused-root-block)))
      (is (false? (#'editor/block-eligible-for-indent-outdent? comments-area false focused-root-block)))
      (is (false? (#'editor/block-eligible-for-indent-outdent? comment-block false focused-root-block)))
      (is (false? (#'editor/block-eligible-for-move-up-down? comments-area focused-root-block)))
      (is (false? (#'editor/block-eligible-for-move-up-down? comment-block focused-root-block))))))

(deftest navigable-sibling-block-skips-comment-items-test
  (let [current-node (js-obj "id" "current")
        comment-node (js-obj "id" "comment"
                             "blockid" "6a073572-fefe-44c5-8b43-267ccc715077")
        target-node (js-obj "id" "target"
                            "blockid" "fd94c4c7-bfb8-49d5-bbb1-46617e4f2154")
        comments-area {:block/tags [{:db/ident :logseq.class/Comments}]}
        comment-uuid #uuid "6a073572-fefe-44c5-8b43-267ccc715077"
        target-uuid #uuid "fd94c4c7-bfb8-49d5-bbb1-46617e4f2154"
        sibling-f (fn [node _opts]
                    (cond
                      (= node current-node) comment-node
                      (= node comment-node) target-node))]
    (with-redefs [db/entity (fn [& args]
                              (case (second (first args))
                                #uuid "6a073572-fefe-44c5-8b43-267ccc715077" {:block/uuid comment-uuid
                                                                              :block/parent comments-area}
                                #uuid "fd94c4c7-bfb8-49d5-bbb1-46617e4f2154" {:block/uuid target-uuid}
                                nil))]
      (is (true? (#'editor/comment-item-node? comment-node)))
      (is (= target-node (#'editor/navigable-sibling-block current-node sibling-f {}))))))

(deftest navigable-sibling-block-skips-comments-area-test
  (let [current-node (js-obj "id" "current")
        comments-node (js-obj "id" "comments"
                              "data-comments-area" "true")
        target-node (js-obj "id" "target")
        sibling-f (fn [node _opts]
                    (cond
                      (= node current-node) comments-node
                      (= node comments-node) target-node))]
    (is (= target-node (#'editor/navigable-sibling-block current-node sibling-f {}))
        "Cursor boundary navigation should skip comments area")))

(deftest navigable-sibling-block-enters-comments-area-for-up-down-test
  (let [current-node (js-obj "id" "current")
        comments-node (js-obj "id" "comments"
                              "data-comments-area" "true")
        target-node (js-obj "id" "target")
        sibling-f (fn [node _opts]
                    (cond
                      (= node current-node) comments-node
                      (= node comments-node) target-node))]
    (is (= comments-node (#'editor/navigable-sibling-block current-node sibling-f {:up-down? true}))
        "Up/down navigation should enter comments instead of skipping the comments area")))

(deftest navigable-sibling-block-skips-open-comments-subtree-for-left-right-test
  (let [current-node (js-obj "id" "current")
        comment-node (js-obj "id" "comment" "nodeType" 1)
        comments-node (js-obj "id" "comments"
                              "data-comments-area" "true"
                              "nodeType" 1
                              "contains" (fn [node] (= node comment-node)))
        target-node (js-obj "id" "target")
        sibling-f (fn [node _opts]
                    (cond
                      (= node current-node) comments-node
                      (= node comments-node) comment-node))]
    (with-redefs [util/get-blocks-noncollapse (fn [] [current-node comments-node comment-node target-node])]
      (is (= target-node (#'editor/navigable-sibling-block current-node sibling-f {:direction :right}))
          "Left/right navigation should skip the whole open comments subtree"))))

(deftest navigable-sibling-block-skips-comment-item-before-block-below-comments-test
  (let [target-node (js-obj "id" "target")
        comments-node (js-obj "id" "comments"
                              "data-comments-area" "true")
        comment-uuid #uuid "6a073572-fefe-44c5-8b43-267ccc715077"
        comment-node (js-obj "id" "comment"
                             "blockid" (str comment-uuid))
        current-node (js-obj "id" "current")
        comments-area {:block/tags [{:db/ident :logseq.class/Comments}]}
        sibling-f (fn [node _opts]
                    (when (= node current-node)
                      comment-node))]
    (with-redefs [db/entity (fn [& args]
                              (case (second (first args))
                                #uuid "6a073572-fefe-44c5-8b43-267ccc715077" {:block/uuid comment-uuid
                                                                              :block/parent comments-area}
                                nil))
                  util/get-blocks-noncollapse (fn [] [target-node comments-node comment-node current-node])]
      (is (= target-node (#'editor/navigable-sibling-block current-node sibling-f {:direction :left}))
          "Left/right navigation from a block below open comments should skip comment items and the comments area"))))

(deftest enter-comments-area-node-focuses-reply-input-test
  (let [comments-id #uuid "6a073572-fefe-44c5-8b43-267ccc715077"
        focused? (atom false)
        selected (atom nil)
        input (js-obj "focus" #(reset! focused? true))
        comments-node (js-obj "id" "comments"
                              "blockid" (str comments-id)
                              "data-collapsed" "false"
                              "querySelector" (fn [_selector] input))]
    (with-redefs [state/clear-edit! (fn [])
                  state/get-current-page (fn [] (str comments-id))
                  state/exit-editing-and-set-selected-blocks! (fn [blocks] (reset! selected blocks))]
      (#'editor/enter-comments-area-node! comments-node)
      (is (true? @focused?)
          "Open comments should focus the reply input when the comments block is the current page")
      (is (nil? @selected)
          "Open comments should not select the comments area when the reply input exists"))))

(deftest enter-comments-area-node-activates-inline-reply-placeholder-test
  (let [selected (atom nil)
        clicked? (atom false)
        comments-id #uuid "6a073572-fefe-44c5-8b43-267ccc715077"
        placeholder (js-obj "click" #(reset! clicked? true))
        comments-node (js-obj "id" "comments"
                              "blockid" (str comments-id)
                              "data-collapsed" "false"
                              "querySelector" (fn [selector]
                                                (when (= selector ".ls-comment-reply-placeholder")
                                                  placeholder)))]
    (with-redefs [state/clear-edit! (fn [])
                  state/get-current-page (fn [] "fd94c4c7-bfb8-49d5-bbb1-46617e4f2154")
                  state/exit-editing-and-set-selected-blocks! (fn [blocks] (reset! selected blocks))]
      (#'editor/enter-comments-area-node! comments-node)
      (is (true? @clicked?)
          "Open inline comments should activate the reply placeholder when entered by arrow navigation")
      (is (nil? @selected)))))

(deftest enter-comments-area-node-selects-collapsed-comments-test
  (let [selected (atom nil)
        comments-node (js-obj "id" "comments"
                              "data-collapsed" "true")]
    (with-redefs [state/clear-edit! (fn [])
                  state/exit-editing-and-set-selected-blocks! (fn [blocks] (reset! selected blocks))]
      (#'editor/enter-comments-area-node! comments-node)
      (is (= [comments-node] @selected)
          "Collapsed comments should be selected for keyboard shortcuts"))))
