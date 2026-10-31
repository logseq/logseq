(ns frontend.handler.editor-key-landing-test
  "Keys pressed while an Enter, Backspace join or Delete join still waits for
  the worker: an undo chord is not typed into the pending block, undo and redo
  wait for the key to land, and a Delete join acts on the row it was pressed
  in."
  (:require [cljs.test :refer [async deftest is]]
            [dommy.core :as dom]
            [frontend.db.async :as db-async]
            [frontend.handler.editor :as editor]
            [frontend.handler.editor.autopair :as editor-autopair]
            [frontend.handler.history :as history]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [promesa.core :as p]))

(defn- key-event
  [key & {:keys [ctrl? meta?]}]
  (let [stopped? (atom false)]
    [#js {:key key
          :ctrlKey (boolean ctrl?)
          :metaKey (boolean meta?)
          :preventDefault #(reset! stopped? true)
          :stopPropagation (fn [])}
     stopped?]))

(defn- press-during-pending-enter!
  [event]
  (with-redefs [state/get-input (constantly #js {:value "" :id "edit-block-1"})
                state/get-edit-input-id (constantly "edit-block-1")
                cursor/pos (constantly 0)
                editor-autopair/surround-by? (constantly false)
                util/native-event-is-composing? (constantly false)]
    ((editor/keydown-not-matched-handler :markdown) event nil)))

(deftest control-z-during-a-pending-enter-is-not-typed-into-the-new-block-test
  (#'editor/start-pending-new-block!)
  (try
    (let [[undo-event undo-stopped?] (key-event "z" :ctrl? true)
          [redo-event redo-stopped?] (key-event "y" :meta? true)
          [typed-event typed-stopped?] (key-event "x")]
      (press-during-pending-enter! undo-event)
      (press-during-pending-enter! redo-event)
      (is (= "" (:typed-text (state/get-state :editor/pending-new-block)))
          "Control+z and Meta+y add no text to the block the Enter makes")
      (is (false? @undo-stopped?) "Control+z reaches the undo shortcut")
      (is (false? @redo-stopped?) "Meta+y reaches the redo shortcut")
      (press-during-pending-enter! typed-event)
      (is (= "x" (:typed-text (state/get-state :editor/pending-new-block)))
          "a plain key is still kept for the new block")
      (is (true? @typed-stopped?)))
    (finally
      (#'editor/clear-pending-new-block!))))

(deftest undo-waits-for-the-pending-enter-to-land-test
  (async done
    (let [calls (atom [])
          *landed (p/deferred)]
      (-> (p/with-redefs [state/get-current-repo (constantly "repo")
                          editor/<pending-block-delete (constantly (p/resolved nil))
                          editor/<pending-new-block (fn [] *landed)
                          editor/save-current-block! (fn [& _] (swap! calls conj :save))
                          state/clear-editor-action! (fn [] nil)
                          state/<invoke-db-worker (fn [api & _]
                                                    (swap! calls conj api)
                                                    (p/resolved nil))
                          history/restore-cursor-and-state! (fn [_] nil)]
            (let [undo (#'history/undo-aux! nil)]
              (p/do!
               (p/delay 20)
               (is (= [] @calls) "nothing is saved or undone while the Enter runs")
               (swap! calls conj :enter-landed)
               (p/resolve! *landed nil)
               undo
               (is (= [:enter-landed :save :thread-api/undo-redo-undo] @calls)
                   "the buffer is saved and the undo sent after the Enter landed"))))
          (p/catch (fn [error] (is false (str error))))
          (p/finally done)))))

(deftest redo-waits-for-a-running-delete-join-test
  (async done
    (let [calls (atom [])
          *joined (p/deferred)]
      (-> (p/with-redefs [state/get-current-repo (constantly "repo")
                          editor/<pending-block-delete (fn [] *joined)
                          editor/<pending-new-block (constantly (p/resolved nil))
                          editor/save-current-block! (fn [& _] (swap! calls conj :save))
                          state/clear-editor-action! (fn [] nil)
                          state/<invoke-db-worker (fn [api & _]
                                                    (swap! calls conj api)
                                                    (p/resolved nil))
                          history/restore-cursor-and-state! (fn [_] nil)]
            (let [redo (#'history/redo-aux! nil)]
              (p/do!
               (p/delay 20)
               (is (= [] @calls))
               (swap! calls conj :join-landed)
               (p/resolve! *joined nil)
               redo
               (is (= [:join-landed :save :thread-api/undo-redo-redo] @calls)))))
          (p/catch (fn [error] (is false (str error))))
          (p/finally done)))))

(deftest delete-join-uses-the-row-the-delete-was-pressed-in-test
  (async done
    (let [pressed-input #js {:id "edit-block-d" :row "row-d"}
          clicked-input #js {:id "edit-block-f" :row "row-f"}
          *input (atom pressed-input)
          *lookup (p/deferred)
          next-rows (atom [])
          joined (atom nil)
          current-block {:db/id 4 :block/uuid #uuid "00000000-0000-0000-0000-00000000000d"}]
      (-> (p/with-redefs [state/get-current-repo (constantly "repo")
                          state/get-input (fn [] @*input)
                          util/rec-get-node (fn [input _class] (.-row input))
                          dom/attr (fn [node _attr]
                                     (case node
                                       "row-d" (str (:block/uuid current-block))
                                       "row-f" "00000000-0000-0000-0000-00000000000f"
                                       "00000000-0000-0000-0000-000000000007"))
                          editor/get-state (fn [] {:config {:container-id (.-row @*input)}})
                          db-async/<get-block-with-children (fn [_repo block-id _opts]
                                                              (if (= block-id (:block/uuid current-block))
                                                                *lookup
                                                                (p/resolved {:block {:db/id 7 :block/uuid block-id :block/title "g"}})))
                          util/collapsed? (constantly false)
                          util/get-next-block-non-collapsed (fn [row _opts]
                                                              (swap! next-rows conj row)
                                                              (str "next of " row))
                          editor/delete-block-inner! (fn [_repo editor-state]
                                                       (reset! joined editor-state)
                                                       nil)]
            (let [delete (#'editor/delete-concat current-block pressed-input (editor/get-state))]
              ;; the user clicks block f while the worker answers for block d
              (reset! *input clicked-input)
              (p/resolve! *lookup {:block current-block})
              (p/do!
               delete
               (is (= ["row-d"] @next-rows) "the next row is the one after d, where Delete was pressed")
               (is (= "next of row-d" (:block-container @joined)))
               (is (= "row-d" (get-in @joined [:config :container-id]))
                   "the join uses the editor state of the keypress")
               (is (= 4 (:db/id (:current-block @joined)))))))
          (p/catch (fn [error] (is false (str error))))
          (p/finally done)))))
