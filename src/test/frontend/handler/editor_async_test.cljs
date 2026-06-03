(ns frontend.handler.editor-async-test
  (:require [cljs.test :refer [deftest is testing async use-fixtures]]
            [datascript.core :as d]
            [frontend.components.block.comments-model :as comments-model]
            [frontend.db :as db]
            [frontend.db.async :as db-async]
            [frontend.db.model :as db-model]
            [frontend.handler.assets :as assets-handler]
            [frontend.handler.block :as block-handler]
            [frontend.handler.comments :as comments-handler]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.editor :as editor]
            [frontend.modules.outliner.op :as outliner-op]
            [frontend.state :as state]
            [frontend.test.helper :as test-helper :include-macros true :refer [deftest-async load-test-files]]
            [frontend.util :as util]
            [goog.dom :as gdom]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(defonce ^:private *previous-state (atom nil))

(use-fixtures :each
  {:before (fn []
             (reset! *previous-state @state/state)
             (async done
                    (test-helper/start-test-db!)
                    (done)))
   :after (fn []
            (let [previous-state @*previous-state]
              (test-helper/destroy-test-db!)
              (state/set-current-repo! (:git/current-repo previous-state))
              (state/replace-state! previous-state)
              (reset! *previous-state nil)))})

(defn- fake-key-event
  []
  (let [stopped? (atom false)]
    {:event #js {:preventDefault #(reset! stopped? true)
                 :stopPropagation #(reset! stopped? true)}
     :stopped? stopped?}))

(defn- delete-block
  [db block {:keys [embed? on-delete edit-content on-edit schedule-immediately?]}]
  (let [sibling-block (ldb/get-left-sibling (d/entity db (:db/id block)))
        first-block (ldb/get-left-sibling sibling-block)
        block-dom-id "ls-block-block-to-delete"
        sibling-dom-id "ls-block-sibling-block"
        sibling-dom #js {:id sibling-dom-id
                         :getAttribute #({"blockid" (str (:block/uuid sibling-block))
                                          "data-embed" (if embed? "true" "false")} %)}
        edit-content (or edit-content (:block/title block))
        previous-repo (state/get-state :git/current-repo)]
    (state/set-state! :git/current-repo test-helper/test-db)
    (-> (p/with-redefs
         [editor/get-state (constantly {:block-id (:block/uuid block)
                                        :block-parent-id block-dom-id
                                        :config {:embed? embed?}
                                        :value edit-content})
                  ;; stub for delete-block
          gdom/getElement (constantly #js {:id block-dom-id})
                  ;; stub since not testing moving
          editor/edit-block! (fn [block pos opts]
                               (when (fn? on-edit)
                                 (on-edit block pos opts))
                               nil)
          state/get-edit-content (constantly edit-content)
          util/get-prev-block-non-collapsed-non-embed (constantly sibling-dom)
                  ;; stub b/c of js/document
          state/get-selection-blocks (constantly [])
          util/get-blocks-noncollapse (constantly (mapv
                                                   (fn [m]
                                                     #js {:id (:id m)
                                                                  ;; for dom/attr
                                                          :getAttribute #({"blockid" (str (:block-uuid m))
                                                                           "data-embed" (if embed? "true" "false")} %)})
                                                   [{:id "ls-block-first-block"
                                                     :block-uuid (:block/uuid first-block)}
                                                    {:id sibling-dom-id
                                                     :block-uuid (:block/uuid sibling-block)}
                                                    {:id block-dom-id
                                                     :block-uuid (:block/uuid block)}]))
          util/schedule (fn [f]
                          (if schedule-immediately?
                            (f)
                            (js/setTimeout f 0)))]
          (p/do!
           (editor/delete-block! test-helper/test-db)
           (when (fn? on-delete)
             (on-delete))))
        (p/finally
          (fn []
            (state/set-state! :git/current-repo previous-repo))))))

