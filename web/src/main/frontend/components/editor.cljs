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
(def *matched-commands (atom nil))
(defonce *slash-caret-pos (atom nil))

(defn- append-command!
  [id command-output]
  (cond
    ;; replace string
    (string? command-output)
    (handler/append-command! command-output)

    ;; steps
    (vector? command-output)
    (commands/handle-steps command-output)

    :else
    nil)

  (.focus (gdom/getElement id))
  (reset! *show-commands false)
  (reset! *matched-commands commands/commands-map))

(rum/defc commands < rum/reactive
  {:will-mount (fn [state]
                 (reset! *matched-commands commands/commands-map)
                 state)}
  [id]
  (when (rum/react *show-commands)
    (let [{:keys [top left]} (rum/react *slash-caret-pos)
          matched (rum/react *matched-commands)]
      (ui/auto-complete
       (map first matched)
       (fn [chosen]
         (append-command! id (get (into {} matched) chosen)))
       {:style {:top (+ top 20)
                :left left
                :width 400}}))))

(rum/defc page-search < rum/reactive
  [id]
  (when (state/sub :editor/show-page-search?)
    (let [{:keys [top left pos]} (rum/react *slash-caret-pos)
          current-pos (:pos (util/get-caret-pos (gdom/getElement id)))
          edit-content (state/sub :edit-content)
          q (subs edit-content (inc pos) current-pos)
          matched-pages (when-not (string/blank? q)
                          (let [pages (db/get-pages (state/get-current-repo))]
                            (filter
                             (fn [page]
                               (string/index-of
                                (string/lower-case page)
                                (string/lower-case q)))
                             pages)))]
      (ui/auto-complete
       matched-pages
       (fn [chosen]
         (let [new-value (util/format "%s [[%s%s"
                                      (subs edit-content 0 (max 0 (dec (dec pos))))
                                      chosen
                                      (subs edit-content current-pos))]
           (handler/editor-set-new-value! new-value))
         (state/set-editor-show-page-search false))
       {:style {:top (+ top 20)
                :left left
                :width 400}}
       :empty-div [:div.text-gray-500.pl-4.pr-4 "Search for a page"]))))

(rum/defcs input < rum/reactive
  (rum/local {} ::input-value)
  {:did-remount
   (fn [old state]
     (when-let [show-input (state/get-editor-show-input)]
       (let [id (str "modal-input-"
                     (name (:id (first show-input))))
             first-input (gdom/getElement id)]
         (.focus first-input)))
     state)}
  (mixins/event-mixin
   (fn [state]
     (mixins/on-enter
      state
      :on-enter (fn [e]
                  (util/stop e)
                  (when-let [input-value (get state ::input-value)]
                    (let [[id on-submit] (:rum/args state)
                          {:keys [pos]} @*slash-caret-pos]
                      (on-submit @input-value pos)
                      (.focus (gdom/getElement id))))))))
  [state id on-submit]
  (let [input-option (state/sub :editor/show-input)]
    (when input-option
      (let [{:keys [top left pos]} (rum/react *slash-caret-pos)
            input-value (get state ::input-value)]
        [:div.absolute.rounded-md.shadow-lg
         {:style {:top (+ top 20)
                  :left left
                  :width 400}}
         (when (seq input-option)
           [:div.p-2.mt-2.mb-2.rounded-md.shadow-sm {:style {:background "#d3d3d3"}},
            (for [{:keys [id] :as input-item} input-option]
              [:input.form-input.block.w-full.pl-2.sm:text-sm.sm:leading-5.mb-1
               (merge
                {:key (str "modal-input-" (name id))
                 :id (str "modal-input-" (name id))
                 :on-change (fn [e]
                              (swap! input-value assoc id (util/evalue e)))
                 :auto-complete "off"}
                (dissoc input-item :id))])
            (ui/button
              "Submit"
              (fn [e]
                (util/stop e)
                (prn "on submit from submit button")
                (on-submit @input-value pos)))])]))))

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
          (or
           (and
            (>= (count edit-content) 2)
            (contains? #{" " "\r" "\n" "\t"} (nth edit-content (- (count edit-content) 2))))
           (= edit-content "/"))
          commands/commands-map)
     (and last-command
          (commands/get-matched-commands last-command)))))

(defn in-auto-complete?
  [input]
  (or (seq (get-matched-commands input))
      (state/get-editor-show-page-search)))

(rum/defc transition-cp
  [cp]
  (ui/css-transition
   {:class-names "fade"
    :timeout {:enter 500
              :exit 300}}
   cp))

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
              (when-not (in-auto-complete? input)
                (on-up-down state e true)))
         ;; down
         40 (fn [state e]
              (when-not (in-auto-complete? input)
                (on-up-down state e false)))

         ;; backspace
         8 (fn [state e] (on-backspace state e))}
        nil)
       (mixins/on-key-up
        state
        {191 (fn [state e]
               (when-let [matched-commands (seq (get-matched-commands input))]
                 (reset! *show-commands true)
                 (reset! *slash-caret-pos (util/get-caret-pos input))))}
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
    [:div.editor {:style {:position "relative"
                          :display "flex"
                          :flex "1 1 0%"}}
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
     (transition-cp
      (commands id))

     (transition-cp
      (page-search id))

     (transition-cp
      (input id
             (fn [{:keys [link label]} pos]
               (when-not (and (string/blank? link)
                              (string/blank? label))
                 (let [new-value (util/format "%s [[%s][%s]]%s"
                                              (subs value 0 (max 0 (dec (dec pos))))
                                              (or link "")
                                              (or label "")
                                              (subs value (+ pos 5)))]
                   (when-let [editor (gdom/getElement id)]
                     (.focus editor))
                   (handler/editor-set-new-value! new-value)))
               (state/set-editor-show-input nil))))]))
