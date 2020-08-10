(ns frontend.components.editor
  (:require [rum.core :as rum]
            [frontend.handler :as handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.image :as image-handler]
            [frontend.util :as util :refer-macros [profile]]
            [promesa.core :as p]
            [frontend.date :as date]
            [frontend.state :as state]
            [frontend.mixins :as mixins]
            [frontend.image :as image]
            [frontend.ui :as ui]
            [frontend.db :as db]
            [frontend.config :as config]
            [frontend.utf8 :as utf8]
            [dommy.core :as d]
            [goog.object :as gobj]
            [goog.dom :as gdom]
            [clojure.string :as string]
            [frontend.commands :as commands
             :refer [*show-commands
                     *matched-commands
                     *slash-caret-pos
                     *angle-bracket-caret-pos
                     *matched-block-commands
                     *show-block-commands]]
            [frontend.format.block :as block]
            [medley.core :as medley]
            [cljs-time.core :as t]
            [cljs-time.coerce :as tc]
            [cljs-drag-n-drop.core :as dnd]
            [frontend.search :as search]
            ["/frontend/utils" :as utils]
            [frontend.extensions.html-parser :as html-parser]))

;; TODO: refactor the state, it is already too complex.
(defonce *last-edit-heading (atom nil))

;; FIXME: should support multiple images concurrently uploading
(defonce *image-uploading? (atom false))
(defonce *image-uploading-process (atom 0))
(defonce *selected-text (atom nil))

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
    (let [restore-slash-caret-pos? (if (= :editor/click-hidden-file-input
                                          (ffirst command-output))
                                     false
                                     true)]
      (commands/restore-state restore-slash-caret-pos?))))

(def autopair-map
  {"[" "]"
   "{" "}"
   "(" ")"
   "$" "$"                              ; math
   "`" "`"
   "~" "~"
   "*" "*"
   "_" "_"
   "^" "^"})

(def reversed-autopair-map
  (zipmap (vals autopair-map)
          (keys autopair-map)))

