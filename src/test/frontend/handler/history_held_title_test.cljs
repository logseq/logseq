(ns frontend.handler.history-held-title-test
  "While our own undo/redo is in flight the pipeline holds back the editing block's
  new title, so the cursor restore sets the text and the cursor together: setting
  the text first put the cursor at the end, and the restore that landed later
  moved it over whatever the user had selected in between (Mod+a then Backspace
  right after an undo deleted one character)."
  (:require [cljs.test :refer [async deftest is]]
            [frontend.db.subs :as db-subs]
            [frontend.handler.editor :as editor]
            [frontend.handler.history :as history]
            [frontend.modules.outliner.pipeline :as pipeline]
            [frontend.state :as state]
            [promesa.core :as p]))

(def ^:private repo "history-held-title-test")

(defn- editing-state
  [block-uuid content]
  {:client-id "this-client"
   :git/current-repo repo
   :editor/block {:block/uuid block-uuid}
   :editor/content {block-uuid content}})

(defn- undo-delta!
  "The render delta of an undo by the worker, which reaches the pipeline before the
  undo's result reaches the history handler."
  [block-uuid title]
  (pipeline/invoke-hooks {:repo repo
                          :tx-meta {:client-id "worker-undo"}
                          :delta {:graph-id repo
                                  :rev 1
                                  :blocks {block-uuid {:block/uuid block-uuid :block/title title}}
                                  :deleted {}
                                  :children {}
                                  :affected-keys #{}}}))

(defn- run-undo!
  "Runs an undo whose worker request broadcasts the delta first, as the worker does."
  [block-uuid title]
  (#'history/<history-request-and-restore!
   (atom nil)
   (fn []
     (undo-delta! block-uuid title)
     (p/resolved {:undo? true
                  :editor-cursors [{:block-uuid block-uuid :start-pos 3}]
                  :block-content title}))))

(defn- with-undo-env
  [*set-calls restore-edits? f]
  (p/with-redefs [db-subs/apply-delta! (constantly true)
                state/get-current-page (constantly nil)
                state/set-edit-content! (fn [& args]
                                          (swap! *set-calls conj (last args))
                                          (state/set-state! :editor/content (last args)
                                                            :nested-path (:block/uuid (state/get-edit-block))))
                state/<invoke-db-worker (fn [_api _repo _selector [_ block-uuid]]
                                          (p/resolved (when restore-edits? {:block/uuid block-uuid})))
                editor/edit-block! (fn [block _pos {:keys [custom-content]}]
                                     (state/set-state! :editor/content custom-content
                                                       :nested-path (:block/uuid block)))]
    (f)))

(deftest pipeline-holds-the-editing-title-while-our-undo-runs-test
  (async done
         (let [original-state (state/get-state)
               block-uuid (random-uuid)
               *set-calls (atom [])]
           (-> (p/do!
                (state/replace-state! (assoc (editing-state block-uuid "first line") :history/request-pending? true))
                (with-undo-env *set-calls true #(undo-delta! block-uuid "first cursor line"))
                (is (= [] @*set-calls) "the editor text waits for the cursor restore")
                (is (= [block-uuid "first cursor line"] (state/get-state :history/held-editing-title)))
                (state/replace-state! (editing-state block-uuid "first line"))
                (with-undo-env *set-calls true #(undo-delta! block-uuid "first cursor line"))
                (is (= ["first cursor line"] @*set-calls)
                    "without an undo in flight a remote title still replaces the text"))
               (p/catch (fn [error] (is nil (str error))))
               (p/finally (fn []
                            (state/replace-state! original-state)
                            (done)))))))

(deftest undo-restore-sets-the-text-once-test
  (async done
         (let [original-state (state/get-state)
               block-uuid (random-uuid)
               *set-calls (atom [])]
           (state/replace-state! (editing-state block-uuid "first line"))
           (-> (with-undo-env *set-calls true
                 #(run-undo! block-uuid "first cursor line"))
               (p/then (fn [_]
                         (is (= [] @*set-calls)
                             "only the cursor restore sets the text, together with the cursor")
                         (is (= "first cursor line" (state/get-edit-content)))
                         (is (false? (state/get-state :history/request-pending?)))
                         (is (nil? (state/get-state :history/held-editing-title)))))
               (p/catch (fn [error] (is nil (str error))))
               (p/finally (fn []
                            (state/replace-state! original-state)
                            (done)))))))

(deftest held-title-is-applied-when-the-restore-edits-nothing-test
  (async done
         (let [original-state (state/get-state)
               block-uuid (random-uuid)
               *set-calls (atom [])]
           (state/replace-state! (editing-state block-uuid "first line"))
           (-> (with-undo-env *set-calls false
                 #(run-undo! block-uuid "first cursor line"))
               (p/then (fn [_]
                         (is (= ["first cursor line"] @*set-calls)
                             "the held title reaches the editor after the restore")
                         (is (= "first cursor line" (state/get-edit-content)))))
               (p/catch (fn [error] (is nil (str error))))
               (p/finally (fn []
                            (state/replace-state! original-state)
                            (done)))))))
