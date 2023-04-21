(ns frontend.components.editor
  (:require [clojure.string :as string]
            [frontend.commands :as commands
             :refer [*first-command-group *matched-block-commands *matched-commands]]
            [frontend.components.block :as block]
            [frontend.components.datetime :as datetime-comp]
            [frontend.components.search :as search]
            [frontend.components.svg :as svg]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [frontend.db.model :as db-model]
            [frontend.extensions.zotero :as zotero]
            [frontend.handler.editor :as editor-handler :refer [get-state]]
            [frontend.handler.editor.lifecycle :as lifecycle]
            [frontend.handler.page :as page-handler]
            [frontend.handler.paste :as paste-handler]
            [frontend.mixins :as mixins]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [frontend.util.keycode :as keycode]
            [goog.dom :as gdom]
            [goog.string :as gstring]
            [logseq.graph-parser.property :as gp-property]
            [logseq.graph-parser.util :as gp-util]
            [promesa.core :as p]
            [react-draggable]
            [rum.core :as rum]))

(rum/defc commands < rum/reactive
  [id format]
  (when (= :commands (state/sub :editor/action))
    (let [matched (util/react *matched-commands)]
      (ui/auto-complete
       matched
       {:get-group-name
        (fn [item]
          (get *first-command-group (first item)))

        :item-render
        (fn [item]
          (let [command-name (first item)
                command-doc  (get item 2)
                plugin-id    (get-in item [1 1 1 :pid])
                doc          (when (state/show-command-doc?) command-doc)]
            (cond
              (or plugin-id (vector? doc))
              [:div.has-help
               command-name
               (when doc (ui/tippy
                          {:html            doc
                           :interactive     true
                           :fixed-position? true
                           :position        "right"}

                          [:small (svg/help-circle)]))
               (when plugin-id
                 [:small {:title (str plugin-id)} (ui/icon "puzzle")])]

              (string? doc)
              [:div {:title doc}
               command-name]

              :else
              [:div command-name])))

        :on-chosen
        (fn [chosen-item]
          (let [command (first chosen-item)]
            (reset! commands/*current-command command)
            (let [command-steps  (get (into {} matched) command)
                  restore-slash? (or
                                  (contains? #{"Today" "Yesterday" "Tomorrow" "Current time"} command)
                                  (and
                                   (not (fn? command-steps))
                                   (not (contains? (set (map first command-steps)) :editor/input))
                                   (not (contains? #{"Date picker" "Template" "Deadline" "Scheduled" "Upload an image"} command))))]
              (editor-handler/insert-command! id command-steps
                                              format
                                              {:restore? restore-slash?
                                               :command  command}))))
        :class
        "black"}))))

(rum/defc block-commands < rum/reactive
  [id format]
  (when (= :block-commands (state/get-editor-action))
    (let [matched (util/react *matched-block-commands)]
      (ui/auto-complete
       (map first matched)
       {:on-chosen (fn [chosen]
                     (editor-handler/insert-command! id (get (into {} matched) chosen)
                                                     format
                                                     {:last-pattern commands/angle-bracket
                                                      :command :block-commands}))
        :class     "black"}))))

(defn- in-sidebar? [el]
  (not (.contains (.getElementById js/document "left-container") el)))

(rum/defc page-search < rum/reactive
  "Embedded page searching popup"
  [id format]
  (let [action (state/sub :editor/action)]
    (when (contains? #{:page-search :page-search-hashtag} action)
      (let [pos (state/get-editor-last-pos)
            input (gdom/getElement id)]
        (when input
          (let [current-pos (cursor/pos input)
                edit-content (or (state/sub [:editor/content id]) "")
                sidebar? (in-sidebar? input)
                q (or
                   (editor-handler/get-selected-text)
                   (when (= action :page-search-hashtag)
                     (gp-util/safe-subs edit-content pos current-pos))
                   (when (> (count edit-content) current-pos)
                     (gp-util/safe-subs edit-content pos current-pos))
                   "")
                matched-pages (when-not (string/blank? q)
                                (editor-handler/get-matched-pages q))
                matched-pages (cond
                                (contains? (set (map util/page-name-sanity-lc matched-pages))
                                           (util/page-name-sanity-lc (string/trim q)))  ;; if there's a page name fully matched
                                (sort-by (fn [m]
                                           [(count m) m])
                                         matched-pages)

                                (string/blank? q)
                                nil

                                (empty? matched-pages)
                                (cons (str (t :new-page) ": " q) matched-pages)

                               ;; reorder, shortest and starts-with first.
                                :else
                                (let [matched-pages (remove nil? matched-pages)
                                      matched-pages (sort-by
                                                     (fn [m]
                                                       [(not (gstring/caseInsensitiveStartsWith m q)) (count m) m])
                                                     matched-pages)]
                                  (if (gstring/caseInsensitiveStartsWith (first matched-pages) q)
                                    (cons (first matched-pages)
                                          (cons  (str (t :new-page) ": " q) (rest matched-pages)))
                                    (cons (str (t :new-page) ": " q) matched-pages))))]
            (ui/auto-complete
             matched-pages
             {:on-chosen   (page-handler/on-chosen-handler input id q pos format)
              :on-enter    #(page-handler/page-not-exists-handler input id q current-pos)
              :item-render (fn [page-name chosen?]
                             [:div.preview-trigger-wrapper
                              (block/page-preview-trigger
                               {:children
                                [:div.flex
                                 (when (db-model/whiteboard-page? page-name) [:span.mr-1 (ui/icon "whiteboard" {:extension? true})])
                                 (search/highlight-exact-query page-name q)]
                                :open?           chosen?
                                :manual?         true
                                :fixed-position? true
                                :tippy-distance  24
                                :tippy-position  (if sidebar? "left" "right")}
                               page-name)])
              :empty-placeholder [:div.text-gray-500.text-sm.px-4.py-2 "Search for a page"]
              :class       "black"})))))))

(defn- search-blocks!
  [state result]
  (let [[edit-block _ _ q] (:rum/args state)]
    (p/let [matched-blocks (when-not (string/blank? q)
                             (editor-handler/get-matched-blocks q (:block/uuid edit-block)))]
      (reset! result matched-blocks))))

(rum/defcs block-search-auto-complete < rum/reactive
  {:init (fn [state]
           (let [result (atom nil)]
             (search-blocks! state result)
             (assoc state ::result result)))
   :did-update (fn [state]
                 (search-blocks! state (::result state))
                 state)}
  [state _edit-block input id q format selected-text]
  (let [result (->> (rum/react (get state ::result))
                    (remove (fn [b] (string/blank? (:block/content (db-model/query-block-by-uuid (:block/uuid b)))))))
        chosen-handler (editor-handler/block-on-chosen-handler id q format selected-text)
        non-exist-block-handler (editor-handler/block-non-exist-handler input)]
    (ui/auto-complete
     result
     {:on-chosen   chosen-handler
      :on-enter    non-exist-block-handler
      :empty-placeholder   [:div.text-gray-500.text-sm.px-4.py-2 (t :editor/block-search)]
      :item-render (fn [{:block/keys [page uuid]}]  ;; content returned from search engine is normalized
                     (let [page (or (:block/original-name page)
                                    (:block/name page))
                           repo (state/sub :git/current-repo)
                           format (db/get-page-format page)
                           block (db-model/query-block-by-uuid uuid)
                           content (:block/content block)]
                       (when-not (string/blank? content)
                         [:.py-2 (search/block-search-result-item repo uuid format content q :block)])))
      :class       "ac-block-search"})))

(rum/defcs block-search < rum/reactive
  {:will-unmount (fn [state]
                   (state/clear-search-result!)
                   state)}
  [state id _format]
  (when (= :block-search (state/sub :editor/action))
    (let [pos (state/get-editor-last-pos)
          input (gdom/getElement id)
          [id format] (:rum/args state)
          current-pos (cursor/pos input)
          edit-content (state/sub [:editor/content id])
          edit-block (state/get-edit-block)
          selected-text (editor-handler/get-selected-text)
          q (or
             selected-text
             (when (> (count edit-content) current-pos)
               (subs edit-content pos current-pos)))]
      (when input
        (block-search-auto-complete edit-block input id q format selected-text)))))

(rum/defc template-search < rum/reactive
  [id _format]
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
                                (state/clear-editor-action!))]
        (ui/auto-complete
         matched-templates
         {:on-chosen   (editor-handler/template-on-chosen-handler id)
          :on-enter    non-exist-handler
          :empty-placeholder [:div.text-gray-500.px-4.py-2.text-sm "Search for a template"]
          :item-render (fn [[template _block-db-id]]
                         template)
          :class       "black"})))))

(rum/defc property-search < rum/reactive
  [id]
  (let [input (gdom/getElement id)]
    (when input
      (let [q (or (:searching-property (editor-handler/get-searching-property input))
                  "")
            matched-properties (editor-handler/get-matched-properties q)
            q-property (string/replace (string/lower-case q) #"\s+" "-")
            non-exist-handler (fn [_state]
                                ((editor-handler/property-on-chosen-handler id q-property) nil))]
        (ui/auto-complete
         matched-properties
         {:on-chosen (editor-handler/property-on-chosen-handler id q-property)
          :on-enter non-exist-handler
          :empty-placeholder [:div.px-4.py-2.text-sm (str "Create a new property: " q-property)]
          :header [:div.px-4.py-2.text-sm.font-medium "Matched properties: "]
          :item-render (fn [property] property)
          :class       "black"})))))

(rum/defc property-value-search < rum/reactive
  [id]
  (let [property (:property (state/get-editor-action-data))
        input (gdom/getElement id)]
    (when (and input
               (not (string/blank? property)))
      (let [current-pos (cursor/pos input)
            edit-content (state/sub [:editor/content id])
            start-idx (string/last-index-of (subs edit-content 0 current-pos)
                                            gp-property/colons)
            q (or
               (when (>= current-pos (+ start-idx 2))
                 (subs edit-content (+ start-idx 2) current-pos))
               "")
            q (string/triml q)
            matched-values (editor-handler/get-matched-property-values property q)
            non-exist-handler (fn [_state]
                                ((editor-handler/property-value-on-chosen-handler id q) nil))]
        (ui/auto-complete
         matched-values
         {:on-chosen (editor-handler/property-value-on-chosen-handler id q)
          :on-enter non-exist-handler
          :empty-placeholder [:div.px-4.py-2.text-sm (str "Create a new property value: " q)]
          :header [:div.px-4.py-2.text-sm.font-medium "Matched property values: "]
          :item-render (fn [property-value] property-value)
          :class       "black"})))))

(rum/defcs input < rum/reactive
  (rum/local {} ::input-value)
  (mixins/event-mixin
   (fn [state]
     (mixins/on-key-down
      state
      {;; enter
       13 (fn [state e]
            (let [input-value (get state ::input-value)
                  input-option (:options (state/get-editor-show-input))]
              (when (seq @input-value)
                ;; no new line input
                (util/stop e)
                (let [[_id on-submit] (:rum/args state)
                      command (:command (first input-option))]
                  (on-submit command @input-value))
                (reset! input-value nil))))
       ;; escape
       27 (fn [_state _e]
            (let [[id _on-submit on-cancel] (:rum/args state)]
              (on-cancel id)))})))
  [state _id on-submit _on-cancel]
  (when (= :input (state/sub :editor/action))
    (when-let [action-data (state/sub :editor/action-data)]
      (let [{:keys [pos options]} action-data
            input-value (get state ::input-value)]
        (when (seq options)
          (let [command (:command (first options))]
            [:div.p-2.rounded-md.shadow-lg
             (for [{:keys [id placeholder type autoFocus] :as input-item} options]
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
                 (on-submit command @input-value pos)))]))))))

(rum/defc absolute-modal < rum/static
  [cp modal-name set-default-width? {:keys [top left rect]}]
  (let [MAX-HEIGHT 700
        MAX-HEIGHT' 600
        MAX-WIDTH 600
        SM-MAX-WIDTH 300
        Y-BOUNDARY-HEIGHT 150
        vw-width js/window.innerWidth
        vw-height js/window.innerHeight
        vw-max-width (- vw-width (:left rect))
        vw-max-height (- vw-height (:top rect))
        vw-max-height' (:top rect)
        sm? (< vw-width 415)
        max-height (min (- vw-max-height 20) MAX-HEIGHT)
        max-height' (min (- vw-max-height' 70) MAX-HEIGHT')
        max-width (if sm? SM-MAX-WIDTH (min (max 400 (/ vw-max-width 2)) MAX-WIDTH))
        offset-top 24
        to-max-height (cond-> (if (and (seq rect) (> vw-height max-height))
                                (let [delta-height (- vw-height (+ (:top rect) top offset-top))]
                                  (if (< delta-height max-height)
                                    (- (max (* 2 offset-top) delta-height) 16)
                                    max-height))
                                max-height)

                              (= modal-name "commands")
                              (min 500))
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
        y-overflow-vh? (or (< to-max-height Y-BOUNDARY-HEIGHT)
                           (> (- max-height' to-max-height) Y-BOUNDARY-HEIGHT))
        to-max-height (if y-overflow-vh? max-height' to-max-height)
        pos-rect (when (and (seq rect) editing-key)
                   (:rect (cursor/get-caret-pos (state/get-input))))
        y-diff (when pos-rect (- (:height pos-rect) (:height rect)))
        style (merge
               {:top        (+ top offset-top (if (int? y-diff) y-diff 0))
                :max-height to-max-height
                :max-width 700
                ;; TODO: auto responsive fixed size
                :width "fit-content"
                :z-index    11}
               (when set-default-width?
                 {:width max-width})
               (if (<= vw-max-width (+ left (if set-default-width? max-width 500)))
                 {:right 0}
                 {:left (if (or (nil? y-diff) (and y-diff (= y-diff 0))) left 0)}))]
    [:div.absolute.rounded-md.shadow-lg.absolute-modal
     {:ref *el
      :data-modal-name modal-name
      :class (if y-overflow-vh? "is-overflow-vh-y" "")
      :on-mouse-down (fn [e]
                       (.stopPropagation e))
      :style style}
     cp]))

(rum/defc transition-cp < rum/reactive
  [cp modal-name set-default-width?]
  (when-let [pos (:pos (state/sub :editor/action-data))]
    (ui/css-transition
     {:class-names "fade"
      :timeout     {:enter 500
                    :exit  300}}
     (absolute-modal cp modal-name set-default-width? pos))))

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
        "upload-file"
        false)))])

(defn- set-up-key-down!
  [state format]
  (mixins/on-key-down
   state
   {}
   {:not-matched-handler (editor-handler/keydown-not-matched-handler format)}))

(defn- set-up-key-up!
  [state input input-id]
  (mixins/on-key-up
   state
   {}
   (editor-handler/keyup-handler state input input-id)))

(def search-timeout (atom nil))

(defn- setup-key-listener!
  [state]
  (let [{:keys [id format]} (get-state)
        input-id id
        input (gdom/getElement input-id)]
    (set-up-key-down! state format)
    (set-up-key-up! state input input-id)))

(defn get-editor-style-class
  "Get textarea css class according to it's content"
  [block content format]
  (let [content (if content (str content) "")
        heading (-> block :block/properties :heading)
        heading (if (true? heading)
                  (min (inc (:block/level block)) 6)
                  heading)]
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
         heading (str "h" heading)
         (string/starts-with? content "# ") "h1"
         (string/starts-with? content "## ") "h2"
         (string/starts-with? content "### ") "h3"
         (string/starts-with? content "#### ") "h4"
         (string/starts-with? content "##### ") "h5"
         (string/starts-with? content "###### ") "h6"
         (and (string/starts-with? content "---\n") (.endsWith content "\n---")) "page-properties"
         :else "normal-block")
       ;; other formats
       (cond
         heading (str "h" heading)
         (and (string/starts-with? content "---\n") (.endsWith content "\n---")) "page-properties"
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
            (catch :default _e
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

(rum/defc animated-modal < rum/reactive
  [modal-name component set-default-width?]
  (when-let [pos (:pos (state/get-editor-action-data))]
    (ui/css-transition
     {:key modal-name
      :class-names {:enter "origin-top-left opacity-0 transform scale-95"
                    :enter-done "origin-top-left transition opacity-100 transform scale-100"
                    :exit "origin-top-left transition opacity-0 transform scale-95"}
      :timeout {:enter 0
                :exit 150}}
     (fn [_]
       (absolute-modal
        component
        modal-name
        set-default-width?
        pos)))))

(rum/defc modals < rum/reactive
  "React to atom changes, find and render the correct modal"
  [id format]
  (let [action (state/sub :editor/action)]
    (cond
      (= action :commands)
      (animated-modal "commands" (commands id format) true)

      (= action :block-commands)
      (animated-modal "block-commands" (block-commands id format) true)

      (contains? #{:page-search :page-search-hashtag} action)
      (animated-modal "page-search" (page-search id format) true)

      (= :block-search action)
      (animated-modal "block-search" (block-search id format) true)

      (= :template-search action)
      (animated-modal "template-search" (template-search id format) true)

      (= :property-search action)
      (animated-modal "property-search" (property-search id) true)

      (= :property-value-search action)
      (animated-modal "property-value-search" (property-value-search id) true)

      ;; date-picker in editing-mode
      (= :datepicker action)
      (animated-modal "date-picker" (datetime-comp/date-picker id format nil) false)

      (= :input action)
      (animated-modal "input" (input id
                                     (fn [command m]
                                       (editor-handler/handle-command-input command id format m))
                                     (fn []
                                       (editor-handler/handle-command-input-close id)))
                      true)

      (= :zotero action)
      (animated-modal "zotero-search" (zotero/zotero-search id) false)

      :else
      nil)))

(rum/defcs box < rum/reactive
  {:init (fn [state]
           (assoc state
                  ::id (str (random-uuid))))
   :did-mount (fn [state]
                (state/set-editor-args! (:rum/args state))
                state)}
  (mixins/event-mixin setup-key-listener!)
  (shortcut/mixin :shortcut.handler/block-editing-only)
  lifecycle/lifecycle
  [state {:keys [format block]} id _config]
  (let [content (state/sub-edit-content id)
        heading-class (get-editor-style-class block content format)]
    [:div.editor-inner {:class (if block "block-editor" "non-block-editor")}

     (ui/ls-textarea
      {:id                id
       :cacheMeasurements (editor-row-height-unchanged?) ;; check when content updated (as the content variable is binded)
       :default-value     (or content "")
       :minRows           (if (state/enable-grammarly?) 2 1)
       :on-click          (editor-handler/editor-on-click! id)
       :on-change         (editor-handler/editor-on-change! block id search-timeout)
       :on-paste          (paste-handler/editor-on-paste! id)
       :auto-focus        false
       :class             heading-class})

     (mock-textarea content)
     (modals id format)

     (when format
       (image-uploader id format))]))
