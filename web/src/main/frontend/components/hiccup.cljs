(ns frontend.components.hiccup
  (:refer-clojure :exclude [range])
  (:require [frontend.config :as config]
            [cljs.core.match :refer-macros [match]]
            [clojure.string :as string]
            [frontend.util :as util]
            [rum.core :as rum]
            [frontend.state :as state]
            [frontend.db :as db]
            [dommy.core :as d]
            [datascript.core :as dc]
            [goog.dom :as gdom]
            [frontend.expand :as expand]
            [frontend.components.editor :as editor]
            [frontend.components.svg :as svg]
            [frontend.components.draw :as draw]
            [frontend.ui :as ui]
            [frontend.components.widgets :as widgets]
            [frontend.handler :as handler]
            [frontend.handler.dnd :as dnd]
            [goog.object :as gobj]
            [medley.core :as medley]
            [cljs.reader :as reader]
            [frontend.util :as util :refer-macros [profile]]
            [frontend.mixins :as mixins]
            [frontend.extensions.latex :as latex]
            [frontend.extensions.code :as code]
            [frontend.extensions.sci :as sci]
            ["/frontend/utils" :as utils]
            [frontend.format.block :as block]
            [clojure.walk :as walk]))

;; local state
(defonce *heading-children
  (atom {}))

(defonce *dragging?
  (atom false))
(defonce *dragging-heading
  (atom nil))
(defonce *move-to-top?
  (atom false))

;; TODO:
;; add `key`

(defn- remove-nils
  [col]
  (remove nil? col))

(defn anchor-link
  [s]
  (.anchorLink js/window.Mldoc s))

(defn vec-cat
  [& args]
  (->> (apply concat args)
       remove-nils
       vec))

(defn ->elem
  ([elem items]
   (->elem elem nil items))
  ([elem attrs items]
   (let [elem (keyword elem)]
     (if attrs
       (vec
        (cons elem
              (cons attrs
                    (seq items))))
       (vec
        (cons elem
              (seq items)))))))

(defn- join-lines
  [l]
  (string/join "\n" l))

(defn- string-of-url
  [url]
  (match url
    (:or ["File" s] ["Search" s])
    s
    ["Complex" m]
    (let [{:keys [link protocol]} m]
      (if (= protocol "file")
        link
        (str protocol ":" link)))))

;; TODO: safe encoding asciis
;; TODO: image link to another link
(defn image-link [url href label]
  [:img.rounded-sm.shadow-xs.mb-2.mt-2
   {:class "object-contain object-center"
    :loading "lazy"
    :style {:max-height "24rem"}
    :src href
    :title (second (first label))}])

(defn repetition-to-string
  [[[kind] [duration] n]]
  (let [kind (case kind
               "Dotted" "."
               "Plus" "+"
               "DoublePlus" "++")]
    (str kind n (string/lower-case (str (first duration))))))

(defn timestamp-to-string
  [{:keys [active date time repetition wday active]}]
  (let [{:keys [year month day]} date
        {:keys [hour min]} time
        [open close] (if active ["<" ">"] ["[" "]"])
        repetition (if repetition
                     (str " " (repetition-to-string repetition))
                     "")
        hour (if hour (util/zero-pad hour))
        min  (if min (util/zero-pad min))
        time (cond
               (and hour min)
               (util/format " %s:%s" hour min)
               hour
               (util/format " %s" hour)
               :else
               "")]
    (util/format "%s%s-%s-%s %s%s%s%s"
                 open
                 (str year)
                 (util/zero-pad month)
                 (util/zero-pad day)
                 wday
                 time
                 repetition
                 close)))

(defn timestamp [{:keys [active date time repetition wday] :as t} kind]
  (let [prefix (case kind
                 "Scheduled"
                 [:i {:class "fa fa-calendar"
                      :style {:margin-right 3.5}}]
                 "Deadline"
                 [:i {:class "fa fa-calendar-times-o"
                      :style {:margin-right 3.5}}]
                 "Date"
                 nil
                 "Closed"
                 nil
                 "Started"
                 [:i {:class "fa fa-clock-o"
                      :style {:margin-right 3.5}}]
                 "Start"
                 "From: "
                 "Stop"
                 "To: "
                 nil)]
    (let [class (if (= kind "Closed")
                  "line-through")]
      [:span.timestamp (cond-> {:active (str active)}
                         class
                         (assoc :class class))
       prefix
       (timestamp-to-string t)])))

