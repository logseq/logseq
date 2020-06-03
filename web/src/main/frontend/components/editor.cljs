(ns frontend.components.editor
  (:require [rum.core :as rum]
            [frontend.handler :as handler]
            [frontend.util :as util]
            [frontend.date :as date]
            [frontend.state :as state]
            [frontend.mixins :as mixins]
            [frontend.image :as image]
            [frontend.ui :as ui]
            [frontend.db :as db]
            [frontend.config :as config]
            [dommy.core :as d]
            [goog.object :as gobj]
            [goog.dom :as gdom]
            [clojure.string :as string]
            [frontend.commands :as commands
             :refer [*show-commands
                     *matched-commands
                     *slash-caret-pos]]
            [medley.core :as medley]
            [cljs-time.core :as t]
            [cljs-time.coerce :as tc]
            [cljs-drag-n-drop.core :as dnd]
            [frontend.search :as search]))

;; TODO: refactor the state, it is already too complex.
(defonce *should-delete? (atom false))
(defonce *last-edit-heading (atom nil))

;; FIXME: should support multiple images concurrently uploading
(defonce *image-uploading? (atom false))
(defonce *image-uploading-process (atom 0))

(defn set-last-edit-heading!
  [id value]
  (reset! *last-edit-heading [id value]))

(defn- insert-command!
  [id command-output format {:keys [restore?]
                             :or {restore? true}
                             :as option}]
  (cond
    ;; replace string
    (string? command-output)
    (commands/insert! id command-output option)

    ;; steps
    (vector? command-output)
    (commands/handle-steps command-output format)

    :else
    nil)

  (when restore?
    (commands/restore-state restore?)))

(def autopair-map
  {"[" "]"
   "{" "}"
   "(" ")"})

(def reversed-autopair-map
  (zipmap (vals autopair-map)
          (keys autopair-map)))

