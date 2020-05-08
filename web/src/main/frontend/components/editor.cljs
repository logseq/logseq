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
            [medley.core :as medley]
            [cljs-time.core :as t]
            [cljs-time.coerce :as tc]
            [cljs-drag-n-drop.core :as dnd]))

(defonce *show-commands (atom false))
(defonce *matched-commands (atom nil))
(defonce *slash-caret-pos (atom nil))

(defn- insert-command!
  [id command-output]
  (cond
    ;; replace string
    (string? command-output)
    (commands/insert! id command-output *slash-caret-pos *show-commands *matched-commands)

    ;; steps
    (vector? command-output)
    (commands/handle-steps command-output *show-commands *matched-commands)

    :else
    nil))

(rum/defc commands < rum/reactive
  {:will-mount (fn [state]
                 (reset! *matched-commands (commands/commands-map))
                 state)}
  [id]
  (when (rum/react *show-commands)
    (let [matched (rum/react *matched-commands)]
      (ui/auto-complete
       (map first matched)
       (fn [chosen]
         (insert-command! id (get (into {} matched) chosen)))))))

(rum/defc page-search < rum/reactive
  [id]
  (when (state/sub :editor/show-page-search?)
    (let [{:keys [pos]} (rum/react *slash-caret-pos)
          input (gdom/getElement id)
          current-pos (:pos (util/get-caret-pos input))
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
       (fn [chosen click?]
         (commands/insert! id (str "[[" chosen)
                           *slash-caret-pos
                           *show-commands
                           *matched-commands
                           :last-pattern "[["
                           :forward-pos 2)
         (state/set-editor-show-page-search false))
       :empty-div [:div.text-gray-500.pl-4.pr-4 "Search for a page"]))))

(rum/defc date-picker < rum/reactive
  [id]
  (when (state/sub :editor/show-date-picker?)
    (ui/datepicker
     (t/today)
     {:on-change
      (fn [e date]
        (util/stop e)
        (let [journal (util/journal-name (tc/to-date date))]
          ;; similar to page reference
          (commands/insert! id (str "[[" journal)
                            *slash-caret-pos
                            *show-commands
                            *matched-commands
                            :last-pattern "[["
                            :forward-pos 2)
          (state/set-editor-show-date-picker false)))})))