(deftest-async delete-block-async!
  (testing "backspace deletes empty block"
    (load-test-files
     [{:page {:block/title "page1"}
       :blocks
       [{:block/title "b1"}
        {:block/title "b2"}
        {:block/title ""}]}])
    (p/let [conn (db/get-db test-helper/test-db false)
            block (->> (d/q '[:find (pull ?b [*])
                              :where [?b :block/title ""]
                              [?p :block/name "page1"]
                              [?b :block/page ?p]]
                            @conn)
                       ffirst)]
      (delete-block @conn block
                    {:on-delete (fn []
                                  (let [updated-blocks (->> (d/q '[:find (pull ?b [*])
                                                                   :where
                                                                   [?p :block/name "page1"]
                                                                   [?b :block/page ?p]
                                                                   [?b :block/title]
                                                                   [(missing? $ ?b :logseq.property/deleted-at)]]
                                                                 @conn)
                                                            (map (comp :block/title first)))
                                        deleted-blocks (->> (d/q '[:find (pull ?b [*])
                                                                   :where
                                                                   [?b :block/title ""]]
                                                                 @conn)
                                                            (map first))]
                                    (is (= ["b1" "b2"] updated-blocks) "Visible page blocks stay on the page")
                                    (is (empty? deleted-blocks) "Deleted block is removed from page db")))})))

  (testing "backspace deletes empty block in embedded context"
    ;; testing embed at this layer doesn't require an embed block since
    ;; delete-block handles all the embed setup
    (p/let [conn (db/get-db test-helper/test-db false)
            block (->> (d/q '[:find (pull ?b [*])
                              :where [?b :block/title ""]
                              [?p :block/name "page1"]
                              [?b :block/page ?p]]
                            @conn)
                       ffirst)]
      (delete-block @conn block
                    {:embed? true
                     :on-delete (fn []
                                  (let [updated-blocks (->> (d/q '[:find (pull ?b [*])
                                                                   :where
                                                                   [?p :block/name "page1"]
                                                                   [?b :block/page ?p]
                                                                   [?b :block/title]
                                                                   [(missing? $ ?b :logseq.property/deleted-at)]]
                                                                 @conn)
                                                            (map (comp :block/title first)))
                                        deleted-blocks (->> (d/q '[:find (pull ?b [*])
                                                                   :where
                                                                   [?b :block/title ""]]
                                                                 @conn)
                                                            (map first))]
                                     (is (= ["b1" "b2"] updated-blocks) "Visible page blocks stay on the page")
                                     (is (empty? deleted-blocks) "Deleted block is removed from page db")))}))))

(deftest-async backspace-before-block-merges-into-previous-blank-asset-block
  (load-test-files
   [{:page {:block/title "page1"}
     :blocks
     [{:block/title "b1"}
      {:block/title ""
       :logseq.property.asset/type "png"
       :logseq.property.asset/checksum "blank-asset-checksum"
       :logseq.property.asset/size 1}
      {:block/title "after"}]}])
  (p/let [conn (db/get-db test-helper/test-db false)
          block (->> (d/q '[:find (pull ?b [*])
                            :where [?b :block/title "after"]
                            [?p :block/name "page1"]
                            [?b :block/page ?p]]
                          @conn)
                     ffirst)]
    (delete-block @conn block
                  {:on-delete (fn []
                                (let [visible-blocks (->> (d/q '[:find (pull ?b [*])
                                                                 :where
                                                                 [?p :block/name "page1"]
                                                                 [?b :block/page ?p]
                                                                 [?b :block/title]
                                                                 [(missing? $ ?b :logseq.property/deleted-at)]]
                                                               @conn)
                                                          (map first))
                                      visible-titles (map :block/title visible-blocks)
                                      asset-blocks (filter :logseq.property.asset/type visible-blocks)]
                                  (is (= ["b1" "after"] visible-titles))
                                  (is (= "after" (:block/title (first asset-blocks)))
                                      "Backspace before the following block should merge its title into the asset block")
                                  (is (= "png" (:logseq.property.asset/type (first asset-blocks)))
                                      "Merging must keep the previous block renderable as an asset")))})))

(deftest-async backspace-before-block-merges-into-previous-blank-comments-block
  (load-test-files
   [{:page {:block/title "page1"}
     :blocks
     [{:block/title "b1"}
      {:block/title ""
       :build/tags [:logseq.class/Comments]}
      {:block/title "after"}]}])
  (p/let [conn (db/get-db test-helper/test-db false)
          block (->> (d/q '[:find (pull ?b [*])
                            :where [?b :block/title "after"]
                            [?p :block/name "page1"]
                            [?b :block/page ?p]]
                          @conn)
                     ffirst)]
    (delete-block @conn block
                  {:on-delete (fn []
                                (let [visible-blocks (->> (d/q '[:find (pull ?b [* {:block/tags [:db/ident]}])
                                                                 :where
                                                                 [?p :block/name "page1"]
                                                                 [?b :block/page ?p]
                                                                 [?b :block/title]
                                                                 [(missing? $ ?b :logseq.property/deleted-at)]]
                                                               @conn)
                                                          (map first))
                                      visible-titles (map :block/title visible-blocks)
                                      comments-blocks (filter comments-model/comments-area? visible-blocks)]
                                  (is (= ["b1" "after"] visible-titles))
                                  (is (= "after" (:block/title (first comments-blocks)))
                                      "Backspace before the following block should merge its title into the Comments block")
                                  (is (= #{:logseq.class/Comments}
                                         (set (map :db/ident (:block/tags (first comments-blocks)))))
                                      "Merging must keep the previous block tagged as a Comments block")))})))

