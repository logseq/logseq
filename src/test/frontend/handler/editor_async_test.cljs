(ns frontend.handler.editor-async-test
  (:require [cljs.test :refer [is testing async use-fixtures]]
            [datascript.core :as d]
            [frontend.db :as db]
            [frontend.handler.block :as block-handler]
            [frontend.handler.editor :as editor]
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
              (reset! state/state previous-state)
              (reset! *previous-state nil)))})

(defn- fake-key-event
  []
  (let [stopped? (atom false)]
    {:event #js {:preventDefault #(reset! stopped? true)
                 :stopPropagation #(reset! stopped? true)}
     :stopped? stopped?}))

(defn- delete-block
  [db block {:keys [embed? on-delete]}]
  (let [sibling-block (ldb/get-left-sibling (d/entity db (:db/id block)))
        first-block (ldb/get-left-sibling sibling-block)
        block-dom-id "ls-block-block-to-delete"
        previous-repo (:git/current-repo @state/state)]
    (swap! state/state assoc :git/current-repo test-helper/test-db)
    (-> (p/with-redefs
         [editor/get-state (constantly {:block-id (:block/uuid block)
                                        :block-parent-id block-dom-id
                                        :config {:embed? embed?}})
                  ;; stub for delete-block
          gdom/getElement (constantly #js {:id block-dom-id})
                  ;; stub since not testing moving
          editor/edit-block! (constantly nil)
          state/get-edit-content (constantly "")
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
                                                    {:id "ls-block-sibling-block"
                                                     :block-uuid (:block/uuid sibling-block)}
                                                    {:id block-dom-id
                                                     :block-uuid (:block/uuid block)}]))]
          (p/do!
           (editor/delete-block! test-helper/test-db)
           (when (fn? on-delete)
             (on-delete))))
        (p/finally
          (fn []
            (swap! state/state assoc :git/current-repo previous-repo))))))

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
          (p/let [_ (when-let [edit-block-f @(:editor/edit-block-fn @state/state)]
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
