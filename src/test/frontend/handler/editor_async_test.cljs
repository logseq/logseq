(ns frontend.handler.editor-async-test
  (:require [cljs.test :refer [is testing async use-fixtures]]
            [datascript.core :as d]
            [frontend.components.block.comments-model :as comments-model]
            [frontend.db.async :as db-async]
            [frontend.db.conn :as conn]
            [frontend.db.transact :as db-transact]
            [frontend.db.utils :as db-utils]
            [frontend.handler.assets :as assets-handler]
            [frontend.handler.block :as block-handler]
            [frontend.handler.comments :as comments-handler]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.editor :as editor]
            [frontend.handler.user :as user-handler]
            [frontend.modules.outliner.op :as frontend-outliner-op]
            [frontend.state :as state]
            [frontend.test.helper :as test-helper :include-macros true :refer [deftest-async load-test-files]]
            [frontend.util :as util]
            [goog.dom :as gdom]
            [logseq.db :as ldb]
            [logseq.outliner.op :as outliner-op]
            [promesa.core :as p]))

(defonce ^:private *previous-state (atom nil))

(def ^:private test-worker-block-pull
  '[* {:block/page [*]
       :block/parent [*]
       :block/_parent [*]
       :block/tags [*]}])

(defn- block-by-worker-id
  [test-db id]
  (when-let [entity
             (or
              (when (uuid? id)
                (db-utils/entity test-db [:block/uuid id]))
              (when (string? id)
                (or
                 (when (util/uuid-string? id)
                   (db-utils/entity test-db [:block/uuid (uuid id)]))
                 (ldb/get-page test-db id)))
              (db-utils/entity test-db id))]
    (d/pull test-db test-worker-block-pull (:db/id entity))))

(defn- <test-db-worker
  [api & args]
  (case api
    :thread-api/get-blocks
    (let [[repo requests-transit] args
          test-db (conn/get-db repo)
          requests (ldb/read-transit-str requests-transit)]
      (p/resolved
       (ldb/write-transit-str
        (mapv (fn [{:keys [id opts]}]
                (let [block (block-by-worker-id test-db id)]
                  (if (:children? opts)
                    block
                    {:block block})))
              requests))))

    :thread-api/get-block-sibling
    (let [[repo block-id direction] args
          test-db (conn/get-db repo)
          block (db-utils/entity test-db block-id)
          sibling (case direction
                    :left (ldb/get-left-sibling block)
                    :right (ldb/get-right-sibling block)
                    nil)]
      (p/resolved
       (when sibling
         (d/pull test-db test-worker-block-pull (:db/id sibling)))))

    (p/resolved nil)))

