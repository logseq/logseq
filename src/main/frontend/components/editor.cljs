(ns frontend.components.editor
  (:require [clojure.string :as string]
            [goog.string :as gstring]
            [frontend.commands :as commands
             :refer [*angle-bracket-caret-pos *first-command-group *matched-block-commands *matched-commands *show-block-commands *show-commands *slash-caret-pos]]
            [frontend.components.block :as block]
            [frontend.components.datetime :as datetime-comp]
            [frontend.components.search :as search]
            [frontend.components.svg :as svg]
            [frontend.mobile.camera :as mobile-camera]
            [frontend.mobile.util :as mobile-util]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.db.model :as db-model]
            [frontend.extensions.zotero :as zotero]
            [frontend.handler.editor :as editor-handler :refer [get-state]]
            [frontend.handler.editor.lifecycle :as lifecycle]
            [frontend.handler.page :as page-handler]
            [frontend.mixins :as mixins]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [frontend.util.keycode :as keycode]
            [logseq.graph-parser.util :as gp-util]
            [goog.dom :as gdom]
            [promesa.core :as p]
            [rum.core :as rum]
            [frontend.handler.history :as history]
            [frontend.mobile.footer :as footer]
            [frontend.handler.config :as config-handler]))

(rum/defc commands < rum/reactive
  [id format]
  (let [matched (util/react *matched-commands)]
    (when (util/react *show-commands)
      (ui/auto-complete
       matched
       {:get-group-name
        (fn [item]
          (get *first-command-group (first item)))

        :item-render
        (fn [item]
          (let [command-name (first item)
                command-doc (get item 2)
                doc (when (state/show-command-doc?) command-doc)]
            (cond
              (string? doc)
              [:div {:title doc}
               command-name]

              (vector? doc)
              [:div.has-help
               command-name
               (ui/tippy
                {:html doc
                 :interactive true
                 :fixed-position? true
                 :position "right"}

                [:small (svg/help-circle)])]

              :else
              [:div command-name])))

        :on-chosen
        (fn [chosen-item]
          (let [command (first chosen-item)]
            (reset! commands/*current-command command)
            (let [command-steps (get (into {} matched) command)
                  restore-slash? (or
                                  (contains? #{"Today" "Yesterday" "Tomorrow" "Current time"} command)
                                  (and
                                   (not (fn? command-steps))
                                   (not (contains? (set (map first command-steps)) :editor/input))
                                   (not (contains? #{"Date picker" "Template" "Deadline" "Scheduled" "Upload an image"} command))))]
              (editor-handler/insert-command! id command-steps
                                              format
                                              {:restore? restore-slash?})
              (state/pub-event! [:instrument {:type :editor/command-triggered
                                              :payload {:command command}}]))))
        :class
        "black"}))))

(rum/defc block-commands < rum/reactive
  [id format]
  (when (util/react *show-block-commands)
    (let [matched (util/react *matched-block-commands)]
      (ui/auto-complete
       (map first matched)
       {:on-chosen (fn [chosen]
                     (editor-handler/insert-command! id (get (into {} matched) chosen)
                                                     format
                                                     {:last-pattern commands/angle-bracket}))
        :class     "black"}))))

(defn- in-sidebar? [el]
  (not (.contains (.getElementById js/document "left-container") el)))

(rum/defc page-search < rum/reactive
  {:will-unmount (fn [state] (reset! editor-handler/*selected-text nil) state)}
  "Embedded page searching popup"
  [id format]
  (when (state/sub :editor/show-page-search?)
    (let [pos (state/get-editor-last-pos)
          input (gdom/getElement id)]
      (when input
        (let [current-pos (cursor/pos input)
              edit-content (or (state/sub [:editor/content id]) "")
              sidebar? (in-sidebar? input)
              q (or
                 @editor-handler/*selected-text
                 (when (state/sub :editor/show-page-search-hashtag?)
                   (gp-util/safe-subs edit-content pos current-pos))
                 (when (> (count edit-content) current-pos)
                   (gp-util/safe-subs edit-content pos current-pos))
                 "")
              matched-pages (when-not (string/blank? q)
                              (editor-handler/get-matched-pages q))
              matched-pages (cond
                              (contains? (set (map util/page-name-sanity-lc matched-pages)) (util/page-name-sanity-lc (string/trim q)))  ;; if there's a page name fully matched
                              matched-pages

                              (string/blank? q)
                              nil

                              (empty? matched-pages)
                              (cons (str "New page: " q) matched-pages)

                              ;; reorder, shortest and starts-with first.
                              :else
                              (let [matched-pages (remove nil? matched-pages)
                                    matched-pages (sort-by
                                                   (fn [m]
                                                     [(not (gstring/caseInsensitiveStartsWith m q)) (count m)])
                                                   matched-pages)]
                                (if (gstring/caseInsensitiveStartsWith (first matched-pages) q)
                                  (cons (first matched-pages)
                                        (cons  (str "New page: " q) (rest matched-pages)))
                                  (cons (str "New page: " q) matched-pages))))]
          (ui/auto-complete
           matched-pages
           {:on-chosen   (page-handler/on-chosen-handler input id q pos format)
            :on-enter    #(page-handler/page-not-exists-handler input id q current-pos)
            :item-render (fn [page-name chosen?]
                           [:div.preview-trigger-wrapper
                            (block/page-preview-trigger
                             {:children        [:div (search/highlight-exact-query page-name q)]
                              :open?           chosen?
                              :manual?         true
                              :fixed-position? true
                              :tippy-distance  24
                              :tippy-position  (if sidebar? "left" "right")}
                             page-name)])
            :empty-placeholder [:div.text-gray-500.text-sm.px-4.py-2 "Search for a page"]
            :class       "black"}))))))

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
  [state _edit-block input id q format]
  (let [result (rum/react (get state ::result))
        chosen-handler (editor-handler/block-on-chosen-handler input id q format)
        non-exist-block-handler (editor-handler/block-non-exist-handler input)]
    (when result
      (ui/auto-complete
       result
       {:on-chosen   chosen-handler
        :on-enter    non-exist-block-handler
        :empty-placeholder   [:div.text-gray-500.pl-4.pr-4 "Search for a block"]
        :item-render (fn [{:block/keys [page uuid]}]  ;; content returned from search engine is normalized
                       (let [page (or (:block/original-name page)
                                      (:block/name page))
                             repo (state/sub :git/current-repo)
                             format (db/get-page-format page)
                             block (db-model/query-block-by-uuid uuid)
                             content (:block/content block)]
                         [:.py-2 (search/block-search-result-item repo uuid format content q :block)]))
        :class       "black"}))))

(rum/defcs block-search < rum/reactive
  {:will-unmount (fn [state]
                   (reset! editor-handler/*selected-text nil)
                   (state/clear-search-result!)
                   state)}
  [state id _format]
  (when (state/sub :editor/show-block-search?)
    (let [pos (state/get-editor-last-pos)
          input (gdom/getElement id)
          [id format] (:rum/args state)
          current-pos (cursor/pos input)
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
  [id _format]
  (when (state/sub :editor/show-template-search?)
    (let [pos (state/get-editor-last-pos)
          input (gdom/getElement id)]
      (when input
        (let [current-pos (cursor/pos input)
              edit-content (state/sub [:editor/content id])
              q (or
                 (when (>= (count edit-content) current-pos)
                   (subs edit-content pos current-pos))
                 "")
              matched-templates (editor-handler/get-matched-templates q)
              non-exist-handler (fn [_state]
                                  (state/set-editor-show-template-search! false))]
          (ui/auto-complete
           matched-templates
           {:on-chosen   (editor-handler/template-on-chosen-handler id)
            :on-enter    non-exist-handler
            :empty-placeholder [:div.text-gray-500.px-4.py-2.text-sm "Search for a template"]
            :item-render (fn [[template _block-db-id]]
                           template)
            :class       "black"}))))))

(rum/defc mobile-bar-indent-outdent [indent? icon]
  [:div
   [:button.bottom-action
    {:on-mouse-down (fn [e]
                      (util/stop e)
                      (editor-handler/indent-outdent indent?))}
    (ui/icon icon {:style {:fontSize ui/icon-size}})]])

(def ^:private mobile-bar-icons-keywords
  [:checkbox :brackets :parentheses :command :tag :a-b :list :camera
   :brand-youtube :link :rotate :rotate-clockwise :code :bold :italic :strikethrough :paint])

(def ^:private mobile-bar-commands-stats
  (atom (into {}
              (mapv (fn [name] [name {:counts 0}])
                    mobile-bar-icons-keywords))))

(defn set-command-stats [icon]
  (let [key (keyword icon)
        counts (get-in @mobile-bar-commands-stats [key :counts])]
    (swap! mobile-bar-commands-stats
           assoc-in [key :counts] (inc counts))
    (config-handler/set-config!
     :mobile/toolbar-stats @mobile-bar-commands-stats)))

(rum/defc mobile-bar-command
  [command-handler icon & [count? event?]]
  [:div
   [:button.bottom-action
    {:on-mouse-down (fn [e]
                      (util/stop e)
                      (when count?
                        (set-command-stats icon))
                      (if event?
                        (command-handler e)
                        (command-handler)))}
    (ui/icon icon {:style {:fontSize ui/icon-size}})]])

(defn mobile-bar-commands
  [_parent-state parent-id]
  (let [viewport-fn (fn [] (when-let [input (gdom/getElement parent-id)]
                             (util/make-el-cursor-position-into-center-viewport input)
                             (.focus input)))]
    (zipmap mobile-bar-icons-keywords
     [(mobile-bar-command editor-handler/cycle-todo! "checkbox" true)
      (mobile-bar-command #(editor-handler/toggle-page-reference-embed parent-id) "brackets" true)
      (mobile-bar-command #(editor-handler/toggle-block-reference-embed parent-id) "parentheses" true)
      (mobile-bar-command #(do (viewport-fn) (commands/simple-insert! parent-id "/" {})) "command" true)
      (mobile-bar-command #(do (viewport-fn) (commands/simple-insert! parent-id "#" {})) "tag" true)
      (mobile-bar-command editor-handler/cycle-priority! "a-b" true)
      (mobile-bar-command editor-handler/toggle-list! "list" true)
      (mobile-bar-command #(mobile-camera/embed-photo parent-id) "camera" true)
      (mobile-bar-command commands/insert-youtube-timestamp "brand-youtube" true)
      (mobile-bar-command editor-handler/html-link-format! "link" true)
      (mobile-bar-command history/undo! "rotate" true true)
      (mobile-bar-command history/redo! "rotate-clockwise" true true)
      (mobile-bar-command #(do (viewport-fn) (commands/simple-insert! parent-id "<" {})) "code" true)
      (mobile-bar-command editor-handler/bold-format! "bold" true)
      (mobile-bar-command editor-handler/italics-format! "italic" true)
      (mobile-bar-command editor-handler/strike-through-format! "strikethrough" true)
      (mobile-bar-command editor-handler/highlight-format! "paint" true)])))

(rum/defc mobile-bar < rum/reactive
  [parent-state parent-id]
  (when-let [config-toolbar-stats (:mobile/toolbar-stats (state/get-config))]
   (reset! mobile-bar-commands-stats config-toolbar-stats))
  (let [commands (mobile-bar-commands parent-state parent-id)
        sorted-commands (sort-by (comp :counts second) > @mobile-bar-commands-stats)]
    [:div#mobile-editor-toolbar.bg-base-2
     [:div.toolbar-commands
      (mobile-bar-indent-outdent false "arrow-bar-left")
      (mobile-bar-indent-outdent true "arrow-bar-right")
      (mobile-bar-command (editor-handler/move-up-down true) "arrow-bar-to-up")
      (mobile-bar-command (editor-handler/move-up-down false) "arrow-bar-to-down")
      (mobile-bar-command #(if (state/sub :document/mode?)
                             (editor-handler/insert-new-block! nil)
                             (commands/simple-insert! parent-id "\n" {})) "arrow-back")
      (for [command sorted-commands]
        ((first command) commands))]
     [:div.toolbar-hide-keyboard
      (mobile-bar-command #(state/clear-edit!) "keyboard-show")]]))

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
  [state _id on-submit]
  (when-let [input-option (state/sub :editor/show-input)]
    (let [{:keys [pos]} (util/react *slash-caret-pos)
          input-value (get state ::input-value)]
      (when (seq input-option)
        (let [command (:command (first input-option))]
          [:div.p-2.rounded-md.shadow-lg
           (for [{:keys [id placeholder type autoFocus] :as input-item} input-option]
             [:div.my-3 {:key id}
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
                  (assoc :placeholder placeholder)
                  autoFocus
                  (assoc :auto-focus true))
                (dissoc input-item :id))]])
           (ui/button
            "Submit"
            :on-click
            (fn [e]
              (util/stop e)
              (on-submit command @input-value pos)))])))))

(rum/defc absolute-modal < rum/static
  [cp set-default-width? {:keys [top left rect]}]
  (let [max-height 370
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
        right-sidebar? (:ui/sidebar-open? @state/state)
        editing-key    (first (keys (:editor/editing? @state/state)))
        *el (rum/use-ref nil)
        _ (rum/use-effect! (fn []
                             (when-let [^js/HTMLElement cnt
                                        (and right-sidebar? editing-key
                                             (js/document.querySelector "#main-content-container"))]
                               (when (.contains cnt (js/document.querySelector (str "#" editing-key)))
                                 (let [el  (rum/deref *el)
                                       ofx (- (.-scrollWidth cnt) (.-clientWidth cnt))]
                                   (when (> ofx 0)
                                     (set! (.-transform (.-style el)) (str "translateX(-" (+ ofx 20) "px)")))))))
                           [right-sidebar? editing-key])
        x-overflow-vw? (when (and (seq rect) (> vw-width max-width))
                         (let [delta-width (- vw-width (+ (:left rect) left))]
                           (< delta-width (* max-width 0.5))))
        pos-rect (when (and (seq rect) editing-key)
                   (:rect (cursor/get-caret-pos (state/get-input))))
        y-diff (when pos-rect (- (:height pos-rect) (:height rect)))]
    [:div.absolute.rounded-md.shadow-lg.absolute-modal
     {:ref *el
      :class (if x-overflow-vw? "is-overflow-vw-x" "")
      :on-mouse-down (fn [e]
                       (.stopPropagation e))
      :style (merge
              {:top        (+ top offset-top (if (int? y-diff) y-diff 0))
               :max-height to-max-height
               :max-width 700
               ;; TODO: auto responsive fixed size
               :width "fit-content"
               :z-index    11}
              (when set-default-width?
                {:width max-width})
              (let [^js/HTMLElement editor
                    (js/document.querySelector ".editor-wrapper")]
                (if (<= (.-clientWidth editor) (+ left (if set-default-width? max-width 500)))
                  {:right 0}
                  {:left (if (and y-diff (= y-diff 0)) left 0)})))}
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
  [id format]
  [:div.image-uploader
   [:input
    {:id        "upload-file"
     :type      "file"
     :on-change (fn [e]
                  (let [files (.-files (.-target e))]
                    (editor-handler/upload-asset id files format editor-handler/*asset-uploading? false)))
     :hidden    true}]
   #_:clj-kondo/ignore
   (when-let [uploading? (util/react editor-handler/*asset-uploading?)]
     (let [processing (util/react editor-handler/*asset-uploading-process)]
       (transition-cp
        [:div.flex.flex-row.align-center.rounded-md.shadow-sm.bg-base-2.px-1.py-1
         (ui/loading
          (util/format "Uploading %s%" (util/format "%2d" processing)))]
        false
        *slash-caret-pos)))])

(defn- set-up-key-down!
  [state format]
  (mixins/on-key-down
   state
   {}
   {:not-matched-handler (editor-handler/keydown-not-matched-handler format)}))

(defn- set-up-key-up!
  [state input input-id search-timeout]
  (mixins/on-key-up
   state
   {}
   (editor-handler/keyup-handler state input input-id search-timeout)))

(def search-timeout (atom nil))

(defn- setup-key-listener!
  [state]
  (let [{:keys [id format]} (get-state)
        input-id id
        input (gdom/getElement input-id)]
    (set-up-key-down! state format)
    (set-up-key-up! state input input-id search-timeout)))

(def starts-with? clojure.string/starts-with?)

(defn get-editor-style-class
  "Get textarea css class according to it's content"
  [content format]
  (let [content (if content (str content) "")]
    ;; as the function is binding to the editor content, optimization is welcome
    (str
     (if (or (> (.-length content) 1000)
             (string/includes? content "\n"))
       "multiline-block"
       "uniline-block")
     " "
     (case format
       :markdown
       (cond
         (starts-with? content "# ") "h1"
         (starts-with? content "## ") "h2"
         (starts-with? content "### ") "h3"
         (starts-with? content "#### ") "h4"
         (starts-with? content "##### ") "h5"
         (starts-with? content "###### ") "h6"
         (and (starts-with? content "---\n") (.endsWith content "\n---")) "page-properties"
         :else "normal-block")
       ;; other formats
       (cond
         (and (starts-with? content "---\n") (.endsWith content "\n---")) "page-properties"
         :else "normal-block")))))

(defn editor-row-height-unchanged?
  "Check if the row height of editor textarea is changed, which happens when font-size changed"
  []
  ;; FIXME: assuming enter key is the only trigger of the height changing (under markdown editing of headlines)
  ;; FIXME: looking for an elegant & robust way to track the change of font-size, or wait for our own WYSIWYG text area
  (let [last-key (state/get-last-key-code)]
    (and (not= keycode/enter (:key-code last-key))
         (not= keycode/enter-code (:code last-key)))))

(rum/defc mock-textarea <
  rum/static
  {:did-update
   (fn [state]
     (when-not (:editor/on-paste? @state/state)
       (try (editor-handler/handle-last-input)
            (catch js/Error _e
              nil)))
     (state/set-state! :editor/on-paste? false)
     state)}
  [content]
  [:div#mock-text
   {:style {:width "100%"
            :height "100%"
            :position "absolute"
            :visibility "hidden"
            :top 0
            :left 0}}
   (let [content (str content "0")]
     (for [[idx c] (map-indexed
                    vector
                    (string/split content ""))]
       (if (= c "\n")
         [:span {:id (str "mock-text_" idx)
                 :key idx} "0" [:br]]
         [:span {:id (str "mock-text_" idx)
                 :key idx} c])))])

(rum/defc mock-textarea-wrapper < rum/reactive
  []
  (let [content (state/sub-edit-content)]
    (mock-textarea content)))

(defn animated-modal
  [key component set-default-width? *pos]
  (when *pos
    (ui/css-transition
     {:key key
      :class-names {:enter "origin-top-left opacity-0 transform scale-95"
                    :enter-done "origin-top-left transition opacity-100 transform scale-100"
                    :exit "origin-top-left transition opacity-0 transform scale-95"}
      :timeout {:enter 0
                :exit 150}}
     (fn [_]
       (absolute-modal
        component
        set-default-width?
        *pos)))))

(rum/defc modals < rum/reactive
  "React to atom changes, find and render the correct modal"
  [id format]
  (ui/transition-group
   (cond
     (and (util/react *show-commands)
          (not (state/sub :editor/show-page-search?))
          (not (state/sub :editor/show-block-search?))
          (not (state/sub :editor/show-template-search?))
          (not (state/sub :editor/show-input))
          (not (state/sub :editor/show-zotero))
          (not (state/sub :editor/show-date-picker?)))
     (animated-modal "commands" (commands id format) true (util/react *slash-caret-pos))

     (and (util/react *show-block-commands) @*angle-bracket-caret-pos)
     (animated-modal "block-commands" (block-commands id format) true (util/react *angle-bracket-caret-pos))

     (state/sub :editor/show-page-search?)
     (animated-modal "page-search" (page-search id format) true (util/react *slash-caret-pos))

     (state/sub :editor/show-block-search?)
     (animated-modal "block-search" (block-search id format) false (util/react *slash-caret-pos))

     (state/sub :editor/show-template-search?)
     (animated-modal "template-search" (template-search id format) true (util/react *slash-caret-pos))

     (state/sub :editor/show-date-picker?)
     (animated-modal "date-picker" (datetime-comp/date-picker id format nil) false (util/react *slash-caret-pos))

     (state/sub :editor/show-input)
     (animated-modal "input" (input id
                                    (fn [command m _pos]
                                      (editor-handler/handle-command-input command id format m)))
                     true (util/react *slash-caret-pos))

     (state/sub :editor/show-zotero)
     (animated-modal "zotero-search" (zotero/zotero-search id) false (util/react *slash-caret-pos))

     :else
     nil)))

(rum/defcs box < rum/reactive
  {:init (fn [state]
           (assoc state ::heading-level (:heading-level (first (:rum/args state)))
                  ::id (str (random-uuid))))
   :did-mount (fn [state]
                (state/set-editor-args! (:rum/args state))
                state)}
  (mixins/event-mixin setup-key-listener!)
  (shortcut/mixin :shortcut.handler/block-editing-only)
  lifecycle/lifecycle
  [state {:keys [format block]} id config]
  (let [content (state/sub-edit-content)
        heading-class (get-editor-style-class content format)]
    [:div.editor-inner {:class (if block "block-editor" "non-block-editor")}

     (when (= (state/sub :editor/record-status) "RECORDING")
       [:div#audio-record-toolbar
        (footer/audio-record-cp)])

     (when (and (or (mobile-util/is-native-platform?)
                    config/mobile?)
                (not (:review-cards? config)))
       (mobile-bar state id))

     (ui/ls-textarea
      {:id                id
       :cacheMeasurements (editor-row-height-unchanged?) ;; check when content updated (as the content variable is binded)
       :default-value     (or content "")
       :minRows           (if (state/enable-grammarly?) 2 1)
       :on-click          (editor-handler/editor-on-click! id)
       :on-change         (editor-handler/editor-on-change! block id search-timeout)
       :on-paste          (editor-handler/editor-on-paste! id)
       :on-height-change  (editor-handler/editor-on-height-change! id)
       :auto-focus        false
       :class             heading-class})

     (mock-textarea-wrapper)
     (modals id format)

     (when format
       (image-uploader id format))]))
