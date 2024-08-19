(ns frontend.components.editor
  (:require [clojure.string :as string]
            [frontend.commands :as commands
             :refer [*matched-block-commands *matched-commands]]
            [frontend.components.datetime :as datetime-comp]
            [frontend.components.svg :as svg]
            [frontend.components.search :as search]
            [frontend.components.title :as title]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [logseq.db :as ldb]
            [frontend.db.model :as db-model]
            [frontend.extensions.zotero :as zotero]
            [frontend.handler.editor :as editor-handler :refer [get-state]]
            [frontend.handler.editor.lifecycle :as lifecycle]
            [frontend.handler.page :as page-handler]
            [frontend.handler.paste :as paste-handler]
            [frontend.handler.property.util :as pu]
            [frontend.handler.search :as search-handler]
            [frontend.search :refer [fuzzy-search]]
            [frontend.mixins :as mixins]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [logseq.shui.ui :as shui]
            [logseq.shui.popup.core :as shui-popup]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [frontend.util.keycode :as keycode]
            [goog.dom :as gdom]
            [goog.string :as gstring]
            [dommy.core :as dom]
            [logseq.graph-parser.property :as gp-property]
            [logseq.common.util :as common-util]
            [promesa.core :as p]
            [react-draggable]
            [rum.core :as rum]
            [frontend.config :as config]))

(rum/defcs commands < rum/reactive
  (rum/local [] ::matched-commands)
  [s id format]
  (let [matched' (util/react *matched-commands)
        *matched (::matched-commands s)
        _ (when (state/get-editor-action)
            (reset! *matched matched'))
        matched @*matched]
    (ui/auto-complete
      matched
      {:get-group-name
       (fn [item]
         (when (= (count item) 5) (last item)))

       :item-render
       (fn [item]
         (let [command-name (first item)
               command-doc (get item 2)
               plugin-id (get-in item [1 1 1 :pid])
               doc (when (state/show-command-doc?) command-doc)
               options (some-> item (get 3))
               icon-name (some-> (if (map? options) (:icon options) options) (name))
               command-name (if icon-name
                              [:span.flex.items-center.gap-1
                               (shui/tabler-icon icon-name)
                               [:strong.font-normal command-name]]
                              command-name)]
           (cond
             (or plugin-id (vector? doc))
             [:div.has-help
              {:title plugin-id}
              command-name
              (when doc (ui/tippy
                          {:html doc
                           :interactive true
                           :fixed-position? true
                           :position "right"}

                          [:small (svg/help-circle)]))]

             (string? doc)
             [:div {:title doc}
              command-name]

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
               {:restore? restore-slash?
                :command command}))))
       :class
       "cp__commands-slash"})))

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
         :class "black"}))))

