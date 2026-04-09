(ns frontend.commands
  "Provides functionality for commands and advanced commands"
  (:require [clojure.string :as string]
            [frontend.context.i18n :refer [interpolate-sentence t]]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.extensions.video.youtube :as youtube]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.db-based.property.util :as db-pu]
            [frontend.handler.notification :as notification]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.search :as search]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [logseq.common.util :as common-util]
            [logseq.common.util.block-ref :as block-ref]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db.frontend.property :as db-property]
            [logseq.graph-parser.property :as gp-property]
            [promesa.core :as p]))

;; TODO: move to frontend.handler.editor.commands

(defonce hashtag "#")
(defonce command-trigger "/")
(defonce command-ask "\\")
(defonce *current-command (atom nil))

(def query-doc
  [:div {:on-pointer-down (fn [e] (.stopPropagation e))}
   [:div.font-medium.text-lg.mb-2 (t :query/examples-title)]
   [:ul.mb-1
    [:li.mb-1 [:code "{{query #tag}}"]]
    [:li.mb-1 [:code "{{query [[page]]}}"]]
    [:li.mb-1 [:code "{{query \"full-text search\"}}"]]
    [:li.mb-1 [:code "{{query (and [[project]] (task Todo Doing))}}"]]
    [:li.mb-1 [:code "{{query (or [[page 1]] [[page 2]])}}"]]
    [:li.mb-1 [:code "{{query (and (between -7d +7d) (task Done))}}"]]
    [:li.mb-1 [:code "{{query (property key value)}}"]]
    [:li.mb-1 [:code "{{query (tags #tag)}}"]]]

   [:p
    (interpolate-sentence
     (t :query/examples-desc)
     :links [{:href "https://docs.logseq.com/#/page/queries"
              :target "_blank"}])]])

(defn link-steps []
  [[:editor/input (str command-trigger "link")]
   [:editor/show-input [{:command :link
                         :id :link
                         :placeholder (t :ui/link)
                         :autoFocus true}
                        {:command :link
                         :id :label
                         :placeholder (t :ui/label)}]]])

(defn image-link-steps []
  [[:editor/input (str command-trigger "link")]
   [:editor/show-input [{:command :image-link
                         :id :link
                         :placeholder (t :ui/link)
                         :autoFocus true}
                        {:command :image-link
                         :id :label
                         :placeholder (t :ui/label)}]]])

(def *extend-slash-commands (atom []))

(defn register-slash-command [cmd]
  (swap! *extend-slash-commands conj cmd))

(defn ->marker
  [marker]
  [[:editor/clear-current-slash]
   [:editor/set-status marker]
   [:editor/move-cursor-to-end]])

(defn ->priority
  [priority]
  [[:editor/clear-current-slash]
   [:editor/set-priority priority]
   [:editor/move-cursor-to-end]])

(defn ->inline
  [type]
  (let [template (util/format "@@%s: @@"
                              type)]
    [[:editor/input template {:last-pattern command-trigger
                              :backward-pos 2}]]))

(defn db-based-statuses
  []
  (db-pu/get-closed-property-values :logseq.property/status))

(defn db-based-embed-block
  []
  [[:editor/input "" {:last-pattern command-trigger}]
   [:editor/search-block :embed]])

(defn db-based-query
  []
  [[:editor/input "" {:last-pattern command-trigger}]
   [:editor/run-query-command]])

(defn query-steps
  []
  (db-based-query))

(defn- calc-steps
  []
  [[:editor/input "" {:last-pattern command-trigger}]
   [:editor/upsert-type-block :code "calc"]
   [:codemirror/focus]])

(defn- advanced-query-steps
  []
  [[:editor/input "" {:last-pattern command-trigger}]
   [:editor/set-property :block/tags :logseq.class/Query]
   [:editor/set-property :logseq.property/query ""]
   [:editor/set-property-on-block-property :logseq.property/query :logseq.property.node/display-type :code]
   [:editor/set-property-on-block-property :logseq.property/query :logseq.property.code/lang "clojure"]
   [:editor/exit]])

(defn code-block-steps
  []
  [[:editor/input "" {:last-pattern command-trigger}]
   [:editor/upsert-type-block :code]
   [:editor/exit]])

(defn quote-block-steps
  []
  [[:editor/input "" {:last-pattern command-trigger}]
   [:editor/set-property :logseq.property.node/display-type :quote]])

