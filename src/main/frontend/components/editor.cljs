(ns frontend.components.editor
  (:require [rum.core :as rum]
            [frontend.components.svg :as svg]
            [frontend.config :as config]
            [frontend.handler.editor :as editor-handler :refer [get-state]]
            [frontend.util :as util :refer-macros [profile]]
            [frontend.handler.file :as file]
            [frontend.handler.page :as page-handler]
            [frontend.components.datetime :as datetime-comp]
            [promesa.core :as p]
            [frontend.state :as state]
            [frontend.mixins :as mixins]
            [frontend.ui :as ui]
            [frontend.db :as db]
            [frontend.config :as config]
            [dommy.core :as d]
            [goog.object :as gobj]
            [goog.dom :as gdom]
            [clojure.string :as string]
            [clojure.set :as set]
            [frontend.commands :as commands
             :refer [*show-commands
                     *matched-commands
                     *slash-caret-pos
                     *angle-bracket-caret-pos
                     *matched-block-commands
                     *show-block-commands]]
            [medley.core :as medley]
            [cljs-drag-n-drop.core :as dnd]
            [frontend.text :as text]
            ["/frontend/utils" :as utils]))

(rum/defc commands < rum/reactive
  [id format]
  (when (and (util/react *show-commands)
             @*slash-caret-pos
             (not (state/sub :editor/show-page-search?))
             (not (state/sub :editor/show-block-search?))
             (not (state/sub :editor/show-template-search?))
             (not (state/sub :editor/show-input))
             (not (state/sub :editor/show-date-picker?)))
    (let [matched (util/react *matched-commands)]
      (ui/auto-complete
       (map first matched)
       {:on-chosen (fn [chosen]
                     (reset! commands/*current-command chosen)
                     (let [command-steps (get (into {} matched) chosen)
                           restore-slash? (or
                                           (contains? #{"Today" "Yesterday" "Tomorrow"} chosen)
                                           (and
                                            (not (fn? command-steps))
                                            (not (contains? (set (map first command-steps)) :editor/input))
                                            (not (contains? #{"Date Picker" "Template" "Deadline" "Scheduled" "Upload an image"} chosen))))]
                       (editor-handler/insert-command! id command-steps
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
                     (editor-handler/insert-command! id (get (into {} matched) chosen)
                                                     format
                                                     {:last-pattern commands/angle-bracket}))
        :class "black"}))))

(rum/defc page-search < rum/reactive
  {:will-unmount (fn [state] (reset! editor-handler/*selected-text nil) state)}
  [id format]
  (when (state/sub :editor/show-page-search?)
    (let [pos (:editor/last-saved-cursor @state/state)
          input (gdom/getElement id)]
      (when input
        (let [current-pos (:pos (util/get-caret-pos input))
              edit-content (state/sub [:editor/content id])
              edit-block (state/sub :editor/block)
              q (or
                 @editor-handler/*selected-text
                 (when (state/sub :editor/show-page-search-hashtag?)
                   (util/safe-subs edit-content pos current-pos))
                 (when (> (count edit-content) current-pos)
                   (util/safe-subs edit-content pos current-pos)))
              matched-pages (when-not (string/blank? q)
                              (editor-handler/get-matched-pages q))
              chosen-handler (if (state/sub :editor/show-page-search-hashtag?)
                               (fn [chosen _click?]
                                 (state/set-editor-show-page-search! false)
                                 (let [chosen (if (re-find #"\s+" chosen)
                                                (util/format "[[%s]]" chosen)
                                                chosen)]
                                   (editor-handler/insert-command! id
                                                                   (str "#" chosen)
                                                                   format
                                                                   {:last-pattern (str "#" (if @editor-handler/*selected-text "" q))})))
                               (fn [chosen _click?]
                                 (state/set-editor-show-page-search! false)
                                 (let [page-ref-text (page-handler/get-page-ref-text chosen)]
                                   (editor-handler/insert-command! id
                                                                   page-ref-text
                                                                   format
                                                                   {:last-pattern (str "[[" (if @editor-handler/*selected-text "" q))
                                                                    :postfix-fn (fn [s] (util/replace-first "]]" s ""))}))))
              non-exist-page-handler (fn [_state]
                                       (state/set-editor-show-page-search! false)
                                       (if (state/org-mode-file-link? (state/get-current-repo))
                                         (let [page-ref-text (page-handler/get-page-ref-text q)
                                               value (gobj/get input "value")
                                               old-page-ref (util/format "[[%s]]" q)
                                               new-value (string/replace value
                                                                         old-page-ref
                                                                         page-ref-text)]
                                           (state/set-edit-content! id new-value)
                                           (let [new-pos (+ current-pos
                                                            (- (count page-ref-text)
                                                               (count old-page-ref))
                                                            2)]
                                             (util/move-cursor-to input new-pos)))
                                         (util/cursor-move-forward input 2)))]
          (ui/auto-complete
           matched-pages
           {:on-chosen chosen-handler
            :on-enter non-exist-page-handler
            :empty-div [:div.text-gray-500.pl-4.pr-4 "Search for a page"]
            :class "black"}))))))

(rum/defc block-search < rum/reactive
  {:will-unmount (fn [state] (reset! editor-handler/*selected-text nil) state)}
  [id format]
  (when (state/sub :editor/show-block-search?)
    (let [pos (:editor/last-saved-cursor @state/state)
          input (gdom/getElement id)]
      (when input
        (let [current-pos (:pos (util/get-caret-pos input))
              edit-content (state/sub [:editor/content id])
              q (or
                 @editor-handler/*selected-text
                 (when (> (count edit-content) current-pos)
                   (subs edit-content pos current-pos)))
              matched-blocks (when-not (string/blank? q)
                               (editor-handler/get-matched-blocks q))
              chosen-handler (fn [chosen _click?]
                               (state/set-editor-show-block-search! false)
                               (let [uuid-string (str (:block/uuid chosen))]

                                 ;; block reference
                                 (editor-handler/insert-command! id
                                                                 (util/format "((%s))" uuid-string)
                                                                 format
                                                                 {:last-pattern (str "((" (if @editor-handler/*selected-text "" q))
                                                                  :postfix-fn (fn [s] (util/replace-first "))" s ""))})

                                 ;; Save it so it'll be parsed correctly in the future
                                 (editor-handler/set-block-property! (:block/uuid chosen)
                                                                     "ID"
                                                                     uuid-string)

                                 (when-let [input (gdom/getElement id)]
                                   (.focus input))))
              non-exist-block-handler (fn [_state]
                                        (state/set-editor-show-block-search! false)
                                        (util/cursor-move-forward input 2))]
          (ui/auto-complete
           matched-blocks
           {:on-chosen chosen-handler
            :on-enter non-exist-block-handler
            :empty-div [:div.text-gray-500.pl-4.pr-4 "Search for a block"]
            :item-render (fn [{:block/keys [content]}]
                           (subs content 0 64))
            :class "black"}))))))

(rum/defc template-search < rum/reactive
  {:will-unmount (fn [state] (reset! editor-handler/*selected-text nil) state)}
  [id format]
  (when (state/sub :editor/show-template-search?)
    (let [pos (:editor/last-saved-cursor @state/state)
          input (gdom/getElement id)]
      (when input
        (let [current-pos (:pos (util/get-caret-pos input))
              edit-content (state/sub [:editor/content id])
              edit-block (state/sub :editor/block)
              q (or
                 (when (>= (count edit-content) current-pos)
                   (subs edit-content pos current-pos))
                 "")
              matched-templates (editor-handler/get-matched-templates q)
              chosen-handler (fn [[template db-id] _click?]
                               (if-let [block (db/entity db-id)]
                                 (let [new-level (:block/level edit-block)
                                       template-parent-level (:block/level block)
                                       pattern (config/get-block-pattern format)
                                       content
                                       (db/get-block-full-content
                                        (state/get-current-repo)
                                        (:block/uuid block)
                                        (fn [{:block/keys [level content properties] :as block}]
                                          (let [new-level (+ new-level (- level template-parent-level))
                                                properties' (dissoc (into {} properties) "id" "custom_id" "template")]
                                            (-> content
                                                (string/replace-first (apply str (repeat level pattern))
                                                                      (apply str (repeat new-level pattern)))
                                                text/remove-properties!
                                                (text/rejoin-properties properties')))))
                                       content (if (string/includes? (string/trim edit-content) "\n")
                                                 content
                                                 (text/remove-level-spaces content format))]
                                   (state/set-editor-show-template-search! false)
                                   (editor-handler/insert-command! id
                                                                   content
                                                                   format
                                                                   {})))
                               (when-let [input (gdom/getElement id)]
                                 (.focus input)))
              non-exist-handler (fn [_state]
                                  (state/set-editor-show-template-search! false))]
          (ui/auto-complete
           matched-templates
           {:on-chosen chosen-handler
            :on-enter non-exist-handler
            :empty-div [:div.text-gray-500.pl-4.pr-4 "Search for a template"]
            :item-render (fn [[template _block-db-id]]
                           template)
            :class "black"}))))))

(rum/defc mobile-bar < rum/reactive
  [parent-state parent-id]
  [:div#mobile-editor-toolbar.bg-base-2.fix-ios-fixed-bottom
   [:button.bottom-action
    {:on-click #(editor-handler/adjust-block-level! parent-state :right)}
    svg/indent-block]
   [:button.bottom-action
    {:on-click #(editor-handler/adjust-block-level! parent-state :left)}
    svg/outdent-block]
   [:button.bottom-action
    {:on-click #(editor-handler/move-up-down % true)}
    svg/move-up-block]
   [:button.bottom-action
    {:on-click #(editor-handler/move-up-down % false)}
    svg/move-down-block]
   [:button.bottom-action
    {:on-click #(commands/simple-insert! parent-id "\n" {})}
    svg/multi-line-input]
   [:button.font-extrabold.bottom-action.-mt-1
    {:on-click #(commands/simple-insert! parent-id "[[]]" {:backward-pos 2})}
    "[[]]"]
   [:button.font-extrabold.bottom-action.-mt-1
    {:on-click #(commands/simple-insert! parent-id "(())" {:backward-pos 2})}
    "(())"]])

(rum/defcs input < rum/reactive
  (rum/local {} ::input-value)
  (mixins/event-mixin
   (fn [state]
     (mixins/on-key-down
      state
      {;; enter
       13 (fn [state e]
            (let [input-value (get state ::input-value)
                  input-option (get @state/state :editor/show-input)]
              (when (seq @input-value)
                ;; no new line input
                (util/stop e)
                (let [[_id on-submit] (:rum/args state)
                      {:keys [pos]} @*slash-caret-pos
                      command (:command (first input-option))]
                  (on-submit command @input-value pos))
                (reset! input-value nil))))})))
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
        (let [command (:command (first input-option))]
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
              (on-submit command @input-value pos)))])))))

(rum/defc absolute-modal < rum/static
  [cp set-default-width? {:keys [top left]}]
  [:div.absolute.rounded-md.shadow-lg.absolute-modal
   {:style (merge
            {:top (+ top 24)
             :max-height 600
             :z-index 11}
            (if set-default-width?
              {:width 400})
            (if config/mobile?
              {:left 0}
              {:left left}))}
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
                    (editor-handler/upload-image id files format editor-handler/*image-uploading? false)))
     :hidden true}]
   (when-let [uploading? (util/react editor-handler/*image-uploading?)]
     (let [processing (util/react editor-handler/*image-uploading-process)]
       (transition-cp
        [:div.flex.flex-row.align-center.rounded-md.shadow-sm.bg-base-2.pl-1.pr-1
         [:span.lds-dual-ring.mr-2]
         [:span {:style {:margin-top 2}}
          (util/format "Uploading %s%" (util/format "%2d" processing))]]
        false
        *slash-caret-pos)))])

(rum/defcs box < rum/reactive
  (mixins/event-mixin
   (fn [state]
     (let [{:keys [id format block]} (get-state state)
           input-id id
           input (gdom/getElement input-id)
           repo (:block/repo block)]
       (mixins/on-key-down
        state
        {;; enter
         13 (fn [state e]
              (when (and (not (gobj/get e "ctrlKey"))
                         (not (gobj/get e "metaKey"))
                         (not (editor-handler/in-auto-complete? input)))
                (let [{:keys [block config]} (get-state state)]
                  (when (and block
                             (not (:ref? config))
                             (not (:custom-query? config))) ; in reference section
                    (let [content (state/get-edit-content)]
                      (if (and
                           (> (:block/level block) 2)
                           (string/blank? content))
                        (do
                          (util/stop e)
                          (editor-handler/adjust-block-level! state :left))
                        (let [shortcut (state/get-new-block-shortcut)
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
                                 (not (editor-handler/in-auto-complete? input)))
                            (util/stop e)
                            (profile
                             "Insert block"
                             (editor-handler/insert-new-block! state))))))))))
         ;; up
         38 (fn [state e]
              (when (and
                     (not (gobj/get e "ctrlKey"))
                     (not (gobj/get e "metaKey"))
                     (not (editor-handler/in-auto-complete? input)))
                (editor-handler/on-up-down state e true)))
         ;; down
         40 (fn [state e]
              (when (and
                     (not (gobj/get e "ctrlKey"))
                     (not (gobj/get e "metaKey"))
                     (not (editor-handler/in-auto-complete? input)))
                (editor-handler/on-up-down state e false)))
         ;; backspace
         8  (fn [state e]
              (let [node (gdom/getElement input-id)
                    current-pos (:pos (util/get-caret-pos node))
                    value (gobj/get node "value")
                    deleted (and (> current-pos 0)
                                 (util/nth-safe value (dec current-pos)))
                    selected-start (gobj/get node "selectionStart")
                    selected-end (gobj/get node "selectionEnd")
                    block-id (:block-id (first (:rum/args state)))
                    page (state/get-current-page)]
                (cond
                  (not= selected-start selected-end)
                  nil

                  (and (zero? current-pos)
                       ;; not the top block in a block page
                       (not (and page
                                 (util/uuid-string? page)
                                 (= (medley/uuid page) block-id))))
                  (editor-handler/delete-block! state repo e)

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
                    (set (keys editor-handler/delete-map))
                    deleted)
                   (>= (count value) (inc current-pos))
                   (= (util/nth-safe value current-pos)
                      (get editor-handler/delete-map deleted)))

                  (do
                    (util/stop e)
                    (commands/delete-pair! id)
                    (cond
                      (and (= deleted "[") (state/get-editor-show-page-search?))
                      (state/set-editor-show-page-search! false)

                      (and (= deleted "(") (state/get-editor-show-block-search?))
                      (state/set-editor-show-block-search! false)

                      :else
                      nil))

                  ;; deleting hashtag
                  (and (= deleted "#") (state/get-editor-show-page-search-hashtag?))
                  (state/set-editor-show-page-search-hashtag! false)

                  :else
                  nil)))
         ;; tab
         9  (fn [state e]
              (let [input-id (state/get-edit-input-id)
                    input (and input-id (gdom/getElement id))
                    pos (and input (:pos (util/get-caret-pos input)))]
                (when-not (state/get-editor-show-input)
                  (util/stop e)
                  (let [direction (if (gobj/get e "shiftKey") ; shift+tab move to left
                                    :left
                                    :right)]
                    (p/let [_ (editor-handler/adjust-block-level! state direction)]
                      (and input pos (js/setTimeout #(when-let [input (gdom/getElement input-id)]
                                                       (util/move-cursor-to input pos))
                                                    0)))))))}
        {:not-matched-handler
         (fn [e key-code]
           (let [key (gobj/get e "key")
                 value (gobj/get input "value")
                 pos (:pos (util/get-caret-pos input))]
             (cond
               (or
                (and (= key "#")
                     (and
                      (> pos 0)
                      (= "#" (util/nth-safe value (dec pos)))))
                (and (= key " ")
                     (state/get-editor-show-page-search-hashtag?)))
               (state/set-editor-show-page-search-hashtag! false)

               (or
                (editor-handler/surround-by? input "#" " ")
                (editor-handler/surround-by? input "#" :end)
                (= key "#"))
               (do
                 (commands/handle-step [:editor/search-page-hashtag])
                 (state/set-last-pos! (:pos (util/get-caret-pos input)))
                 (reset! commands/*slash-caret-pos (util/get-caret-pos input)))

               (and
                (= key " ")
                (state/get-editor-show-page-search-hashtag?))
               (state/set-editor-show-page-search-hashtag! false)

               (and
                (contains? (set/difference (set (keys editor-handler/reversed-autopair-map))
                                           #{"`"})
                           key)
                (= (editor-handler/get-current-input-char input) key))
               (do
                 (util/stop e)
                 (util/cursor-move-forward input 1))

               (contains? (set (keys editor-handler/autopair-map)) key)
               (do
                 (util/stop e)
                 (editor-handler/autopair input-id key format nil)
                 (cond
                   (editor-handler/surround-by? input "[[" "]]")
                   (do
                     (commands/handle-step [:editor/search-page])
                     (reset! commands/*slash-caret-pos (util/get-caret-pos input)))
                   (editor-handler/surround-by? input "((" "))")
                   (do
                     (commands/handle-step [:editor/search-block :reference])
                     (reset! commands/*slash-caret-pos (util/get-caret-pos input)))
                   :else
                   nil))

               (let [sym "$"]
                 (and (= key sym)
                      (>= (count value) 1)
                      (> pos 0)
                      (= (nth value (dec pos)) sym)
                      (if (> (count value) pos)
                        (not= (nth value pos) sym)
                        true)))
               (commands/simple-insert! input-id "$$" {:backward-pos 2})

               (let [sym "^"]
                 (and (= key sym)
                      (>= (count value) 1)
                      (> pos 0)
                      (= (nth value (dec pos)) sym)
                      (if (> (count value) pos)
                        (not= (nth value pos) sym)
                        true)))
               (commands/simple-insert! input-id "^^" {:backward-pos 2})

               :else
               nil)))})
       (mixins/on-key-up
        state
        {}
        (fn [e key-code]
          (let [k (gobj/get e "key")
                format (:format (get-state state))]
            (when-not (state/get-editor-show-input)
              (when (and @*show-commands (not= key-code 191))     ; not /
                (let [matched-commands (editor-handler/get-matched-commands input)]
                  (if (seq matched-commands)
                    (do
                      (cond
                        (= key-code 9)      ;tab
                        (when @*show-commands
                          (util/stop e)
                          (editor-handler/insert-command! input-id
                                                          (last (first matched-commands))
                                                          format
                                                          nil))

                        :else
                        (do
                          (reset! *show-commands true)
                          (reset! *matched-commands matched-commands))))
                    (reset! *show-commands false))))
              (when (and @*show-block-commands (not= key-code 188))     ; not <
                (let [matched-block-commands (editor-handler/get-matched-block-commands input)]
                  (if (seq matched-block-commands)
                    (cond
                      (= key-code 9)      ;tab
                      (when @*show-block-commands
                        (util/stop e)
                        (editor-handler/insert-command! input-id
                                                        (last (first matched-block-commands))
                                                        format
                                                        {:last-pattern commands/angle-bracket}))

                      :else
                      (reset! *matched-block-commands matched-block-commands))
                    (reset! *show-block-commands false))))
              (editor-handler/close-autocomplete-if-outside input))))))))
  {:did-mount (fn [state]
                (let [[{:keys [dummy? format block-parent-id]} id] (:rum/args state)
                      content (get-in @state/state [:editor/content id])]
                  (when block-parent-id
                    (state/set-editing-block-dom-id! block-parent-id))
                  (editor-handler/restore-cursor-pos! id content dummy?)

                  (when-let [input (gdom/getElement id)]
                    (dnd/subscribe!
                     input
                     :upload-images
                     {:drop (fn [e files]
                              (editor-handler/upload-image id files format editor-handler/*image-uploading? true))}))

                  ;; Here we delay this listener, otherwise the click to edit event will trigger a outside click event,
                  ;; which will hide the editor so no way for editing.
                  (js/setTimeout
                   (fn []
                     (mixins/hide-when-esc-or-outside
                      state
                      :on-hide
                      (fn [state e event]
                        (let [target (.-target e)]
                          (if (d/has-class? target "bottom-action") ;; FIXME: not particular case
                            (.preventDefault e)
                            (let [{:keys [on-hide format value block id repo dummy?]} (get-state state)]
                              (when on-hide
                                (on-hide value event))
                              (when
                               (or (= event :esc)
                                   (= event :visibilitychange)
                                   (and (= event :click)
                                        (not (editor-handler/in-auto-complete? (gdom/getElement id)))))
                                (state/clear-edit!))))))
                      :node (gdom/getElement id)
                      ;; :visibilitychange? true
))
                   100)

                  (when-let [element (gdom/getElement id)]
                    (.focus element)))
                state)
   :will-unmount (fn [state]
                   (let [{:keys [id value format block repo dummy? config]} (get-state state)
                         file? (:file? config)]
                     (when-let [input (gdom/getElement id)]
                       ;; (.removeEventListener input "paste" (fn [event]
                       ;;                                       (append-paste-doc! format event)))
                       (let [s (str "cljs-drag-n-drop." :upload-images)
                             a (gobj/get input s)
                             timer (:timer a)]

                         (and timer
                              (dnd/unsubscribe!
                               input
                               :upload-images))))
                     (editor-handler/clear-when-saved!)
                     (if file?
                       (let [path (:file-path config)
                             content (db/get-file-no-sub path)
                             value (some-> (gdom/getElement path)
                                           (gobj/get "value"))]
                         (when (and
                                (not (string/blank? value))
                                (not= (string/trim value) (string/trim content)))
                           (let [old-page-name (db/get-file-page path false)]
                             (page-handler/rename-when-alter-title-property! old-page-name path format content value)
                             (file/alter-file (state/get-current-repo) path (string/trim value)
                                              {:re-render-root? true}))))
                       (when-not (contains? #{:insert :indent-outdent :auto-save} (state/get-editor-op))
                         (editor-handler/save-block! (get-state state) value))))
                   state)}
  [state {:keys [on-hide dummy? node format block block-parent-id]
          :or {dummy? false}
          :as option} id config]
  (let [content (state/get-edit-content)]
    [:div.editor-inner {:class (if block "block-editor" "non-block-editor")}
     (when config/mobile? (mobile-bar state id))
     (ui/ls-textarea
      {:id id
       :cacheMeasurements true
       :default-value (or content "")
       :minRows (if (state/enable-grammarly?) 2 1)
       :on-click (fn [_e]
                   (let [input (gdom/getElement id)
                         current-pos (:pos (util/get-caret-pos input))]
                     (state/set-edit-pos! current-pos)
                     (editor-handler/close-autocomplete-if-outside input)))
       :on-change (fn [e]
                    (let [value (util/evalue e)
                          current-pos (:pos (util/get-caret-pos (gdom/getElement id)))]
                      (state/set-edit-content! id value false)
                      (state/set-edit-pos! current-pos)
                      (when-let [repo (or (:block/repo block)
                                          (state/get-current-repo))]
                        (state/set-editor-last-input-time! repo (util/time-ms))
                        (db/clear-repo-persistent-job! repo))
                      (let [input (gdom/getElement id)
                            native-e (gobj/get e "nativeEvent")
                            last-input-char (util/nth-safe value (dec current-pos))]
                        (case last-input-char
                          "/"
                          ;; TODO: is it cross-browser compatible?
                          (when (not= (gobj/get native-e "inputType") "insertFromPaste")
                            (when-let [matched-commands (seq (editor-handler/get-matched-commands input))]
                              (reset! *slash-caret-pos (util/get-caret-pos input))
                              (reset! *show-commands true)))
                          "<"
                          (when-let [matched-commands (seq (editor-handler/get-matched-block-commands input))]
                            (reset! *angle-bracket-caret-pos (util/get-caret-pos input))
                            (reset! *show-block-commands true))
                          nil))))
       :auto-focus false})

     ;; TODO: how to render the transitions asynchronously?
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
      (template-search id format)
      true
      *slash-caret-pos)

     (transition-cp
      (datetime-comp/date-picker id format nil)
      false
      *slash-caret-pos)

     (transition-cp
      (input id
             (fn [command m pos]
               (editor-handler/handle-command-input command id format m pos)))
      true
      *slash-caret-pos)

     (when format
       (image-uploader id format))]))
