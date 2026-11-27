(ns frontend.handler.editor-fuzz-ui-test
  (:require [clojure.test :refer [async deftest is testing use-fixtures]]
            [frontend.db.async :as db-async]
            [frontend.db.conn :as conn]
            [frontend.db.subs :as db-subs]
            [frontend.db.transact :as db-transact]
            [frontend.handler.editor :as editor]
            [frontend.state :as state]
            [frontend.test.helper :as test-helper]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [goog.dom :as gdom]
            [promesa.core :as p]))

(use-fixtures :each {:before (fn []
                              (async done
                                     (test-helper/start-test-db!)
                                     (done)))
                     :after (fn []
                              (state/set-current-repo! nil)
                              (test-helper/destroy-test-db!))})

(def ^:private numbering-block-id #uuid "11111111-1111-1111-1111-111111111111")

(defn- renderer-snapshot-numbered
  "The renderer's snapshot of the block after it was numbered while it was being edited."
  [block-uuid]
  {:status :ready
   :value {:block/uuid block-uuid
           :logseq.property/order-list-type {:block/title "number"}}})

(deftest handle-last-input-does-not-toggle-a-block-numbered-while-editing-test
  (let [stale-edit-block {:block/uuid numbering-block-id :block/title ""}
        published (atom [])
        type-one-dot-space! (fn [snapshot-fn]
                              (p/with-redefs [state/get-input (constantly #js {:value "1. "})
                                              state/get-edit-input-id (constantly "edit-block-1")
                                              state/get-edit-block (constantly stale-edit-block)
                                              state/get-editor-args (constantly [nil nil {}])
                                              state/pub-event! (fn [event] (swap! published conj event))
                                              state/set-edit-content! (constantly nil)
                                              cursor/pos (constantly 3)
                                              db-subs/block-snapshot snapshot-fn]
                                (editor/handle-last-input)))]
    (async done
      (-> (p/do!
           (type-one-dot-space! (constantly {:status :loading}))
           (is (= [[:editor/toggle-own-number-list stale-edit-block]] @published)
               "a block that is not numbered is numbered by typing 1. ")
           (reset! published [])
           (type-one-dot-space! renderer-snapshot-numbered)
           (is (empty? @published)
               "a block numbered after editing started is left alone, not toggled off"))
          (p/finally done)))))

(deftest keydown-new-block-on-an-empty-block-numbered-while-editing-removes-the-number-test
  (let [stale-block {:db/id 1
                     :block/uuid numbering-block-id
                     :block/title ""}
        removed (atom [])
        inserted (atom [])]
    (with-redefs [editor/auto-complete? (constantly false)
                  db-subs/block-snapshot renderer-snapshot-numbered
                  editor/remove-block-own-order-list-type! (fn [block]
                                                             (swap! removed conj (:block/uuid block)))
                  editor/insert-new-block! (fn [& args]
                                             (swap! inserted conj args))]
      (#'editor/keydown-new-block {:block stale-block
                                   :config {}
                                   :value ""})
      (is (= [numbering-block-id] @removed))
      (is (empty? @inserted)))))

(deftest backspace-at-start-of-a-block-numbered-while-editing-removes-the-number-test
  (let [stale-block {:db/id 1
                     :block/uuid numbering-block-id
                     :block/title ""
                     :block/page {:db/id 10}}
        removed (atom [])
        deleted (atom [])]
    (async done
      (-> (p/with-redefs [state/get-input (constantly #js {:value ""})
                          cursor/pos (constantly 0)
                          util/stop (constantly nil)
                          state/get-current-repo (constantly test-helper/test-db)
                          state/get-edit-block (constantly stale-block)
                          db-async/<get-block-sibling (fn [& _] (p/resolved nil))
                          db-subs/block-snapshot renderer-snapshot-numbered
                          editor/get-state (constantly {:config {}})
                          editor/save-current-block! (constantly nil)
                          editor/remove-block-own-order-list-type! (fn [block]
                                                                     (swap! removed conj (:block/uuid block)))
                          editor/delete-block-inner! (fn [& args]
                                                       (swap! deleted conj args))
                          util/get-prev-block-non-collapsed-non-embed (constantly nil)]
            (p/do!
             (#'editor/delete-block-when-zero-pos! nil)
             (is (= [numbering-block-id] @removed))
             (is (empty? @deleted))))
          (p/finally done)))))

(defn- backspace-in-empty-numbered-block
  "Backspace at position 0 of an empty block. `edit-block` is what the editor
  captured when editing started, `latest-block` what the renderer shows now."
  [edit-block latest-block]
  (let [calls (atom [])]
    (-> (p/with-redefs [state/get-input (constantly #js {:value ""})
                        cursor/pos (constantly 0)
                        util/stop (constantly nil)
                        state/get-current-repo (constantly test-helper/test-db)
                        state/get-edit-block (constantly edit-block)
                        editor/get-state (constantly {:config {}})
                        util/get-prev-block-non-collapsed-non-embed (constantly nil)
                        db-async/<get-block-sibling (fn [& _] (p/resolved nil))
                        db-subs/block-snapshot (constantly {:status :ready :value latest-block})
                        editor/save-current-block! (fn [& _] (swap! calls conj :save))
                        editor/remove-block-own-order-list-type!
                        (fn [_block] (swap! calls conj :remove-list-type))
                        editor/delete-block-inner! (fn [& _] (swap! calls conj :delete-block))]
          (#'editor/delete-block-when-zero-pos! nil))
        (p/then (fn [] @calls)))))

(deftest backspace-in-numbered-block-uses-the-latest-list-type-test
  (async done
    (let [numbered {:db/id 1
                    :block/uuid #uuid "11111111-1111-1111-1111-111111111111"
                    :block/title ""
                    :block/page {:db/id 10}
                    :logseq.property/order-list-type {:block/title "number"}}
          plain (dissoc numbered :logseq.property/order-list-type)]
      (-> (p/let [first-backspace (backspace-in-empty-numbered-block numbered numbered)
                  second-backspace (backspace-in-empty-numbered-block numbered plain)]
            (is (= [:save :remove-list-type] first-backspace)
                "The first Backspace turns the numbered block back into a bullet")
            (is (= [:delete-block] second-backspace)
                "Once the list type is gone, Backspace deletes the block even though the editor still holds the block it captured when editing started"))
          (p/finally done)))))

(defn- escape-editing-library-block
  "Run `escape-editing` on `block` in an editor whose input holds `input-value`.
  Resolves to the outliner ops it sent to the worker."
  [{:keys [block input-value config]}]
  (let [tx-ops (atom [])]
    (-> (p/with-redefs [state/editor-in-composition? (constantly false)
                        state/get-editor-action (constantly nil)
                        state/get-current-repo (constantly "library-escape")
                        state/get-edit-input-id (constantly "editor")
                        state/get-edit-block (constantly block)
                        state/get-editor-args (constantly [nil "editor" config])
                        state/clear-edit! (constantly nil)
                        gdom/getElement (constantly #js {:value input-value})
                        db-subs/block-snapshot (constantly {:status :ready :value block})
                        conn/get-db (constantly nil)
                        editor/wrap-parse-block identity
                        db-transact/apply-outliner-ops (fn [_db ops _opts]
                                                         (swap! tx-ops into ops)
                                                         :tx)]
          (editor/escape-editing))
        (p/then (fn [_] @tx-ops)))))

(deftest escape-editing-deletes-untitled-library-page-test
  (let [page-uuid #uuid "44444444-4444-4444-4444-444444444444"
        untitled-page {:db/id 1
                       :block/uuid page-uuid
                       :block/title ""
                       :block/tags [{:db/ident :logseq.class/Page}]}]
    (async done
      (-> (p/let [deleted-ops (escape-editing-library-block {:block untitled-page
                                                             :input-value ""
                                                             :config {:library? true}})
                  titled-ops (escape-editing-library-block {:block (assoc untitled-page :block/title "Typed")
                                                            :input-value "Typed"
                                                            :config {:library? true}})
                  outside-library-ops (escape-editing-library-block {:block untitled-page
                                                                     :input-value ""
                                                                     :config {}})]
            (testing "leaving a Library page that never got a title removes it"
              (is (= [:delete-page :recycle-delete-permanently]
                     (map first deleted-ops)))
              (is (every? #(= page-uuid (first (second %))) deleted-ops)))
            (testing "a Library page with a title is kept"
              (is (empty? (filter #{:delete-page :recycle-delete-permanently}
                                  (map first titled-ops)))))
            (testing "outside the Library nothing is deleted"
              (is (empty? (filter #{:delete-page :recycle-delete-permanently}
                                  (map first outside-library-ops))))))
          (p/catch (fn [error]
                     (is false (str error))))
          (p/finally done)))))

(deftest db-collapsable-ignores-hidden-properties-test
  (testing "a block whose properties are all hidden has nothing to expand"
    (is (not (editor/db-collapsable?
              {:block/title "hidden only"
               :block.temp/property-keys [:user.property/p1 :user.property/p2]
               :block.temp/display-properties
               {:full-properties []
                :hidden-properties [{:property-id :user.property/p1}
                                    {:property-id :user.property/p2}]}}))))

  (testing "a visible property row makes the block collapsable"
    (is (editor/db-collapsable?
         {:block/title "visible and hidden"
          :block.temp/property-keys [:user.property/p1 :user.property/p2]
          :block.temp/display-properties
          {:full-properties [{:property-id :user.property/p1}]
           :hidden-properties [{:property-id :user.property/p2}]}})))

  (testing "shown hidden properties stay reopenable after the block is collapsed"
    (let [block-uuid (random-uuid)
          block {:block/uuid block-uuid
                 :block/title "hidden only"
                 :block.temp/display-properties
                 {:full-properties []
                  :hidden-properties [{:property-id :user.property/p1}]}}]
      (try
        (swap! state/*show-hidden-properties-block-ids conj block-uuid)
        (is (editor/db-collapsable? block))
        (is (not (editor/db-collapsable? (assoc block :block/uuid (random-uuid))))
            "Another block with hidden rows that are not shown has no arrow")
        (swap! state/*show-hidden-properties-block-ids disj block-uuid)
        (is (not (editor/db-collapsable? block))
            "Hiding them again removes the arrow")
        (finally
          (swap! state/*show-hidden-properties-block-ids disj block-uuid)))))

  (testing "query blocks stay collapsable when every property row is hidden"
    (is (editor/db-collapsable?
         {:block/title "query"
          :logseq.property/query {:block/title "q"}
          :block.temp/display-properties {:full-properties [] :hidden-properties []}}))))
