(ns frontend.handler.history-restore-test
  "The undo's cursor restore does not override a selection or text the user made
  in the block while the undo was in flight. The undo's render delta puts the
  undone text into the editor before the undo's result arrives, and the restore
  that landed later moved the cursor over a Mod+a pressed in between, so the
  following Backspace deleted one character instead of the selection."
  (:require [cljs.test :refer [async deftest is]]
            [frontend.handler.block :as block-handler]
            [frontend.handler.editor :as editor]
            [frontend.handler.history :as history]
            [frontend.state :as state]
            [frontend.util :as util]
            [promesa.core :as p]))

(def ^:private repo "history-restore-test")

(defn- run-undo!
  "Runs an undo of `block-uuid` back to `title` whose worker request first runs
  `during-f`: the render delta, the user's keys, or both."
  [block-uuid title during-f]
  (#'history/<history-request-and-restore!
   (atom nil)
   (fn []
     (during-f)
     (p/resolved {:undo? true
                  :editor-cursors [{:block-uuid block-uuid :start-pos 6}]
                  :block-content title}))))

(defn- <undo-restores?
  "Whether the cursor restore edited the block, for an editor at \"first line\"
  with the cursor at 6 and an undo back to \"first cursor line\". `during-f` runs
  while the worker request is in flight, `during-load-f` while edit-block! loads
  the block, before it would move the editor."
  [during-f & [during-load-f]]
  (let [block-uuid (random-uuid)
        *editor (atom {:content "first line" :selection [6 6]})
        *edits (atom [])]
    ;; The editor is faked in full (block, text, selection), so the test reads
    ;; none of the state store other namespaces' tests leave behind.
    (-> (p/with-redefs [state/get-current-repo (constantly repo)
                        state/get-edit-block (constantly {:block/uuid block-uuid})
                        state/get-edit-content (fn [] (:content @*editor))
                        state/get-input (constantly #js {})
                        util/get-selection-start (fn [_] (first (:selection @*editor)))
                        util/get-selection-end (fn [_] (second (:selection @*editor)))
                        state/<invoke-db-worker (fn [_api _repo _selector [_ uuid]]
                                                  (p/resolved {:block/uuid uuid}))
                        editor/edit-block! (fn [block pos {:keys [custom-content]}]
                                             (when during-load-f (during-load-f *editor))
                                             (when (#'block-handler/edit-guard-passes? block)
                                               (swap! *edits conj [custom-content pos])))]
          (run-undo! block-uuid "first cursor line" #(during-f *editor)))
        (p/then (fn [_] (seq @*edits))))))

(defn- render-delta!
  "What the pipeline does with the undo's render delta: the undone text, cursor at its end."
  [*editor]
  (reset! *editor {:content "first cursor line" :selection [17 17]}))

(defn- check!
  [done during-f restores? message & [during-load-f]]
  (-> (<undo-restores? during-f during-load-f)
      (p/then (fn [restored?] (is (= restores? (boolean restored?)) message)))
      (p/catch (fn [error] (is nil (str error))))
      (p/finally done)))

(deftest undo-restores-the-cursor-when-the-user-did-nothing-test
  (async done
         (check! done render-delta! true
                 "the undone text placed by the render delta is not the user's doing")))

(deftest undo-restores-the-cursor-without-a-render-delta-test
  (async done
         (check! done (fn [_] nil) true
                 "an editor left as it was at the request is restored")))

(deftest undo-keeps-a-selection-made-while-it-runs-test
  (async done
         (check! done
                 (fn [*editor]
                   (render-delta! *editor)
                   (swap! *editor assoc :selection [0 17]))
                 false
                 "Mod+a after the undone text appeared keeps its selection")))

(deftest undo-keeps-text-typed-while-it-runs-test
  (async done
         (check! done
                 (fn [*editor]
                   (render-delta! *editor)
                   (reset! *editor {:content "first cursor linex" :selection [18 18]}))
                 false
                 "text typed after the undone text appeared stays where it was typed")))

(deftest undo-keeps-a-selection-made-while-the-block-loads-test
  (async done
         (check! done
                 render-delta!
                 false
                 "Mod+a while edit-block! loads the block keeps its selection"
                 (fn [*editor] (swap! *editor assoc :selection [0 17])))))

(deftest edit-guard-is-used-once-and-only-for-its-block-test
  (let [block-uuid (random-uuid)
        guard-passes? #'block-handler/edit-guard-passes?]
    (try
      (state/set-state! :editor/edit-guard {:block-uuid block-uuid :ok? (constantly false)})
      (is (true? (guard-passes? {:block/uuid (random-uuid)})) "another block's edit is not guarded")
      (is (false? (guard-passes? {:block/uuid block-uuid})))
      (is (true? (guard-passes? {:block/uuid block-uuid})) "the guard is spent after one check")
      (finally
        (state/set-state! :editor/edit-guard nil)))))