(defn- autopair
  [input-id prefix format {:keys [restore?]
                           :or {restore? true}
                           :as option}]
  (let [value (get autopair-map prefix)
        selected (util/get-selected-text)
        postfix (str selected value)
        value (str prefix postfix)
        input (gdom/getElement input-id)]
    (when value
      (when-not (string/blank? selected) (reset! *selected-text selected))
      (let [[prefix pos] (commands/simple-replace! input-id value selected
                                                   {:backward-pos (count postfix)
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
            (commands/handle-step [:editor/search-block :reference])
            (reset! commands/*slash-caret-pos (util/get-caret-pos input)))

          nil)))))

(defn surround-by?
  [input before after]
  (when input
    (let [value (gobj/get input "value")
          pos (:pos (util/get-caret-pos input))
          start-pos (- pos (count before))
          end-pos (+ pos (count after))]
      (when (>= (count value) end-pos)
        (= (str before after)
           (subs value start-pos end-pos))))))

(defn- upload-image
  [id files format uploading? drop?]
  (image/upload
   files
   (fn [file file-name file-type]
     (image-handler/request-presigned-url
      file file-name file-type
      uploading?
      (fn [signed-url]
        (insert-command! id
                         (util/format "[[%s][%s]]"
                                      signed-url
                                      file-name)
                         format
                         {:last-pattern (if drop? "" commands/slash)
                          :restore? false})

        (reset! *image-uploading-process 0))
      (fn [e]
        (let [process (* (/ (gobj/get e "loaded")
                            (gobj/get e "total"))
                         100)]
          (reset! *image-uploading-process process)))))))

(rum/defc commands < rum/reactive
  [id format]
  (when (and (util/react *show-commands)
             @*slash-caret-pos
             (not (state/sub :editor/show-page-search?))
             (not (state/sub :editor/show-block-search?))
             (not (state/sub :editor/show-input))
             (not (state/sub :editor/show-date-picker?)))
    (let [matched (util/react *matched-commands)]
      (ui/auto-complete
       (map first matched)
       {:on-chosen (fn [chosen]
                     (reset! commands/*current-command chosen)
                     (let [command-steps (get (into {} matched) chosen)
                           restore-slash? (and
                                           (not (contains? (set (map first command-steps)) :editor/input))
                                           (not (contains? #{"Date Picker"} chosen)))]
                       (insert-command! id command-steps
                                        format
                                        {:restore? restore-slash?})))
        :class "black"}))))

(rum/defc block-commands < rum/reactive
  [id format]
  (when (and (util/react *show-block-commands)
             @*angle-bracket-caret-pos)
    (let [matched (util/react *matched-block-commands)]
      (ui/auto-complete
       (map first matched)
       {:on-chosen (fn [chosen]
                     (insert-command! id (get (into {} matched) chosen)
                                      format
                                      {:last-pattern commands/angle-bracket}))
        :class "black"}))))

(defn get-matched-pages
  [q]
  (let [pages (->> (db/get-pages (state/get-current-repo))
                   (remove (fn [p]
                             (= (string/lower-case p)
                                (:page/name (db/get-current-page))))))]
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
        (util/nth-safe value (- pos 1))))))

(defn get-previous-input-chars
  [input length]
  (when-let [pos (:pos (util/get-caret-pos input))]
    (let [value (gobj/get input "value")]
      (when (and (>= (count value) pos)
                 (>= pos 1))
        (subs value (- pos length) pos)))))

(defn get-current-input-char
  [input]
  (when-let [pos (:pos (util/get-caret-pos input))]
    (let [value (gobj/get input "value")]
      (when (and (>= (count value) (inc pos))
                 (>= pos 1))
        (util/nth-safe value pos)))))

(rum/defc page-search < rum/reactive
  {:will-unmount (fn [state] (reset! *selected-text nil) state)}
  [id format]
  (when (state/sub :editor/show-page-search?)
    (let [pos (:editor/last-saved-cursor @state/state)
          input (gdom/getElement id)]
      (when input
        (let [current-pos (:pos (util/get-caret-pos input))
              edit-content (state/sub [:editor/content id])
              q (or
                 @*selected-text
                 (when (> (count edit-content) current-pos)
                   (subs edit-content pos current-pos)))
              matched-pages (when-not (string/blank? q)
                              (get-matched-pages q))
              chosen-handler (fn [chosen _click?]
                               (state/set-editor-show-page-search false)
                               (insert-command! id
                                                (util/format "[[%s]]" chosen)
                                                format
                                                {:last-pattern (str "[[" (if @*selected-text "" q))
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
  ;; remove current block
  (let [current-heading (state/get-edit-heading)]
    (remove
     (fn [h]
       (= (:heading/uuid current-heading)
          (:heading/uuid h)))
     (search/search q 21))))

(rum/defc block-search < rum/reactive
  {:will-unmount (fn [state] (reset! *selected-text nil) state)}
  [id format]
  (when (state/sub :editor/show-block-search?)
    (let [pos (:editor/last-saved-cursor @state/state)
          input (gdom/getElement id)]
      (when input
        (let [current-pos (:pos (util/get-caret-pos input))
              edit-content (state/sub [:editor/content id])
              q (or
                 @*selected-text
                 (when (> (count edit-content) current-pos)
                   (subs edit-content pos current-pos)))
              matched-blocks (when-not (string/blank? q)
                               (get-matched-blocks q))
              chosen-handler (fn [chosen _click?]
                               (state/set-editor-show-block-search false)
                               (let [uuid-string (str (:heading/uuid chosen))]

                                 ;; block reference
                                 (insert-command! id
                                                  (util/format "((%s))" uuid-string)
                                                  format
                                                  {:last-pattern (str "((" (if @*selected-text "" q))
                                                   :postfix-fn (fn [s] (util/replace-first "))" s ""))})

                                 ;; Save it so it'll be parsed correctly in the future
                                 (editor-handler/set-heading-property! (:heading/uuid chosen)
                                                                       "CUSTOM_ID"
                                                                       uuid-string)

                                 (when-let [input (gdom/getElement id)]
                                   (.focus input))))
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
         (for [{:keys [id placeholder type] :as input-item} input-option]
           [:div.my-3
            [:input.form-input.block.w-full.pl-2.sm:text-sm.sm:leading-5
             (merge
              (cond->
                  {:key (str "modal-input-" (name id))
                   :id (str "modal-input-" (name id))
                   :type (or type "text")
                   :on-change (fn [e]
                                (swap! input-value assoc id (util/evalue e)))
                   :auto-complete (if (util/chrome?) "chrome-off" "off")}
                placeholder
                (assoc :placeholder placeholder))
              (dissoc input-item :id))]])
         (ui/button
           "Submit"
           :on-click
           (fn [e]
             (util/stop e)
             (on-submit @input-value pos)))]))))

;; TODO: refactor
(defn get-state
  [state]
  (let [[{:keys [on-hide heading heading-id heading-parent-id dummy? format sidebar?]} id config] (:rum/args state)
        node (gdom/getElement id)
        value (gobj/get node "value")
        pos (gobj/get node "selectionStart")]
    {:config config
     :on-hide on-hide
     :dummy? dummy?
     :sidebar? sidebar?
     :format format
     :id id
     :heading heading
     :heading-id heading-id
     :heading-parent-id heading-parent-id
     :node node
     :value value
     :pos pos}))

(defn- save-heading!
  [{:keys [format heading id repo dummy?] :as state} value]
  (when (or (:db/id (db/entity repo [:heading/uuid (:heading/uuid heading)]))
            dummy?)
    (let [new-value (block/with-levels value format heading)]
      (let [cache [(:heading/uuid heading) value]]
        (when (not= @*last-edit-heading cache)
          (editor-handler/save-heading-if-changed! heading new-value)
          (reset! *last-edit-heading cache))))))

(defn on-up-down
  [state e up?]
  (let [{:keys [id heading-id heading heading-parent-id dummy? value pos format] :as heading-state} (get-state state)]
    (if (gobj/get e "shiftKey")
      (reset! editor-handler/select-start-heading-state heading-state)
      (let [element (gdom/getElement id)
            line-height (util/get-textarea-line-height element)]
        (when (and heading-id
                   (or (and up? (util/textarea-cursor-first-row? element line-height))
                       (and (not up?) (util/textarea-cursor-end-row? element line-height))))
          (util/stop e)
          (let [f (if up? util/get-prev-heading util/get-next-heading)
                sibling-heading (f (gdom/getElement heading-parent-id))]
            (when sibling-heading
              (when-let [sibling-heading-id (d/attr sibling-heading "headingid")]
                (let [state (get-state state)
                      content (:heading/content heading)
                      value (:value state)]
                  (when (not= (string/trim (editor-handler/remove-level-spaces content format))
                              (string/trim value))
                    (save-heading! state (:value state))))
                (editor-handler/edit-heading! (uuid sibling-heading-id) pos format id)))))))))

(defn delete-heading!
  [state repo e]
  (let [{:keys [id heading-id heading-parent-id dummy? value pos format]} (get-state state)]
    (when heading-id
      (do
        (util/stop e)
        ;; delete heading, edit previous heading
        (let [heading (db/pull [:heading/uuid heading-id])
              heading-parent (gdom/getElement heading-parent-id)
              sibling-heading (util/get-prev-heading heading-parent)]
          (editor-handler/delete-heading! heading dummy?)
          (when sibling-heading
            (when-let [sibling-heading-id (d/attr sibling-heading "headingid")]
              (when repo
                (when-let [heading (db/pull repo '[*] [:heading/uuid (uuid sibling-heading-id)])]
                  (let [original-content (util/trim-safe (:heading/content heading))
                        new-value (str original-content value)
                        pos (max
                             (if original-content
                               (utf8/length (utf8/encode (editor-handler/remove-level-spaces original-content format)))
                               0)
                             0)]
                    (editor-handler/save-heading-if-changed! heading new-value)
                    (editor-handler/edit-heading! (uuid sibling-heading-id)
                                                  pos format id)))))))))))

(defn get-matched-commands
  [input]
  (try
    (let [edit-content (gobj/get input "value")
          pos (:pos (util/get-caret-pos input))
          last-slash-caret-pos (:pos @*slash-caret-pos)
          last-command (and last-slash-caret-pos (subs edit-content last-slash-caret-pos pos))]
      (when (> pos 0)
        (or
         (and (= \/ (util/nth-safe edit-content (dec pos)))
              (commands/commands-map))
         (and last-command
              (commands/get-matched-commands last-command)))))
    (catch js/Error e
      nil)))

(defn get-matched-block-commands
  [input]
  (try
    (let [edit-content (gobj/get input "value")
          pos (:pos (util/get-caret-pos input))
          last-command (subs edit-content
                             (:pos @*angle-bracket-caret-pos)
                             pos)]
      (when (> pos 0)
        (or
         (and (= \< (util/nth-safe edit-content (dec pos)))
              (commands/block-commands-map))
         (and last-command
              (commands/get-matched-commands
               last-command
               (commands/block-commands-map))))))
    (catch js/Error e
      nil)))

(defn in-auto-complete?
  [input]
  (or @*show-commands
      @*show-block-commands
      (state/get-editor-show-input)
      (state/get-editor-show-page-search)
      (state/get-editor-show-block-search)
      (state/get-editor-show-date-picker)))

(rum/defc absolute-modal < rum/static
  [cp set-default-width? {:keys [top left]}]
  [:div.absolute.rounded-md.shadow-lg
   {:style (merge
            {:top (+ top 24)
             :left left
             :max-height 600
             :z-index 11}
            (if set-default-width?
              {:width 400}))}
   cp])

(rum/defc transition-cp < rum/reactive
  [cp set-default-width? pos]
  (when pos
    (when-let [pos (rum/react pos)]
      (ui/css-transition
       {:class-names "fade"
        :timeout {:enter 500
                  :exit 300}}
       (absolute-modal cp set-default-width? pos)))))

(rum/defc image-uploader < rum/reactive
  [id format]
  [:div.image-uploader
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
          (util/format "Uploading %s%" (util/format "%2d" processing))]]
        false
        *slash-caret-pos)))])

(defn- clear-when-saved!
  []
  (state/set-editor-show-input nil)
  (state/set-editor-show-date-picker false)
  (state/set-editor-show-page-search false)
  (state/set-editor-show-block-search false)
  (commands/restore-state true))

(defn- insert-new-heading!
  [state]
  (let [{:keys [heading value format id]} (get-state state)
        heading-id (:heading/uuid heading)
        heading (or (db/pull [:heading/uuid heading-id])
                    heading)]
    (set-last-edit-heading! (:heading/uuid heading) value)
    ;; save the current heading and insert a new heading
    (editor-handler/insert-new-heading!
     heading
     value
     true
     (fn [[_first-heading last-heading _new-heading-content]]
       (let [last-id (:heading/uuid last-heading)]
         (editor-handler/edit-heading! last-id 0 format id)
         (clear-when-saved!)))
     false)))

(defn get-previous-heading-level
  [current-id]
  (when-let [input (gdom/getElement current-id)]
    (when-let [prev-heading (util/get-prev-heading input)]
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
        new-value (block/with-levels value format (assoc heading :heading/level final-level))]
    (when (<= (- final-level previous-level) 1)
      (set-last-edit-heading! (:heading/uuid heading) value)
      (editor-handler/save-heading-if-changed! heading new-value (= direction :left)))))

(defn- append-paste-doc!
  [format event]
  (let [[html text] (util/get-clipboard-as-html event)]
    (when-not (string/starts-with? (string/trim text) "http")
      (let [doc-text (html-parser/parse format html)]
        (when-not (string/blank? doc-text)
          (util/stop event)
          (state/append-current-edit-content! doc-text))))))

(rum/defc box < rum/reactive
  (mixins/keyboard-mixin "ctrl+shift+a" editor-handler/select-all-headings!)
  (mixins/event-mixin
   (fn [state]
     (let [{:keys [id format heading]} (get-state state)
           input-id id
           input (gdom/getElement input-id)
           repo (:heading/repo heading)]
       ;; (.addEventListener input "paste" (fn [event]
       ;;                                    (append-paste-doc! format event)))
       (mixins/on-key-down
        state
        {
         ;; enter
         13 (fn [state e]
              (let [{:keys [heading config]} (get-state state)]
                (when (and heading
                           (not (:ref? config))
                           (not (:custom-query? config))) ; in reference section
                  (let [content (state/get-edit-content)]
                    (if (and
                         (not (in-auto-complete? input))
                         (> (:heading/level heading) 2)
                         (string/blank? content))
                      (do
                        (util/stop e)
                        (adjust-heading-level! state :left))
                      (let [shortcut (when-let [v (state/get-shortcut repo :editor/new-heading)]
                                       (string/lower-case (string/trim v)))
                            insert? (cond
                                      config/mobile?
                                      true

                                      (and (= shortcut "alt+enter") (not (gobj/get e "altKey")))
                                      false

                                      (gobj/get e "shiftKey")
                                      false

                                      :else
                                      true)]
                        (when (and
                               insert?
                               (not (in-auto-complete? input)))
                          (profile
                           "Insert heading"
                           (insert-new-heading! state))
                          (util/stop e))))))))
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
                                (util/nth-safe value (dec current-pos)))
                   selected-start (gobj/get node "selectionStart")
                   selected-end (gobj/get node "selectionEnd")]
               (cond

                 (not= selected-start selected-end)
                 nil

                 (zero? current-pos)
                 (delete-heading! state repo e)

                 (and (> current-pos 1)
                      (= (util/nth-safe value (dec current-pos)) commands/slash))
                 (do
                   (reset! *slash-caret-pos nil)
                   (reset! *show-commands false))

                 (and (> current-pos 1)
                      (= (util/nth-safe value (dec current-pos)) commands/angle-bracket))
                 (do
                   (reset! *angle-bracket-caret-pos nil)
                   (reset! *show-block-commands false))

                 ;; pair
                 (and
                  deleted
                  (contains?
                   (set (keys autopair-map))
                   deleted)
                  (>= (count value) (inc current-pos))
                  (= (util/nth-safe value current-pos)
                     (get autopair-map deleted)))

                 (do
                   (util/stop e)
                   (commands/delete-pair! id)
                   (cond
                     (and (= deleted "[") (state/get-editor-show-page-search))
                     (state/set-editor-show-page-search false)

                     (and (= deleted "(") (state/get-editor-show-block-search))
                     (state/set-editor-show-block-search false)

                     :else
                     nil))

                 :else
                 nil)))
         ;; tab
         9 (fn [state e]
             (let [input-id (state/get-edit-input-id)
                   input (and input-id (gdom/getElement id))
                   pos (and input (:pos (util/get-caret-pos input)))]
               (when-not (state/get-editor-show-input)
                 (util/stop e)
                 (let [direction (if (gobj/get e "shiftKey") ; shift+tab move to left
                                   :left
                                   :right)]
                   (p/let [_ (adjust-heading-level! state direction)]
                     (and input pos (js/setTimeout #(when-let [input (gdom/getElement input-id)]
                                                      (util/move-cursor-to input pos))
                                                   0)))))))}
        (fn [e key-code]
          (let [key (gobj/get e "key")]
            (cond
              (surround-by? input "[[" "]]")
              (do
                (commands/handle-step [:editor/search-page])
                (reset! commands/*slash-caret-pos (util/get-caret-pos input)))

              (surround-by? input "((" "))")
              (do
                (commands/handle-step [:editor/search-block :reference])
                (reset! commands/*slash-caret-pos (util/get-caret-pos input)))

              (and
               (contains? (set (keys reversed-autopair-map)) key)
               (= (get-previous-input-chars input 2) (str key key)))
              nil

              (and
               (contains? (set (keys reversed-autopair-map)) key)
               (or
                (= (get-previous-input-char input) key)
                (= (get-current-input-char input) key)))
              (do
                (util/stop e)
                (util/cursor-move-forward input 1))

              (contains? (set (keys autopair-map)) key)
              (do
                (util/stop e)
                (autopair input-id key format nil))

              :else
              nil))))
       (mixins/on-key-up
        state
        {}
        (fn [e key-code]
          (let [k (gobj/get e "key")
                format (:format (get-state state))]
            (when-not (state/get-editor-show-input)
              (when (and @*show-commands (not= key-code 191))     ; not /
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
                        (do
                          (reset! *show-commands true)
                          (reset! *matched-commands matched-commands))))
                    (reset! *show-commands false))))
              (when (and @*show-block-commands (not= key-code 188))     ; not <
                (let [matched-block-commands (get-matched-block-commands input)]
                  (if (seq matched-block-commands)
                    (cond
                      (= key-code 9)      ;tab
                      (when @*show-block-commands
                        (util/stop e)
                        (insert-command! input-id
                                         (last (first matched-block-commands))
                                         format
                                         {:last-pattern commands/angle-bracket}))

                      :else
                      (reset! *matched-block-commands matched-block-commands))
                    (reset! *show-block-commands false)))))))))))
  {:did-mount (fn [state]
                (let [[{:keys [dummy? format heading-parent-id]} id] (:rum/args state)
                      content (get-in @state/state [:editor/content id])]
                  (editor-handler/restore-cursor-pos! id content dummy?)

                  (when-let [input (gdom/getElement id)]
                    (dnd/subscribe!
                     input
                     :upload-images
                     {:drop (fn [e files]
                              (upload-image id files format *image-uploading? true))}))

                  ;; Here we delay this listener, otherwise the click to edit event will trigger a outside click event,
                  ;; which will hide the editor so no way for editing.
                  (js/setTimeout
                   (fn []
                     (mixins/hide-when-esc-or-outside
                      state
                      :on-hide
                      (fn [state e event]
                        (let [{:keys [on-hide format value heading id repo dummy?]} (get-state state)]
                          (when on-hide
                            (on-hide value event))
                          (when
                              (or (= event :esc)
                                  (and (= event :click)
                                       (not (in-auto-complete? (gdom/getElement id)))))
                            (state/clear-edit!))))
                      :node (gdom/getElement id)))
                   100)

                  (when-let [element (gdom/getElement id)]
                    (.focus element)))
                state)
   :will-unmount (fn [state]
                   (let [{:keys [id value format heading repo dummy?]} (get-state state)]
                     (when-let [input (gdom/getElement id)]
                       ;; (.removeEventListener input "paste" (fn [event]
                       ;;                                       (append-paste-doc! format event)))
                       (and input
                            (dnd/unsubscribe!
                             input
                             :upload-images)))
                     (clear-when-saved!)
                     (save-heading! (get-state state) value))
                   state)}
  [{:keys [on-hide dummy? node format heading]
    :or {dummy? false}
    :as option} id config]
  (let [content (state/sub [:editor/content id])]
    [:div.editor {:style {:position "relative"
                          :display "flex"
                          :flex "1 1 0%"}
                  :class (if heading "heading-editor" "non-heading-editor")}
     (ui/textarea
      {:id id
       :value (or content "")
       :on-change (fn [e]
                    (let [value (util/evalue e)
                          current-pos (:pos (util/get-caret-pos (gdom/getElement id)))]
                      (state/set-edit-content! id value)
                      (let [input (gdom/getElement id)
                            last-input-char (util/nth-safe value (dec current-pos))]
                        (case last-input-char
                          "/"
                          (when-let [matched-commands (seq (get-matched-commands input))]
                            (reset! *slash-caret-pos (util/get-caret-pos input))
                            (reset! *show-commands true))
                          "<"
                          (when-let [matched-commands (seq (get-matched-block-commands input))]
                            (reset! *angle-bracket-caret-pos (util/get-caret-pos input))
                            (reset! *show-block-commands true))
                          nil))))
       :auto-focus true})

     (transition-cp
      (commands id format)
      true
      *slash-caret-pos)

     (transition-cp
      (block-commands id format)
      true
      *angle-bracket-caret-pos)

     (transition-cp
      (page-search id format)
      true
      *slash-caret-pos)

     (transition-cp
      (block-search id format)
      true
      *slash-caret-pos)

     (transition-cp
      (date-picker id format)
      false
      *slash-caret-pos)

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
                                  {:last-pattern (str commands/slash "link")}))
               (state/set-editor-show-input nil)
               (when-let [saved-cursor (get @state/state :editor/last-saved-cursor)]
                 (when-let [input (gdom/getElement id)]
                   (.focus input)
                   (util/move-cursor-to input saved-cursor)))))
      true
      *slash-caret-pos)

     (when format
       (image-uploader id format))]))