(defn- apply-test-outliner-ops!
  [_db ops opts]
  (let [result (outliner-op/apply-ops! (conn/get-db test-helper/test-db false)
                                        ops
                                        (dissoc opts :editor/edit-block-fn))]
    (when-let [edit-block-f (:editor/edit-block-fn opts)]
      (edit-block-f nil))
    result))

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
          state/<invoke-db-worker <test-db-worker
          db-transact/apply-outliner-ops apply-test-outliner-ops!
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
    (p/let [conn (conn/get-db test-helper/test-db false)
            block (->> (d/q '[:find (pull ?b [*])
                              :where [?b :block/title ""]
                              [?p :block/name "page1"]
                              [?b :block/page ?p]]
                            @conn)
                       ffirst)
            edit-calls (atom [])]
      (delete-block @conn block
                    {:on-edit (fn [block pos opts]
                                (swap! edit-calls conj {:block block
                                                        :pos pos
                                                        :opts opts}))
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
                                    (is (empty? deleted-blocks) "Deleted block is removed from page db")
                                    (is (= {:block "b2"
                                            :pos 2
                                            :opts {:custom-content "b2"
                                                   :tail-len 0
                                                   :container-id nil
                                                   :save-code-editor? false
                                                   :skip-load? true}}
                                           (some-> (last @edit-calls)
                                                   (update :block :block/title)))
                                        "Deleting an empty block should focus the previous block")))})))

  (testing "backspace deletes empty block in embedded context"
    ;; testing embed at this layer doesn't require an embed block since
    ;; delete-block handles all the embed setup
    (p/let [conn (conn/get-db test-helper/test-db false)
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

(deftest-async backspace-between-empty-blocks-focuses-current-block-like-master
  (load-test-files
   [{:page {:block/title "empty-delete-page"}
     :blocks
     [{:block/title "before"}
      {:block/title ""}
      {:block/title ""}]}])
  (p/let [conn (conn/get-db test-helper/test-db false)
          blocks (->> (d/q '[:find (pull ?b [*])
                             :where
                             [?p :block/name "empty-delete-page"]
                             [?b :block/page ?p]
                             [(missing? $ ?b :logseq.property/deleted-at)]]
                           @conn)
                      (map first)
                      ldb/sort-by-order)
          current-block (last blocks)
          edit-calls (atom [])]
    (delete-block @conn current-block
                  {:on-edit (fn [block pos opts]
                              (swap! edit-calls conj {:block block
                                                      :pos pos
                                                      :opts opts}))
                   :on-delete
                   (fn []
                     (let [visible-blocks (->> (d/q '[:find (pull ?b [*])
                                                        :where
                                                        [?p :block/name "empty-delete-page"]
                                                        [?b :block/page ?p]
                                                        [(missing? $ ?b :logseq.property/deleted-at)]]
                                                      @conn)
                                               (map first))]
                       (is (= 2 (count visible-blocks)))
                       (is (= (:block/uuid current-block)
                              (some-> @edit-calls last :block :block/uuid))
                           "Backspace must keep the current block focused, matching master.")))})))

(deftest-async delete-selection-focuses-the-previous-block-after-the-worker-transaction
  (let [previous-block {:db/id 1
                        :block/uuid (random-uuid)
                        :block/title "previous"}
        deleted-block {:db/id 2
                       :block/uuid (random-uuid)
                       :block/title "deleted"}
        previous-dom #js {:getAttribute #({"blockid" (str (:block/uuid previous-block))
                                           "containerid" nil} %)}
        deleted-dom #js {}
        tx-opts (atom nil)
        worker-lookups (atom 0)
        edit-call (atom nil)]
    (-> (p/with-redefs [util/get-prev-block-non-collapsed-non-embed
                        (fn [block]
                          (is (identical? deleted-dom block))
                          previous-dom)
                        db-async/<get-block
                        (fn [& _args]
                          (swap! worker-lookups inc)
                          (p/resolved nil))
                        db-transact/apply-outliner-ops (fn [_conn _ops opts]
                                                        (reset! tx-opts opts)
                                                        (p/resolved nil))
                        editor/edit-block! (fn [block pos opts]
                                             (reset! edit-call [block pos opts]))]
          (-> (editor/delete-blocks! "test-repo"
                                     [(:block/uuid deleted-block)]
                                     [deleted-block]
                                     [deleted-dom]
                                     false)
              (p/then
               (fn [_]
                 (is (nil? @edit-call)
                     "Deletion should not focus before the renderer applies the response")
                 (is (zero? @worker-lookups)
                     "Selection deletion should use the post-transaction window instead of a preflight worker lookup")
                 (is (fn? (:editor/edit-block-fn @tx-opts))
                     "Deletion should carry a response-local renderer callback")
                 (let [edit-block-f (:editor/edit-block-fn @tx-opts)]
                   (is (fn? edit-block-f)
                       "Deletion should run focus from the worker response")
                   (when edit-block-f
                     (edit-block-f [previous-block])))
                 (is (= [previous-block 8
                         {:custom-content "previous"
                          :tail-len 0
                          :container-id nil
                          :save-code-editor? false
                          :skip-load? true}]
                        @edit-call)
                     "Deletion should restore focus from the renderer callback")))))
        (p/finally (fn [] nil)))))

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
  (p/let [conn (conn/get-db test-helper/test-db false)
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
  (p/let [conn (conn/get-db test-helper/test-db false)
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
  (p/let [conn (conn/get-db test-helper/test-db false)
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
    (-> (p/with-redefs [state/<invoke-db-worker <test-db-worker
                        db-transact/apply-outliner-ops apply-test-outliner-ops!
                        state/get-edit-content (constantly "")
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
        (p/finally (fn [] nil)))))

(deftest-async delete-at-empty-comments-end-merges-next-block-into-comments-block
  (load-test-files
   [{:page {:block/title "page1"}
     :blocks
     [{:block/title "b1"}
      {:block/title ""
       :build/tags [:logseq.class/Comments]}
      {:block/title "after"}]}])
  (p/let [conn (conn/get-db test-helper/test-db false)
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
    (-> (p/with-redefs [state/<invoke-db-worker <test-db-worker
                        db-transact/apply-outliner-ops apply-test-outliner-ops!
                        state/get-edit-content (constantly "")
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
        (p/finally (fn [] nil)))))

(deftest-async top-level-blank-enter-does-not-query-right-sibling
  (let [page {:db/id 10}
        block {:db/id 1
               :block/uuid (random-uuid)
               :block/title ""
               :block/parent page}
        input #js {:value ""}
        inserts (atom 0)]
    (p/with-redefs [editor/get-state (constantly {:block block
                                                  :config {:page page}
                                                  :node input})
                    editor/inside-of-single-block (constantly false)
                    state/get-input (constantly input)
                    db-async/<get-block-sibling
                    (fn [& _]
                      (throw (js/Error. "Top-level Enter does not need a sibling lookup")))
                    editor/insert-new-block! (fn [& _]
                                               (swap! inserts inc)
                                               (p/resolved nil))]
      (p/let [_ (editor/keydown-new-block-handler nil)]
        (is (= 1 @inserts))))))

(deftest-async insert-above-awaits-async-insert
  (let [current-block {:db/id 1
                       :block/uuid (random-uuid)
                       :block/title "first"}
        next-block {:db/id 2
                    :block/uuid (random-uuid)
                    :block/title ""}
        input #js {:value "first"}
        cleared? (atom false)
        previous-document (.-document js/globalThis)]
    (state/set-editing-block-id! [:unknown-container (:block/uuid current-block)])
    (set! (.-document js/globalThis)
          #js {:activeElement input
               :getElementById (fn [_id] input)})
    (-> (p/with-redefs [state/get-edit-input-id (constantly "edit-block-current")
                        gdom/getElement (constantly input)
                        util/get-selection-start (constantly 0)
                        util/get-selection-end (constantly 0)
                        editor/get-state (constantly {:block current-block
                                                      :value "first"
                                                      :config {}
                                                      :node input
                                                      :block-container #js {}})
                        editor/insert-new-block-before-block-aux!
                        (fn [_config _block _value]
                          (p/resolved [true true next-block]))
                        editor/clear-when-saved! #(reset! cleared? true)]
          (p/let [_ (editor/insert-new-block! nil nil)]
            (is @cleared? "Insert above should await the async insert helper")))
        (p/finally (fn []
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
    (d/transact! (conn/get-db test-helper/test-db false)
                 [[:db/add (:db/id comments-area) :block/tags comments-model/comments-tag-ident]])
    (p/with-redefs [state/<invoke-db-worker <test-db-worker
                    db-transact/apply-outliner-ops apply-test-outliner-ops!]
      (p/let [_ (block-handler/indent-outdent-blocks! [target] true nil)
              test-db (conn/get-db test-helper/test-db)
              target' (db-utils/entity test-db [:block/uuid (:block/uuid target)])
              comments-area' (db-utils/entity test-db [:block/uuid (:block/uuid comments-area)])]
        (is (= original-parent-id (:db/id (:block/parent target')))
            "Indenting a block after #Comments should leave it at the same parent")
        (is (not= (:db/id comments-area') (:db/id (:block/parent target')))
            "The target block must not become a child of the comments area")))))

(deftest-async db-based-save-assets-appends-to-today-page-without-editor
  (let [today-page {:block/uuid (random-uuid)
                    :block/title "today"}
        inserted (atom nil)]
    (-> (p/with-redefs [assets-handler/ensure-assets-dir! (fn [_repo]
                                                            (p/resolved ["/repo" "assets"]))
                        assets-handler/get-file-checksum (constantly "checksum")
                        db-async/<get-asset-with-checksum (fn [& _] (p/resolved nil))
                        db-async/<get-today-journal-title (fn [& _] (p/resolved "today"))
                        db-async/<get-journal-page-by-day (fn [& _] (p/resolved today-page))
                        state/<invoke-db-worker (fn [& _] (p/resolved nil))
                        state/get-edit-block (constantly nil)
                        state/get-edit-content (constantly "")
                        frontend-outliner-op/insert-blocks! (fn [blocks target opts]
                                                     (reset! inserted {:blocks blocks
                                                                       :target target
                                                                       :opts opts})
                                                     [:insert-blocks [blocks target opts]])
                        db-async/<get-blocks (fn [_repo block-ids _opts]
                                               (p/resolved
                                                (mapv (fn [block-id]
                                                        {:block/uuid block-id})
                                                      block-ids)))]
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
                        db-async/<get-today-journal-title (fn [& _] (p/resolved "today"))
                        db-async/<get-journal-page-by-day (fn [& _] (p/resolved {:block/uuid (random-uuid)
                                                                                 :block/title "today"}))
                        state/<invoke-db-worker (fn [& _] (p/resolved nil))
                        state/get-edit-block (constantly nil)
                        state/get-edit-content (constantly "")
                        frontend-outliner-op/insert-blocks! (fn [blocks target opts]
                                                     (reset! inserted {:blocks blocks
                                                                       :target target
                                                                       :opts opts})
                                                     [:insert-blocks [blocks target opts]])
                        db-async/<get-blocks (fn [_repo block-ids _opts]
                                               (p/resolved
                                                (mapv (fn [block-id]
                                                        {:block/uuid block-id})
                                                      block-ids)))]
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
                        db-async/<get-today-journal-title (fn [& _] (p/resolved "today"))
                        db-async/<get-journal-page-by-day (fn [& _] (p/resolved {:block/uuid (random-uuid)
                                                                                 :block/title "today"}))
                        state/<invoke-db-worker (fn [& _] (p/resolved nil))
                        state/get-edit-block (constantly temp-edit-block)
                        state/get-edit-content (constantly "")
                        frontend-outliner-op/insert-blocks! (fn [blocks target opts]
                                                     (reset! inserted {:blocks blocks
                                                                       :target target
                                                                       :opts opts})
                                                     [:insert-blocks [blocks target opts]])
                        db-async/<get-blocks (fn [_repo block-ids _opts]
                                               (p/resolved
                                                (mapv (fn [block-id]
                                                        {:block/uuid block-id})
                                                      block-ids)))]
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
        command-targets (atom [])
        expanded (atom [])]
    (-> (p/with-redefs [state/get-current-repo (constantly "test-repo")
                        block-handler/get-top-level-blocks identity
                        state/<invoke-db-worker
                        (fn [api _repo block-refs]
                          (is (= :thread-api/ensure-comments-area-for-blocks api))
                          (reset! command-targets (vec block-refs))
                          (is (= [first-uuid second-uuid] (vec block-refs)))
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
            (is (= [first-uuid second-uuid] @command-targets))
            (is (= [created-comments-area-uuid] @expanded)
                "The range comments area should be expanded inline"))))))

(deftest-async quick-add-creates-block-for-current-user
  (let [user-id (random-uuid)
        quick-add-page-id (random-uuid)
        inserts (atom [])]
    (p/with-redefs [state/get-current-repo (constantly "test-repo")
                    user-handler/user-uuid (constantly (str user-id))
                    db-async/<get-block
                    (fn [_repo block-id & _opts]
                      (p/resolved (when (= user-id block-id)
                                    {:db/id 42
                                     :block/uuid user-id})))
                    db-async/<get-block-with-children
                    (fn [& _]
                      (p/resolved {:block {:block/uuid quick-add-page-id}
                                   :children [{:block/uuid (random-uuid)
                                               :logseq.property/created-by-ref {:db/id 99}}]}))
                    editor/api-insert-new-block!
                    (fn [content opts]
                      (swap! inserts conj [content opts])
                      (p/resolved nil))]
      (p/let [_ (editor/quick-add-ensure-new-block-exists!)]
        (is (= [["" {:page quick-add-page-id
                      :container-id :unknown-container
                      :replace-empty-target? false}]]
               @inserts)
            "Another user's Quick Add block must not suppress the current user's block.")))))

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
        command-targets (atom [])
        expanded (atom [])]
    (-> (p/with-redefs [state/get-current-repo (constantly "test-repo")
                        block-handler/get-top-level-blocks identity
                        state/<invoke-db-worker
                        (fn [api _repo block-refs]
                          (is (= :thread-api/ensure-comments-area-for-blocks api))
                          (reset! command-targets (vec block-refs))
                          (is (= [block-uuid] (vec block-refs)))
                          (p/resolved created-comments-area))
                        editor/expand-block! (fn [block-uuid]
                                               (swap! expanded conj block-uuid)
                                               (p/resolved nil))]
          (p/let [area (comments-handler/ensure-comments-area-for-selected-blocks! [block])]
            (is (= created-comments-area area)
                "A single selected block should use a child comments area")
            (is (= [block-uuid] @command-targets))
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
                        db-async/<get-block (fn [_repo block-id _opts]
                                              (p/resolved
                                               (cond
                                                 (= block-uuid block-id) block
                                                 (= selected-uuid block-id) selected-block
                                                 :else nil)))
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

(deftest-async comment-delete-uses-atomic-worker-command
  (let [comment-block {:block/uuid (random-uuid)
                       :block/title "first"}
        resolved-block-ref (atom nil)]
    (-> (p/with-redefs [state/get-current-repo (constantly "test-repo")
                        state/<invoke-db-worker
                        (fn [api _repo block-ref]
                          (is (= :thread-api/delete-comment api))
                          (reset! resolved-block-ref block-ref)
                          (p/resolved nil))]
          (comments-handler/delete-comment! comment-block))
        (p/then
         (fn []
           (is (= (:block/uuid comment-block) @resolved-block-ref)))))))
