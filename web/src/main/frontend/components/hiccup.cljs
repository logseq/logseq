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
            [frontend.ui :as ui]
            [frontend.handler :as handler]
            [goog.object :as gobj]
            [medley.core :as medley]
            [cljs.reader :as reader]))

;; local state
(defonce *mouse
  (atom {}))

(defonce *dragging?
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
   {:class "object-contain object-left-top"
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

(rum/defc page-cp
  [page]
  [:a.page-ref
   {:href (str "/page/" (util/url-encode (:page/name page)))
    :on-click (fn [e]
                (util/stop e)
                (when (gobj/get e "shiftKey")
                  (when-let [page (db/entity [:page/name (:page/name page)])]
                    (state/sidebar-add-block!
                     (state/get-current-repo)
                     (:db/id page)
                     :page
                     {:page page}))
                  (handler/show-right-sidebar)))}
   (util/capitalize-all (:page/name page))])

(defn- latex-environment-content
  [name option content]
  (if (= (string/lower-case name) "equation")
    content
    (util/format "\\begin%s\n%s\\end{%s}"
                 (str "{" name "}" option)
                 content
                 name)))

(rum/defc latex <
  {:did-mount (fn [state]
                (let [[id s display?] (:rum/args state)
                      component (:rum/react-component state)]
                  (when js/window.katex
                    (js/katex.render s (gdom/getElement id)
                                     #js {:displayMode display?
                                          :throwOnError false})))
                state)}
  [id s block? display?]
  (let [element (if block?
                  :div.latex
                  :span.latex-inline)]
    [element {:id id}
     s]))

(rum/defc inline < rum/reactive
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
    (latex (str (dc/squuid)) s false true)

    ["Latex_Fragment" ["Inline" s]]
    (latex (str (dc/squuid)) s false false)

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
        (case (first s)
          \#
          (->elem :a {:href (str "#" (anchor-link (subs s 1)))} (map-inline config label))
          ;; FIXME: same headline, see more https://orgmode.org/manual/Internal-Links.html
          \*
          (->elem :a {:href (str "#" (anchor-link (subs s 1)))} (map-inline config label))
          ;; page reference
          [:span.page-reference
           [:span.text-gray-500 "[["]
           (page-cp {:page/name s})
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
    ["Export_Snippet" "hiccup" s]
    (reader/read-string s)

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

(rum/defc heading-control < rum/reactive
  [config uuid heading-id level start-level collapsed? collapsed-atom? body children dummy?]
  (let [control-show (util/react (rum/cursor *control-show? heading-id))
        dark? (= "dark" (state/sub :ui/theme))
        has-child? (or (seq children)
                       (seq body))]
    [:div.hd-control.mr-2.flex.flex-row.items-center
     {:style {:height 24
              :padding-left 10
              :float "left"}}
     [:a.heading-control
      {:id (str "control-" uuid)
       :style {:width 16
               :height 16
               :padding-left 2}
       :class "transition ease-in-out duration-150"
       :on-click (fn [e]
                   (util/stop e)
                   (let [id (str "ls-heading-" uuid)]
                     (if collapsed?
                       (expand/expand! (:id config) id)
                       (expand/collapse! (:id config) id))
                     (reset! collapsed-atom? (not collapsed?))))}
      (cond
        (and control-show collapsed?)
        (svg/caret-right)

        (and control-show has-child?)
        (svg/caret-down)

        :else
        [:span ""])]
     [:a
      (cond->
          {:id (str "dot-" uuid)
           :draggable true
           :on-drag-start (fn [event]
                            (.setData (gobj/get event "dataTransfer")
                                      "heading-uuid"
                                      uuid)
                            (.setData (gobj/get event "dataTransfer")
                                      "heading-dom-id"
                                      heading-id)
                            (reset! *dragging? true))
           ;; :on-drag-end (fn [event]
           ;;                (reset! *dragging? false)
           ;;                (reset! *mouse {}))

           :style {:width 16
                   :height 16}
           :headingid (str uuid)}
        (not dummy?)
        (assoc :href (str "/page/" uuid)
               :on-click (fn [e]
                           (util/stop e)
                           (when (gobj/get e "shiftKey")
                             (state/sidebar-add-block!
                              (state/get-current-repo)
                              (get-in config [:heading :db/id])
                              :heading
                              (:heading config))
                             (handler/show-right-sidebar)))))
      (if collapsed?
        [:svg {:height 16
               :width 16
               :fill "currentColor"
               :display "inline-block"}
         [:circle {:cx 8
                   :cy 8
                   :r 5
                   :stroke (if dark? "#1d6577" "#cbd7de")
                   :stroke-width 5
                   :fill "none"}]
         [:circle {:cx 8
                   :cy 8
                   :r 3}]]
        [:svg {:height 16
               :width 16
               :fill "currentColor"
               :display "inline-block"}
         [:circle {:cx 8
                   :cy 8
                   :r 3}]])]]))

(defn- build-id
  [config ref? sidebar?]
  (cond
    ref? (str (:id config) "-")
    sidebar? (str "sidebar-" (:id config) "-")
    (:custom-query? config) (str "custom-query-" (:id config) "-")
    :else nil))

(rum/defc dnd-separator
  [heading margin-left top?]
  (let [id (str (:heading/uuid heading))]
    [:div.dnd-separator
     {:id id
      :style (merge
              {:position "absolute"
               :left 0
               :width (- 700 margin-left)}
              (if top?
                {:top 0}
                {:bottom 0}))
      :on-mouse-move (fn [event]
                       (let [client-x (gobj/get event "clientX")]
                         (reset! *mouse {:client-x client-x})))}]))

(declare heading-container)
(rum/defcs heading-cp < rum/reactive
  (rum/local false ::collapsed?)
  {:did-update (fn [state]
                 (util/code-highlight!)
                 state)}
  [state {:heading/keys [uuid title level body meta content dummy? lock? page format repo children] :as heading} heading-part config]
  (let [dragging? (rum/react *dragging?)
        config (assoc config :heading heading)
        ref? (boolean (:ref? config))
        sidebar? (boolean (:sidebar? config))
        unique-dom-id (build-id config ref? sidebar?)
        edit-input-id (str "edit-heading-" unique-dom-id uuid)
        edit? (state/sub [:editor/editing? edit-input-id])
        heading-id (str "ls-heading-" unique-dom-id uuid)
        collapsed-atom? (get state ::collapsed?)
        toggle-collapsed? (state/sub [:ui/collapsed-headings heading-id])
        has-child? (or (seq children)
                       (seq body))
        collapsed? (or (and
                        toggle-collapsed?
                        has-child?)
                       @collapsed-atom?)
        start-level (or (:start-level config) 1)
        margin-left -27]
    (when-not lock?
      [:div.ls-heading.flex.flex-col
       {:id heading-id
        :style {:position "relative"}
        :class (str uuid
                    (if dummy? " dummy"))
        :headingid (str uuid)
        :repo repo
        :level level
        :on-drag-over (fn [event]
                        (let [element (gdom/getElement (str uuid))]
                          (when (d/has-class? element "dnd-separator")
                            (d/remove-class! element "dnd-separator")
                            (d/add-class! element "dnd-separator-cur")))
                        (util/stop event))
        :on-drag-leave (fn [event]
                         (let [element (gdom/getElement (str uuid))]
                           (when (d/has-class? element "dnd-separator-cur")
                             (d/remove-class! element "dnd-separator-cur")
                             (d/add-class! element "dnd-separator"))))
        :on-drop (fn [event]
                   (reset! *dragging? false)
                   ;; (let [get-data-transfer-attr (fn [attr] (.getData (gobj/get event "dataTransfer") attr))
                   ;;       from-id (cljs.core/uuid (get-data-transfer-attr "heading-uuid"))
                   ;;       from-dom-id (get-data-transfer-attr "heading-dom-id")]
                   ;;   (cond
                   ;;     (= from-id (:heading/uuid heading))
                   ;;     nil

                   ;;     :else
                   ;;     (handler/move-heading from-id
                   ;;                           heading
                   ;;                           from-dom-id
                   ;;                           false)))
                   )
        :on-mouse-over (fn [e]
                         (util/stop e)
                         (when has-child?
                           (swap! *control-show? assoc heading-id true)))
        :on-mouse-out (fn [e]
                        (util/stop e)
                        (when has-child?
                          (swap! *control-show?
                                 assoc heading-id false)))}
       [:div.flex-1.flex-row
        {:style {:margin-left margin-left}}
        (heading-control config uuid heading-id level start-level collapsed? collapsed-atom? body children dummy?)

        (if edit?
          (editor/box (string/trim content)
                      {:heading heading
                       :heading-id uuid
                       :heading-parent-id heading-id
                       :format format
                       :dummy? dummy?
                       :on-hide (fn [value event]
                                  (when (= event :esc)
                                    (handler/highlight-heading! uuid)))}
                      edit-input-id)
          [:div.flex.flex-col
           {:style {:cursor "text"
                    :min-height 24}
            :on-click (fn [e]
                        (let [target (gobj/get e "target")]
                          (when-not (or (util/link? target)
                                        (util/input? target)
                                        (and (util/sup? target)
                                             (d/has-class? target "fn")))
                            (handler/clear-selection! nil)
                            (handler/unhighlight-heading!)
                            (util/stop e)
                            (handler/reset-cursor-range! (gdom/getElement heading-id))
                            (state/set-editing!
                             edit-input-id
                             (handler/remove-level-spaces content format)
                             heading))))}
           heading-part

           (when (seq body)
             [:div.heading-body
              (for [child body]
                (let [block (block config child)]
                  (rum/with-key (heading-child block)
                    (cljs.core/random-uuid))))])])]

       (when (seq children)
         [:div.heading-children {:style {:padding-left 20
                                         :margin-left 6}}
          (for [child children]
            (rum/with-key (heading-container config child)
              (:heading/uuid child)))])
       (when dragging?
         (dnd-separator heading 0 false))
       ])))

(rum/defc heading-checkbox
  [heading class]
  (case (:heading/marker heading)
    (list "DOING" "IN-PROGRESS" "TODO" "WAIT" "WAITING")
    (ui/checkbox {:class class
                  :style {:margin-top -5}
                  :on-change (fn [_e]
                               ;; FIXME: Log timestamp
                               (handler/check heading))})

    "DONE"
    (ui/checkbox {:checked true
                  :class (str class " checked")
                  :style {:margin-top -5}
                  :on-change (fn [_e]
                               ;; FIXME: Log timestamp
                               (handler/uncheck heading))})

    nil))

(rum/defc heading-container < rum/static
  [config {:heading/keys [uuid title tags marker level priority anchor meta format content]
           :as t}]
  (let [config (assoc config :heading t)
        checkbox (heading-checkbox t (str "mr-1 cursor"))
        marker-cp (if (contains? #{"DOING" "IN-PROGRESS" "WAIT" "WAITING"} marker)
                    [:span {:class (str "task-status " (string/lower-case marker))
                            :style {:margin-right 3.5}}
                     (string/upper-case marker)])
        priority (if priority
                   [:span {:class "priority"
                           :style {:margin-right 3.5}}
                    (util/format "[#%s]" (str priority))])
        tags (when-not (empty? tags)
               (->elem
                :span
                {:class "heading-tags"}
                (mapv (fn [{:keys [db/id tag/name]}]
                        [:span.tag {:key (str "tag-" id)}
                         [:span {:class name}
                          name]])
                      tags)))
        heading-part (when level
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
                                   [checkbox
                                    marker-cp
                                    priority]
                                   (map-inline config title)
                                   [tags])))))]
    (heading-cp t heading-part config)))

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
                                                 (gobj/get js/window "innerHeight"))}}
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