(deftest-async delete-at-empty-asset-end-merges-next-block-into-asset-block
  (load-test-files
   [{:page {:block/title "page1"}
     :blocks
     [{:block/title "b1"}
      {:block/title ""
       :logseq.property.asset/type "png"
       :logseq.property.asset/checksum "blank-asset-checksum"
       :logseq.property.asset/size 1}
      {:block/title "after"}]}])
  (p/let [conn (db/get-db test-helper/test-db false)
          asset-block (->> (d/q '[:find (pull ?b [*])
                                  :where [?b :logseq.property.asset/type "png"]
                                  [?p :block/name "page1"]
                                  [?b :block/page ?p]]
                                @conn)
                           ffirst)
          next-block (->> (d/q '[:find (pull ?b [*])
                                 :where [?b :block/title "after"]
                                 [?p :block/name "page1"]
                                 [?b :block/page ?p]]
                               @conn)
                          ffirst)
          asset-dom #js {:getAttribute #({"blockid" (str (:block/uuid asset-block))
                                          "containerid" nil} %)}]
    (-> (p/with-redefs [state/get-edit-content (constantly "")
                        util/get-prev-block-non-collapsed-non-embed (constantly asset-dom)
                        editor/edit-block! (constantly nil)]
          (p/do!
           (editor/delete-block-inner!
            test-helper/test-db
            {:block-id (:block/uuid next-block)
             :value (:block/title next-block)
             :config {}
             :block-container #js {}
             :current-block asset-block
             :next-block next-block
             :delete-concat? true})
           (let [visible-blocks (->> (d/q '[:find (pull ?b [*])
                                            :where
                                            [?p :block/name "page1"]
                                            [?b :block/page ?p]
                                            [?b :block/title]
                                            [(missing? $ ?b :logseq.property/deleted-at)]]
                                          @conn)
                                     (map first))
                 visible-titles (map :block/title visible-blocks)
                 asset-blocks (filter :logseq.property.asset/type visible-blocks)]
             (is (= ["b1" "after"] visible-titles))
             (is (= "after" (:block/title (first asset-blocks)))
                 "Delete at the end of an empty asset title should merge the next title into the asset block")
             (is (= "png" (:logseq.property.asset/type (first asset-blocks)))
                 "Delete merge must keep the current block renderable as an asset"))))
        (p/finally (fn []
                     (state/set-state! :editor/edit-block-fn nil))))))

(deftest-async delete-at-empty-comments-end-merges-next-block-into-comments-block
  (load-test-files
   [{:page {:block/title "page1"}
     :blocks
     [{:block/title "b1"}
      {:block/title ""
       :build/tags [:logseq.class/Comments]}
      {:block/title "after"}]}])
  (p/let [conn (db/get-db test-helper/test-db false)
          comments-block (->> (d/q '[:find (pull ?b [* {:block/tags [:db/ident]}])
                                      :where
                                      [?p :block/name "page1"]
                                      [?b :block/page ?p]
                                      [?b :block/tags :logseq.class/Comments]]
                                    @conn)
                               ffirst)
          next-block (->> (d/q '[:find (pull ?b [*])
                                 :where [?b :block/title "after"]
                                 [?p :block/name "page1"]
                                 [?b :block/page ?p]]
                               @conn)
                          ffirst)
          comments-dom #js {:getAttribute #({"blockid" (str (:block/uuid comments-block))
                                             "containerid" nil} %)}]
    (-> (p/with-redefs [state/get-edit-content (constantly "")
                        util/get-prev-block-non-collapsed-non-embed (constantly comments-dom)
                        editor/edit-block! (constantly nil)]
          (p/do!
           (editor/delete-block-inner!
            test-helper/test-db
            {:block-id (:block/uuid next-block)
             :value (:block/title next-block)
             :config {}
             :block-container #js {}
             :current-block comments-block
             :next-block next-block
             :delete-concat? true})
           (let [visible-blocks (->> (d/q '[:find (pull ?b [* {:block/tags [:db/ident]}])
                                            :where
                                            [?p :block/name "page1"]
                                            [?b :block/page ?p]
                                            [?b :block/title]
                                            [(missing? $ ?b :logseq.property/deleted-at)]]
                                          @conn)
                                     (map first))
                 visible-titles (map :block/title visible-blocks)
                 comments-blocks (filter comments-model/comments-area? visible-blocks)]
             (is (= ["b1" "after"] visible-titles))
             (is (= "after" (:block/title (first comments-blocks)))
                 "Delete at the end of an empty Comments title should merge the next title into the Comments block")
             (is (= #{:logseq.class/Comments}
                    (set (map :db/ident (:block/tags (first comments-blocks)))))
                 "Delete merge must keep the current block tagged as a Comments block"))))
        (p/finally (fn []
                     (state/set-state! :editor/edit-block-fn nil))))))