(defn- autopair
  [input-id prefix format {:keys [restore?]
                           :or {restore? true}
                           :as option}]
  (let [value (get autopair-map prefix)
        value (str prefix value)
        input (gdom/getElement input-id)]
    (when value
      (let [[prefix pos] (commands/simple-insert! input-id value
                                            {:backward-pos 1
                                             :check-fn (fn [new-value prefix-pos]
                                                         (when (>= prefix-pos 0)
                                                           [(subs new-value prefix-pos (+ prefix-pos 2))
                                                            (+ prefix-pos 2)]))})]
        (case prefix
          "[["
          (do
            (commands/handle-step [:editor/search-page])
            (reset! commands/*slash-caret-pos (util/get-caret-pos input)))

          "(("
          (do
            (commands/handle-step [:editor/search-block])
            (reset! commands/*slash-caret-pos (util/get-caret-pos input)))

          nil))
      )))

(defn- upload-image
  [id files format uploading? drop?]
  (image/upload
   files
   (fn [file file-name file-type]
     (handler/request-presigned-url
      file file-name file-type
      uploading?
      (fn [signed-url]
        (insert-command! id
                         (util/format "[[%s][%s]]"
                                      signed-url
                                      file-name)
                         format
                         {:last-pattern (if drop? "" "/")})

        (reset! *image-uploading-process 0))
      (fn [e]
        (let [process (* (/ (gobj/get e "loaded")
                            (gobj/get e "total"))
                         100)]
          (reset! *image-uploading-process process)))))))

(defn with-levels
  [text format level]
  (let [pattern (config/get-heading-pattern format)]
    (str (apply str (repeat level pattern))
         " "
         (string/triml text))))

(rum/defc commands < rum/reactive
  [id format]
  (when (and (util/react *show-commands)
             @*slash-caret-pos
             (not (state/sub :editor/show-page-search?))
             (not (state/sub :editor/show-input))
             (not (state/sub :editor/show-date-picker?)))
    (let [matched (util/react *matched-commands)]
      (ui/auto-complete
       (map first matched)
       {:on-chosen (fn [chosen]
                     (let [restore-slash? (not (contains? #{"Page Reference"
                                                            "Link"
                                                            "Image Link"
                                                            "Date Picker"} chosen))]
                       (insert-command! id (get (into {} matched) chosen)
                                        format
                                        {:restore? restore-slash?})))
        :class "black"}))))

(defn get-matched-pages
  [q]
  (let [pages (db/get-pages (state/get-current-repo))]
    (filter
     (fn [page]
       (string/index-of
        (string/lower-case page)
        (string/lower-case q)))
     pages)))

(defn get-previous-input-char
  [input]
  (when-let [pos (:pos (util/get-caret-pos input))]
    (let [value (gobj/get input "value")]
      (when (and (>= (count value) pos)
                 (>= pos 1))
        (nth value (- pos 1))))))

(rum/defc page-search < rum/reactive
  [id format]
  (when (state/sub :editor/show-page-search?)
    (let [pos (:editor/last-saved-cursor @state/state)
          input (gdom/getElement id)]
      (when input
        (let [current-pos (:pos (util/get-caret-pos input))
              edit-content (state/sub [:editor/content id])
              q (when (> (count edit-content)
                         (+ current-pos))
                  (subs edit-content pos current-pos))
              matched-pages (when-not (string/blank? q)
                              (map util/capitalize-all (get-matched-pages q)))
              chosen-handler (fn [chosen _click?]
                               (state/set-editor-show-page-search false)
                               (insert-command! id
                                                (util/format "[[%s]]" chosen)
                                                format
                                                {:last-pattern (str "[[" q)
                                                 :postfix-fn (fn [s] (util/replace-first "]]" s ""))}))
              non-exist-page-handler (fn [_state]
                                       (state/set-editor-show-page-search false)
                                       (util/cursor-move-forward input 2))]
          (ui/auto-complete
           matched-pages
           {:on-chosen chosen-handler
            :on-enter non-exist-page-handler
            :empty-div [:div.text-gray-500.pl-4.pr-4 "Search for a page"]
            :class "black"}))))))

(defn get-matched-blocks
  [q]
  (search/search q 5))

(rum/defc block-search < rum/reactive
  [id format]
  (when (state/sub :editor/show-block-search?)
    (let [pos (:editor/last-saved-cursor @state/state)
          input (gdom/getElement id)]
      (when input
        (let [current-pos (:pos (util/get-caret-pos input))
              edit-content (state/sub [:editor/content id])
              q (when (> (count edit-content)
                         (+ current-pos))
                  (subs edit-content pos current-pos))
              matched-blocks (when-not (string/blank? q)
                               (get-matched-blocks q))
              chosen-handler (fn [chosen _click?]
                               (state/set-editor-show-block-search false)
                               (let [uuid-string (str (:heading/uuid chosen))]
                                 (insert-command! id
                                                  (util/format "((%s))" uuid-string)
                                                  format
                                                  {:last-pattern (str "((" q)
                                                   :postfix-fn (fn [s] (util/replace-first "))" s ""))})
                                 ;; Save it so it'll be remembered when next time it got parsing
                                 (handler/set-heading-property! (:heading/uuid chosen)
                                                                "CUSTOM_ID"
                                                                uuid-string)))
              non-exist-block-handler (fn [_state]
                                        (state/set-editor-show-block-search false)
                                        (util/cursor-move-forward input 2))]
          (ui/auto-complete
           matched-blocks
           {:on-chosen chosen-handler
            :on-enter non-exist-block-handler
            :empty-div [:div.text-gray-500.pl-4.pr-4 "Search for a block"]
            :item-render (fn [{:heading/keys [content]}]
                           (subs content 0 64))
            :class "black"}))))))

(rum/defc date-picker < rum/reactive
  [id format]
  (when (state/sub :editor/show-date-picker?)
    (ui/datepicker
     (t/today)
     {:on-change
      (fn [e date]
        (util/stop e)
        (let [date (t/to-default-time-zone date)
              journal (date/journal-name date)]
          ;; similar to page reference
          (insert-command! id
                           (util/format "[[%s]]" journal)
                           format
                           nil)
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
    (let [{:keys [pos]} (util/react *slash-caret-pos)
          input-value (get state ::input-value)]
      (when (seq input-option)
        [:div.p-2.mt-2.rounded-md.shadow-sm.bg-base-2
         (for [{:keys [id] :as input-item} input-option]
           [:input.form-input.block.w-full.pl-2.sm:text-sm.sm:leading-5.mb-2
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
           :on-click
           (fn [e]
             (util/stop e)
             (on-submit @input-value pos)))]))))

;; TODO: refactor
(defn get-state
  [state]
  (let [[content {:keys [on-hide heading heading-id heading-parent-id dummy? format]} id] (:rum/args state)
        node (gdom/getElement id)
        value (gobj/get node "value")
        pos (gobj/get node "selectionStart")]
    {:on-hide on-hide
     :content content
     :dummy? dummy?
     :format format
     :id id
     :heading heading
     :heading-id heading-id
     :heading-parent-id heading-parent-id
     :node node
     :value value
     :pos pos}))

(defn on-up-down
  [state e up?]
  (let [{:keys [id heading-id heading heading-parent-id dummy? value pos format]} (get-state state)
        element (gdom/getElement id)
        line-height (util/get-textarea-line-height element)]
    (when (and heading-id
               (or (and up? (util/textarea-cursor-first-row? element line-height))
                   (and (not up?) (util/textarea-cursor-end-row? element line-height))))
      (util/stop e)
      (let [f (if up? gdom/getPreviousElementSibling gdom/getNextElementSibling)
            sibling-heading (f (gdom/getElement heading-parent-id))]
        (when sibling-heading
          (when-let [sibling-heading-id (d/attr sibling-heading "headingid")]
            (handler/edit-heading! (uuid sibling-heading-id) pos format)))))))

(defn on-backspace
  [state e]
  (let [{:keys [id heading-id heading-parent-id dummy? value  pos format]} (get-state state)]
    (when (and heading-id (= value ""))
      (if @*should-delete?
        (do
          (util/stop e)
          ;; delete heading, edit previous heading
          (let [heading (db/pull [:heading/uuid heading-id])
                heading-parent (gdom/getElement heading-parent-id)
                sibling-heading (gdom/getPreviousElementSibling heading-parent)]
            (handler/delete-heading! heading dummy?)
            (when sibling-heading
              (when-let [sibling-heading-id (d/attr sibling-heading "headingid")]
                (handler/edit-heading! (uuid sibling-heading-id) :max format)))))
        (reset! *should-delete? true)))))

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
      (state/get-editor-show-block-search)
      (state/get-editor-show-date-picker)))

(rum/defc absolute-modal < rum/reactive
  [cp set-default-width?]
  (let [{:keys [top left pos]} (util/react *slash-caret-pos)]
    [:div.absolute.rounded-md.shadow-lg
     {:style (merge
              {:top (+ top 24)
               :left left
               :max-height 600
               :z-index 11}
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

(rum/defc image-uploader < rum/reactive
  [id format]
  [:<>
   [:input
    {:id "upload-file"
     :type "file"
     :on-change (fn [e]
                  (let [files (.-files (.-target e))]
                    (upload-image id files format *image-uploading? false)))
     :hidden true}]
   (when-let [uploading? (util/react *image-uploading?)]
     (let [processing (util/react *image-uploading-process)]
       (transition-cp
        [:div.flex.flex-row.align-center.rounded-md.shadow-sm.bg-base-2.pl-1.pr-1
         [:span.lds-dual-ring.mr-2]
         [:span {:style {:margin-top 2}}
          (util/format "Uploading %s%" (util/format "%2d" processing))]])))])

(defn- clear-when-saved!
  []
  (state/set-editor-show-input nil)
  (state/set-editor-show-date-picker false)
  (state/set-editor-show-page-search false)
  (state/set-editor-show-block-search false)
  (reset! *slash-caret-pos nil)
  (reset! *show-commands false)
  (reset! *matched-commands (commands/commands-map)))

(defn- insert-new-heading!
  [state]
  (let [{:keys [heading value format]} (get-state state)
        heading-id (:heading/uuid heading)
        heading (try
                  (db/pull [:heading/uuid heading-id])
                  (catch js/Error e     ; dummy heading
                    heading))]
    (set-last-edit-heading! (:heading/uuid heading) value)
    ;; save the current heading and insert a new heading
    (let [value-with-levels (with-levels value format (:heading/level heading))
          [_first-heading last-heading _new-heading-content] (handler/insert-new-heading! heading value-with-levels)
          last-id (:heading/uuid last-heading)]
      (handler/edit-heading! last-id :max format)
      (clear-when-saved!))))

(defn get-previous-heading-level
  [current-id]
  (when-let [input (gdom/getElement current-id)]
    (when-let [prev-heading (gdom/getPreviousElementSibling input)]
      (util/parse-int (d/attr prev-heading "level")))))

(defn- adjust-heading-level!
  [state direction]
  (let [{:keys [heading heading-parent-id value]} (get-state state)
        format (:heading/format heading)
        heading-pattern (config/get-heading-pattern format)
        level (:heading/level heading)
        previous-level (or (get-previous-heading-level heading-parent-id) 1)
        [add? remove?] (case direction
                         :left [false true]
                         :right [true false]
                         [(<= level previous-level)
                          (and (> level previous-level)
                               (> level 2))])
        final-level (cond
                      add? (inc level)
                      remove? (if (> level 2)
                                (dec level)
                                level)
                      :else level)
        new-value (with-levels value format final-level)]
    (set-last-edit-heading! (:heading/uuid heading) value)
    (handler/save-heading-if-changed! heading new-value)))

(defn- get-input
  [state]
  (when-let [input-id (last (:rum/args state))]
    (gdom/getElement input-id)))

(defn edit-heading?
  [state]
  (some? (:heading (nth (:rum/args state) 1))))

(rum/defc box < rum/reactive
  ;; TODO: Overwritten by user's configuration
  (mixins/keyboard-mixin "alt+enter" insert-new-heading! edit-heading? get-input)
  (mixins/keyboard-mixin "alt+shift+left" #(adjust-heading-level! % :left) edit-heading? get-input)
  (mixins/keyboard-mixin "alt+shift+right" #(adjust-heading-level! % :right) edit-heading? get-input)
  (mixins/event-mixin
   (fn [state]
     (let [{:keys [id format]} (get-state state)
           input-id id
           input (gdom/getElement input-id)]
       (let [{:keys [format heading]} (get-state state)]
         (mixins/hide-when-esc-or-outside
          state
          :on-hide
          (fn [state]
            (let [{:keys [on-hide format value heading id]} (get-state state)
                  current-edit-id (state/get-edit-input-id)]
              (if (and heading (= current-edit-id id))
                (do
                  (state/set-edit-input-id! nil)
                  (state/set-edit-heading! nil))
                (when on-hide           ;might be raw file editing

                  (on-hide value)
                  (state/set-edit-input-id! nil)))))))
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
                   value (gobj/get node "value")
                   deleted (and (> current-pos 0)
                                (nth value (dec current-pos)))]
               (cond
                 (and (> current-pos 1)
                      (= (nth value (dec current-pos)) "/"))
                 (do
                   (reset! *slash-caret-pos nil)
                   (reset! *show-commands false))

                 ;; pair
                 (and
                  deleted
                  (contains?
                   (set (keys autopair-map))
                   deleted)
                  (>= (count value) (inc current-pos))
                  (= (nth value current-pos)
                     (get autopair-map deleted)))
                 (do
                   (util/stop e)
                   (commands/delete-pair! id)
                   (reset! *should-delete? false))

                 :else
                 nil)))
         ;; tab
         9 (fn [state e]
             (when-not (state/get-editor-show-input)
               (util/stop e)
               (adjust-heading-level! state nil)))

         ;; autopairs
         ;; [ && { (shift+219)
         219 (fn [state e]
               (util/stop e)
               (autopair input-id (gobj/get e "key") format nil))
         ;; (
         57 (fn [state e]
              (util/stop e)
              (autopair input-id "(" format nil))
         }
        (fn [e key-code]
          (let [key (gobj/get e "key")]
            (when (and
                   (contains? (set (keys reversed-autopair-map)) key)
                   (or
                    (=
                     (get-previous-input-char input)
                     (get reversed-autopair-map key))
                    (=
                     (get-previous-input-char input)
                     key)))
              (util/stop e)
              (util/cursor-move-forward input 1)))
          ;; (swap! state/state assoc
          ;;        :editor/last-saved-cursor nil)
          ))
       (mixins/on-key-up
        state
        {
         ;; /
         191 (fn [state e]
               (when-let [matched-commands (seq (get-matched-commands input))]
                 (reset! *slash-caret-pos (util/get-caret-pos input))
                 (reset! *show-commands true)))

         ;; backspace
         8 on-backspace}
        (fn [e key-code]
          (let [format (:format (get-state state))]
            (when (not= key-code 191)     ; not /
              (let [matched-commands (get-matched-commands input)]
                (if (seq matched-commands)
                  (do
                    (cond
                      (= key-code 9)      ;tab
                      (when @*show-commands
                        (util/stop e)
                        (insert-command! input-id
                                         (last (first matched-commands))
                                         format
                                         nil))

                      :else
                      (reset! *matched-commands matched-commands)))
                  (reset! *show-commands false)
                  )))))))))
  {:after (fn [state _props]
            (let [[content {:keys [dummy? heading heading-id]} id] (:rum/args state)]
              (reset! *should-delete? false))
            state)
   :did-mount (fn [state]
                (let [[content {:keys [heading format dummy? format]} id] (:rum/args state)]
                  (let [content (handler/remove-level-spaces content format)]
                    (state/set-edit-content! id (string/trim (or content "")) true)
                    (handler/restore-cursor-pos! id content dummy?))
                  (when-let [input (gdom/getElement id)]
                    (dnd/subscribe!
                     input
                     :upload-images
                     {:drop (fn [e files]
                              (upload-image id files format *image-uploading? true))})))
                state)
   :will-unmount (fn [state]
                   (let [{:keys [id value format heading]} (get-state state)]
                     (when-let [input (gdom/getElement id)]
                       (dnd/unsubscribe!
                        input
                        :upload-images))
                     (when heading
                       (let [new-value (with-levels
                                         value
                                         format
                                         (:heading/level heading))]
                         (cond
                           @*should-delete?
                           (reset! *should-delete? false)

                           :else
                           (let [cache [(:heading/uuid heading) value]]
                             (when (not= @*last-edit-heading cache)
                               (when-not (string/blank? value)
                                 (when (not= (string/trim new-value)
                                             (string/trim (:heading/content heading)))
                                   (handler/save-heading-if-changed! heading new-value))
                                 (reset! *last-edit-heading cache)))))))
                     (clear-when-saved!))
                   state)}
  [content {:keys [on-hide dummy? node format heading]
            :or {dummy? false}
            :as option} id]
  [:div.editor {:style {:position "relative"
                        :display "flex"
                        :flex "1 1 0%"}
                :class (if heading "heading-editor" "non-heading-editor")}
   (ui/textarea
    {:id id
     :default-value content
     :on-change (fn [e]
                  (let [value (util/evalue e)]
                    (state/set-edit-content! id value false)
                    (reset! *should-delete? false)))
     :auto-focus true})
   (transition-cp
    (commands id format)
    true)

   (transition-cp
    (page-search id format)
    true)

   (transition-cp
    (block-search id format)
    true)

   (transition-cp
    (date-picker id format)
    false)

   (transition-cp
    (input id
           (fn [{:keys [link label]} pos]
             (if (and (string/blank? link)
                      (string/blank? label))
               nil
               (insert-command! id
                                (util/format "[[%s][%s]]"
                                             (or link "")
                                             (or label ""))
                                format
                                {:last-pattern "/link"}))
             (state/set-editor-show-input nil)
             (when-let [saved-cursor (get @state/state :editor/last-saved-cursor)]
               (when-let [input (gdom/getElement id)]
                 (.focus input)
                 (util/move-cursor-to input saved-cursor)))))
    true)

   (when format
     (image-uploader id format))])
