(ns frontend.handler.editor.assets-mutation-test
  (:require [cljs.test :refer [async deftest is use-fixtures]]
            [frontend.db.async :as db-async]
            [frontend.handler.assets :as assets-handler]
            [frontend.handler.editor :as editor]
            [frontend.handler.editor.assets :as editor-assets]
            [frontend.modules.outliner.op :as outliner-op]
            [frontend.state :as state]
            [frontend.test.helper :as test-helper]
            [promesa.core :as p]))

(use-fixtures :each {:before (fn []
                               (async done
                                 (test-helper/start-test-db!)
                                 (done)))
                     :after test-helper/destroy-test-db!})

(defn- save-assets!
  "Saves `files` with the worker, the assets dir and the outliner stubbed.
   Returns a promise of {:inserted <insert-blocks! args> :edited <edit-block! calls>}."
  [files edit-block]
  (let [inserted (atom nil)
        edited (atom [])]
    (p/with-redefs [assets-handler/ensure-assets-dir! (fn [_repo] (p/resolved ["/repo" "assets"]))
                    assets-handler/get-file-checksum (fn [file] (str "checksum of " file))
                    db-async/<get-asset-with-checksum (fn [& _] (p/resolved nil))
                    state/<invoke-db-worker (fn [api & _]
                                              (p/resolved (when (= api :thread-api/pull)
                                                            {:block/uuid (random-uuid) :block/title "Asset"})))
                    state/get-edit-block (constantly edit-block)
                    state/get-edit-content (constantly (:block/title edit-block))
                    outliner-op/insert-blocks! (fn [blocks target opts]
                                                 (reset! inserted {:blocks blocks :target target :opts opts})
                                                 [:insert-blocks [blocks target opts]])
                    db-async/<get-blocks (fn [_repo block-ids _opts]
                                           (p/resolved (mapv (fn [id] {:block {:block/uuid id}}) block-ids)))
                    editor/edit-block! (fn [block pos] (swap! edited conj [(:block/uuid block) pos]))]
      (p/let [_ (editor-assets/db-based-save-assets! "repo" files)]
        {:inserted @inserted :edited @edited}))))

(deftest asset-block-is-titled-after-its-file-and-keeps-its-checksum-test
  (async done
    (-> (p/let [{:keys [inserted]} (save-assets! [{:src "photo.png"}] nil)
                block (first (:blocks inserted))]
          (is (= "photo" (:block/title block)) "only a file named image gets a date-time title")
          (is (= "checksum of photo.png" (:logseq.property.asset/checksum block))))
        (p/catch (fn [e] (is (nil? e))))
        (p/finally (fn [& _] (done))))))

(deftest asset-pasted-into-an-empty-editing-block-reopens-the-editor-on-it-test
  (async done
    (let [edit-uuid (random-uuid)]
      (-> (p/let [{:keys [inserted edited]} (save-assets! [{:src "photo.png"}]
                                                           {:block/uuid edit-uuid :block/title ""})]
            (is (= edit-uuid (:block/uuid (first (:blocks inserted)))) "the asset takes the empty block's place")
            (is (= [[edit-uuid :max]] edited)))
          (p/catch (fn [e] (is (nil? e))))
          (p/finally (fn [& _] (done)))))))