(rum/defcs input < rum/reactive
  (rum/local {} ::input-value)
  (mixins/event-mixin
   (fn [state]
     (mixins/on-key-down
      state
      {
       ;; enter
       13 (fn [state e]
            (let [input-value (get state ::input-value)]
              (when (seq @input-value)
                ;; no new line input
                (util/stop e)
                (let [[_id on-submit] (:rum/args state)
                      {:keys [pos]} @*slash-caret-pos]
                  (on-submit @input-value pos))
                (reset! input-value nil))))}
      nil)))
  {:did-update
   (fn [state]
     (when-let [show-input (state/get-editor-show-input)]
       (let [id (str "modal-input-"
                     (name (:id (first show-input))))
             first-input (gdom/getElement id)]
         (when (and first-input
                    (not (d/has-class? first-input "focused")))
           (.focus first-input)
           (d/add-class! first-input "focused"))))
     state)}
  [state id on-submit]
  (when-let [input-option (state/sub :editor/show-input)]
    (let [{:keys [pos]} (rum/react *slash-caret-pos)
          input-value (get state ::input-value)]
      (when (seq input-option)
        [:div.p-2.mt-2.mb-2.rounded-md.shadow-sm {:style {:background "#d3d3d3"}},
         (for [{:keys [id] :as input-item} input-option]
           [:input.form-input.block.w-full.pl-2.sm:text-sm.sm:leading-5.mb-1
            (merge
             {:key (str "modal-input-" (name id))
              :id (str "modal-input-" (name id))
              :value (get @input-value id "")
              :on-change (fn [e]
                           (swap! input-value assoc id (util/evalue e)))
              :auto-complete "off"}
             (dissoc input-item :id))])
         (ui/button
           "Submit"
           (fn [e]
             (util/stop e)
             (on-submit @input-value pos)))]))))

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
            ;;   (handler/save-heading-if-changed! heading value))
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
  (try
    (let [edit-content (gobj/get input "value")
          pos (:pos (util/get-caret-pos input))
          last-command (subs edit-content
                             (:pos @*slash-caret-pos)
                             pos)]
      (when (> pos 0)
        (or
         (and (= \/ (nth edit-content (dec pos)))
              ;; (or
              ;;  (and
              ;;   (>= (count edit-content) 2)
              ;;   (contains? #{" " "\r" "\n" "\t"} (nth edit-content (- (count edit-content) 2))))
              ;;  (= edit-content "/"))
              (commands/commands-map))
         (and last-command
              (commands/get-matched-commands last-command)))))
    (catch js/Error e
      nil)))

(defn in-auto-complete?
  [input]
  (or (seq (get-matched-commands input))
      (state/get-editor-show-page-search)
      (state/get-editor-show-date-picker)))

(rum/defc absolute-modal < rum/reactive
  [cp set-default-width?]
  (let [{:keys [top left pos]} (rum/react *slash-caret-pos)]
    [:div.absolute.rounded-md.shadow-lg
     {:style (merge
              {:top (+ top 20)
               :left left}
              (if set-default-width?
                {:width 400}))}
     cp]))

(rum/defc transition-cp
  [cp set-default-width?]
  (ui/css-transition
   {:class-names "fade"
    :timeout {:enter 500
              :exit 300}}
   (absolute-modal cp set-default-width?)))

(rum/defc box < rum/reactive
  (mixins/event-mixin
   (fn [state]
     (let [input-id (last (:rum/args state))
           input (gdom/getElement input-id)]
       (mixins/hide-when-esc-or-outside
        state
        :on-hide (fn []
                   (let [{:keys [value on-hide]} (get-state state)]
                     (on-hide value)
                     (state/set-editor-show-input nil)
                     (state/set-editor-show-date-picker false)
                     (state/set-editor-show-page-search false)
                     (state/set-edit-input-id! nil)
                     (reset! *slash-caret-pos nil)
                     (reset! *show-commands false)
                     (reset! *matched-commands (commands/commands-map)))))
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
         8 (fn [state e]
             (let [node (gdom/getElement input-id)
                   current-pos (:pos (util/get-caret-pos node))
                   value (gobj/get node "value")]
               (when (and (> current-pos 1)
                          (= (nth value (dec current-pos)) "/"))
                 (reset! *slash-caret-pos nil)
                 (reset! *show-commands false))))
         }
        (fn [e key-code]
          (swap! state/state assoc
                 :editor/last-saved-cursor nil)))
       (mixins/on-key-up
        state
        {
         ;; /
         191 (fn [state e]
               (when-let [matched-commands (seq (get-matched-commands input))]
                 (reset! *show-commands true)
                 (reset! *slash-caret-pos (util/get-caret-pos input))))
         ;; backspace
         8 on-backspace}
        (fn [e key-code]
          (when (not= key-code 191)     ; not /
            (let [matched-commands (get-matched-commands input)]
              (if (seq matched-commands)
                (if (= key-code 9)      ;tab
                  (do
                    (util/stop e)
                    (insert-command! input-id (last (first matched-commands))))
                  (do
                    (reset! *matched-commands matched-commands)
                    (reset! *show-commands true)))
                (reset! *show-commands false)))))))))
  {:init (fn [state _props]
           (let [[content {:keys [dummy?]}] (:rum/args state)]
             (state/set-edit-content!
              (if dummy?
                (string/triml content)
                (string/trim content)))
             (swap! state/state assoc
                    :editor/last-saved-cursor nil))
           state)
   :did-mount (fn [state]
                (let [[content opts id] (:rum/args state)]
                  (handler/restore-cursor-pos! id content (:dummy? opts)))
                state)
   :after-render (fn [state]
                   (let [[content opts id] (:rum/args state)]
                     (when-let [input (gdom/getElement id)]
                       (dnd/subscribe!
                        input
                        :upload-images
                        {:drop (fn [e files]
                                 (js/console.dir files)
                                 (handler/upload-image
                                  id files *slash-caret-pos *show-commands *matched-commands true))})))
                   state)
   :will-unmount (fn [state]
                   (let [[content opts id] (:rum/args state)]
                     (when-let [input (gdom/getElement id)]
                       (dnd/unsubscribe!
                        input
                        :upload-images)))
                   state)
   :did-update (fn [state]
                 (when-let [saved-cursor (get @state/state :editor/last-saved-cursor)]
                   (let [[_content _opts id] (:rum/args state)
                         input (gdom/getElement id)]
                     (when input
                       (.focus input)
                       (util/move-cursor-to input saved-cursor))))
                 state)}
  [content {:keys [on-hide dummy? node]
            :or {dummy? false}} id]
  (let [value (state/sub :edit-content)]
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
      (commands id)
      true)

     (transition-cp
      (page-search id)
      true)

     (transition-cp
      (date-picker id)
      false)

     (transition-cp
      (input id
             (fn [{:keys [link label]} pos]
               (when-not (and (string/blank? link)
                              (string/blank? label))
                 (commands/insert! id
                                   (util/format "[[%s][%s]]"
                                                (or link "")
                                                (or label ""))
                                   *slash-caret-pos
                                   *show-commands
                                   *matched-commands
                                   :last-pattern "[["
                                   :postfix-fn (fn [s]
                                                 (util/replace-first "][]]" s ""))))
               (state/set-editor-show-input nil)))
      true)

     [:input
      {:id "upload-file"
       :type "file"
       :on-change (fn [e]
                    (let [files (.-files (.-target e))]
                      (handler/upload-image
                       id files *slash-caret-pos *show-commands *matched-commands false)))
       :hidden true}]]))
