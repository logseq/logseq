(ns frontend.components.editor
  (:require [clojure.string :as string]
            [dommy.core :as dom]
            [frontend.commands :as commands :refer [*matched-commands]]
            [frontend.components.datepicker :as datepicker]
            [frontend.components.icon :as icon-component]
            [frontend.components.svg :as svg]
            [frontend.context.i18n :refer [t]]
            [frontend.date :as date]
            [frontend.db.async :as db-async]
            [frontend.handler.block :as block-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.editor.lifecycle :as lifecycle]
            [frontend.handler.page :as page-handler]
            [frontend.handler.paste :as paste-handler]
            [frontend.handler.property.util :as pu]
            [frontend.handler.search :as search-handler]
            [frontend.rfx :as rfx]
            [frontend.search :refer [fuzzy-search]]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [frontend.util.entity :as entity]
            [frontend.util.keycode :as keycode]
            [goog.dom :as gdom]
            [goog.string :as gstring]
            [logseq.common.util :as common-util]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db :as ldb]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]
            [io.factorhouse.hsx.core :as hsx]))

(defonce no-matched-commands [["No matched commands" [[:editor/move-cursor-to-end]]]])

(defn- use-current-edit-content
  []
  (rfx/use-sub [:editor/content (:block/uuid (state/get-edit-block))]))

(defn filter-commands
  [page? commands]
  (if page?
    (let [task-groups #{(t :editor.slash/group-task-status)
                        (t :editor.slash/group-task-date)
                        (t :editor.slash/group-priority)}]
      (filter (fn [item]
                (or
                 (= (t :command.editor/add-property) (first item))
                 (when (= (count item) 5)
                   (contains? task-groups (last item))))) commands))
    commands))

