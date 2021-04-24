(ns frontend.components.editor
  (:require [rum.core :as rum]
            [frontend.components.svg :as svg]
            [frontend.config :as config]
            [frontend.handler.editor :as editor-handler :refer [get-state]]
            [frontend.handler.editor.lifecycle :as lifecycle]
            [frontend.util :as util :refer-macros [profile]]
            [frontend.handler.block :as block-handler]
            [frontend.components.block :as block]
            [frontend.components.search :as search]
            [frontend.handler.page :as page-handler]
            [frontend.components.datetime :as datetime-comp]
            [frontend.state :as state]
            [frontend.mixins :as mixins]
            [frontend.ui :as ui]
            [frontend.db :as db]
            [frontend.modules.shortcut.handler :as shortcut-handler]
            [dommy.core :as d]
            [goog.object :as gobj]
            [goog.dom :as gdom]
            [clojure.string :as string]
            [promesa.core :as p]
            [frontend.commands :as commands
             :refer [*show-commands
                     *matched-commands
                     *slash-caret-pos
                     *angle-bracket-caret-pos
                     *matched-block-commands
                     *show-block-commands]]
            ["/frontend/utils" :as utils]
            [frontend.modules.shortcut.core :as shortcut]))

(rum/defc commands < rum/reactive
  [id format]
  (let [show-commands? (util/react *show-commands)]
    (when (and show-commands?
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
         :class     "black"})))))

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
        :class     "black"}))))

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
                              (editor-handler/get-matched-pages q))]
          (ui/auto-complete
           matched-pages
           {:on-chosen (page-handler/on-chosen-handler input id q pos format)
            :on-enter #(page-handler/page-not-exists-handler input id q current-pos)
            :item-render (fn [item] [:div.py-2 (search/highlight-exact-query item q)])
            :empty-div [:div.text-gray-500.pl-4.pr-4 "Search for a page"]
            :class     "black"}))))))

(rum/defcs block-search-auto-complete < rum/reactive
  {:init (fn [state]
           (assoc state ::result (atom nil)))
   :did-update (fn [state]
                 (let [result (::result state)
                       [edit-block _ _ q] (:rum/args state)]
                   (p/let [matched-blocks (when-not (string/blank? q)
                                            (editor-handler/get-matched-blocks q (:block/uuid edit-block)))]
                     (reset! result matched-blocks)))
                 state)}
  [state edit-block input id q format content]
  (let [result (rum/react (get state ::result))
        chosen-handler (editor-handler/block-on-chosen-handler input id q format)
        non-exist-block-handler (editor-handler/block-non-exist-handler input)]
    (when result
      (ui/auto-complete
       result
       {:on-chosen   chosen-handler
        :on-enter    non-exist-block-handler
        :empty-div   [:div.text-gray-500.pl-4.pr-4 "Search for a block"]
        :item-render (fn [{:block/keys [content page uuid] :as item}]
                       (let [page (or (:block/original-name page)
                                      (:block/name page))
                             repo (state/sub :git/current-repo)
                             format (db/get-page-format page)]

                         [:.py-2 (search/block-search-result-item repo uuid format content q)]))
        :class       "black"}))))