(defn math-block-steps
  []
  [[:editor/input "" {:last-pattern command-trigger}]
   [:editor/set-property :logseq.property.node/display-type :math]])

(defn get-statuses
  []
  (let [group-label (t :editor.slash/group-task-status)
        result (->>
                (db-based-statuses)
                (mapv (fn [status]
                        (let [command (:block/title status)
                              label (db-property/built-in-display-title status t)
                              icon (case command
                                     "Canceled" "Cancelled"
                                     "Doing" "InProgress50"
                                     command)]
                          [label (->marker command) (t :editor.slash/status-desc label) icon]))))]
    (when (seq result)
      (map (fn [v] (conj v group-label)) result))))

(defn db-based-priorities
  []
  (db-pu/get-closed-property-values :logseq.property/priority))

(defn get-priorities
  []
  (let [group-label (t :editor.slash/group-priority)
        with-no-priority #(cons [(t :editor.slash/no-priority) (->priority nil) "" :icon/priorityLvlNone] %)
        result (->>
                (db-based-priorities)
                (mapv (fn [priority]
                        (let [value (:block/title priority)
                              label (db-property/built-in-display-title priority t)]
                          [(t :editor.slash/priority-label label)
                           (->priority value)
                           (t :editor.slash/priority-desc label)
                           (str "priorityLvl" value)])))
                (with-no-priority)
                (vec))]
    (when (seq result)
      (map (fn [v] (into v [group-label])) result))))

;; Credits to roamresearch.com

(defn- ->heading
  [heading]
  [[:editor/clear-current-slash]
   [:editor/set-heading heading]
   [:editor/move-cursor-to-end]])

(defn- headings
  []
  (into [[(t :editor.slash/normal-text)
          (->heading nil)
          (t :editor.slash/normal-text-desc)
          :icon/text
          (t :editor.slash/group-heading)]]
        (mapv (fn [level]
                (let [heading (t :editor.slash/heading-label level)]
                  [heading (->heading level) heading (str "h-" level) (t :editor.slash/group-heading)]))
              (range 1 7))))

(defonce *latest-matched-command (atom ""))
(defonce *matched-commands (atom nil))
(defonce *initial-commands (atom nil))