(defn range [{:keys [start stop]} stopped?]
  [:div {:class "timestamp-range"
         :stopped stopped?}
   (timestamp start "Start")
   (timestamp stop "Stop")])

(declare map-inline)
(declare block)

(defn page-cp
  [page]
  (let [page (string/lower-case page)]
    [:a.page-ref
     {:href (str "/page/" (util/encode-str page))
      :on-click (fn [e]
                  (util/stop e)
                  (when (gobj/get e "shiftKey")
                    (when-let [page (db/entity [:page/name page])]
                      (state/sidebar-add-block!
                       (state/get-current-repo)
                       (:db/id page)
                       :page
                       {:page page}))
                    (handler/show-right-sidebar)))}
     (util/capitalize-all page)]))

(defn- latex-environment-content
  [name option content]
  (if (= (string/lower-case name) "equation")
    content
    (util/format "\\begin%s\n%s\\end{%s}"
                 (str "{" name "}" option)
                 content
                 name)))

(declare headings-container)

(defn inline
  [config item]
  (match item
    ["Plain" s]
    s
    ["Spaces" s]
    s
    ["Superscript" l]
    (->elem :sup (map-inline config l))
    ["Subscript" l]
    (->elem :sub (map-inline config l))
    ["Tag" s]
    (if (and s (util/tag-valid? s))
      [:a.tag.mr-1 {:href (str "/page/" s)}
       (str "#" s)]
      [:span.warning.mr-1 {:title "Invalid tag, tags only accept alphanumeric characters, \"-\", \"_\", \"@\" and \"%\"."}
       (str "#" s)])
    ["Emphasis" [[kind] data] ]
    (let [elem (case kind
                 "Bold" :b
                 "Italic" :i
                 "Underline" :ins
                 "Strike_through" :del
                 "Highlight" :mark)]
      (->elem elem (map-inline config data)))
    ["Entity" e]
    [:span {:dangerouslySetInnerHTML
            {:__html (:html e)}}]

    ["Latex_Fragment" ["Displayed" s]]
    (latex/latex (str (dc/squuid)) s false true)

    ["Latex_Fragment" ["Inline" s]]
    (latex/latex (str (dc/squuid)) s false false)

    ["Target" s]
    [:a {:id s} s]

    ["Radio_Target" s]
    [:a {:id s} s]

    ["Email" address]
    (let [{:keys [local_part domain]} address
          address (str local_part "@" domain)]
      [:a {:href (str "mainto:" address)}
       address])

    ["Block_reference" id]
    ;; get heading content
    (when-not (string/blank? id)
      (when (util/uuid-string? id)
        (when-let [heading (db/pull-heading (uuid id))]
          [:span
           [:span.text-gray-500 "(("]
           [:a {:href (str "/page/" id)
                :on-click (fn [e]
                            (util/stop e)
                            (when (gobj/get e "shiftKey")
                              (state/sidebar-add-block!
                               (state/get-current-repo)
                               (:db/id heading)
                               :heading-ref
                               {:heading heading})
                              (handler/show-right-sidebar)))}
            (->elem :span.block-ref
                    (map-inline config (:heading/title heading)))]
           [:span.text-gray-500 "))"]])))

    ["Link" link]
    (let [{:keys [url label title]} link]
      (match url
        ["Search" s]
        (cond
          (= \# (first s))
          (->elem :a {:href (str "#" (anchor-link (subs s 1)))} (map-inline config label))
          ;; FIXME: same headline, see more https://orgmode.org/manual/Internal-Links.html
          (= \* (first s))
          (->elem :a {:href (str "#" (anchor-link (subs s 1)))} (map-inline config label))

          (re-find #"^https://" s)
          (->elem :a {:href s}
                  (map-inline config label))

          :else
          ;; page reference
          [:span.page-reference
           [:span.text-gray-500 "[["]
           (if (string/ends-with? s ".excalidraw")
             [:a.page-ref
              {:href (str "/draw?file=" (string/replace s (str config/default-draw-directory "/") ""))
               :on-click (fn [e] (util/stop e))}
              [:span
               (svg/excalidraw-logo)
               (string/capitalize (draw/get-file-title s))]
              ]
             (page-cp s))
           [:span.text-gray-500 "]]"]])

        :else
        (let [href (string-of-url url)
              protocol (and (= "Complex" (first url))
                            (:protocol (second url)))
              img-formats (set (map name (config/img-formats)))]
          (cond
            (= protocol "file")
            (->elem
             :a
             (cond->
                 {:href href}
               title
               (assoc :title title))
             (map-inline config label))

            ;; image
            (some (fn [fmt] (re-find (re-pattern (str "\\." fmt)) href)) img-formats)
            (image-link url href label)

            :else
            (->elem
             :a
             (cond->
                 {:href href
                  :target "_blank"}
               title
               (assoc :title title))
             (map-inline config label))))))

    ["Verbatim" s]
    [:code s]

    ["Code" s]
    [:code s]

    ["Inline_Source_Block" x]
    [:code (:code x)]

    ["Export_Snippet" "html" s]
    [:span {:dangerouslySetInnerHTML
            {:__html s}}]

    ;; String to hiccup
    ["Inline_Hiccup" s]
    (reader/read-string s)

    ["Export_Snippet" "embed" s]
    (when s
      (let [s (string/trim s)]
        (if (util/uuid-string? s)
          (let [id (uuid s)
                headings (db/get-heading-and-children (state/get-current-repo) id)]
            [:div.embed-block.pt-2.px-3.bg-base-2
             (headings-container headings (assoc config :embed? true))]))))

    ["Break_Line"]
    [:br]
    ["Hard_Break_Line"]
    [:br]

    ["Timestamp" ["Scheduled" t]]
    (timestamp t "Scheduled")
    ["Timestamp" ["Deadline" t]]
    (timestamp t "Deadline")
    ["Timestamp" ["Date" t]]
    (timestamp t "Date")
    ["Timestamp" ["Closed" t]]
    (timestamp t "Closed")
    ["Timestamp" ["Range" t]]
    (range t false)
    ["Timestamp" ["Clock" ["Stopped" t]]]
    (range t true)
    ["Timestamp" ["Clock" ["Started" t]]]
    (timestamp t "Started")

    ["Cookie" ["Percent" n]]
    [:span {:class "cookie-percent"}
     (util/format "[d%%]" n)]

    ["Cookie" ["Absolute" current total]]
    [:span {:class "cookie-absolute"}
     (util/format "[%d/%d]" current total)]

    ["Footnote_Reference" options]
    (let [{:keys [id name]} options
          encode-name (util/url-encode name)]
      [:sup.fn
       [:a {:id (str "fnr." encode-name)
            :class "footref"
            :href (str "#fn." encode-name)}
        name]])

    ;; TODO:
    ["Macro" options]
    (let [{:keys [name arguments]} options]
      "")

    :else
    ""))

(declare block)
(declare blocks)

(rum/defc heading-child
  [block]
  block)

(defonce *control-show? (atom {}))

(rum/defcs heading-control < rum/reactive
  {:will-mount (fn [state]
                 (let [heading (nth (:rum/args state) 1)
                       collapsed? (:heading/collapsed? heading)]
                   (state/set-collapsed-state! (:heading/uuid heading)
                                               collapsed?))
                 state)}
  [state config heading uuid heading-id level start-level body children dummy?]
  (let [has-child? (and
                    (not (:pre-heading? heading))
                    (or (seq children)
                        (seq body)))
        collapsed? (state/sub [:ui/collapsed-headings uuid])
        collapsed? (and has-child? collapsed?)
        control-show (util/react (rum/cursor *control-show? heading-id))
        dark? (= "dark" (state/sub :ui/theme))]
    [:div.hd-control.mr-2.flex.flex-row.items-center
     {:style {:height 24
              :padding-left 9
              :float "left"}}

     [:a.heading-control
      {:id (str "control-" uuid)
       :style {:width 14
               :height 16
               :margin-right 2}
       :on-click (fn [e]
                   (util/stop e)
                   (if collapsed?
                     (expand/expand! heading)
                     (expand/collapse! heading))

                   (state/set-collapsed-state! uuid (not collapsed?)))}
      (cond
        (and control-show collapsed?)
        (svg/caret-right)

        (and control-show has-child?)
        (svg/caret-down)

        :else
        [:span ""])]
     [:a (if (not dummy?)
           {:href (str "/page/" uuid)
            :on-click (fn [e]
                        (util/stop e)
                        (when (gobj/get e "shiftKey")
                          (state/sidebar-add-block!
                           (state/get-current-repo)
                           (:db/id heading)
                           :heading
                           heading)
                          (handler/show-right-sidebar)))})
      [:span.bullet-container.cursor
       {:id (str "dot-" uuid)
        :draggable true
        :on-drag-start (fn [event]
                         (handler/highlight-heading! uuid)
                         (.setData (gobj/get event "dataTransfer")
                                   "heading-uuid"
                                   uuid)
                         (.setData (gobj/get event "dataTransfer")
                                   "heading-dom-id"
                                   heading-id)
                         (reset! *dragging? true)
                         (reset! *dragging-heading heading))
        :headingid (str uuid)
        :class (str (when collapsed? "bullet-closed")
                    " "
                    (when (and (:document/mode? config)
                               (not collapsed?))
                      "hide-inner-bullet"))}
       [:span.bullet]]]]))

(defn- build-id
  [config ref? sidebar? embed?]
  (cond->>
      ""
    (and (:id config) (or ref? sidebar? embed?))
    (str (util/url-encode (:id config)) "-")

    (:custom-query? config)
    (str "custom-query-")

    embed?
    (str "embed-")

    sidebar?
    (str "sidebar-")))

(rum/defc dnd-separator
  [heading margin-left bottom top? nested?]
  (let [id (str (:heading/uuid heading)
                (cond nested?
                      "-nested"
                      top?
                      "-top"
                      :else
                      nil))]
    [:div.dnd-separator
     {:id id
      :style (merge
              {:position "absolute"
               :left margin-left
               :width (- 700 margin-left)}
              (if top?
                {:top 0}
                {:bottom bottom}))}]))

(declare heading-container)
(rum/defc heading-checkbox
  [heading class]
  (case (:heading/marker heading)
    (list "NOW" "LATER" "DOING" "IN-PROGRESS" "TODO" "WAIT" "WAITING")
    (ui/checkbox {:class class
                  :style {:margin-top -3
                          :margin-right 6}
                  :on-change (fn [_e]
                               ;; FIXME: Log timestamp
                               (handler/check heading))})

    "DONE"
    (ui/checkbox {:checked true
                  :class (str class " checked")
                  :style {:margin-top -3
                          :margin-right 6}
                  :on-change (fn [_e]
                               ;; FIXME: Log timestamp
                               (handler/uncheck heading))})

    nil))

(defn build-heading-part
  [config {:heading/keys [uuid title tags marker level priority anchor meta format content pre-heading?]
           :as t}]
  (let [config (assoc config :heading t)
        slide? (boolean (:slide? config))
        checkbox (when-not pre-heading?
                   (heading-checkbox t (str "mr-1 cursor")))
        marker-cp (when-not pre-heading?
                    (if (contains? #{"DOING" "IN-PROGRESS" "WAIT" "WAITING"} marker)
                      [:span {:class (str "task-status " (string/lower-case marker))
                              :style {:margin-right 3.5}}
                       (string/upper-case marker)]))
        priority (when-not pre-heading?
                   (if priority
                     [:span {:class "priority"
                             :style {:margin-right 3.5}}
                      (util/format "[#%s]" (str priority))]))
        tags (when-not pre-heading?
               (when-not (empty? tags)
                 (->elem
                  :span
                  {:class "heading-tags"}
                  (mapv (fn [{:keys [db/id tag/name]}]
                          (if (util/tag-valid? name)
                            [:a.tag.mx-1 {:key (str "tag-" id)
                                          :href (str "/page/" name)}
                             (str "#" name)]
                            [:span.warning.mx-1 {:title "Invalid tag, tags only accept alphanumeric characters, \"-\", \"_\", \"@\" and \"%\"."}
                             (str "#" name)]))
                        tags))))]
    (when level
      (let [element (if (<= level 6)
                      (keyword (str "h" level))
                      :div)]
        (->elem element
                (merge
                 {:id anchor}
                 (when marker
                   {:class (string/lower-case marker)}))
                (remove-nils
                 (concat
                  [(when-not slide? checkbox)
                   marker-cp
                   priority]
                  (map-inline config title)
                  [tags])))))))

(defn dnd-same-heading?
  [uuid]
  (= (:heading/uuid @*dragging-heading) uuid))

(defn show-dnd-separator
  [element-id]
  (when-let [element (gdom/getElement element-id)]
    (when (d/has-class? element "dnd-separator")
      (d/remove-class! element "dnd-separator")
      (d/add-class! element "dnd-separator-cur"))))

(defn hide-dnd-separator
  [element-id]
  (when-let [element (gdom/getElement element-id)]
    (when (d/has-class? element "dnd-separator-cur")
      (d/remove-class! element "dnd-separator-cur")
      (d/add-class! element "dnd-separator"))))

(defn- get-data-transfer-attr
  [event attr]
  (.getData (gobj/get event "dataTransfer") attr))

(rum/defc heading-content-or-editor < rum/reactive
  [config {:heading/keys [uuid title level body meta content dummy? page format repo children pre-heading? collapsed? idx] :as heading} edit-input-id heading-id slide?]
  (let [current-edit-input-id (state/sub-edit-input-id)
        edit? (= current-edit-input-id edit-input-id)
        follower? (and (not edit?)
                       current-edit-input-id
                       (when-let [s (util/extract-uuid current-edit-input-id)]
                         (= (cljs.core/uuid s) uuid)))
        heading (if follower?
                  (let [content (state/sub [:editor/content current-edit-input-id])
                        content (block/with-levels content format heading)
                        new-heading (first (second (first (block/parse-heading
                                                           (assoc heading :heading/content content) format))))]
                    (merge new-heading
                           {:heading/level level
                            :heading/meta meta
                            :heading/dummy? dummy?
                            :heading/children children
                            :heading/pre-heading? pre-heading?}))
                  heading)]
    (if edit?
      [:div {:id (str "editor-" edit-input-id)}
       (editor/box (string/trim content)
                   {:heading heading
                    :heading-id uuid
                    :heading-parent-id heading-id
                    :format format
                    :dummy? dummy?
                    :on-hide (fn [value event]
                               (when (= event :esc)
                                 (handler/highlight-heading! uuid)))}
                   edit-input-id
                   config)]
      (let [dragging? (rum/react *dragging?)
            drag-attrs {:on-click (fn [e]
                                    (let [target (gobj/get e "target")]
                                      (when-not (or (util/link? target)
                                                    (util/input? target)
                                                    (and (util/sup? target)
                                                         (d/has-class? target "fn")))
                                        (handler/clear-selection! nil)
                                        (handler/unhighlight-heading!)
                                        (util/stop e)
                                        (let [cursor-range (util/caret-range (gdom/getElement heading-id))]
                                          (state/set-editing!
                                           edit-input-id
                                           (handler/remove-level-spaces content format)
                                           heading
                                           cursor-range)))))
                        :on-drag-over (fn [event]
                                        (util/stop event)
                                        (when-not (dnd-same-heading? uuid)
                                          (show-dnd-separator (str uuid "-nested"))))
                        :on-drag-leave (fn [event]
                                         (hide-dnd-separator (str uuid))
                                         (hide-dnd-separator (str uuid "-nested"))
                                         (hide-dnd-separator (str uuid "-top")))
                        :on-drop (fn [event]
                                   (util/stop event)
                                   (when-not (dnd-same-heading? uuid)
                                     (let [from-dom-id (get-data-transfer-attr event "heading-dom-id")]
                                       (dnd/move-heading @*dragging-heading
                                                         heading
                                                         from-dom-id
                                                         false
                                                         true)))
                                   (reset! *dragging? false)
                                   (reset! *dragging-heading nil)
                                   (handler/unhighlight-heading!))}]
        [:div.flex.flex-col.relative
         (cond-> {:style {:cursor "text"
                          :min-height 24}}
           (not slide?)
           (merge drag-attrs))

         (if pre-heading?
           [:div.pre-heading.pre-white-space
            (string/trim content)]
           (build-heading-part config heading))

         (when (and dragging? (not slide?))
           (dnd-separator heading 0 -4 false true))

         (when (and (not pre-heading?) (seq body))
           [:div.heading-body {:style {:display (if collapsed? "none" "")}}
            ;; TODO: consistent id instead of the idx (since it could be changed later)
            (for [[idx child] (medley/indexed (:heading/body heading))]
              (when-let [block (block config child)]
                (rum/with-key (heading-child block)
                  (str uuid "-" idx))))])]))))

(rum/defc dnd-separator-wrapper < rum/reactive
  [heading slide? top?]
  (let [dragging? (rum/react *dragging?)]
    (cond
      (and dragging? (not slide?))
      (dnd-separator heading 30 0 top? false)

      :else
      nil)))

(rum/defc heading-container < rum/static
  ;; (mixins/perf-measure-mixin "heading-container")
  [config {:heading/keys [uuid title level body meta content dummy? page format repo children collapsed? pre-heading? idx] :as heading}]
  (let [ref? (boolean (:ref? config))
        sidebar? (boolean (:sidebar? config))
        slide? (boolean (:slide? config))
        doc-mode? (:document/mode? config)
        embed? (:embed? config)
        unique-dom-id (build-id config ref? sidebar? embed?)
        edit-input-id (str "edit-heading-" unique-dom-id uuid)
        heading-id (str "ls-heading-" unique-dom-id uuid)
        has-child? (boolean
                    (and
                     (not pre-heading?)
                     (or (seq children)
                         (seq body))))
        start-level (or (:start-level config) 1)
        drag-attrs {:on-drag-over (fn [event]
                                    (util/stop event)
                                    (when-not (dnd-same-heading? uuid)
                                      (if (zero? idx)
                                        (let [element-top (gobj/get (utils/getOffsetRect (gdom/getElement heading-id)) "top")
                                              cursor-top (gobj/get event "clientY")]
                                          (if (<= (js/Math.abs (- cursor-top element-top)) 16)
                                            ;; top
                                            (do
                                              (hide-dnd-separator (str uuid))
                                              (show-dnd-separator (str uuid "-top"))
                                              (reset! *move-to-top? true))
                                            (do
                                              (hide-dnd-separator (str uuid "-top"))
                                              (show-dnd-separator (str uuid)))))
                                        (show-dnd-separator (str uuid)))))
                    :on-drag-leave (fn [event]
                                     (hide-dnd-separator (str uuid))
                                     (hide-dnd-separator (str uuid "-nested"))
                                     (hide-dnd-separator (str uuid "-top"))
                                     (reset! *move-to-top? false))
                    :on-drop (fn [event]
                               (when-not (dnd-same-heading? uuid)
                                 (let [from-dom-id (get-data-transfer-attr event "heading-dom-id")]
                                   (dnd/move-heading @*dragging-heading
                                                     heading
                                                     from-dom-id
                                                     @*move-to-top?
                                                     false)))
                               (reset! *dragging? false)
                               (reset! *dragging-heading nil)
                               (handler/unhighlight-heading!))
                    :on-mouse-over (fn [e]
                                     (util/stop e)
                                     (when has-child?
                                       (swap! *control-show? assoc heading-id true))
                                     (when-let [parent (gdom/getElement heading-id)]
                                       (let [node (.querySelector parent ".bullet-container")
                                             closed? (d/has-class? node "bullet-closed")]
                                         (if closed?
                                           (state/collapse-heading! uuid)
                                           (state/expand-heading! uuid))
                                         (when doc-mode?
                                           (d/remove-class! node "hide-inner-bullet")))))
                    :on-mouse-out (fn [e]
                                    (util/stop e)
                                    (when has-child?
                                      (swap! *control-show?
                                             assoc heading-id false))
                                    (when doc-mode?
                                      (when-let [parent (gdom/getElement heading-id)]
                                        (when-let [node (.querySelector parent ".bullet-container")]
                                          (d/add-class! node "hide-inner-bullet")))))}]
    [:div.ls-heading.flex.flex-col.pt-1
     (cond->
         {:id heading-id
          :style {:position "relative"}
          :class (str uuid
                      (when dummy? " dummy")
                      (when (and collapsed? has-child?) " collapsed")
                      (when pre-heading? " pre-heading"))
          :headingid (str uuid)
          :repo repo
          :level level
          :haschild (str has-child?)}
       (not slide?)
       (merge drag-attrs))

     (dnd-separator-wrapper heading slide? (zero? idx))

     [:div.flex-1.flex-row
      (when (not slide?)
        (heading-control config heading uuid heading-id level start-level body children dummy?))

      (heading-content-or-editor config heading edit-input-id heading-id slide?)]

     (when (seq children)
       [:div.heading-children {:style {:margin-left (if doc-mode? 12 31)
                                       :display (if collapsed? "none" "")}}
        (for [child children]
          (let [child (dissoc child :heading/meta)]
            (rum/with-key (heading-container config child)
              (:heading/uuid child))))])

     (dnd-separator-wrapper heading slide? false)]))

(defn list-element
  [l]
  (match l
    [l1 & tl]
    (let [{:keys [ordered name]} l1]
      (cond
        (seq name)
        :dl
        ordered
        :ol
        :else
        :ul))

    :else
    :ul))

(defn list-item
  [config {:keys [name content checkbox items number] :as l}]
  (let [content (when-not (empty? content)
                  (match content
                    [["Paragraph" i] & rest]
                    (vec-cat
                     (map-inline config i)
                     (blocks config rest))
                    :else
                    (blocks config content)))
        checked? (some? checkbox)
        items (if (seq items)
                (->elem
                 (list-element items)
                 (for [item items]
                   (list-item config item))))]
    (cond
      (seq name)
      [:dl {:checked checked?}
       [:dt (map-inline config name)]
       (->elem :dd
               (vec-cat content [items]))]

      :else
      (->elem
       :li
       {:checked checked?}
       (vec-cat
        [(->elem
          :p
          content)]
        [items])))))

(defn table
  [config {:keys [header groups col_groups]}]
  (let [tr (fn [elm cols]
             (->elem
              :tr
              (mapv (fn [col]
                      (->elem
                       elm
                       {:scope "col"
                        :class "org-left"}
                       (map-inline config col)))
                    cols)))
        tb-col-groups (try
                        (mapv (fn [number]
                                (let [col-elem [:col {:class "org-left"}]]
                                  (->elem
                                   :colgroup
                                   (repeat number col-elem))))
                              col_groups)
                        (catch js/Error e
                          []))
        head (if header
               [:thead (tr :th header)])
        groups (mapv (fn [group]
                       (->elem
                        :tbody
                        (mapv #(tr :td %) group)))
                     groups)]
    [:div.table-wrapper {:style {:max-width (min 700
                                                 (gobj/get js/window "innerWidth"))}}
     (->elem
      :table
      {:class "table-auto"
       :border 2
       :cell-spacing 0
       :cell-padding 6
       :rules "groups"
       :frame "hsides"}
      (vec-cat
       tb-col-groups
       (cons head groups)))]))

(defn map-inline
  [config col]
  (map #(inline config %) col))

(declare ->hiccup)

(rum/defcs custom-query < rum/reactive
  {:will-mount (fn [state]
                 (let [[config _options content] (:rum/args state)
                       query-atom (db/custom-query content)]
                   (assoc state :query-atom query-atom)))
   :did-mount (fn [state]
                (when-let [query (last (:rum/args state))]
                  (state/add-custom-query-component! query (:rum/react-component state)))
                state)
   :will-unmount (fn [state]
                   (when-let [query (last (:rum/args state))]
                     (state/remove-custom-query-component! query)
                     (db/remove-custom-query! (state/get-current-repo) query))
                   state)}
  [state config options content]
  (let [current-heading-uuid (:heading/uuid (:heading config))
        ;; exclude the current one, otherwise it'll loop forever
        remove-headings (if current-heading-uuid [current-heading-uuid] nil)
        query-result (rum/react (:query-atom state))
        result (db/custom-query-result-transform query-result remove-headings)]
    [:div.custom-query.my-2
     [:code (or (:query-title options)
                "Query result: ")]
     (if (seq result)
       (->hiccup result (assoc config
                               :custom-query? true
                               :group-by-page? true)
                 {:style {:margin-top "0.25rem"
                          :margin-left "0.25rem"}})
       [:div.text-sm.mt-2 "Empty"])]))

(defn admonition
  [config type options result]
  (when-let [icon (case (string/lower-case (name type))
                    "note" svg/note
                    "tip" svg/tip
                    "important" svg/important
                    "caution" svg/caution
                    "warning" svg/warning
                    nil)]
    [:div.flex.flex-row.admonitionblock.align-items {:class type}
     [:div.pr-4.admonition-icon.flex.flex-col.justify-center
      {:title (string/upper-case type)} (icon)]
     [:div.ml-4.text-lg
      (blocks config result)]]))

(defn block
  [config item]
  (try
    (match item
      ["Paragraph" l]
      ;; TODO: speedup
      (if (re-find #"\"Export_Snippet\" \"embed\"" (str l))
        (->elem :div (map-inline config l))
        (->elem :p (map-inline config l)))
      ["Horizontal_Rule"]
      (when-not (:slide? config)
        [:hr])
      ["Heading" h]
      (heading-container config h)
      ["List" l]
      (->elem
       (list-element l)
       (map #(list-item config %) l))
      ["Table" t]
      (table config t)
      ["Math" s]
      (latex/latex (str (dc/squuid)) s true true)
      ["Example" l]
      [:pre.pre-wrap-white-space
       (join-lines l)]
      ["Src" options]
      (let [{:keys [language options lines]} options
            attr (if language
                   {:data-lang language})
            code (join-lines lines)]
        (if (and (= language "clojure") (contains? (set options) ":results"))
          [:div
           (code/highlight (str (dc/squuid)) attr code)
           (sci/eval-result code)]
          (code/highlight (str (dc/squuid)) attr code)))
      ["Quote" l]
      (->elem
       :blockquote
       (blocks config l))
      ["Raw_Html" content]
      [:div.raw_html {:dangerouslySetInnerHTML
                      {:__html content}}]
      ["Export" "html" options content]
      [:div.export_html {:dangerouslySetInnerHTML
                         {:__html content}}]
      ["Hiccup" content]
      (reader/read-string content)

      ["Export" "latex" options content]
      (latex/latex (str (dc/squuid)) content true false)

      ["Custom" "query" options result content]
      (custom-query config options content)

      ["Custom" "note" options result content]
      (admonition config "note" options result)

      ["Custom" "tip" options result content]
      (admonition config "tip" options result)

      ["Custom" "important" options result content]
      (admonition config "important" options result)

      ["Custom" "caution" options result content]
      (admonition config "caution" options result)

      ["Custom" "warning" options result content]
      (admonition config "warning" options result)

      ["Custom" name options l content]
      (->elem
       :div
       {:class name}
       (blocks config l))
      ["Latex_Fragment" l]
      [:p.latex-fragment
       (inline config ["Latex_Fragment" l])]

      ["Latex_Environment" name option content]
      (let [content (latex-environment-content name option content)]
        (latex/latex (str (dc/squuid)) content true true))
      ["Footnote_Definition" name definition]
      (let [id (util/url-encode name)]
        [:div.footdef
         [:div.footpara
          (conj
           (block config ["Paragraph" definition])
           [:a.ml-1 {:id (str "fn." id)
                     :style {:font-size 14}
                     :class "footnum"
                     :href (str "#fnr." id)}
            [:sup.fn (str name "↩︎")]])]])

      :else
      "")
    (catch js/Error e
      (prn "Convert to html failed, error: " e)
      "")))

(defn blocks
  [config col]
  (map #(block config %) col))

(defn build-headings
  [headings config]
  (let [headings (db/headings->vec-tree headings)]
    (when (seq headings)
      (let [first-id (:heading/uuid (first headings))]
        (for [item headings]
          (let [item (-> (if (:heading/dummy? item)
                           item
                           (dissoc item :heading/meta)))
                item (if (= first-id (:heading/uuid item))
                       (assoc item :heading/idx 0)
                       item)]
            (rum/with-key
              (heading-container config item)
              (:heading/uuid item))))))))

(defn build-slide-sections
  [headings config]
  (when (seq headings)
    (let [first-heading-level (:heading/level (first headings))
          sections (reduce
                    (fn [acc heading]
                      (let [heading (dissoc heading :heading/meta)
                            level (:heading/level heading)
                            heading-cp (rum/with-key
                                         (heading-container config heading)
                                         (str "slide-" (:heading/uuid heading)))]
                        (if (= first-heading-level level)
                          ;; new slide
                          (conj acc [[heading heading-cp]])
                          (update acc (dec (count acc))
                                  (fn [sections]
                                    (conj sections [heading heading-cp]))))))
                    []
                    headings)]
      sections)))

(rum/defc headings-container < rum/static
  [headings config]
  (let [headings (map #(dissoc % :heading/children) headings)]
    [:div.headings-container {:style {:margin-left -24}}
    (build-headings headings config)]))

;; headers to hiccup
(rum/defc ->hiccup < rum/reactive
  ;; (mixins/perf-measure-mixin "hiccup")
  [headings config option]
  (let [document-mode? (state/sub [:document/mode?])
        config (assoc config :document/mode? document-mode?)]
    [:div.content (cond-> option
                    document-mode?
                    (assoc :class "doc-mode"))
     (if (:group-by-page? config)
       (for [[page headings] headings]
         (let [page (db/entity (:db/id page))]
           [:div.my-2 {:key (str "page-" (:db/id page))}
            (page-cp (:page/name page))
            (headings-container headings config)]))
       (headings-container headings config))]))

(comment
  ;; timestamps
  ;; [2020-02-10 Mon 13:22]
  ;; repetition
  (def r1 "<2005-10-01 Sat +1m>")
  ;; TODO: mldoc add supports
  (def r2 "<2005-10-01 Sat +1m -3d>")

  (def l
    "1. First item
hello world
2. Second item
nice
3. Third item")

  (def t
    "| Name  | Phone | Age |
|-------+-------+-----|
| Peter |  1234 |  17 |
| Anna  |  4321 |  25 |")
  )