(rum/defcs block-search < rum/reactive
  {:will-unmount (fn [state]
                   (reset! editor-handler/*selected-text nil)
                   (state/clear-search-result!)
                   state)}
  [state id format]
  (when (state/sub :editor/show-block-search?)
    (let [pos (:editor/last-saved-cursor @state/state)
          input (gdom/getElement id)
          [id format] (:rum/args state)
          current-pos (:pos (util/get-caret-pos input))
          edit-content (state/sub [:editor/content id])
          edit-block (state/get-edit-block)
          q (or
             @editor-handler/*selected-text
             (when (> (count edit-content) current-pos)
               (subs edit-content pos current-pos)))]
      (when input
        (block-search-auto-complete edit-block input id q format)))))

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
              non-exist-handler (fn [_state]
                                  (state/set-editor-show-template-search! false))]
          (ui/auto-complete
           matched-templates
           {:on-chosen   (editor-handler/template-on-chosen-handler input id q format edit-block edit-content)
            :on-enter    non-exist-handler
            :empty-div   [:div.text-gray-500.pl-4.pr-4 "Search for a template"]
            :item-render (fn [[template _block-db-id]]
                           template)
            :class       "black"}))))))

(rum/defc mobile-bar < rum/reactive
  [parent-state parent-id]
  [:div#mobile-editor-toolbar.bg-base-2.fix-ios-fixed-bottom
   [:button.bottom-action
    {:on-click #(editor-handler/indent-on-tab parent-state)}
    svg/indent-block]
   [:button.bottom-action
    {:on-click #(editor-handler/outdent-on-shift-tab parent-state)}
    svg/outdent-block]
   [:button.bottom-action
    {:on-click (editor-handler/move-up-down true)}
    svg/move-up-block]
   [:button.bottom-action
    {:on-click (editor-handler/move-up-down false)}
    svg/move-down-block]
   [:button.bottom-action
    {:on-click #(commands/simple-insert! parent-id "\n" {})}
    svg/multi-line-input]
   [:button.bottom-action
    {:on-click #(commands/insert-before! parent-id "TODO " {})}
    svg/checkbox]
   [:button.font-extrabold.bottom-action.-mt-1
    {:on-click #(commands/simple-insert!
                 parent-id "[[]]"
                 {:backward-pos 2
                  :check-fn     (fn [_ _ new-pos]
                                  (reset! commands/*slash-caret-pos new-pos)
                                  (commands/handle-step [:editor/search-page]))})}
    "[[]]"]
   [:button.font-extrabold.bottom-action.-mt-1
    {:on-click #(commands/simple-insert!
                 parent-id "(())"
                 {:backward-pos 2
                  :check-fn     (fn [_ _ new-pos]
                                  (reset! commands/*slash-caret-pos new-pos)
                                  (commands/handle-step [:editor/search-block]))})}
    "(())"]
   [:button.font-extrabold.bottom-action.-mt-1
    {:on-click #(commands/simple-insert! parent-id "/" {})}
    "/"]])

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
                 {:key           (str "modal-input-" (name id))
                  :id            (str "modal-input-" (name id))
                  :type          (or type "text")
                  :on-change     (fn [e]
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
  [cp set-default-width? {:keys [top left rect]}]
  (let [max-height 500
        max-width 300
        offset-top 24
        vw-height js/window.innerHeight
        vw-width js/window.innerWidth
        to-max-height (if (and (seq rect) (> vw-height max-height))
                        (let [delta-height (- vw-height (+ (:top rect) top offset-top))]
                          (if (< delta-height max-height)
                            (- (max (* 2 offset-top) delta-height) 16)
                            max-height))
                        max-height)
        x-overflow? (if (and (seq rect) (> vw-width max-width))
                      (let [delta-width (- vw-width (+ (:left rect) left))]
                        (< delta-width (* max-width 0.5))))] ;; FIXME: for translateY layer
    [:div.absolute.rounded-md.shadow-lg.absolute-modal
     {:class (if x-overflow? "is-overflow-vw-x" "")
      :style (merge
              {:top        (+ top offset-top)
               :max-height to-max-height
               :max-width 700
               ;; TODO: auto responsive fixed size
               :min-width 300
               :z-index    11}
              (if set-default-width?
                {:width max-width})
              (if config/mobile?
                {:left 0}
                {:left left}))}
     cp]))

(rum/defc transition-cp < rum/reactive
  [cp set-default-width? pos]
  (when pos
    (when-let [pos (rum/react pos)]
      (ui/css-transition
       {:class-names "fade"
        :timeout     {:enter 500
                      :exit  300}}
       (absolute-modal cp set-default-width? pos)))))

(rum/defc image-uploader < rum/reactive
  {:did-mount    (fn [state]
                   (let [[id format] (:rum/args state)]
                     (add-watch editor-handler/*asset-pending-file ::pending-asset
                                (fn [_ _ _ f]
                                  (reset! *slash-caret-pos (util/get-caret-pos (gdom/getElement id)))
                                  (editor-handler/upload-asset id #js[f] format editor-handler/*asset-uploading? true))))
                   state)
   :will-unmount (fn [state]
                   (remove-watch editor-handler/*asset-pending-file ::pending-asset))}
  [id format]
  [:div.image-uploader
   [:input
    {:id        "upload-file"
     :type      "file"
     :on-change (fn [e]
                  (let [files (.-files (.-target e))]
                    (editor-handler/upload-asset id files format editor-handler/*asset-uploading? false)))
     :hidden    true}]
   (when-let [uploading? (util/react editor-handler/*asset-uploading?)]
     (let [processing (util/react editor-handler/*asset-uploading-process)]
       (transition-cp
        [:div.flex.flex-row.align-center.rounded-md.shadow-sm.bg-base-2.px-1.py-1
         (ui/loading
          (util/format "Uploading %s%" (util/format "%2d" processing)))]
        false
        *slash-caret-pos)))])

(defn- set-up-key-down!
  [repo state input input-id format]
  (mixins/on-key-down
   state
   {}
   {:not-matched-handler (editor-handler/keydown-not-matched-handler input input-id format)}))

(defn- set-up-key-up!
  [state input input-id search-timeout]
  (mixins/on-key-up
   state
   {}
   (editor-handler/keyup-handler state input input-id search-timeout)))

(def search-timeout (atom nil))

(defn- setup-key-listener!
  [state]
  (let [{:keys [id format block]} (get-state)
        input-id id
        input (gdom/getElement input-id)
        repo (:block/repo block)]
    (set-up-key-down! repo state input input-id format)
    (set-up-key-up! state input input-id search-timeout)))

(rum/defcs box < rum/reactive
  (mixins/event-mixin setup-key-listener!)
  (mixins/shortcuts
   shortcut/install-shortcut!
   :shortcut-listener/editor
   shortcut-handler/editing-only)
  lifecycle/lifecycle
  {:did-mount (fn [state]
                (state/set-editor-args! (:rum/args state))
                state)}
  [state {:keys [on-hide dummy? node format block block-parent-id]
          :or   {dummy? false}
          :as   option} id config]
  (let [content (state/get-edit-content)]
    [:div.editor-inner {:class (if block "block-editor" "non-block-editor")}
     (when config/mobile? (mobile-bar state id))
     (ui/ls-textarea
      {:id                id
       :cacheMeasurements true
       :default-value     (or content "")
       :minRows           (if (state/enable-grammarly?) 2 1)
       :on-click          (editor-handler/editor-on-click! id)
       :on-change         (editor-handler/editor-on-change! block id search-timeout)
       :on-paste          (editor-handler/editor-on-paste! id)
       :auto-focus        false})

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
      false
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