(rum/defc custom-query < rum/reactive
  {:did-mount (fn [state]
                (when-let [query (last (:rum/args state))]
                  (state/add-custom-query-component! query (:rum/react-component state)))
                state)}
  [config options content]
  [:div.custom-query.my-4
   [:code (or (:query-title options)
              "Query result: ")]
   (let [result (db/custom-query content)]
     (if (seq result)
       (->hiccup result (assoc config
                               :custom-query? true
                               :group-by-page? true)
                 {:style {:margin-top "0.25rem"
                          :margin-left "0.25rem"}})
       [:div "Empty"]))])

(rum/defc admonition
  [config type options result]
  (when-let [icon (case (string/lower-case (name type))
                    "note" svg/note
                    "tip" svg/tip
                    "important" svg/important
                    "caution" svg/caution
                    "warning" svg/warning
                    nil)]
    [:div.flex.flex-row.admonitionblock.my-4.align-items {:class type}
     [:div.pr-4.admonition-icon.flex.flex-col.justify-center
      {:title (string/upper-case type)} (icon)]
     [:div.ml-4.text-lg
      (blocks config result)]]))

(defn block
  [config item]
  (try
    (match item
      ["Paragraph" l]
      (->elem :p (map-inline config l))
      ["Horizontal_Rule"]
      [:hr]
      ["Heading" h]
      (heading-container config h)
      ["List" l]
      (->elem
       (list-element l)
       (map #(list-item config %) l))
      ["Table" t]
      (table config t)
      ["Math" s]
      (latex (str (dc/squuid)) s true true)
      ["Example" l]
      [:pre.pre-wrap-white-space
       (join-lines l)]
      ["Src" options]
      (let [{:keys [language options lines]} options
            attr (if language
                   {:data-lang language
                    :class lines})]
        [:pre.pre-wrap-white-space.code
         [:code attr
          (join-lines lines)]])
      ["Quote" l]
      (->elem
       :blockquote
       (blocks config l))
      ["Export" "html" options content]
      [:div {:dangerouslySetInnerHTML
             {:__html content}}]
      ["Export" "hiccup" options content]
      (reader/read-string content)
      ["Export" "latex" options content]
      (latex (str (dc/squuid)) content true false)

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
        (latex (str (dc/squuid)) content true true))
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
            [:sup.fn (str name "↩︎")]])]
         ])

      :else
      "")
    (catch js/Error e
      (prn "Convert to html failed, error: " e)
      "")))

(defn blocks
  [config col]
  (map #(block config %) col))

(rum/defc headings-cp
  [headings config]
  [:div.headings-container
   (let [headings (db/headings->vec-tree headings)]
     (for [item headings]
       (let [item (if (:heading/dummy? item)
                    item
                    (dissoc item :heading/meta))]
         (rum/with-key
           (heading-container config item)
           (:heading/uuid item)))))])

(defn ->hiccup
  ([headings config]
   (->hiccup headings config {}))
  ([headings config option]
   [:div.content option
    (if (:group-by-page? config)
      (for [[page headings] headings]
        (let [page (db/entity (:db/id page))]
          [:div.my-2 {:key (str "page-" (:db/id page))}
           (page-cp page)
           (headings-cp headings config)]))
      (headings-cp headings config))]))

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
