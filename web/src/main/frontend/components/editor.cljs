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
            [clojure.string :as string]
            [frontend.commands :as commands]
            [medley.core :as medley]))

(defonce *show-commands (atom false))
(defonce *matched-commands (atom commands/commands-map))
(defonce *slash-caret-pos (atom nil))
(defonce *command-current-idx (atom 0))

(defn- append-command!
  [id command-output]
  (handler/append-command! command-output)
  (.focus (gdom/getElement id))
  (reset! *show-commands false))

(rum/defc commands < rum/reactive
  {:will-mount (fn [state]
                 (reset! *command-current-idx 0)
                 (reset! *matched-commands commands/commands-map)
                 state)}
  [id]
  (let [{:keys [top left]} (rum/react *slash-caret-pos)
        command-current-idx (rum/react *command-current-idx)]
    [:div.absolute.rounded-md.shadow-lg
     {:style {:top (+ top 20)
              :left left
              :width 400}}
     [:div.py-1.rounded-md.bg-white.shadow-xs
      (for [[idx [name handler]] (medley/indexed (rum/react *matched-commands))]
        (rum/with-key
          (ui/menu-link
           {:style (merge
                    {:padding "6px"}
                    (when (= command-current-idx idx)
                      {:background-color "rgb(213, 218, 223)"}))
            :class "initial-color"
            :tab-index 0
            :on-click (fn [e]
                        (util/stop e)
                        (cond
                          ;; replace string
                          (string? handler)
                          (handler/append-command! handler)

                          ;; steps
                          (vector? handler)
                          nil

                          :else
                          nil)
                        (.focus (gdom/getElement id))
                        (reset! *show-commands false))}
           name)
          name))]]))

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

(defn get-matched-commands
  [input]
  (let [edit-content (gobj/get input "value")
        last-command (commands/get-command-input edit-content)]
    (or
     (and (= \/ (last edit-content))
          commands/commands-map)
     (and last-command
          (commands/get-matched-commands last-command)))))

(rum/defc box < rum/reactive
  (mixins/event-mixin
   (fn [state]
     (let [input-id (last (:rum/args state))
           input (gdom/getElement input-id)]
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
         38 (fn [state e]
              (if (seq (get-matched-commands input))
                (do
                  (util/stop e)
                  (when (>= @*command-current-idx 1)
                   (swap! *command-current-idx dec)))
                (on-up-down state e true)))
         ;; down
         40 (fn [state e]
              (if-let [matched (seq (get-matched-commands input))]
                (do
                  (util/stop e)
                  (let [total (count matched)]
                   (if (>= @*command-current-idx (dec total))
                     (reset! *command-current-idx 0)
                     (swap! *command-current-idx inc))))
                (on-up-down state e false)))

         ;; backspace
         8 (fn [state e] (on-backspace state e))

         ;; enter
         13 (fn [state e]
              (let [matched-commands (get-matched-commands input)]
                (when (seq matched-commands)
                  (util/stop e)
                  (append-command! input-id (last (nth matched-commands @*command-current-idx))))))}
        nil)
       (mixins/on-key-up
        state
        {191 (fn [state e]
               (reset! *show-commands true)
               (reset! *slash-caret-pos (util/get-caret-pos input)))}
        (fn [e key-code]
          (when (not= key-code 191)
            (let [matched-commands (get-matched-commands input)]
              (if (seq matched-commands)
                (if (= key-code 9)      ;tab
                  (do
                    (util/stop e)
                    (append-command! input-id (last (first matched-commands))))
                  (do
                    (reset! *matched-commands matched-commands)
                    (reset! *show-commands true)))
                (reset! *show-commands false)))))))))
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
  (let [value (state/sub :edit-content)
        show-commands? (rum/react *show-commands)]
    [:div.editor.flex-1 {:style {:position "relative"}}
     (ui/textarea
      {:id id
       :on-change (fn [e]
                    (state/set-edit-content! (util/evalue e)))
       :value value
       :auto-focus true
       :style {:border "none"
               :border-radius 0
               :background "transparent"
               :padding 0}})
     (when show-commands?
       (ui/css-transition
        {:class-names "fade"
         :timeout {:enter 500
                   :exit 300}}
        (commands id)))]))