(defn- page-on-chosen-handler
  [embed? input id q pos format]
  (if embed?
    (fn [chosen-item _e]
      (let [value (.-value input)
            value' (str (common-util/safe-subs value 0 q)
                     (common-util/safe-subs value (+ (count q) 4 pos)))]
        (state/set-edit-content! (.-id input) value')
        (state/clear-editor-action!)
        (p/let [page (db/get-page chosen-item)
                _ (when-not page (page-handler/<create! chosen-item {:redirect? false
                                                                     :create-first-block? false}))
                page' (db/get-page chosen-item)
                current-block (state/get-edit-block)]
          (editor-handler/api-insert-new-block! chosen-item
                                                {:block-uuid (:block/uuid current-block)
                                                 :sibling? true
                                                 :replace-empty-target? true
                                                 :other-attrs {:block/link (:db/id page')}}))))
    (page-handler/on-chosen-handler input id q pos format)))

(rum/defc page-search-aux
  [id format embed? db-tag? q current-pos input pos]
  (let [db? (config/db-based-graph? (state/get-current-repo))
        [matched-pages set-matched-pages!] (rum/use-state nil)]
    (rum/use-effect! (fn []
                       (when-not (string/blank? q)
                         (p/let [result (if db-tag?
                                          (editor-handler/get-matched-classes q)
                                          (editor-handler/<get-matched-blocks q))]
                           (set-matched-pages! result))))
                     [q])
    (let [matched-pages (when-not (string/blank? q)
                          ;; reorder, shortest and starts-with first.
                          (let [matched-pages-with-new-page
                                (fn [partial-matched-pages]
                                  (if (db/page-exists? q (if db-tag? "class" "page"))
                                    partial-matched-pages
                                    (if db-tag?
                                      (concat [{:block/title (str (t :new-tag) " " q)}]
                                              partial-matched-pages)
                                      (cons {:block/title (str (t :new-page) " " q)}
                                            partial-matched-pages))))]
                            (if (and (seq matched-pages)
                                     (gstring/caseInsensitiveStartsWith (:block/title (first matched-pages)) q))
                              (cons (first matched-pages)
                                    (matched-pages-with-new-page (rest matched-pages)))
                              (matched-pages-with-new-page matched-pages))))]
      [:<>
       (ui/auto-complete
        matched-pages
        {:on-chosen   (page-on-chosen-handler embed? input id q pos format)
         :on-enter    (fn []
                        (page-handler/page-not-exists-handler input id q current-pos))
         :item-render (fn [block _chosen?]
                        [:div.flex.flex-row.items-center.gap-1
                         (when-not db-tag?
                           (cond
                             (ldb/class? block)
                             [:div (ui/icon "hash" {:size 14})]
                             (ldb/property? block)
                             [:div (ui/icon "letter-p" {:size 14})]
                             (db-model/whiteboard-page? block)
                             [:div (ui/icon "whiteboard" {:extension? true})]
                             (db/page? block)
                             [:div (ui/icon "page" {:extension? true})]
                             (or (string/starts-with? (:block/title block) (t :new-tag))
                                 (string/starts-with? (:block/title block) (t :new-page)))
                             nil
                             :else
                             [:div (ui/icon "letter-n" {:size 14})]))

                         (let [title (if db-tag?
                                       (:block/title block)
                                       (title/block-unique-title block))]
                           (search-handler/highlight-exact-query title q))])
         :empty-placeholder [:div.text-gray-500.text-sm.px-4.py-2 (if db-tag?
                                                                    "Search for a tag"
                                                                    "Search for a node")]
         :class       "black"})

       (when (and db? db-tag? (not (string/blank? q)))
         [:p.px-1.opacity-50.text-sm
          [:code (if util/mac? "Cmd+Enter" "Ctrl+Enter")]
          [:span " to display this tag inline instead of at the end of this node."]])])))

(rum/defc page-search < rum/reactive
  {:will-unmount (fn [state]
                   (reset! commands/*current-command nil)
                   state)}
  "Page or tag searching popup"
  [id format]
  (let [action (state/sub :editor/action)
        db? (config/db-based-graph? (state/get-current-repo))
        embed? (and db? (= @commands/*current-command "Page embed"))
        tag? (= action :page-search-hashtag)
        db-tag? (and db? tag?)]
    (let [pos (state/get-editor-last-pos)
          input (gdom/getElement id)]
      (when input
        (let [current-pos (cursor/pos input)
              edit-content (state/sub-edit-content)
              q (or
                  (editor-handler/get-selected-text)
                  (when (= action :page-search-hashtag)
                    (common-util/safe-subs edit-content pos current-pos))
                  (when (> (count edit-content) current-pos)
                    (common-util/safe-subs edit-content pos current-pos))
                  "")]
          (page-search-aux id format embed? db-tag? q current-pos input pos))))))

(defn- search-blocks!
  [state result]
  (let [[_edit-block _ _ q] (:rum/args state)]
    (p/let [matched-blocks (when-not (string/blank? q)
                             (editor-handler/<get-matched-blocks q))]
      (reset! result matched-blocks))))

(defn- block-on-chosen-handler
  [embed? input id q format selected-text]
  (if embed?
    (fn [chosen-item]
      (let [pos (state/get-editor-last-pos)
            value (.-value input)
            value' (str (common-util/safe-subs value 0 q)
                        (common-util/safe-subs value (+ (count q) 4 pos)))]
        (state/set-edit-content! (.-id input) value')
        (state/clear-editor-action!)
        (let [current-block (state/get-edit-block)
              id (:block/uuid chosen-item)
              id (if (string? id) (uuid id) id)]
          (p/do!
           (editor-handler/api-insert-new-block! ""
                                                 {:block-uuid (:block/uuid current-block)
                                                  :sibling? true
                                                  :replace-empty-target? true
                                                  :other-attrs {:block/link (:db/id (db/entity [:block/uuid id]))}})
           (state/clear-edit!)))))
    (editor-handler/block-on-chosen-handler id q format selected-text)))

;; TODO: use rum/use-effect instead
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
                    (remove (fn [b] (string/blank? (:block/title (db-model/query-block-by-uuid (:block/uuid b)))))))
        db? (config/db-based-graph? (state/get-current-repo))
        embed? (and db? (= @commands/*current-command "Block embed"))
        chosen-handler (block-on-chosen-handler embed? input id q format selected-text)
        non-exist-block-handler (editor-handler/block-non-exist-handler input)]
    (ui/auto-complete
     result
     {:on-chosen   chosen-handler
      :on-enter    non-exist-block-handler
      :empty-placeholder   [:div.text-gray-500.text-sm.px-4.py-2 (t :editor/block-search)]
      :item-render (fn [{:block/keys [page uuid]}]  ;; content returned from search engine is normalized
                     (let [page-entity (db/entity [:block/uuid page])
                           repo (state/sub :git/current-repo)
                           format (get page-entity :block/format :markdown)
                           block (db-model/query-block-by-uuid uuid)
                           content (:block/title block)]
                       (when-not (string/blank? content)
                         [:.py-2 (search/block-search-result-item repo uuid format content q :block)])))
      :class       "ac-block-search"})))

(rum/defcs block-search < rum/reactive
  {:will-unmount (fn [state]
                   (reset! commands/*current-command nil)
                   (state/clear-search-result!)
                   state)}
  [state id _format]
  (let [pos (state/get-editor-last-pos)
        input (gdom/getElement id)
        [id format] (:rum/args state)
        current-pos (cursor/pos input)
        edit-content (state/sub-edit-content)
        edit-block (state/get-edit-block)
        selected-text (editor-handler/get-selected-text)
        q (or
            selected-text
            (when (>= (count edit-content) current-pos)
              (subs edit-content pos current-pos)))]
    (when input
      (block-search-auto-complete edit-block input id q format selected-text))))

(rum/defc template-search-aux
  [id q]
  (let [[matched-templates set-matched-templates!] (rum/use-state nil)]
    (rum/use-effect! (fn []
                       (p/let [result (editor-handler/<get-matched-templates q)]
                         (set-matched-templates! result)))
                     [q])
    (ui/auto-complete
     matched-templates
     {:on-chosen   (editor-handler/template-on-chosen-handler id)
      :on-enter    (fn [_state] (state/clear-editor-action!))
      :empty-placeholder [:div.text-gray-500.px-4.py-2.text-sm "Search for a template"]
      :item-render (fn [[template _block-db-id]]
                     template)
      :class       "black"})))

(rum/defc template-search < rum/reactive
  [id _format]
  (let [pos (state/get-editor-last-pos)
        input (gdom/getElement id)]
    (when input
      (let [current-pos (cursor/pos input)
            edit-content (state/sub-edit-content)
            q (or
               (when (>= (count edit-content) current-pos)
                 (subs edit-content pos current-pos))
               "")]
        (template-search-aux id q)))))

(rum/defc property-search
  [id]
  (let [input (gdom/getElement id)
        [matched-properties set-matched-properties!] (rum/use-state nil)]
    (when input
      (let [q (or (:searching-property (editor-handler/get-searching-property input))
                  "")]
        (rum/use-effect!
         (fn []
           (p/let [matched-properties (editor-handler/<get-matched-properties q)]
             (set-matched-properties! matched-properties)))
         [q])
        (let [q-property (string/replace (string/lower-case q) #"\s+" "-")
              non-exist-handler (fn [_state]
                                  ((editor-handler/property-on-chosen-handler id q-property) nil))]
          (ui/auto-complete
           matched-properties
           {:on-chosen (editor-handler/property-on-chosen-handler id q-property)
            :on-enter non-exist-handler
            :empty-placeholder [:div.px-4.py-2.text-sm (str "Create a new property: " q-property)]
            :header [:div.px-4.py-2.text-sm.font-medium "Matched properties: "]
            :item-render (fn [property] property)
            :class       "black"}))))))

(rum/defc property-value-search-aux
  [id property q]
  (let [[values set-values!] (rum/use-state nil)]
    (rum/use-effect!
     (fn []
       (p/let [result (editor-handler/get-matched-property-values property q)]
         (set-values! result)))
     [property q])
    (ui/auto-complete
         values
         {:on-chosen (editor-handler/property-value-on-chosen-handler id q)
          :on-enter (fn [_state]
                      ((editor-handler/property-value-on-chosen-handler id q) nil))
          :empty-placeholder [:div.px-4.py-2.text-sm (str "Create a new property value: " q)]
          :header [:div.px-4.py-2.text-sm.font-medium "Matched property values: "]
          :item-render (fn [property-value] property-value)
          :class       "black"})))

(rum/defc property-value-search < rum/reactive
  [id]
  (let [property (:property (state/get-editor-action-data))
        input (gdom/getElement id)]
    (when (and input
               (not (string/blank? property)))
      (let [current-pos (cursor/pos input)
            edit-content (state/sub-edit-content)
            start-idx (string/last-index-of (subs edit-content 0 current-pos)
                                            gp-property/colons)
            q (or
               (when (>= current-pos (+ start-idx 2))
                 (subs edit-content (+ start-idx 2) current-pos))
               "")
            q (string/triml q)]
        (property-value-search-aux id property q)))))

(rum/defc code-block-mode-keyup-listener
  [_q _edit-content last-pos current-pos]
  (rum/use-effect!
    (fn []
      (when (< current-pos last-pos)
        (state/clear-editor-action!)))
    [last-pos current-pos])
  [:<>])

(rum/defc code-block-mode-picker < rum/reactive
  [id format]
  (when-let [modes (some->> js/window.CodeMirror (.-modes) (js/Object.keys) (js->clj) (remove #(= "null" %)))]
    (when-let [^js input (gdom/getElement id)]
      (let [pos          (state/get-editor-last-pos)
            current-pos  (cursor/pos input)
            edit-content (or (state/sub-edit-content) "")
            q            (or (editor-handler/get-selected-text)
                             (common-util/safe-subs edit-content pos current-pos)
                             "")
            matched      (seq (fuzzy-search modes q))
            matched      (or matched (if (string/blank? q) modes [q]))]
        [:div
         (code-block-mode-keyup-listener q edit-content pos current-pos)
         (ui/auto-complete matched
                           {:on-chosen   (fn [chosen _click?]
                                           (state/clear-editor-action!)
                                           (let [prefix (str "```" chosen)
                                                 last-pattern (str "```" q)]
                                             (editor-handler/insert-command! id
                                                                             prefix format {:last-pattern last-pattern})
                                             (-> (editor-handler/save-block!
                                                   (state/get-current-repo)
                                                   (:block/uuid (state/get-edit-block))
                                                   (.-value input))
                                               (p/then #(commands/handle-step [:codemirror/focus])))
                                             ))
                            :on-enter (fn []
                                        (state/clear-editor-action!)
                                        (commands/handle-step [:codemirror/focus]))
                            :item-render (fn [mode _chosen?]
                                           [:strong mode])
                            :class "code-block-mode-picker"})]))))

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
  (when-let [action-data (state/get-editor-action-data)]
    (let [{:keys [pos options]} action-data
          input-value (get state ::input-value)]
      (when (seq options)
        (let [command (:command (first options))]
          [:div.p-2.rounded-md.flex.flex-col.gap-2
           (for [{:keys [id placeholder type]} options]
             (shui/input
               (cond->
                 {:key (str "modal-input-" (name id))
                  :type (or type "text")
                  :auto-complete (if (util/chrome?) "chrome-off" "off")
                  :on-change (fn [e]
                               (swap! input-value assoc id (util/evalue e)))}

                 placeholder
                 (assoc :placeholder placeholder))))
           (ui/button
             "Submit"
             :on-click
             (fn [e]
               (util/stop e)
               (on-submit command @input-value pos)))])))))

(rum/defc image-uploader < rum/reactive
  [id format]
  [:div.image-uploader
   [:input
    {:id "upload-file"
     :type "file"
     :on-change (fn [e]
                  (let [files (.-files (.-target e))]
                    (editor-handler/upload-asset! id files format editor-handler/*asset-uploading? false)))
     :hidden true}]])

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
        heading (pu/get-block-property-value block :logseq.property/heading)
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
     (when-not @(:editor/on-paste? @state/state)
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
   (let [content (str content "0")
         graphemes (util/split-graphemes content)
         graphemes-char-index (reductions #(+ %1 (count %2)) 0 graphemes)]
     (for [[idx c] (into (sorted-map) (zipmap graphemes-char-index graphemes))]
       (if (= c "\n")
         [:span {:id (str "mock-text_" idx)
                 :key idx} "0" [:br]]
         [:span {:id (str "mock-text_" idx)
                 :key idx} c])))])

(defn- exist-editor-commands-popup?
  []
  (some->> (shui-popup/get-popups)
    (some #(some-> % (:id) (str) (string/starts-with? ":editor.commands")))))

(defn- open-editor-popup!
  [id content opts]
  (let [{:keys [left top rect]} (cursor/get-caret-pos (state/get-input))
        pos [(+ left (:left rect) -20) (+ top (:top rect) 20)]
        {:keys [root-props content-props]} opts]
    (shui/popup-show!
      pos content
      (merge
        {:id (keyword :editor.commands id)
         :align :start
         :root-props (merge {:onOpenChange #(when-not % (state/clear-editor-action!))} root-props)
         :content-props (merge {:onOpenAutoFocus #(.preventDefault %)
                                :onCloseAutoFocus #(.preventDefault %)
                                :data-editor-popup-ref (name id)} content-props)
         :force-popover? true}
        (dissoc opts :root-props :content-props)))))

(rum/defc shui-editor-popups
  [id format action _data]
  (rum/use-effect!
    (fn []
      (let [pid (case action
                  :commands
                  (open-editor-popup! :commands
                    (commands id format)
                    {:content-props {:withoutAnimation false}})

                  :block-commands
                  (open-editor-popup! :block-commands
                    (block-commands id format)
                    {:content-props {:withoutAnimation true}})

                  (:block-search :page-search :page-search-hashtag)
                  (open-editor-popup! action
                    (if (= :block-search action)
                      (block-search id format)
                      (page-search id format))
                    {:root-props {:onOpenChange
                                  #(when-not %
                                     (when (contains?
                                             #{:block-search :page-search :page-search-hashtag}
                                             (state/get-editor-action))
                                       (state/clear-editor-action!)))}})

                  :datepicker
                  (open-editor-popup! :datepicker
                    (datetime-comp/date-picker id format nil) {})

                  :input
                  (open-editor-popup! :input
                    (input id
                      (fn [command m]
                        (editor-handler/handle-command-input command id format m))
                      (fn []
                        (editor-handler/handle-command-input-close id)))
                    {:content-props {:onOpenAutoFocus #()}})

                  :select-code-block-mode
                  (open-editor-popup! :code-block-mode-picker
                    (code-block-mode-picker id format) {})

                  :template-search
                  (open-editor-popup! :template-search
                    (template-search id format) {})

                  (:property-search :property-value-search)
                  (open-editor-popup! action
                    (if (= :property-search action)
                      (property-search id) (property-value-search id))
                    {})

                  :zotero
                  (open-editor-popup! :zotero
                    (zotero/zotero-search id) {})

                  ;; TODO: try remove local model state
                  false)]
        #(when pid
           (shui/popup-hide! pid))))
    [action])
  [:<>])

(rum/defc command-popups <
  rum/reactive
  "React to atom changes, find and render the correct popup"
  [id format]
  (let [action (state/sub :editor/action)]
    (shui-editor-popups id format action nil)))

(defn- editor-on-hide
  [state value* type e]
  (let [repo (state/get-current-repo)
        action (state/get-editor-action)
        [opts _id config] (:rum/args state)
        block (:block opts)
        value (or value* "")]
    (cond
      (and (= type :esc) (exist-editor-commands-popup?))
      nil

      (or (contains?
           #{:commands :block-commands
             :page-search :page-search-hashtag :block-search :template-search
             :property-search :property-value-search
             :datepicker} action)
          (and (keyword? action)
               (= (namespace action) "editor.action")))
      (when e (util/stop e))

      ;; editor/input component handles Escape directly, so just prevent handling it here
      (= :input action)
      nil

      ;; exit editing mode
      :else
      (let [select? (= type :esc)]
        (when-let [container (gdom/getElement "app-container")]
          (dom/remove-class! container "blocks-selection-mode"))
        (p/do!
         (editor-handler/save-block! repo (:block/uuid block) value)
         (editor-handler/escape-editing select?)
         (some-> config :on-escape-editing
                 (apply [(str uuid) (= type :esc)])))))))

(rum/defcs box < rum/reactive
  {:init (fn [state]
           (assoc state
                  ::id (str (random-uuid))
                  ::ref (atom nil)))
   :did-mount (fn [state]
                (state/set-editor-args! (:rum/args state))
                state)}
  (mixins/event-mixin
   (fn [state]
     (mixins/hide-when-esc-or-outside
      state
      {:node @(::ref state)
       :on-hide (fn [_state e type]
                  (when-not (= type :esc)
                    (editor-on-hide state (:value (editor-handler/get-state)) type e)))})))
  (mixins/event-mixin setup-key-listener!)
  lifecycle/lifecycle
  [state {:keys [format block parent-block]} id config]
  (let [*ref (::ref state)
        content (state/sub-edit-content (:block/uuid block))
        heading-class (get-editor-style-class block content format)
        opts (cond->
              {:id                id
               :ref               #(reset! *ref %)
               :cacheMeasurements (editor-row-height-unchanged?) ;; check when content updated (as the content variable is binded)
               :default-value     (or content "")
               :minRows           (if (state/enable-grammarly?) 2 1)
               :on-click          (editor-handler/editor-on-click! id)
               :on-change         (editor-handler/editor-on-change! block id search-timeout)
               :on-paste          (paste-handler/editor-on-paste! id)
               :on-key-down       (fn [e]
                                    (if-let [on-key-down (:on-key-down config)]
                                      (on-key-down e)
                                      (when (= (util/ekey e) "Escape")
                                        (editor-on-hide state content :esc e))))
               :auto-focus true
               :class heading-class}
               (some? parent-block)
               (assoc :parentblockid (str (:block/uuid parent-block)))

               true
               (merge (:editor-opts config)))]
    [:div.editor-inner.flex.flex-1 {:class (if block "block-editor" "non-block-editor")}

     (ui/ls-textarea opts)
     (mock-textarea content)
     (command-popups id format)

     (when format
       (image-uploader id format))]))