(deftest-async rapid-tab-after-new-block-indents-pending-block
  (let [current-block {:db/id 1
                       :block/uuid (random-uuid)
                       :block/title "first"}
        next-block {:db/id 2
                    :block/uuid (random-uuid)
                    :block/title ""}
        input #js {:value "first"}
        current-block-indents (atom [])
        pending-block-indents (atom [])
        edit-calls (atom [])
        {:keys [event stopped?]} (fake-key-event)
        previous-document (.-document js/globalThis)]
    (state/set-editing-block-id! [:unknown-container (:block/uuid current-block)])
    (set! (.-document js/globalThis)
          #js {:activeElement input
               :getElementById (fn [_id] input)})
    (-> (p/with-redefs [state/get-edit-input-id (constantly "edit-block-current")
                        gdom/getElement (constantly input)
                        util/get-selection-start (constantly 5)
                        util/get-selection-end (constantly 5)
                        db/entity (fn [lookup-ref]
                                    (case lookup-ref
                                      [:block/uuid (:block/uuid current-block)] current-block
                                      [:block/uuid (:block/uuid next-block)] next-block
                                      current-block))
                        editor/get-state (constantly {:block current-block
                                                      :value "first"
                                                      :config {}
                                                      :block-container #js {}})
                        editor/insert-new-block-aux! (fn [_config _block _value]
                                                       [(p/resolved true) true next-block])
                        editor/get-new-container-id (constantly nil)
                        editor/indent-outdent (fn [indent?]
                                                (swap! current-block-indents conj indent?))
                        editor/edit-block! (fn [block pos opts]
                                             (swap! edit-calls conj {:block block
                                                                     :pos pos
                                                                     :opts opts})
                                             (p/resolved nil))
                        block-handler/indent-outdent-blocks! (fn [blocks indent? save-current-block]
                                                               (swap! pending-block-indents conj
                                                                      {:blocks blocks
                                                                       :indent? indent?
                                                                       :save-current-block save-current-block})
                                                               (p/resolved nil))]
          (editor/insert-new-block! nil nil)
          ((editor/keydown-tab-handler :right) event)
          (p/let [_ (when-let [edit-block-f (state/get-state :editor/edit-block-fn)]
                       (edit-block-f))]
            (is @stopped? "Tab should still be consumed while the new block is pending")
            (is (empty? @current-block-indents) "Tab must not indent the block that was split by Enter")
            (is (= [{:blocks [next-block]
                     :indent? true
                     :save-current-block nil}]
                   @pending-block-indents)
                "Tab should apply to the newly inserted block once it exists")
            (is (= [{:block next-block
                     :pos 0
                     :opts {:container-id nil
                            :custom-content ""}}]
                   @edit-calls)
                "The pending block should still enter edit mode after applying queued Tab")))
        (p/finally (fn []
                     (state/set-state! :editor/edit-block-fn nil)
            (state/set-state! :editor/pending-new-block nil)
            (set! (.-document js/globalThis) previous-document))))))

(deftest-async indent-block-does-not-move-into-comments-area
  (load-test-files
   [{:page {:block/title "Comments indent"}
     :blocks [{:block/title "ordinary"}
              {:block/title "Comments"}
              {:block/title "target"}]}])
  (let [comments-area (test-helper/find-block-by-content "Comments")
        target (test-helper/find-block-by-content "target")
        original-parent-id (:db/id (:block/parent target))]
    (db/transact! test-helper/test-db
                  [[:db/add (:db/id comments-area) :block/tags comments-model/comments-tag-ident]])
    (p/let [_ (block-handler/indent-outdent-blocks! [target] true nil)
            target' (db/entity [:block/uuid (:block/uuid target)])
            comments-area' (db/entity [:block/uuid (:block/uuid comments-area)])]
      (is (= original-parent-id (:db/id (:block/parent target')))
          "Indenting a block after #Comments should leave it at the same parent")
      (is (not= (:db/id comments-area') (:db/id (:block/parent target')))
          "The target block must not become a child of the comments area"))))

(deftest-async db-based-save-assets-appends-to-today-page-without-editor
  (let [today-page {:block/uuid (random-uuid)
                    :block/title "today"}
        inserted (atom nil)]
    (-> (p/with-redefs [assets-handler/ensure-assets-dir! (fn [_repo]
                                                            (p/resolved ["/repo" "assets"]))
                        assets-handler/get-file-checksum (constantly "checksum")
                        db-async/<get-asset-with-checksum (fn [& _] (p/resolved nil))
                        db-model/get-today-journal-title (constantly "today")
                        db-model/get-journal-page (constantly today-page)
                        state/get-edit-block (constantly nil)
                        state/get-edit-content (constantly "")
                        outliner-op/insert-blocks! (fn [blocks target opts]
                                                     (reset! inserted {:blocks blocks
                                                                       :target target
                                                                       :opts opts})
                                                     [:insert-blocks [blocks target opts]])
                        db/entity (fn [[_lookup uuid]]
                                    {:block/uuid uuid})]
          (editor/db-based-save-assets! "repo" [{:src "image.png"
                                                 :title "image"}]))
        (p/then
         (fn [_]
           (is (= today-page (:target @inserted)))
           (is (= {:keep-uuid? true
                   :bottom? true
                   :sibling? false
                   :replace-empty-target? false}
                  (:opts @inserted))
               "Page-target asset insertion must allow :bottom? to take effect"))))))

(deftest-async db-based-save-assets-uses-last-edit-block-title-without-editor-state
  (let [last-edit-block {:block/uuid (random-uuid)
                         :block/title "existing content"}
        inserted (atom nil)]
    (-> (p/with-redefs [assets-handler/ensure-assets-dir! (fn [_repo]
                                                            (p/resolved ["/repo" "assets"]))
                        assets-handler/get-file-checksum (constantly "checksum")
                        db-async/<get-asset-with-checksum (fn [& _] (p/resolved nil))
                        db-model/get-today-journal-title (constantly "today")
                        db-model/get-journal-page (constantly {:block/uuid (random-uuid)
                                                               :block/title "today"})
                        state/get-edit-block (constantly nil)
                        state/get-edit-content (constantly "")
                        outliner-op/insert-blocks! (fn [blocks target opts]
                                                     (reset! inserted {:blocks blocks
                                                                       :target target
                                                                       :opts opts})
                                                     [:insert-blocks [blocks target opts]])
                        db/entity (fn [[_lookup uuid]]
                                    {:block/uuid uuid})]
          (editor/db-based-save-assets! "repo"
                                        [{:src "image.png"
                                          :title "image"}]
                                        :last-edit-block last-edit-block))
        (p/then
         (fn [_]
           (is (= last-edit-block (:target @inserted)))
           (is (not= (:block/uuid last-edit-block)
                     (:block/uuid (first (:blocks @inserted))))
               "Non-empty last edit block must not be replaced by the pasted asset")
           (is (= {:keep-uuid? true
                   :bottom? true
                   :sibling? true
                   :replace-empty-target? true}
                  (:opts @inserted))))))))

(deftest-async db-based-save-assets-appends-to-explicit-target-block
  (let [target-block {:block/uuid (random-uuid)
                      :block/title "comments"}
        temp-edit-block {:block/uuid (random-uuid)
                         :block/title ""}
        inserted (atom nil)]
    (-> (p/with-redefs [assets-handler/ensure-assets-dir! (fn [_repo]
                                                            (p/resolved ["/repo" "assets"]))
                        assets-handler/get-file-checksum (constantly "checksum")
                        db-async/<get-asset-with-checksum (fn [& _] (p/resolved nil))
                        db-model/get-today-journal-title (constantly "today")
                        db-model/get-journal-page (constantly {:block/uuid (random-uuid)
                                                               :block/title "today"})
                        state/get-edit-block (constantly temp-edit-block)
                        state/get-edit-content (constantly "")
                        outliner-op/insert-blocks! (fn [blocks target opts]
                                                     (reset! inserted {:blocks blocks
                                                                       :target target
                                                                       :opts opts})
                                                     [:insert-blocks [blocks target opts]])
                        db/entity (fn [[_lookup uuid]]
                                    {:block/uuid uuid})]
          (editor/db-based-save-assets! "repo"
                                        [{:src "image.png"
                                          :title "image"}]
                                        :target-block target-block
                                        :last-edit-block temp-edit-block))
        (p/then
         (fn [_]
           (is (= target-block (:target @inserted)))
           (is (not= (:block/uuid temp-edit-block)
                     (:block/uuid (first (:blocks @inserted))))
               "Explicit target insertion must not replace a temporary editor block")
           (is (= {:keep-uuid? true
                   :bottom? true
                   :sibling? false
                   :replace-empty-target? false}
                  (:opts @inserted))
               "Explicit target asset insertion should append as children, not replace the temp edit block"))))))

(deftest-async ensure-comments-area-for-selected-blocks
  (let [first-uuid (random-uuid)
        second-uuid (random-uuid)
        created-comments-area-uuid (random-uuid)
        first-block {:block/uuid first-uuid
                     :db/id 1
                     :block/title "first"
                     :block/page {:db/id 10}}
        second-block {:block/uuid second-uuid
                      :db/id 2
                      :block/title "second"
                      :block/page {:db/id 10}}
        comments-area {:block/uuid (random-uuid)
                       :block/title "Comments"
                       :block/tags #{comments-model/comments-tag-ident}}
        comment-block {:block/uuid (random-uuid)
                       :block/title "comment"
                       :block/parent comments-area}
        created-comments-area {:block/uuid created-comments-area-uuid
                               :block/title "Comments"
                               :block/tags #{comments-model/comments-tag-ident}
                               comments-model/comments-blocks-property [first-block second-block]}
        inserts (atom [])
        expanded (atom [])]
    (-> (p/with-redefs [db/entity (fn [lookup-ref]
                                    (case lookup-ref
                                      [:block/uuid first-uuid] first-block
                                      [:block/uuid second-uuid] second-block
                                      nil))
                        block-handler/get-top-level-blocks identity
                        editor/api-insert-new-block! (fn [content opts]
                                                       (swap! inserts conj {:content content
                                                                           :opts opts})
                                                       (p/resolved created-comments-area))
                        editor/expand-block! (fn [block-uuid]
                                               (swap! expanded conj block-uuid)
                                               (p/resolved nil))]
          (p/let [area (comments-handler/ensure-comments-area-for-selected-blocks! [first-block
                                                                                    comments-area
                                                                                    comment-block
                                                                                    second-block])]
            (is (= created-comments-area area)
                "Selected blocks should share one comments area")
            (is (= [{:content "Comments"
                     :opts {:block-uuid second-uuid
                            :sibling? true
                            :edit-block? false
                            :other-attrs {:block/tags #{comments-model/comments-tag-ident}
                                          comments-model/comments-blocks-property #{[:block/uuid first-uuid]
                                                                                   [:block/uuid second-uuid]}}}}]
                   @inserts)
                "A range comments area should be inserted after the last selected top block with lookup-ref targets")
            (is (= [created-comments-area-uuid] @expanded)
                "The range comments area should be expanded inline"))))))

(deftest-async ensure-comments-area-for-single-selected-block
  (let [block-uuid (random-uuid)
        created-comments-area-uuid (random-uuid)
        block {:block/uuid block-uuid
               :db/id 1
               :block/title "target"
               :block/page {:db/id 10}}
        created-comments-area {:block/uuid created-comments-area-uuid
                               :block/title "Comments"
                               :block/tags #{comments-model/comments-tag-ident}}
        inserts (atom [])
        expanded (atom [])]
    (-> (p/with-redefs [db/entity (fn [lookup-ref]
                                    (case lookup-ref
                                      [:block/uuid block-uuid] block
                                      nil))
                        db/sort-by-order identity
                        block-handler/get-top-level-blocks identity
                        editor/api-insert-new-block! (fn [content opts]
                                                       (swap! inserts conj {:content content
                                                                           :opts opts})
                                                       (p/resolved created-comments-area))
                        editor/expand-block! (fn [block-uuid]
                                               (swap! expanded conj block-uuid)
                                               (p/resolved nil))]
          (p/let [area (comments-handler/ensure-comments-area-for-selected-blocks! [block])]
            (is (= created-comments-area area)
                "A single selected block should use a child comments area")
            (is (= [{:content "Comments"
                     :opts {:block-uuid block-uuid
                            :end? true
                            :edit-block? false
                            :other-attrs {:block/tags #{comments-model/comments-tag-ident}
                                          comments-model/comments-blocks-property #{[:block/uuid block-uuid]}}}}]
                   @inserts)
                "Single-block comments area should be inserted as a child with the target property")
            (is (= [created-comments-area-uuid] @expanded)
                "The single-block comments area should be expanded inline"))))))

(deftest-async add-comment-to-blocks-opens-comment-box
  (let [block {:block/uuid (random-uuid)
               :db/id 1
               :block/title "target"
               :block/page {:db/id 10}}
        comments-area {:block/uuid (random-uuid)
                       :block/title "Comments"
                       :block/tags #{comments-model/comments-tag-ident}}
        revealed (atom nil)
        cleared-selection? (atom false)
        events (atom [])]
    (-> (p/with-redefs [comments-handler/ensure-comments-area-for-selected-blocks! (fn [blocks]
                                                                                     (is (= [block] blocks))
                                                                                     (p/resolved comments-area))
                        comments-handler/reveal-comments-area! (fn [area opts]
                                                                 (reset! revealed [area opts]))
                        state/clear-selection! #(reset! cleared-selection? true)
                        state/pub-event! #(swap! events conj %)]
          (comments-handler/add-comment-to-blocks! [block])
          (p/resolved nil))
        (p/then (fn [_]
                  (is (= [comments-area {:focus-editor? true}]
                         @revealed)
                      "Adding a comment should open the reply editor")
                  (is @cleared-selection?)
                  (is (= [[:editor/hide-action-bar]] @events)))))))

(deftest-async add-comment-to-non-empty-edit-block-focuses-comment-box
  (let [block-uuid (random-uuid)
        selected-uuid (random-uuid)
        block {:block/uuid block-uuid
               :db/id 1
               :block/title "typing"
               :block/page {:db/id 10}}
        selected-block {:block/uuid selected-uuid
                        :db/id 2
                        :block/title "stale selection"
                        :block/page {:db/id 10}}
        comments-area {:block/uuid (random-uuid)
                       :block/title "Comments"
                       :block/tags #{comments-model/comments-tag-ident}}
        saved? (atom false)
        cleared? (atom false)
        revealed (atom nil)]
    (-> (p/with-redefs [state/editing? (constantly true)
                        state/get-edit-block (constantly block)
                        state/get-edit-content (constantly "typing")
                        state/get-selection-block-ids (constantly [selected-uuid])
                        db/entity (fn [lookup-ref]
                                    (case lookup-ref
                                      [:block/uuid block-uuid] block
                                      [:block/uuid selected-uuid] selected-block
                                      nil))
                        block-handler/get-top-level-blocks identity
                        editor/save-current-block! #(reset! saved? true)
                        state/clear-edit! #(reset! cleared? true)
                        comments-handler/ensure-comments-area-for-selected-blocks! (fn [blocks]
                                                                                     (is (= [block] blocks)
                                                                                         "The editing block should take precedence over stale selection state")
                                                                                     (p/resolved comments-area))
                        comments-handler/reveal-comments-area! (fn [area opts]
                                                                 (reset! revealed [area opts]))
                        state/clear-selection! (fn [])
                        state/pub-event! (fn [_])]
          (comments-handler/add-comment-to-current-context!))
        (p/then (fn [_]
                  (is @saved?)
                  (is @cleared?
                      "Moving focus to the comment box should leave the original block editor")
                  (is (= [comments-area {:focus-editor? true}]
                         @revealed)
                      "Adding a comment while typing should open and focus the reply editor"))))))

(deftest-async add-comment-to-empty-edit-block
  (let [block {:block/uuid (random-uuid)
               :db/id 1
               :block/title ""}
        saved? (atom false)
        cleared? (atom false)
        properties (atom [])
        revealed (atom nil)]
    (-> (p/with-redefs [state/editing? (constantly true)
                        state/get-edit-block (constantly block)
                        state/get-edit-content (constantly "")
                        editor/save-current-block! #(reset! saved? true)
                        db-property-handler/set-block-property! (fn [db-id property value]
                                                                  (swap! properties conj [db-id property value]))
                        state/clear-edit! #(reset! cleared? true)
                        comments-handler/reveal-comments-area! (fn [area opts]
                                                                 (reset! revealed [area opts]))
                        editor/api-insert-new-block! (fn [& _]
                                                       (is false "Empty /Add comment should not insert a child comments block"))]
          (comments-handler/add-comment-to-current-context!)
          (p/resolved nil))
        (p/then (fn [_]
                  (is @saved?)
                  (is @cleared?)
                  (is (= [[1 :block/tags comments-model/comments-tag-ident]]
                         @properties)
                      "Empty /Add comment should turn the current block into a comments area")
                  (is (= [block {:focus-editor? true}]
                         @revealed)
                      "Empty /Add comment should open the reply editor"))))))

(deftest-async add-comment-to-empty-edit-block-reveals-after-comments-tag-is-saved
  (let [block {:block/uuid (random-uuid)
               :db/id 1
               :block/title ""}
        property-save (p/deferred)
        revealed (atom nil)]
    (-> (p/with-redefs [state/editing? (constantly true)
                        state/get-edit-block (constantly block)
                        state/get-edit-content (constantly "")
                        editor/save-current-block! (fn [])
                        db-property-handler/set-block-property! (fn [_db-id _property _value]
                                                                  property-save)
                        state/clear-edit! (fn [])
                        comments-handler/reveal-comments-area! (fn [area opts]
                                                                 (reset! revealed [area opts]))]
          (let [result (comments-handler/add-comment-to-current-context!)]
            (is (nil? @revealed)
                "The reply editor cannot be focused until the blank block is saved as a comments area")
            (p/resolve! property-save :saved)
            result))
        (p/then (fn [_]
                  (is (= [block {:focus-editor? true}]
                         @revealed)
                      "The converted comments area should be revealed after the property transaction finishes"))))))

(deftest-async empty-comment-submit-creates-sibling-block-after-comments
  (let [comments-area {:block/uuid (random-uuid)
                       :block/title "Comments"
                       :block/tags #{comments-model/comments-tag-ident}}
        inserted (atom nil)]
    (-> (p/with-redefs [editor/api-insert-new-block! (fn [content opts]
                                                       (reset! inserted {:content content
                                                                         :opts opts})
                                                       (p/resolved {:block/uuid (random-uuid)}))]
          (let [create-sibling (resolve 'frontend.handler.comments/create-sibling-block-after-comments!)]
            (is (fn? create-sibling))
            (when (fn? create-sibling)
              (create-sibling comments-area))))
        (p/then (fn [_]
                  (is (= {:content ""
                          :opts {:block-uuid (:block/uuid comments-area)
                                 :sibling? true
                                 :edit-block? true}}
                         @inserted)
                      "Empty Enter in the reply box should create an editable sibling after #Comments"))))))

(deftest-async insert-comment-tags-created-comment-block
  (let [comments-area {:block/uuid (random-uuid)
                       :block/title "Comments"
                       :block/tags #{comments-model/comments-tag-ident}}
        inserted (atom nil)]
    (-> (p/with-redefs [editor/api-insert-new-block! (fn [content opts]
                                                       (reset! inserted {:content content
                                                                         :opts opts})
                                                       (p/resolved {:block/uuid (random-uuid)}))]
          (comments-handler/insert-comment! comments-area "review this"))
        (p/then (fn [_]
                  (is (= {:content "review this"
                          :opts {:block-uuid (:block/uuid comments-area)
                                 :end? true
                                 :edit-block? false
                                 :other-attrs {:block/tags #{:logseq.class/Comment}}}}
                         @inserted)
                      "Inserted comment blocks should be tagged as #Comment"))))))

(deftest delete-comment-targets
  (let [delete-targets (resolve 'frontend.handler.comments/comment-delete-targets)
        first-comment {:block/uuid (random-uuid)
                       :block/title "first"}
        second-comment {:block/uuid (random-uuid)
                        :block/title "second"}
        deleted-comment (assoc second-comment :logseq.property/deleted-at 1)
        comments-area {:block/uuid (random-uuid)
                       :block/title "Comments"
                       :block/tags #{comments-model/comments-tag-ident}}]
    (is (fn? delete-targets))
    (when (fn? delete-targets)
      (testing "deletes the comments area when the deleted comment is the only live child"
        (let [comments-area (assoc comments-area :block/_parent [first-comment])
              first-comment (assoc first-comment :block/parent comments-area)]
          (is (= [comments-area]
                 (delete-targets first-comment)))))
      (testing "keeps the comments area when other live comments remain"
        (let [comments-area (assoc comments-area :block/_parent [first-comment second-comment])
              first-comment (assoc first-comment :block/parent comments-area)]
          (is (= [first-comment]
                 (delete-targets first-comment)))))
      (testing "ignores already deleted comment children"
        (let [comments-area (assoc comments-area :block/_parent [first-comment deleted-comment])
              first-comment (assoc first-comment :block/parent comments-area)]
          (is (= [comments-area]
                 (delete-targets first-comment))))))))
