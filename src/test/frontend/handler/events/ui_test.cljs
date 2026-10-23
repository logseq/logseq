(ns frontend.handler.events.ui-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.components.property.dialog :as property-dialog]
            [frontend.db.async :as db-async]
            [frontend.handler.events.ui :as events-ui]
            [frontend.state :as state]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]))

(def ^:private alpha
  {:block/uuid #uuid "11111111-1111-1111-1111-111111111111"
   :block/title "QA tag alpha"})

(def ^:private beta
  {:block/uuid #uuid "22222222-2222-2222-2222-222222222222"
   :block/title "QA tag beta"})

(def ^:private gamma
  {:block/uuid #uuid "33333333-3333-3333-3333-333333333333"
   :block/title "QA tag gamma"})

(def ^:private delta
  {:block/uuid #uuid "44444444-4444-4444-4444-444444444444"
   :block/title "QA tag delta"})

(defn- block-ids
  [blocks]
  (mapv :block/uuid blocks))

(defn- <open-property-dialog
  [opts]
  (let [shown (atom nil)]
    (-> (p/with-redefs [state/get-edit-block (constantly nil)
                        state/get-current-page (constantly nil)
                        state/get-current-repo (constantly "test")
                        state/get-edit-pos (constantly nil)
                        state/get-edit-input-id (constantly nil)
                        state/get-selection-block-ids (constantly (block-ids [alpha beta gamma delta]))
                        state/get-selection-blocks (constantly [:dom])
                        db-async/<get-blocks
                        (fn [_repo ids]
                          (let [by-id {(:block/uuid alpha) alpha
                                       (:block/uuid beta) beta
                                       (:block/uuid gamma) gamma
                                       (:block/uuid delta) delta}]
                            (p/resolved (mapv (fn [id] {:block (get by-id id)}) ids))))
                        property-dialog/dialog
                        (fn [blocks dialog-opts]
                          (reset! shown {:blocks blocks :opts dialog-opts})
                          [:div])
                        shui/popup-show!
                        (fn [_target render-fn _popup-opts]
                          (render-fn))]
          (#'events-ui/editor-new-property nil :toolbar-button opts))
        (p/then (fn [_] @shown)))))

(deftest editor-new-property-uses-live-selection-when-toolbar-omits-blocks
  (async done
         (-> (<open-property-dialog {:property-key "Tags"})
             (p/then (fn [shown]
                       (is (= (block-ids [alpha beta gamma delta])
                              (block-ids (:blocks shown)))
                           "Live outliner selection is loaded when the toolbar does not pin a snapshot.")
                       (is (= (block-ids [alpha beta gamma delta])
                              (block-ids (:selected-blocks (:opts shown))))
                           "Click-time live blocks are pinned for the property dialog.")
                       (done)))
             (p/catch (fn [error]
                        (is false (str error))
                        (done))))))

(deftest editor-new-property-keeps-explicit-view-selected-blocks
  (async done
         (-> (<open-property-dialog {:selected-blocks [alpha beta]
                                     :property-key "Tags"})
             (p/then (fn [shown]
                       (is (= (block-ids [alpha beta])
                              (block-ids (:blocks shown)))
                           "Views still operate on the explicit row list.")
                       (done)))
             (p/catch (fn [error]
                        (is false (str error))
                        (done))))))
