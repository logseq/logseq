(ns frontend.components.block.drop-boundary-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.components.block]
            [frontend.db.async :as db-async]
            [frontend.handler.dnd :as dnd]
            [frontend.state :as state]
            [promesa.core :as p]))

(deftest selected-block-drop-passes-canonical-blocks-to-dnd-test
  (async done
    (let [block-drop (some-> (resolve 'frontend.components.block/block-drop) deref)
          first-uuid (random-uuid)
          second-uuid (random-uuid)
          selected [{:id first-uuid
                     :block {:block/uuid first-uuid :block/title "first"}}
                    {:id second-uuid
                     :block {:block/uuid second-uuid :block/title "second"}}]
          moved (atom nil)
          move-to (atom :nested)
          event #js {:stopPropagation (fn [])}]
      (is (fn? block-drop))
      (-> (p/with-redefs [state/get-selection-block-ids (constantly [first-uuid second-uuid])
                          state/get-current-repo (constantly "test-repo")
                          db-async/<get-blocks (fn [& _] (p/resolved selected))
                          dnd/move-blocks (fn [_event blocks _target _original _move-to]
                                            (reset! moved blocks))]
            (p/let [_ (block-drop event
                                  (random-uuid)
                                  {:block/uuid (random-uuid)}
                                  nil
                                  move-to)
                    _ (p/delay 0)]
              (is (= (mapv :block selected) @moved))))
          (p/catch (fn [error]
                     (is false (str error))))
          (p/finally done)))))