(defn node-render
  [block q {:keys [db-tag?]}]
  (let [block' (cond-> block
                 (:friendly-title block)
                 (assoc :block/title (:friendly-title block)))]
    (when-not (string/blank? (:block/title block'))
      [:div.flex.flex-col
       (when (and (:block/uuid block') (or (:block/parent block') (not (:page? block))))
         (when-let [breadcrumb (state/get-component :block/breadcrumb)]
           [:div.text-xs.opacity-70.mb-1 {:style {:margin-left 3}}
            (breadcrumb {:search? true} (state/get-current-repo) (:block/uuid block')
                        {:disabled? true})]))
       [:div.flex.flex-row.items-start
        (when-not db-tag?
          [:div.flex.items-center.h-5.mr-1.opacity-50
           (cond
             (:nlp-date? block')
             (ui/icon "calendar" {:size 14})

             (or (string/starts-with? (str (:block/title block')) (t :editor/new-tag))
                 (string/starts-with? (str (:block/title block')) (t :editor/new-page)))
             (ui/icon "plus" {:size 14})

             :else
             (icon-component/get-node-icon-cp block' {:ignore-current-icon? true}))])

        (let [title (let [alias (get-in block' [:alias :block/title])]
                      (block-handler/block-unique-title block' {:alias alias}))]
          (if (or (string/starts-with? title (t :editor/new-tag))
                  (string/starts-with? title (t :editor/new-page)))
            title
            (block-handler/block-title-with-icon block'
                                                 (search-handler/highlight-exact-query title q)
                                                 icon-component/icon)))]])))

(hsx/defc commands
  [id format]
  (let [[matched'] (hooks/use-atom *matched-commands)
        page? (entity/page? (state/get-edit-block))
        matched (or (filter-commands page? matched') no-matched-commands)
        filtered? (not= matched @commands/*initial-commands)]
    (ui/auto-complete
     matched
     (cond->
      {:item-render
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
              (when doc (ui/tooltip [:small (svg/help-circle)] doc))]

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
       "cp__commands-slash"}
       (not filtered?)
       (assoc :get-group-name
              (fn [item]
                (when (= (count item) 5) (last item))))))))

(defn- page-on-chosen-handler
  [embed? input id q pos format]
  (if embed?
    (fn [chosen-item _e]
      (let [value (.-value input)
            value' (str (common-util/safe-subs value 0 q)
                        (common-util/safe-subs value (+ (count q) 4 pos)))]
        (state/set-edit-content! (.-id input) value')
        (state/clear-editor-action!)
        (p/let [page (db-async/<get-block (state/get-current-repo) chosen-item {:children? false})
                page' (or page
                          (page-handler/<create! chosen-item {:redirect? false
                                                             :reference? true}))
                current-block (state/get-edit-block)]
          (editor-handler/api-insert-new-block! chosen-item
                                                {:block-uuid (:block/uuid current-block)
                                                 :sibling? true
                                                 :replace-empty-target? true
                                                 :other-attrs {:block/link (:db/id page')}}))))
    (page-handler/on-chosen-handler input id pos format)))

(defn- class-alias?
  [page]
  (:block/alias-source-page-class? page))

(defn- matched-pages-with-new-page [partial-matched-pages db-tag? q exact-page]
  (let [page-exists? (and (nil? (:block/parent exact-page))
                          (if db-tag?
                            (entity/class? exact-page)
                            (entity/page? exact-page)))]
    (if (or page-exists?
            (and db-tag? (class-alias? exact-page)))
      partial-matched-pages
      (if db-tag?
        (concat
         ;; Don't show 'New tag' for an internal page because it already shows 'Convert ...'
         (when-not (and (entity/internal-page? exact-page) (= (:block/title exact-page) q))
           [{:block/title (str (t :editor/new-tag) " " q)}])
         partial-matched-pages)
        (cons {:block/title (str (t :editor/new-page) " " q)}
              partial-matched-pages)))))

(defn- search-pages
  [q db-tag? set-matched-pages! set-exact-page!]
  (if (string/blank? q)
    (when db-tag?
      (p/let [classes (db-async/<get-all-classes (state/get-current-repo)
                                                 {:except-root-class? true})]
        (set-exact-page! nil)
        (set-matched-pages! classes)))
    (p/let [block (db-async/<get-block (state/get-current-repo) q {:children? false})
            result (if db-tag?
                     (p/let [classes (editor-handler/get-matched-classes q)]
                       (if (and (entity/internal-page? block)
                                (= (:block/title block) q)
                                (not (ldb/built-in? block))
                                (not (class-alias? block)))
                         (cons {:block/title q
                                :db/id (:db/id block)
                                :block/uuid (:block/uuid block)
                                :convert-page-to-tag? true
                                :friendly-title (t :page.convert/page-to-tag-action q)} classes)
                         classes))
                             (editor-handler/<get-matched-blocks q {:nlp-pages? true
                                                                    :page-only? false}))]
      (set-exact-page! block)
      (set-matched-pages! result))))

(hsx/defc page-search-aux
  [id format embed? db-tag? q input pos]
  (let [q (string/trim q)
        [matched-pages set-matched-pages!] (hooks/use-state nil)
        [exact-page set-exact-page!] (hooks/use-state nil)
        search-f #(search-pages q db-tag? set-matched-pages! set-exact-page!)]
    (hooks/use-effect! search-f [(hooks/use-debounced-value q 150)])

    (let [matched-pages' (if (string/blank? q)
                                   (if db-tag?
                                     matched-pages
                                     (->> (date/nlp-pages-i18n :nlp-date? true)
                                          (take 10)))
                           ;; reorder, shortest and starts-with first.
                           (if (and (seq matched-pages)
                                            (gstring/caseInsensitiveStartsWith (:block/title (first matched-pages)) q))
                                     (cons (first matched-pages)
                                           (matched-pages-with-new-page (rest matched-pages) db-tag? q exact-page))
                                     (matched-pages-with-new-page matched-pages db-tag? q exact-page)))]
      [:<>
       (ui/auto-complete
        matched-pages'
        {:on-chosen   (page-on-chosen-handler embed? input id q pos format)
         :on-enter    (fn []
                        (page-handler/page-not-exists-handler input))
         :item-render (fn [block _chosen?]
                        (node-render block q {:db-tag? db-tag?}))
         :empty-placeholder [:div.text-gray-500.text-sm.px-4.py-2 (if db-tag?
                                                                    (t :editor/search-for-tag)
                                                                    (t :editor/search-for-node))]
         :class "black"})

       (when (and db-tag?
                  (not (string/blank? q))
                  (not= "page" (string/lower-case q)))
         [:p.px-1.opacity-50.text-sm.flex.flex-row.items-center.gap-2
          (shui/shortcut "mod+enter")
          [:span (t :editor/display-tag-inline-hint)]])])))

(hsx/defc page-search
  "Page or tag searching popup"
  [id format]
  (let [pos (hooks/use-memo state/get-editor-last-pos [])
        action (rfx/use-sub [:editor/action])
        embed? (= @commands/*current-command "Page embed")
        tag? (= action :page-search-hashtag)
        db-tag? tag?
        input (gdom/getElement id)
        edit-content (use-current-edit-content)]
    (hooks/use-effect!
     (fn []
       #(reset! commands/*current-command nil))
     [])
    (when input
      (let [current-pos (cursor/pos input)
            q (or
               (editor-handler/get-selected-text)
               (when (= action :page-search-hashtag)
                 (common-util/safe-subs edit-content pos current-pos))
               (when (> (count edit-content) current-pos)
                 (common-util/safe-subs edit-content pos current-pos))
               "")]
        (page-search-aux id format embed? db-tag? q input pos)))))

(defn- search-blocks!
  [q result]
  (p/let [matched-blocks (when-not (string/blank? q)
                           (editor-handler/<get-matched-blocks q))]
    (reset! result matched-blocks)))

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
        (let [current-block (state/get-edit-block)]
          (p/do!
           (editor-handler/api-insert-new-block! ""
                                                  {:block-uuid (:block/uuid current-block)
                                                   :sibling? true
                                                   :replace-empty-target? true
                                                   :other-attrs {:block/link (:db/id chosen-item)}})
           (state/clear-edit!)))))
    (editor-handler/block-on-chosen-handler id q format selected-text)))

(hsx/defc block-search-auto-complete
  [_edit-block input id q format selected-text]
  (let [result* (hooks/use-memo #(atom nil) [])
        [debounced-search stop-search!] (hooks/use-memo #(util/cancelable-debounce search-blocks! 150) [])
        [result-value] (hooks/use-atom result*)]
    (hooks/use-effect!
     (fn []
       (if (string/blank? q)
         (reset! result* nil)
         (debounced-search q result*)))
     [q])
    (hooks/use-effect!
     (fn []
       stop-search!)
     [])
    (let [result (->> result-value
                    (remove (fn [b] (nil? (:block/uuid b)))))
        embed? (= @commands/*current-command "Block embed")
        chosen-handler (block-on-chosen-handler embed? input id q format selected-text)
        non-exist-block-handler (editor-handler/block-non-exist-handler input)]
    (ui/auto-complete
     result
     {:on-chosen   chosen-handler
      :on-enter    non-exist-block-handler
      :empty-placeholder   [:div.text-gray-500.text-sm.px-4.py-2 (t :editor/block-search)]
      :item-render (fn [block]
                     (node-render block q {:db-tag? false}))
      :class       "ac-block-search"}))))

(hsx/defc block-search
  [id _format]
  (hooks/use-effect!
   (fn []
     #(do
        (reset! commands/*current-command nil)
        (state/clear-search-result!)))
   [])
  (let [[action] (hooks/use-atom commands/*current-command)
        pos (state/get-editor-last-pos)
        input (gdom/getElement id)
        format _format
        current-pos (cursor/pos input)
        edit-content (use-current-edit-content)
        edit-block (state/get-edit-block)
        selected-text (editor-handler/get-selected-text)
        q (or
           selected-text
           (when (>= (count edit-content) current-pos)
             (subs edit-content pos current-pos)))]
    (when input
      (let [embed? (= action "Block embed")
            page (when embed? (page-ref/get-page-name edit-content))
            embed-block-id (when (and embed? page (common-util/uuid-string? page))
                             (uuid page))]
        (if embed-block-id
          (let [f (block-on-chosen-handler true input id q format nil)
                repo (state/get-current-repo)]
            (p/let [block (db-async/<get-block repo embed-block-id {:children? false})]
              (when block (f block))))
          (block-search-auto-complete edit-block input id q format selected-text))))))

(hsx/defc template-search-aux
  [id q]
  (let [[matched-templates set-matched-templates!] (hooks/use-state nil)]
    (hooks/use-effect! (fn []
                         (p/let [result (editor-handler/<get-matched-templates q)]
                           (set-matched-templates!
                            (sort-by :block/title result))))
                       [q])
    (ui/auto-complete
     matched-templates
     {:on-chosen   (editor-handler/template-on-chosen-handler id)
      :on-enter    (fn [_state] (state/clear-editor-action!))
      :empty-placeholder [:div.text-gray-500.px-4.py-2.text-sm (t :editor/search-template-placeholder)]
      :item-render (fn [template]
                     (:block/title template))
      :class       "black"})))

(hsx/defc template-search
  [id _format]
  (let [pos (hooks/use-memo state/get-editor-last-pos [])
        input (gdom/getElement id)
        edit-content (use-current-edit-content)]
    (when input
      (let [current-pos (cursor/pos input)
            q (or
               (when (>= (count edit-content) current-pos)
                 (subs edit-content pos current-pos))
               "")]
        (template-search-aux id q)))))

(hsx/defc code-block-mode-keyup-listener
  [_q _edit-content last-pos current-pos]
  (hooks/use-effect!
   (fn []
     (when (< current-pos last-pos)
       (state/clear-editor-action!)))
   [last-pos current-pos])
  [:<>])

(hsx/defc code-block-mode-picker
  [id format]
  (let [pos          (hooks/use-memo state/get-editor-last-pos [])
        edit-content (or (use-current-edit-content) "")
        modes        (some->> js/window.CodeMirror (.-modes) (js/Object.keys) (js->clj) (remove #(= "null" %)))
        ^js input    (gdom/getElement id)]
    (when (and modes input)
      (let [current-pos  (cursor/pos input)
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
                                                 (p/then #(commands/handle-step [:codemirror/focus])))))
                            :on-enter (fn []
                                        (state/clear-editor-action!)
                                        (commands/handle-step [:codemirror/focus]))
                            :item-render (fn [mode _chosen?]
                                           [:strong mode])
                            :class "code-block-mode-picker"})]))))

(hsx/defc editor-input
  [_id on-submit _on-cancel]
  (let [input-value (hooks/use-memo #(atom {}) [])
        latest-args-ref (hooks/use-ref nil)]
    (hooks/set-ref! latest-args-ref [_id on-submit _on-cancel])
    (hooks/use-effect!
     (fn []
       (let [on-key-down (fn [e]
                           (case (.-keyCode e)
                             13
                             (let [[_id on-submit] (hooks/deref latest-args-ref)
                                   input-option (:options (state/get-editor-show-input))]
                               (when (seq @input-value)
                                 ;; no new line input
                                 (util/stop e)
                                 (let [command (:command (first input-option))]
                                   (on-submit command @input-value))
                                 (reset! input-value nil)))
                             27
                             (let [[id _on-submit on-cancel] (hooks/deref latest-args-ref)]
                               (on-cancel id))
                             nil))]
         (.addEventListener js/window "keydown" on-key-down)
         #(.removeEventListener js/window "keydown" on-key-down)))
     [])
  (when-let [action-data (state/get-editor-action-data)]
    (let [{:keys [pos options]} action-data
          input-value input-value]
      (when (seq options)
        (let [command (:command (first options))]
          [:div.p-2.rounded-md.flex.flex-col.gap-2
           (for [{:keys [id placeholder type auto-focus]} options]
             (shui/input
              (cond->
               {:key (str "modal-input-" (name id))
                :type (or type "text")
                :auto-complete (if (util/chrome?) "chrome-off" "off")
                :on-change (fn [e]
                             (swap! input-value assoc id (util/evalue e)))}

                placeholder
                (assoc :placeholder placeholder)

                auto-focus
                (assoc :auto-focus true))))
           (ui/button
            (t :ui/submit)
            :on-click
            (fn [e]
              (util/stop e)
              (on-submit command @input-value pos)))]))))))

(hsx/defc image-uploader
  [id format]
  [:div.image-uploader
   [:input
    {:id "upload-file"
     :type "file"
     :on-change (fn [e]
                  (let [files (.-files (.-target e))]
                    (editor-handler/upload-asset! id files format editor-handler/*asset-uploading? false)))
     :hidden true}]])

(def search-timeout (atom nil))

(defn- use-key-listeners!
  [component-state id format]
  (hooks/use-effect!
   (fn []
     (let [input' (gdom/getElement id)
           keydown-handler (editor-handler/keydown-not-matched-handler format)
           keyup-handler (editor-handler/keyup-handler component-state input')
           on-key-down #(keydown-handler % (.-keyCode %))
           on-key-up #(keyup-handler % (.-keyCode %))]
       (.addEventListener js/window "keydown" on-key-down)
       (.addEventListener js/window "keyup" on-key-up)
       #(do
          (.removeEventListener js/window "keydown" on-key-down)
          (.removeEventListener js/window "keyup" on-key-up))))
   [id format]))

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

(hsx/defc mock-textarea
  [content]
  (hooks/use-effect!
   (fn []
     (when-not (state/get-state :editor/on-paste?)
       (try (editor-handler/handle-last-input)
            (catch :default _e
              nil)))
     (state/set-state! :editor/on-paste? false)))
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

(defn- open-editor-popup!
  [id content opts]
  (let [input (state/get-input)
        line-height (or (when input
                          (some-> (.-lineHeight (js/window.getComputedStyle input))
                                  (js/parseFloat)
                                  (- 4)))
                        20)
        {:keys [left top rect]} (cursor/get-caret-pos input)
        pos [(+ left (:left rect) -20) (+ top (:top rect) line-height)]
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

(hsx/defc shui-editor-popups
  [id format action _data]
  (hooks/use-effect!
   (fn []
     (let [pid (case action
                 :commands
                 (open-editor-popup! :commands
                                     (commands id format)
                                     {:content-props {:withoutAnimation false}})

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
                                     (datepicker/date-picker id format) {})

                 :input
                 (open-editor-popup! :input
                                     (editor-input id
                      ;; on-submit
                                                   (fn [command m]
                                                     (editor-handler/handle-command-input command id format m))
                      ;; on-cancel
                                                   (fn []
                                                     (editor-handler/handle-command-input-close id)))
                                     {:content-props {:onOpenAutoFocus #()}})

                 :select-code-block-mode
                 (open-editor-popup! :code-block-mode-picker
                                     (code-block-mode-picker id format) {})

                 :template-search
                 (open-editor-popup! :template-search
                                     (template-search id format) {})

                 ;; TODO: try remove local model state
                 false)]
       #(when pid
          (shui/popup-hide! pid))))
   [action])
  [:<>])

(hsx/defc command-popups
  "React to atom changes, find and render the correct popup"
  [id format]
  (let [action (rfx/use-sub [:editor/action])]
    (shui-editor-popups id format action nil)))

(defn- editor-on-hide
  [state type e editing-another-block?]
  (let [action (state/get-editor-action)
        config (:config state)]
    (cond
      (and (= type :esc) (editor-handler/editor-commands-popup-exists?))
      nil

      (state/editor-in-composition?)
      nil

      (or (contains?
           #{:commands :page-search :page-search-hashtag :block-search :template-search
             :datepicker}
           action)
          (and (keyword? action)
               (= (namespace action) "editor.action")))
      (when e (util/stop e))

      ;; editor/input component handles Escape directly, so just prevent handling it here
      (= :input action)
      nil

      ;; exit editing mode
      :else
      (let [select? (= type :esc)]
        (p/do!
         (editor-handler/escape-editing {:select? select?
                                         :editing-another-block? editing-another-block?})
         (some-> config :on-escape-editing
                 (apply [(str uuid) (= type :esc)])))))))

(defn editor-readonly?
  [block]
  (boolean (:block/journal-day block)))

(hsx/defc box
  [{:keys [format block parent-block] :as opts} id config]
  (let [*ref (hooks/use-memo #(atom nil) [])
        component-state {:opts opts
                         :id id
                         :config config}
        content (rfx/use-sub [:editor/content (:block/uuid block)])
        heading-class (get-editor-style-class block content format)
        read-only? (editor-readonly? block)
        _ (lifecycle/use-did-mount! id config)
        _ (use-key-listeners! component-state id format)
        _ (hooks/use-layout-effect!
           (fn []
             (state/set-editor-args! [opts id config]))
           [id (:block/uuid block) config])
        _ (hooks/use-effect!
           (fn []
             #(state/set-state! :editor/raw-mode-block nil))
           [])
        _ (hooks/use-hide-on-esc-or-outside
           {:active? true
            :root-ref #(or @*ref (gdom/getElement id))
            :on-hide (fn [e]
                       (let [esc? (= "keydown" (.-type e))
                             target (.-target e)
                             block-container (when-not esc? (.closest target ".ls-block"))
                             editing-another-block? (and block-container
                                                         (not (dom/has-class? block-container "block-add-button"))
                                                         (gdom/contains block-container target))]
                         (editor-on-hide component-state
                                         (if esc? :esc :click)
                                         e
                                         editing-another-block?)))})
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
                                        (editor-on-hide component-state :esc e false))))
               :auto-focus true
               :auto-capitalize (if (util/mobile?) "sentences" "off")
               :auto-correct (if (util/mobile?) "true" "false")
               :class heading-class}
               read-only?
               (merge
                {:on-before-input #(.preventDefault ^js/Event %)
                 :on-paste #(.preventDefault ^js/Event %)})
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
