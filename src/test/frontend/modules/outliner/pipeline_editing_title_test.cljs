(ns frontend.modules.outliner.pipeline-editing-title-test
  "A remote tx that carries the editing block puts its title into the editor
  only when the tx changed that title."
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.db.subs :as db-subs]
            [frontend.modules.outliner.pipeline :as pipeline]
            [frontend.state :as state]))

(defn- editor-content-after-remote-delta
  "Edits a block saved as `rendered-title`, types `typed`, then applies a remote
  delta that carries the block with `delta-title`. Returns the editor content."
  [{:keys [rendered-title typed delta-title]}]
  (let [repo "pipeline-editing-title-test"
        block-uuid (random-uuid)
        *rendered (atom {:db/id 7 :block/uuid block-uuid :block/title rendered-title})
        *content (atom typed)]
    (with-redefs [state/get-current-repo (constantly repo)
                  state/get-current-page (constantly nil)
                  state/get-state (constantly {:client-id "this-client"})
                  state/set-state! (fn [& _] nil)
                  state/pub-event! (fn [& _] nil)
                  state/get-edit-block (constantly {:db/id 7 :block/uuid block-uuid :block/title rendered-title})
                  state/get-edit-content (fn [] @*content)
                  state/set-edit-content! (fn [value] (reset! *content value))
                  db-subs/block-snapshot (fn [_] {:status :ready :value @*rendered})
                  db-subs/apply-delta! (fn [delta]
                                         (swap! *rendered merge (get-in delta [:blocks block-uuid]))
                                         true)]
      (pipeline/invoke-hooks {:repo repo
                              :tx-meta {:rtc-tx? true}
                              :delta {:graph-id repo
                                      :rev 3
                                      :blocks {block-uuid {:db/id 7
                                                           :block/uuid block-uuid
                                                           :block/title delta-title}}
                                      :deleted {}
                                      :children {}
                                      :affected-keys #{}}}))
    @*content))

(deftest remote-tx-without-a-title-change-keeps-the-typed-text-test
  (testing "a remote child, property or reference change carries the editing block with its saved title"
    (is (= "saved and typed"
           (editor-content-after-remote-delta {:rendered-title "saved"
                                               :typed "saved and typed"
                                               :delta-title "saved"})))))

(deftest remote-title-change-reaches-the-editor-test
  (testing "a remote edit of the block's title still replaces the editor content"
    (is (= "remote title"
           (editor-content-after-remote-delta {:rendered-title "saved"
                                               :typed "saved and typed"
                                               :delta-title "remote title"})))))