(defn ^:large-vars/cleanup-todo commands-map
  [get-page-ref-text]
  (let [embed-block db-based-embed-block]
    (->>
     (concat
        ;; basic
      [[(t :editor.slash/node-reference)
        [[:editor/input page-ref/left-and-right-brackets {:backward-pos 2}]
         [:editor/search-page]]
        (t :editor.slash/node-reference-desc)
        :icon/pageRef
        (t :editor.slash/group-basic)]
       [(t :editor.slash/node-embed)
        (embed-block)
        (t :editor.slash/node-embed-desc)
        :icon/blockEmbed]]

        ;; format
      [[(t :ui/link) (link-steps) (t :editor.slash/link-desc) :icon/link (t :editor.slash/group-format)]
       [(t :editor.slash/image-link) (image-link-steps) (t :editor.slash/image-link-desc) :icon/photoLink]
       (when (state/markdown?)
         [(t :editor.slash/underline) [[:editor/input "<ins></ins>"
                                        {:last-pattern command-trigger
                                         :backward-pos 6}]] (t :editor.slash/underline-desc)
          :icon/underline])
       [(t :editor.slash/code-block)
        (code-block-steps)
        (t :editor.slash/code-block-desc)
        :icon/code]
       [(t :class.built-in/quote-block)
        (quote-block-steps)
        (t :editor.slash/quote-desc)
        :icon/quote]
       [(t :editor.slash/math-block)
        (math-block-steps)
        (t :editor.slash/math-block-desc)
        :icon/math]]

      (headings)

      ;; task management
      (get-statuses)

      ;; task date
      [[(t :property.built-in/deadline)
        [[:editor/clear-current-slash]
         [:editor/set-deadline]]
        ""
        :icon/calendar-stats
        (t :editor.slash/group-task-date)]
       [(t :property.built-in/scheduled)
        [[:editor/clear-current-slash]
         [:editor/set-scheduled]]
        ""
        :icon/calendar-month
        (t :editor.slash/group-task-date)]]

      ;; priority
      (get-priorities)

      ;; time & date
      [[(t :date.nlp/tomorrow)
        #(get-page-ref-text (date/tomorrow))
        (t :editor.slash/tomorrow-desc)
        :icon/tomorrow
        (t :editor.slash/group-time-and-date)]
       [(t :date.nlp/yesterday) #(get-page-ref-text (date/yesterday)) (t :editor.slash/yesterday-desc) :icon/yesterday]
       [(t :date.nlp/today) #(get-page-ref-text (date/today)) (t :editor.slash/today-desc) :icon/calendar]
       [(t :editor.slash/current-time) #(date/get-current-time) (t :editor.slash/current-time-desc) :icon/clock]
       [(t :editor.slash/date-picker) [[:editor/show-date-picker]] (t :editor.slash/date-picker-desc) :icon/calendar-dots]]

      ;; order list
      [[(t :editor.slash/number-list)
        [[:editor/clear-current-slash]
         [:editor/toggle-own-number-list]]
        (t :editor.slash/number-list)
        :icon/numberedParents
        (t :editor.slash/group-list-type)]
       [(t :editor.slash/number-children) [[:editor/clear-current-slash]
                                           [:editor/toggle-children-number-list]]
        (t :editor.slash/number-children)
        :icon/numberedChildren]]

      ;; advanced
      [[(t :property.built-in/query) (query-steps) query-doc :icon/query (t :editor.slash/group-advanced)]
       [(t :editor.slash/advanced-query) (advanced-query-steps) (t :editor.slash/advanced-query-desc) :icon/query]
       [(t :editor.slash/query-function) [[:editor/input "{{function }}" {:backward-pos 2}]] (t :editor.slash/query-function-desc) :icon/queryCode]
       [(t :editor.slash/calculator)
        (calc-steps)
        (t :editor.slash/calculator-desc) :icon/calculator]

       [(t :editor.slash/upload-asset)
        [[:editor/click-hidden-file-input :id]]
        (t :editor.slash/upload-asset-desc)
        :icon/upload]

       [(t :class.built-in/template) [[:editor/input command-trigger nil]
                                      [:editor/search-template]] (t :editor.slash/template-desc)
        :icon/template]

       [(t :editor.slash/embed-html) (->inline "html") "" :icon/htmlEmbed]

       [(t :editor.slash/embed-video-url) [[:editor/input "{{video }}" {:last-pattern command-trigger
                                                                        :backward-pos 2}]] ""
        :icon/videoEmbed]

       [(t :editor.slash/embed-youtube-timestamp) [[:youtube/insert-timestamp]] "" :icon/videoEmbed]

       [(t :editor.slash/embed-twitter-tweet) [[:editor/input "{{tweet }}" {:last-pattern command-trigger
                                                                            :backward-pos 2}]] ""
        :icon/xEmbed]

       [(t :command.editor/add-property) [[:editor/clear-current-slash]
                                          [:editor/new-property]] ""
        :icon/cube-plus]]

      (let [commands (->> @*extend-slash-commands
                          (remove (fn [command] (when (map? (last command))
                                                  (false? (:db-graph? (last command)))))))]
        commands)

;; Allow user to modify or extend, should specify how to extend.

      (state/get-commands)
      (when-let [plugin-commands (seq (some->> (state/get-plugins-slash-commands)
                                               (mapv #(vec (concat % [nil :icon/puzzle])))))]
        (-> plugin-commands (vec) (update 0 (fn [v] (conj v (t :editor.slash/group-plugins)))))))
     (remove nil?)
     (util/distinct-by-last-wins first))))

(defn init-commands!
  [get-page-ref-text]
  (let [commands (commands-map get-page-ref-text)]
    (reset! *latest-matched-command "")
    (reset! *initial-commands commands)
    (reset! *matched-commands commands)))

(defn set-matched-commands!
  [command matched-commands]
  (reset! *latest-matched-command command)
  (reset! *matched-commands matched-commands))

(defn reinit-matched-commands!
  []
  (set-matched-commands! "" @*initial-commands))

(defn restore-state
  []
  (state/clear-editor-action!)
  (reinit-matched-commands!))

(defn insert!
  [id value
   {:keys [last-pattern postfix-fn backward-pos end-pattern backward-truncate-number
           command only-breakline?]
    :as _option}]
  (when-let [input (gdom/getElement id)]
    (let [last-pattern (when-not (= last-pattern :skip-check)
                         (when-not backward-truncate-number
                           (or last-pattern command-trigger)))
          edit-content (gobj/get input "value")
          current-pos (cursor/pos input)
          current-pos (or
                       (when (and end-pattern (string? end-pattern))
                         (when-let [i (string/index-of (common-util/safe-subs edit-content current-pos) end-pattern)]
                           (+ current-pos i)))
                       current-pos)
          orig-prefix (subs edit-content 0 current-pos)
          postfix (subs edit-content current-pos)
          postfix (if postfix-fn (postfix-fn postfix) postfix)
          space? (let [space? (when (and last-pattern orig-prefix)
                                (let [s (when-let [last-index (string/last-index-of orig-prefix last-pattern)]
                                          (common-util/safe-subs orig-prefix 0 last-index))]
                                  (not
                                   (or
                                    (and (= :page-ref command)
                                         (util/cjk-string? value)
                                         (or (util/cjk-string? (str (last orig-prefix)))
                                             (util/cjk-string? (str (first postfix)))))
                                    (and s
                                         (string/ends-with? s "(")
                                         (or (string/starts-with? last-pattern block-ref/left-parens)
                                             (string/starts-with? last-pattern page-ref/left-brackets)))
                                    (and s (string/starts-with? s "{{embed"))
                                    (and s (= (last s) \#) (string/starts-with? last-pattern "[["))
                                    (and last-pattern
                                         (or (string/ends-with? last-pattern gp-property/colons)
                                             (string/starts-with? last-pattern gp-property/colons)))))))]
                   (if (and space? (or (string/starts-with? last-pattern "#[[")
                                       (string/starts-with? last-pattern "```")))
                     false
                     space?))
          prefix (cond
                   (and backward-truncate-number (integer? backward-truncate-number))
                   (str (common-util/safe-subs orig-prefix 0 (- (count orig-prefix) backward-truncate-number))
                        (when-not (zero? backward-truncate-number)
                          value))

                   (string/blank? last-pattern)
                   (if space?
                     (util/concat-without-spaces orig-prefix value)
                     (str orig-prefix value))

                   :else
                   (util/replace-last last-pattern orig-prefix value space?))
          postfix (cond-> postfix
                    (and only-breakline? postfix
                         (= (get postfix 0) "\n"))
                    (string/replace-first "\n" ""))
          new-value (cond
                      (string/blank? postfix)
                      prefix

                      space?
                      (util/concat-without-spaces prefix postfix)

                      :else
                      (str prefix postfix))
          new-pos (- (count prefix)
                     (or backward-pos 0))]
      (when-not (and (not (string/blank? value))
                     (string/blank? new-value))
        (state/set-block-content-and-last-pos! id new-value new-pos)
        (cursor/move-cursor-to input new-pos)))))

(defn simple-insert!
  [id value
   {:keys [backward-pos forward-pos check-fn]
    :as _option}]
  (let [input (gdom/getElement id)
        edit-content (gobj/get input "value")
        current-pos (cursor/pos input)
        prefix (subs edit-content 0 current-pos)
        surfix (subs edit-content current-pos)
        new-value (str prefix
                       value
                       surfix)
        new-pos (- (+ (count prefix)
                      (count value)
                      (or forward-pos 0))
                   (or backward-pos 0))]
    (state/set-block-content-and-last-pos! id new-value new-pos)
    (cursor/move-cursor-to input new-pos)
    (when check-fn
      (check-fn new-value (dec (count prefix)) new-pos))))

(defn simple-replace!
  [id value selected
   {:keys [backward-pos forward-pos check-fn]
    :as _option}]
  (let [selected? (not (string/blank? selected))
        input (gdom/getElement id)
        edit-content (gobj/get input "value")]
    (when edit-content
      (let [current-pos (cursor/pos input)
            prefix (subs edit-content 0 current-pos)
            postfix (if selected?
                      (string/replace-first (subs edit-content current-pos)
                                            selected
                                            "")
                      (subs edit-content current-pos))
            new-value (str prefix value postfix)
            new-pos (- (+ (count prefix)
                          (count value)
                          (or forward-pos 0))
                       (or backward-pos 0))]
        (state/set-block-content-and-last-pos! id new-value new-pos)
        (cursor/move-cursor-to input new-pos)
        (when selected?
          (.setSelectionRange input new-pos (+ new-pos (count selected))))
        (when check-fn
          (check-fn new-value (dec (count prefix))))))))

(defn delete-pair!
  [id]
  (let [input (gdom/getElement id)
        edit-content (gobj/get input "value")
        current-pos (cursor/pos input)
        prefix (subs edit-content 0 (dec current-pos))
        new-value (str prefix
                       (subs edit-content (inc current-pos)))
        new-pos (count prefix)]
    (state/set-block-content-and-last-pos! id new-value new-pos)
    (cursor/move-cursor-to input new-pos)))

(defn delete-selection!
  [id]
  (let [input (gdom/getElement id)
        edit-content (gobj/get input "value")
        start (util/get-selection-start input)
        end (util/get-selection-end input)]
    (when-not (= start end)
      (let [prefix (subs edit-content 0 start)
            new-value (str prefix
                           (subs edit-content end))
            new-pos (count prefix)]
        (state/set-block-content-and-last-pos! id new-value new-pos)
        (cursor/move-cursor-to input new-pos)))))

(defn get-matched-commands
  ([text]
   (get-matched-commands text @*initial-commands))
  ([text commands]
   (search/fuzzy-search commands text
                        :extract-fn first
                        :limit 50)))

(defmulti handle-step first)

(defmethod handle-step :editor/hook [[_ event {:keys [pid uuid] :as payload}] format]
  (plugin-handler/hook-plugin-editor event (merge payload {:format format :uuid (or uuid (:block/uuid (state/get-edit-block)))}) pid))

(defmethod handle-step :editor/input [[_ value option]]
  (when-let [input-id (state/get-edit-input-id)]
    (let [type (:type option)
          input (gdom/getElement input-id)
          beginning-of-line? (or (cursor/beginning-of-line? input)
                                 (= 1 (:pos (:pos (state/get-editor-action-data)))))
          value (if (and (contains? #{"block" "properties"} type)
                         (not beginning-of-line?))
                  (str "\n" value)
                  value)]
      (insert! input-id value option)
      (state/clear-editor-action!))))

(defmethod handle-step :editor/cursor-back [[_ n]]
  (when-let [input-id (state/get-edit-input-id)]
    (when-let [current-input (gdom/getElement input-id)]
      (cursor/move-cursor-backward current-input n))))

(defmethod handle-step :editor/cursor-forward [[_ n]]
  (when-let [input-id (state/get-edit-input-id)]
    (when-let [current-input (gdom/getElement input-id)]
      (cursor/move-cursor-forward current-input n))))

(defmethod handle-step :editor/move-cursor-to-end [[_]]
  (when-let [input-id (state/get-edit-input-id)]
    (when-let [current-input (gdom/getElement input-id)]
      (cursor/move-cursor-to-end current-input))))

(defmethod handle-step :editor/restore-saved-cursor [[_]]
  (when-let [input-id (state/get-edit-input-id)]
    (when-let [current-input (gdom/getElement input-id)]
      (cursor/move-cursor-to current-input (state/get-editor-last-pos)))))

(defmethod handle-step :editor/clear-current-slash [[_ space?]]
  (when-let [input-id (state/get-edit-input-id)]
    (when-let [current-input (gdom/getElement input-id)]
      (let [edit-content (gobj/get current-input "value")
            current-pos (cursor/pos current-input)
            prefix (subs edit-content 0 current-pos)
            prefix (util/replace-last command-trigger prefix "" (boolean space?))
            new-value (str prefix
                           (subs edit-content current-pos))]
        (state/set-block-content-and-last-pos! input-id
                                               new-value
                                               (count prefix))))))

(defn- db-based-set-status
  [status]
  (when-let [block (state/get-edit-block)]
    (db-property-handler/batch-set-property-closed-value! [(:block/uuid block)] :logseq.property/status status)))

(defmethod handle-step :editor/set-status [[_ status] _format]
  (db-based-set-status status))

(defmethod handle-step :editor/set-property [[_ property-id value]]
  (when-let [block (state/get-edit-block)]
    (db-property-handler/set-block-property! (:db/id block) property-id value)))

(defmethod handle-step :editor/set-property-on-block-property [[_ block-property-id property-id value]]
  (let [updated-block (when-let [block-uuid (:block/uuid (state/get-edit-block))]
                        (db/entity [:block/uuid block-uuid]))
        block-property-value (get updated-block block-property-id)]
    (when block-property-value
      (db-property-handler/set-block-property! (:db/id block-property-value) property-id value))))

(defmethod handle-step :editor/upsert-type-block [[_ type lang]]
  (when-let [block (state/get-edit-block)]
    (state/pub-event! [:editor/upsert-type-block {:block block :type type :lang lang}])))

(defn- db-based-set-priority
  [priority]
  (when-let [block (state/get-edit-block)]
    (if (nil? priority)
      (db-property-handler/set-block-property! (:block/uuid block) :logseq.property/priority :logseq.property/empty-placeholder)
      (db-property-handler/batch-set-property-closed-value! [(:block/uuid block)] :logseq.property/priority priority))))

(defmethod handle-step :editor/set-priority [[_ priority] _format]
  (db-based-set-priority priority))

(defmethod handle-step :editor/set-scheduled [[_]]
  (state/pub-event! [:editor/new-property {:property-key "Scheduled"}]))

(defmethod handle-step :editor/set-deadline [[_]]
  (state/pub-event! [:editor/new-property {:property-key "Deadline"}]))

(defmethod handle-step :editor/run-query-command [[_]]
  (state/pub-event! [:editor/run-query-command]))

(def clear-markdown-heading common-util/clear-markdown-heading)

(defmethod handle-step :editor/set-heading [[_ heading]]
  (when-let [input-id (state/get-edit-input-id)]
    (when-let [_current-input (gdom/getElement input-id)]
      (let [current-block (state/get-edit-block)]
        (state/pub-event! [:editor/set-heading current-block heading])))))

(defmethod handle-step :editor/search-page [_]
  (state/set-editor-action! :page-search))

(defmethod handle-step :editor/search-page-hashtag [[_]]
  (state/set-editor-action! :page-search-hashtag))

(defmethod handle-step :editor/search-block [[_ type]]
  (when (= type :embed)
    (reset! *current-command "Block embed")
    (state/set-editor-action-data! {:pos (cursor/get-caret-pos (state/get-input))}))
  (state/set-editor-action! :block-search))

(defmethod handle-step :editor/search-template [[_]]
  (state/set-editor-action! :template-search))

(defmethod handle-step :editor/show-input [[_ option]]
  (state/set-editor-show-input! option))

(defn insert-youtube-timestamp
  []
  (let [input-id (state/get-edit-input-id)
        macro (youtube/gen-youtube-ts-macro)]
    (when-let [input (gdom/getElement input-id)]
      (when macro
        (util/insert-at-current-position! input (str macro " "))))))

(defmethod handle-step :youtube/insert-timestamp [[_]]
  (let [input-id (state/get-edit-input-id)
        macro (youtube/gen-youtube-ts-macro)]
    (insert! input-id macro {})))

(defmethod handle-step :editor/toggle-children-number-list [[_]]
  (when-let [block (state/get-edit-block)]
    (state/pub-event! [:editor/toggle-children-number-list block])))

(defmethod handle-step :editor/toggle-own-number-list [[_]]
  (when-let [block (state/get-edit-block)]
    (state/pub-event! [:editor/toggle-own-number-list block])))

(defmethod handle-step :editor/remove-own-number-list [[_]]
  (when-let [block (state/get-edit-block)]
    (state/pub-event! [:editor/remove-own-number-list block])))

(defmethod handle-step :editor/show-date-picker [[_ type]]
  (if (and
       (contains? #{:scheduled :deadline} type)
       (string/blank? (gobj/get (state/get-input) "value")))
    (do
      (notification/show! [:div (t :notification/add-content-first)] :warning)
      (restore-state))
    (do
      (state/set-timestamp-block! nil)
      (state/set-editor-action! :datepicker))))

(defmethod handle-step :editor/click-hidden-file-input [[_ _input-id]]
  (when-let [input-file (gdom/getElement "upload-file")]
    (.click input-file)))

(defmethod handle-step :editor/exit [[_]]
  (p/do!
   (state/pub-event! [:editor/save-current-block])
   (state/clear-edit!)))

(defmethod handle-step :editor/new-property [[_]]
  (state/pub-event! [:editor/new-property]))

(defmethod handle-step :default [[type & _args]]
  (prn "No handler for step: " type))

(defn handle-steps
  [vector' format]
  (p/doseq [step vector']
    (handle-step step format)))

(defn exec-plugin-simple-command!
  [pid {:keys [block-id] :as cmd} action]
  (let [format (and block-id (get (db/entity [:block/uuid block-id]) :block/format :markdown))
        inputs (vector (conj action (assoc cmd :pid pid)))]
    (handle-steps inputs format)))
