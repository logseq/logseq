(ns frontend.components.editor
  (:require [rum.core :as rum]
            [frontend.handler :as handler]
            [frontend.util :as util]
            [frontend.state :as state]
            [frontend.mixins :as mixins]
            [frontend.image :as image]
            [frontend.ui :as ui]
            [frontend.db :as db]
            [dommy.core :as d]
            [goog.object :as gobj]
            [goog.dom :as gdom]
            [clojure.string :as string]))

(defn get-state
  [state]
  (let [[_ {:keys [on-hide dummy?]} id] (:rum/args state)
        node (gdom/getElement id)
        value (gobj/get node "value")
        pos (gobj/get node "selectionStart")]
    {:on-hide on-hide
     :dummy? dummy?
     :id id
     :node node
     :value value
     :pos pos}))


(defn on-up-down
  [state e up?]
  (let [{:keys [id dummy? on-hide value pos]} (get-state state)
        heading? (string/starts-with? id "edit-heading-")
        element (gdom/getElement id)
        line-height (util/get-textarea-line-height element)]
    (when (and heading?
               (or (and up? (util/textarea-cursor-first-row? element line-height))
                   (and (not up?) (util/textarea-cursor-end-row? element line-height))))
      (util/stop e)
      (let [f (if up? gdom/getPreviousElementSibling gdom/getNextElementSibling)
            heading-id (string/replace id "edit-heading-" "")
            heading-parent (str "ls-heading-parent-" heading-id)
            sibling-heading (f (gdom/getElement heading-parent))
            id (gobj/get sibling-heading "id")]
        (when id
          (let [id (uuid (string/replace id "ls-heading-parent-" ""))]
            (on-hide value)
            ;; FIXME: refactor later
            ;; (let [heading (db/entity [:heading/uuid (uuid heading-id)])]
            ;;   (handler/save-heading-if-changed! heading value nil))
            (handler/edit-heading! id pos)))))))

(defn on-backspace
  [state e]
  (let [{:keys [id dummy? value on-hide pos]} (get-state state)
        heading? (string/starts-with? id "edit-heading-")]
    (when (and heading? (= value ""))
      (util/stop e)
      ;; delete heading, edit previous heading
      (let [heading-id (string/replace id "edit-heading-" "")
            heading (db/entity [:heading/uuid (uuid heading-id)])
            heading-parent (str "ls-heading-parent-" heading-id)
            heading-parent (gdom/getElement heading-parent)
            current-idx (util/parse-int (gobj/get heading-parent "idx"))
            sibling-heading (gdom/getPreviousElementSibling heading-parent)
            id (gobj/get sibling-heading "id")]

        (let [heading (db/entity [:heading/uuid (uuid heading-id)])]
          (handler/delete-heading! heading dummy?))

        (when id
          (let [id (uuid (string/replace id "ls-heading-parent-" ""))]
            (handler/edit-heading! id :max)))))))

(rum/defc box < rum/reactive
  (mixins/event-mixin
   (fn [state]
     (mixins/hide-when-esc-or-outside
      state
      :show-fn (fn []
                 (some? (:edit-input-id @state/state)))
      :on-hide (fn []
                 (let [{:keys [value on-hide]} (get-state state)]
                   (on-hide value))))
     (mixins/on-key-down
      state
      {
       ;; up
       38 (fn [state e] (on-up-down state e true))
       ;; down
       40 (fn [state e] (on-up-down state e false))

       ;; backspace
       8 (fn [state e] (on-backspace state e))
       })))
  {:init (fn [state _props]
           (let [[content {:keys [dummy?]}] (:rum/args state)]
             (state/set-edit-content!
              (if dummy?
                (string/triml content)
                (string/trim content))))
           state)
   :did-mount (fn [state]
                (let [[content opts id] (:rum/args state)]
                  (handler/restore-cursor-pos! id content (:dummy? opts)))
                state)}
  [content {:keys [on-hide dummy?]
            :or {dummy? false}} id]
  (let [value (state/sub :edit-content)]
    (ui/textarea
     {:id id
      :on-change (fn [e]
                   (state/set-edit-content! (util/evalue e)))
      :value value
      :auto-focus true
      :style {:border "none"
              :border-radius 0
              :background "transparent"
              :padding 0}})))
