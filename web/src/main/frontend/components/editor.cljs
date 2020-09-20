(ns frontend.components.editor
  (:require [rum.core :as rum]
            [frontend.components.svg :as svg]
            [frontend.config :as config]
            [frontend.handler :as handler]
            [frontend.handler.editor :as editor-handler :refer [get-state]]
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
            [clojure.set :as set]
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
            ["/frontend/utils" :as utils]))

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

(defn- get-search-q
  []
  (when-let [id (state/get-edit-input-id)]
    (when-let [input (gdom/getElement id)]
      (let [current-pos (:pos (util/get-caret-pos input))
            pos (:editor/last-saved-cursor @state/state)
            edit-content (state/sub [:editor/content id])]
        (or
         @editor-handler/*selected-text
         (when (state/get-editor-show-page-search-hashtag)
           (util/safe-subs edit-content pos current-pos))
         (when (> (count edit-content) current-pos)
           (util/safe-subs edit-content pos current-pos)))))))

(rum/defc page-search < rum/reactive
  {:will-unmount (fn [state] (reset! editor-handler/*selected-text nil) state)}
  [id format]
  (when (state/sub :editor/show-page-search?)
    (let [pos (:editor/last-saved-cursor @state/state)
          input (gdom/getElement id)]
      (when input
        (let [current-pos (:pos (util/get-caret-pos input))
              edit-content (state/sub [:editor/content id])
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
                                 (state/set-editor-show-page-search false)
                                 (editor-handler/insert-command! id
                                                                 (util/format "#%s" (if (string/includes? chosen " ")
                                                                                      (str "[[" chosen "]]")
                                                                                      chosen))
                                                                 format
                                                                 {:last-pattern (str "#" (if @editor-handler/*selected-text "" q))}))
                               (fn [chosen _click?]
                                 (state/set-editor-show-page-search false)
                                 (editor-handler/insert-command! id
                                                                 (util/format "[[%s]]" chosen)
                                                                 format
                                                                 {:last-pattern (str "[[" (if @editor-handler/*selected-text "" q))
                                                                  :postfix-fn (fn [s] (util/replace-first "]]" s ""))})))
              non-exist-page-handler (fn [_state]
                                       (state/set-editor-show-page-search false)
                                       (util/cursor-move-forward input 2))]
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
                               (state/set-editor-show-block-search false)
                               (let [uuid-string (str (:block/uuid chosen))]

                                 ;; block reference
                                 (editor-handler/insert-command! id
                                                                 (util/format "((%s))" uuid-string)
                                                                 format
                                                                 {:last-pattern (str "((" (if @editor-handler/*selected-text "" q))
                                                                  :postfix-fn (fn [s] (util/replace-first "))" s ""))})

                                 ;; Save it so it'll be parsed correctly in the future
                                 (editor-handler/set-block-property! (:block/uuid chosen)
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
            :item-render (fn [{:block/keys [content]}]
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
          (editor-handler/insert-command! id
                                          (util/format "[[%s]]" journal)
                                          format
                                          nil)
          (state/set-editor-show-date-picker false)))})))

(rum/defc mobile-bar < rum/reactive
  [parent-state parent-id]
  [:div.bg-base-2 {:style {:position "fixed"
                           :bottom 0
                           :width "100%"
                           :left 0
                           :justify-content "center"
                           :height "2.5rem"
                           :display "flex"
                           :align-items "center"
                           ;; This element should be the upper-most in most situations
                           :z-index 99999999}}
   [:button
    {:style {:padding "5px"}
     :on-click #(editor-handler/adjust-block-level! parent-state :right)}
    svg/indent-block]
   [:button
    {:style {:padding "5px"}
     :on-click #(editor-handler/adjust-block-level! parent-state :left)}
    svg/outdent-block]
   [:button
    {:style {:padding "5px"}
     :on-click #(editor-handler/move-up-down parent-state % true)}
    svg/move-up-block]
   [:button
    {:style {:padding "5px"}
     :on-click #(editor-handler/move-up-down parent-state % false)}
    svg/move-down-block]
   [:button
    {:style {:padding "5px"}
     :on-click (fn [e]
                 (let [old-content (state/sub [:editor/content parent-id])
                       new-content (str old-content "\n")]
                   (state/set-state! :editor/content {parent-id new-content}))
                 (.stopPropagation e))}
    svg/multi-line-input]
   [:button
    {:style {:padding "5px"}
     :on-click (fn [e]
                 (let [old-content (state/sub [:editor/content parent-id])
                       new-content (str old-content "[[]]")]
                   (state/set-state! :editor/content {parent-id new-content}))
                 (.stopPropagation e))}
    "[[]]"]
   [:button
    {:style {:padding "5px"}
     :on-click (fn [e]
                 (let [old-content (state/sub [:editor/content parent-id])
                       new-content (str old-content "(())")]
                   (state/set-state! :editor/content {parent-id new-content}))
                 (.stopPropagation e))}
    "(())"]])

(rum/defcs input < rum/reactive
  (rum/local {} ::input-value)
  (mixins/event-mixin
   (fn [state]
     (mixins/on-key-down
      state
      {
       ;; enter
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
  [:div.absolute.rounded-md.shadow-lg
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
  (mixins/keyboard-mixin (util/->system-modifier "ctrl+shift+a") editor-handler/select-all-blocks!)
  (mixins/keyboard-mixin (if util/mac? "meta+shift+up" "alt+shift+up")
                         (fn [state e]
                           (editor-handler/move-up-down state e true)))
  (mixins/keyboard-mixin (if util/mac? "meta+shift+down" "alt+shift+down")
                         (fn [state e] (editor-handler/move-up-down state e false)))
  (mixins/event-mixin
   (fn [state]
     (let [{:keys [id format block]} (get-state state)
           input-id id
           input (gdom/getElement input-id)
           repo (:block/repo block)]
       ;; (.addEventListener input "paste" (fn [event]
       ;;                                    (editor-handler/append-paste-doc! format event)))
       (mixins/on-key-down
        state
        {
         ;; enter
         13 (fn [state e]
              (when (and (not (gobj/get e "ctrlKey"))
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
         8 (fn [state e]
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
                   (set (keys editor-handler/autopair-map))
                   deleted)
                  (>= (count value) (inc current-pos))
                  (= (util/nth-safe value current-pos)
                     (get editor-handler/autopair-map deleted)))

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

                 ;; deleting hashtag
                 (and (= deleted "#") (state/get-editor-show-page-search-hashtag))
                 (state/set-editor-show-page-search-hashtag false)

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
                   (p/let [_ (editor-handler/adjust-block-level! state direction)]
                     (and input pos (js/setTimeout #(when-let [input (gdom/getElement input-id)]
                                                      (util/move-cursor-to input pos))
                                                   0)))))))}
        (fn [e key-code]
          (let [key (gobj/get e "key")
                value (gobj/get input "value")]
            (cond
              (or
               (and (= key "#")
                    (let [pos (:pos (util/get-caret-pos input))]
                      (and
                       (> pos 0)
                       (= "#" (util/nth-safe value (dec pos))))))
               (= key " "))
              (state/set-editor-show-page-search-hashtag false)

              (and
               (not= key-code 8) ;; backspace
               (or
                (editor-handler/surround-by? input "#" " ")
                (editor-handler/surround-by? input "#" :end)
                (= key "#")))
              (do
                (commands/handle-step [:editor/search-page-hashtag])
                (state/set-last-pos! (:pos (util/get-caret-pos input)))
                (reset! commands/*slash-caret-pos (util/get-caret-pos input)))

              (and
               (= key " ")
               (state/get-editor-show-page-search-hashtag))
              (state/set-editor-show-page-search-hashtag false)

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

              (when (or (state/get-editor-show-page-search)
                        (state/get-editor-show-block-search))
                (when-let [q (get-search-q)]
                  (let [value (gobj/get input "value")
                        pos (:editor/last-saved-cursor @state/state)
                        current-pos (:pos (util/get-caret-pos input))]
                    (when (or (< current-pos pos)
                              (string/includes? q "]")
                              (string/includes? q ")"))
                      (state/set-editor-show-block-search false)
                      (state/set-editor-show-page-search false)
                      (state/set-editor-show-page-search-hashtag false))))))))))))
  {:did-mount (fn [state]
                (let [[{:keys [dummy? format block-parent-id]} id] (:rum/args state)
                      content (get-in @state/state [:editor/content id])]
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
                        (let [{:keys [on-hide format value block id repo dummy?]} (get-state state)]
                          (when on-hide
                            (on-hide value event))
                          (when
                              (or (= event :esc)
                                  (and (= event :click)
                                       (not (editor-handler/in-auto-complete? (gdom/getElement id)))))
                            (state/clear-edit!))))
                      :node (gdom/getElement id)))
                   100)

                  (when-let [element (gdom/getElement id)]
                    (.focus element)))
                state)
   :will-unmount (fn [state]
                   (let [{:keys [id value format block repo dummy?]} (get-state state)]
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
                     (editor-handler/save-block! (get-state state) value))
                   state)}
  [state {:keys [on-hide dummy? node format block]
          :or {dummy? false}
          :as option} id config]
  (let [content (state/sub [:editor/content id])]
    [:div.editor {:style {:position "relative"
                          :display "flex"
                          :flex "1 1 0%"}
                  :class (if block "block-editor" "non-block-editor")}
     (when config/mobile? (mobile-bar state id))
     (ui/textarea
      {:id id
       :value (or content "")
       :on-click (fn [_e]
                   (let [current-pos (:pos (util/get-caret-pos (gdom/getElement id)))]
                     (state/set-edit-pos! current-pos)))
       :on-key-down (fn [_e]
                      (let [current-pos (:pos (util/get-caret-pos (gdom/getElement id)))]
                        (state/set-edit-pos! current-pos)))
       :on-change (fn [e]
                    (let [value (util/evalue e)
                          current-pos (:pos (util/get-caret-pos (gdom/getElement id)))]
                      (state/set-edit-content! id value)
                      (state/set-edit-pos! current-pos)
                      (let [input (gdom/getElement id)
                            last-input-char (util/nth-safe value (dec current-pos))]
                        (case last-input-char
                          "/"
                          (when-let [matched-commands (seq (editor-handler/get-matched-commands input))]
                            (reset! *slash-caret-pos (util/get-caret-pos input))
                            (reset! *show-commands true))
                          "<"
                          (when-let [matched-commands (seq (editor-handler/get-matched-block-commands input))]
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
             (fn [command m pos]
               (editor-handler/handle-command-input command id format m pos)))
      true
      *slash-caret-pos)

     (when format
       (image-uploader id format))]))
