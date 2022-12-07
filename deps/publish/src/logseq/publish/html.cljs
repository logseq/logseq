(ns logseq.publish.html
  (:require [rum.core :as rum]
            [clojure.walk :as walk]
            [clojure.string :as string]
            [logseq.graph-parser.block :as gp-block]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [logseq.graph-parser.property :as gp-property]
            [logseq.graph-parser.util :as gp-util]
            [logseq.graph-parser.text :as text]
            [cljs.core.match :refer [match]]
            [logseq.graph-parser.util.page-ref :as page-ref]
            [logseq.graph-parser.util.block-ref :as block-ref]
            [cljs.reader :as reader]
            [logseq.publish.repeated :as repeated]
            [logseq.publish.block :as block]
            [logseq.publish.security :as security]
            [logseq.publish.svg :as svg]
            [logseq.publish.ui :as ui]
            [logseq.publish.util :as util]))

(defn- string-of-url
  [url]
  (match url
    ["File" s]
    (-> (string/replace s "file://" "")
        ;; "file:/Users/ll/Downloads/test.pdf" is a normal org file link
        (string/replace "file:" ""))

    ["Complex" m]
    (let [{:keys [link protocol]} m]
      (if (= protocol "file")
        link
        (str protocol "://" link)))))

(defn safe-read-string
  [s]
  (try
    (reader/read-string s)
    (catch :default e
      nil)))

(defn breadcrumb
  [config {:keys [show-page? indent? level-limit]
           :or {show-page? true
                level-limit 3}
           :as opts}]
  [:div "TBD (breadcrumb)"])

(rum/defc block-control
  [config block collapsed?]
  [:div.mr-1.flex.flex-row.items-center.sm:mr-2
   {:style {:height 24
            :margin-top 0
            :float "left"}}

   [:a.block-control
    {:id (str "control-" (:block/uuid block))}
    [:span {:class (if collapsed?
                     "control-show cursor-pointer"
                     "control-hide")}
     (ui/rotating-arrow collapsed?)]]])

(defn- walk-block
  [block check? transform]
  (let [result (atom nil)]
    (walk/postwalk
     (fn [x]
       (if (check? x)
         (reset! result (transform x))
         x))
     (:block/body block))
    @result))

(defn get-timestamp
  [block typ]
  (walk-block block
              (fn [x]
                (and (gp-block/timestamp-block? x)
                     (= typ (first (second x)))))
              #(second (second %))))

(defn get-scheduled-ast
  [block]
  (get-timestamp block "Scheduled"))

(defn get-deadline-ast
  [block]
  (get-timestamp block "Deadline"))

(defn hidden-properties
  "These are properties hidden from user including built-in ones and ones
  configured by user"
  []
  (gp-property/hidden-built-in-properties))

(defn properties-hidden?
  [properties]
  (and (seq properties)
       (let [ks (map (comp keyword string/lower-case name) (keys properties))
             hidden-properties-set (hidden-properties)]
         (every? hidden-properties-set ks))))

(rum/defc timestamp-cp
  [block typ ast]
  (let [{:keys [date time]} ast
        {:keys [year month day]} date
        {:keys [hour min]} time]
    [:div.flex.flex-col.timestamp
    [:div.text-sm.flex.flex-row
     [:div.opacity-50.font-medium.timestamp-label
      (str typ ": ")]
     [:a.opacity-80.hover:opacity-100
      [:span.time-start "<"] [:time (repeated/timestamp->text ast)] [:span.time-stop ">"]]]]))

(defn block-checkbox
  [block class]
  (let [marker (:block/marker block)
        [class checked?] (cond
                           (nil? marker)
                           nil
                           (contains? #{"NOW" "LATER" "DOING" "IN-PROGRESS" "TODO" "WAIT" "WAITING"} marker)
                           [class false]
                           (= "DONE" marker)
                           [(str class " checked") true])]
    (when class
      (ui/checkbox {:class class
                    :style {:margin-right 5}
                    :checked checked?}))))

(defn list-checkbox
  [config checked?]
  (ui/checkbox
   {:style {:margin-right 6}
    :checked checked?}))

(defn marker-switch
  [{:block/keys [marker] :as block}]
  (when (contains? #{"NOW" "LATER" "TODO" "DOING"} marker)
    [:a
     {:class (str "marker-switch block-marker " marker)}
     marker]))

(defn marker-cp
  [{:block/keys [pre-block? marker] :as _block}]
  (when-not pre-block?
    (when (contains? #{"IN-PROGRESS" "WAIT" "WAITING"} marker)
      [:span {:class (str "task-status block-marker " (string/lower-case marker))
              :style {:margin-right 3.5}}
       (string/upper-case marker)])))

(rum/defc priority-text
  [priority]
  [:a.opacity-50.hover:opacity-100
   {:class "priority"
    :style {:margin-right 3.5}}
   (util/format "[#%s]" (str priority))])

(defn priority-cp
  [{:block/keys [pre-block? priority] :as block}]
  (when (and (not pre-block?) priority)
    (priority-text priority)))

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

(defn block-tags-cp
  [{:block/keys [pre-block? tags] :as _block}]
  (when (and (not pre-block?)
             (seq tags))
    (->elem
     :span
     {:class "block-tags"}
     (mapv (fn [tag]
             (when-let [tag (or (:block/original-name tag)
                                (:block/name tag))]
               [:a.tag.mx-1 {:data-ref tag
                             :key (str "tag-" (:db/id tag))}
                (str "#" tag)]))
           tags))))

(declare map-inline)
(def hidden-editable-page-properties
  "Properties that are hidden in the pre-block (page property)"
  #{:title :filters :icon})

(defn- emphasis-cp
  [config kind data]
  (let [elem (case kind
               "Bold" :b
               "Italic" :i
               "Underline" :ins
               "Strike_through" :del
               "Highlight" :mark)]
    (->elem elem (map-inline config data))))

(rum/defc nested-link < rum/reactive
  [config link]
  (let [{:keys [content children]} link]
    [:span.page-reference.nested
     (let [page-name (subs content 2 (- (count content) 2))]
       [:a.page-ref page-name])]))

(declare block-content)

(rum/defc block-reference
  [config block label]
  (when (and block (:block/content block))
    (let [title [:span {:class "block-ref"}
                 (block-content (assoc config :block-ref? true) block)]]
      [:div.block-ref-wrap.inline
       (if label
         [:a {:href (str "/ref/" (:block/uuid block) "?graph-id=" (:graph-id config))}
          (->elem
           :span.block-ref
           (map-inline config label))]
         title)])))

(rum/defc page-reference < rum/reactive
  [s config _label]
  (let [s (some-> s string/trim)]
    (when-not (string/blank? s)
      [:span.page-reference
       {:data-ref s}
       [:span.text-gray-500.bracket page-ref/left-brackets]
       [:a {:href (str "/ref/" (util/url-encode (gp-util/page-name-sanity-lc s)) "?graph-id=" (:graph-id config))}
        s]
       [:span.text-gray-500.bracket page-ref/right-brackets]])))

(defn get-refed-block
  [refed-blocks id embed?]
  (let [blocks (get refed-blocks id)]
    (if embed?
      blocks
      (first (filter #(= (:block/uuid %) id) blocks)))))

(defn- search-link-cp
  [config url s label title metadata full_text]
  (cond
    (string/blank? s)
    nil

    (= \# (first s))
    ;; TBD
    nil
    ;; (->elem :a {:on-click #(route-handler/jump-to-anchor! (mldoc/anchorLink (subs s 1)))} (subs s 1))

    ;; FIXME: same headline, see more https://orgmode.org/manual/Internal-Links.html
    (and (= \* (first s))
         (not= \* (last s)))
    ;; (->elem :a {:on-click #(route-handler/jump-to-anchor! (mldoc/anchorLink (subs s 1)))} (subs s 1))
    ;; TBD
    nil

    (block-ref/block-ref? s)
    (let [id (block-ref/get-block-ref-id s)]
      (when (util/uuid-string? id)
        (when-let [block (get-refed-block (:refed-blocks config) id false)]
          (block-reference config block label))))

    (not (string/includes? s "."))
    (page-reference s config label)

    (gp-util/url? s)
    (->elem :a {:href s
                :data-href s
                :target "_blank"}
            (map-inline config label))

    ;; (show-link? config metadata s full_text)
    ;; (media-link config url s label metadata full_text)

    ;; (util/electron?)
    ;; (let [path (cond
    ;;              (string/starts-with? s "file://")
    ;;              (string/replace s "file://" "")

    ;;              (string/starts-with? s "/")
    ;;              s

    ;;              :else
    ;;              (relative-assets-path->absolute-path s))]
    ;;   (->elem
    ;;    :a
    ;;    (cond->
    ;;     {:href      (str "file://" path)
    ;;      :data-href path
    ;;      :target    "_blank"}
    ;;      title
    ;;      (assoc :title title))
    ;;    (map-inline config label)))

    ;; TBD handle assets

    :else
    nil))

(defn- plain->text
  [plains]
  (string/join (map last plains)))

(defonce max-depth-of-links 5)

(defn- link-cp [config link]
  (let [{:keys [url label title metadata full_text]} link]
    (match url
      ["Block_ref" id]
      (let [label* (if (seq (plain->text label)) label nil)
            {:keys [link-depth]} config
            link-depth (or link-depth 0)
            block (get-refed-block (:refed-blocks config) (uuid id) false)]
        (when (and block (<= link-depth max-depth-of-links))
          (block-reference (assoc config
                                  :reference? true
                                  :link-depth (inc link-depth)
                                  :block/uuid id)
                           block label*)))

      ["Page_ref" page]
      (let [label* (if (seq (plain->text label)) label nil)]
        (when-not (and (string? page) (string/blank? page))
          (page-reference page config label*)))

      ["Embed_data" src]
      ;; TBD
      nil
      ;; (image-link config url src nil metadata full_text)

      ["Search" s]
      (search-link-cp config url s label title metadata full_text)

      :else
      (let [href (string-of-url url)
            [protocol path] (or (and (= "Complex" (first url)) url)
                                (and (= "File" (first url)) ["file" (second url)]))]
        (cond
          (= protocol "file")
          nil

          :else
          (->elem
           :a.external-link
           (cond->
            {:href href
             :target "_blank"}
             title
             (assoc :title title))
           (map-inline config label)))))))

(declare markup-element-cp)
(declare markup-elements-cp)

(defn repetition-to-string
  [[[kind] [duration] n]]
  (let [kind (case kind
               "Dotted" "."
               "Plus" "+"
               "DoublePlus" "++")]
    (str kind n (string/lower-case (str (first duration))))))

(defn timestamp-to-string
  [{:keys [_active date time repetition wday active]}]
  (let [{:keys [year month day]} date
        {:keys [hour min]} time
        [open close] (if active ["<" ">"] ["[" "]"])
        repetition (if repetition
                     (str " " (repetition-to-string repetition))
                     "")
        hour (when hour (util/zero-pad hour))
        min  (when min (util/zero-pad min))
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

(defn timestamp [{:keys [active _date _time _repetition _wday] :as t} kind]
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
                 nil)
        class (when (= kind "Closed")
                "line-through")]
    [:span.timestamp (cond-> {:active (str active)}
                       class
                       (assoc :class class))
     prefix (timestamp-to-string t)]))

(def bilibili-regex #"^((?:https?:)?//)?((?:www).)?((?:bilibili.com))(/(?:video/)?)([\w-]+)(\?p=(\d+))?(\S+)?$")
(def loom-regex #"^((?:https?:)?//)?((?:www).)?((?:loom.com))(/(?:share/|embed/))([\w-]+)(\S+)?$")
(def vimeo-regex #"^((?:https?:)?//)?((?:www).)?((?:player.vimeo.com|vimeo.com))(/(?:video/)?)([\w-]+)(\S+)?$")
(def youtube-regex #"^((?:https?:)?//)?((?:www|m).)?((?:youtube.com|youtu.be|y2u.be|youtube-nocookie.com))(/(?:[\w-]+\?v=|embed/|v/)?)([\w-]+)([\S^\?]+)?$")

(defn get-matched-video
  [url]
  (or (re-find youtube-regex url)
      (re-find loom-regex url)
      (re-find vimeo-regex url)
      (re-find bilibili-regex url)))

(rum/defc youtube-video
  [id]
  (let [width 560
        height 315]
    [:iframe
     {:id                (str "youtube-player-" id)
      :allow-full-screen "allowfullscreen"
      :allow "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
      :frame-border      "0"
      :src               (str "https://www.youtube.com/embed/" id "?enablejsapi=1")
      :height            height
      :width             width}]))

(defn- macro-vimeo-cp
  [arguments]
  (when-let [url (first arguments)]
    (when-let [vimeo-id (nth (util/safe-re-find vimeo-regex url) 5)]
      (when-not (string/blank? vimeo-id)
        (let [width 560
              height 315]
          [:iframe
           {:allow-full-screen "allowfullscreen"
            :allow
            "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
            :frame-border "0"
            :src (str "https://player.vimeo.com/video/" vimeo-id)
            :height height
            :width width}])))))

(defn- macro-video-cp
  [arguments]
  (when-let [url (first arguments)]
    (let [results (get-matched-video url)
          src (match results
                     [_ _ _ (:or "youtube.com" "youtu.be" "y2u.be") _ id _]
                     (if (= (count id) 11) ["youtube-player" id] url)

                     [_ _ _ "youtube-nocookie.com" _ id _]
                     (str "https://www.youtube-nocookie.com/embed/" id)

                     [_ _ _ "loom.com" _ id _]
                     (str "https://www.loom.com/embed/" id)

                     [_ _ _ (_ :guard #(string/ends-with? % "vimeo.com")) _ id _]
                     (str "https://player.vimeo.com/video/" id)

                     [_ _ _ "bilibili.com" _ id & query]
                     (str "https://player.bilibili.com/player.html?bvid=" id "&high_quality=1"
                          (when-let [page (second query)]
                            (str "&page=" page)))

                     :else
                     url)]
      (if (and (coll? src)
               (= (first src) "youtube-player"))
        (youtube-video (last src))
        (when src
          (let [width 560
                height (if (string/includes? src "player.bilibili.com")
                         360 315)]
            [:iframe
             {:allow-full-screen true
              :allow "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
              :framespacing "0"
              :frame-border "no"
              :border "0"
              :scrolling "no"
              :src src
              :width width
              :height height}]))))))

(declare blocks-container)
(rum/defc block-embed
  [config uuid]
  (let [blocks (get-refed-block (:refed-blocks config) uuid true)]
    [:div.embed-block
     (blocks-container blocks (assoc config
                                     :id (str uuid)
                                     :embed-id uuid
                                     :embed? true
                                     :embed-parent (:block config))
                       uuid)]))

(defn- macro-embed-cp
  [config arguments]
  (let [a (first arguments)
        {:keys [link-depth]} config
        link-depth (or link-depth 0)]
    (cond
      (nil? a)                      ; empty embed
      nil

      (> link-depth max-depth-of-links)
      [:p.warning.text-sm "Embed depth is too deep"]

      (page-ref/page-ref? a)
      (let [page-name (text/get-page-name a)]
        (when-not (string/blank? page-name)
          (page-reference page-name config nil)
          ;; TODO: page embed
          ))

      (block-ref/string-block-ref? a)
      (when-let [s (-> a block-ref/get-string-block-ref-id string/trim)]
        (when-let [id (uuid s)]
          (block-embed (assoc config :link-depth (inc link-depth)) id)))

      :else
      nil)))

(defn- macro-cp
  [config options]
  (let [{:keys [name arguments]} options
        arguments (if (and
                       (>= (count arguments) 2)
                       (and (string/starts-with? (first arguments) page-ref/left-brackets)
                            (string/ends-with? (last arguments) page-ref/right-brackets))) ; page reference
                    (let [title (string/join ", " arguments)]
                      [title])
                    arguments)]
    (cond
      (contains? #{"query" "function" "namespace" "youtube-timestamp"
                   "zotero-imported-file" "zotero-linked-file" "tweet" "twitter"} name)
      nil

      (= name "youtube")
      (when-let [url (first arguments)]
        (when-let [youtube-id (cond
                                (== 11 (count url)) url
                                :else
                                (nth (util/safe-re-find youtube-regex url) 5))]
          (when-not (string/blank? youtube-id)
            (youtube-video youtube-id))))

      (= name "vimeo")
      (macro-vimeo-cp arguments)

      (= name "video")
      (macro-video-cp arguments)

      (= name "embed")
      (macro-embed-cp config arguments)

      :else
      nil)))

(defn inline
  [config item]
  (match item
    [(:or "Plain" "Spaces") s]
    (string/replace s " " " ")

    ["Superscript" l]
    (->elem :sup (map-inline config l))
    ["Subscript" l]
    (->elem :sub (map-inline config l))

    ["Tag" _]
    (when-let [s (gp-block/get-tag item)]
      (let [s (text/page-ref-un-brackets! s)]
        [:a.tag (str "#" s)]))

    ["Emphasis" [[kind] data]]
    (emphasis-cp config kind data)

    ["Entity" e]
    [:span {:dangerouslySetInnerHTML
            {:__html (:html e)}}]

    ["Latex_Fragment" [display s]] ;display can be "Displayed" or "Inline"
    :tbd
    ;; (latex/latex (str (d/squuid)) s false (not= display "Inline"))

    [(:or "Target" "Radio_Target") s]
    [:a {:id s} s]

    ["Email" address]
    (let [{:keys [local_part domain]} address
          address (str local_part "@" domain)]
      [:a {:href (str "mailto:" address)} address])

    ["Nested_link" link]
    (nested-link config link)

    ["Link" link]
    (link-cp config link)

    [(:or "Verbatim" "Code") s]
    [:code s]

    ["Inline_Source_Block" x]
    [:code (:code x)]

    ["Export_Snippet" "html" s]
    [:span {:dangerouslySetInnerHTML
            {:__html s}}]

    ["Inline_Hiccup" s] ;; String to hiccup
    (-> (safe-read-string s)
        (security/remove-javascript-links-in-href))

    ["Inline_Html" s]
    [:span {:dangerouslySetInnerHTML {:__html s}}]

    [(:or "Break_Line" "Hard_Break_Line")]
    [:br]

    ["Timestamp" [(:or "Scheduled" "Deadline") _timestamp]]
    nil
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
    (let [{:keys [name]} options
          encode-name (util/url-encode name)]
      [:sup.fn
       [:a {:id (str "fnr." encode-name)
            :class "footref"
            ;; :on-click #(route-handler/jump-to-anchor! (str "fn." encode-name))
            }
        name]])

    ["Macro" options]
    (macro-cp config options)

    :else ""))

(defn map-inline
  [config col]
  (map #(inline config %) col))

(def *debug-time (atom {}))

(defn inline-text
  ([format v]
   (inline-text {} format v))
  ([config format v]
   (when (string? v)
     (let [result (gp-mldoc/inline->edn v (gp-mldoc/default-config format))]
       [:div.inline.mr-1 (map-inline config result)]))))

(rum/defc property-cp
  [config block k value]
  (let [v (or
           (when (and (coll? value) (seq value))
             (get (:block/properties-text-values block) k))
           value)]
    [:div
     [:span.property-key.font-medium (name k)]
     [:span.mr-1 ":"]
     [:div.property-value.inline
      (inline-text config (:block/format block) (str v))]]))

(rum/defc properties-cp
  [config {:block/keys [pre-block?] :as block}]
  (when-not pre-block?
    (let [dissoc-keys (fn [m keys] (apply dissoc m keys))
          properties (cond-> (update-keys (:block/properties block) keyword)
                       true
                       (dissoc-keys (hidden-properties))
                       pre-block?
                       (dissoc-keys hidden-editable-page-properties))]
      (cond
        (seq properties)
        (let [properties-order (cond->> (:block/properties-order block)
                                 true
                                 (remove (hidden-properties))
                                 pre-block?
                                 (remove hidden-editable-page-properties))
              ordered-properties (if (seq properties-order)
                                   (map (fn [k] [k (get properties k)]) properties-order)
                                   properties)]
          [:div.block-properties
           {:class (when pre-block? "page-properties")}
           (for [[k v] ordered-properties]
             (rum/with-key (property-cp config block k v)
               (str (:block/uuid block) "-" k)))])

        :else
        nil))))

(defn build-block-title
  [config {:block/keys [title marker pre-block? properties]
           :as t}]
  (let [config (assoc config :block t)
        block-ref? (:block-ref? config)
        checkbox (when-not pre-block?
                   (block-checkbox t (str "mr-1 cursor")))
        marker-switch (when-not pre-block?
                        (marker-switch t))
        marker-cp (marker-cp t)
        priority (priority-cp t)
        tags (block-tags-cp t)
        bg-color (:background-color properties)
        heading (:heading properties)
        elem (if heading
               (keyword (str "h" heading
                             (when block-ref? ".inline")))
               :span.inline)]
    (->elem
     elem
     (merge
      {}
      (when (and marker
                 (not (string/blank? marker))
                 (not= "nil" marker))
        {:class (str (string/lower-case marker))})
      (when bg-color
        {:style {:background-color bg-color}
         :class "with-bg-color"}))
     (remove nil?
      (concat
       [checkbox
        marker-switch
        marker-cp
        priority]
       (when (seq title)
         (map-inline config title))
       [tags])))))

(defn divide-lists
  [[f & l]]
  (loop [l l
         ordered? (:ordered f)
         result [[f]]]
    (if (seq l)
      (let [cur (first l)
            cur-ordered? (:ordered cur)]
        (if (= ordered? cur-ordered?)
          (recur
           (rest l)
           cur-ordered?
           (update result (dec (count result)) conj cur))
          (recur
           (rest l)
           cur-ordered?
           (conj result [cur]))))
      result)))

(defn list-element
  [l]
  (match l
    [l1 & _tl]
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

(defn- vec-cat
  [& args]
  (->> (apply concat args)
       (remove nil?)
       vec))

(defn list-item
  [config {:keys [name content checkbox items number] :as _list}]
  (let [content (when-not (empty? content)
                  (match content
                    [["Paragraph" i] & rest]
                    (vec-cat
                     (map-inline config i)
                     (markup-elements-cp config rest))
                    :else
                    (markup-elements-cp config content)))
        checked? (some? checkbox)
        items (when (seq items)
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
      (if (nil? checkbox)
        (->elem
         :li
         (cond->
          {:checked checked?}
           number
           (assoc :value number))
         (vec-cat
          [(->elem
            :p
            content)]
          [items]))
        (->elem
         :li
         {:checked checked?}
         (vec-cat
          [(->elem
            :p
            (list-checkbox config checkbox)
            content)]
          [items]))))))

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
                        (catch :default _e
                          []))
        head (when header
               [:thead (tr :th header)])
        groups (mapv (fn [group]
                       (->elem
                        :tbody
                        (mapv #(tr :td %) group)))
                     groups)]
    [:div.table-wrapper {:style {:max-width 700}}
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

(defn- join-lines
  [l]
  (string/trim (apply str l)))

(defn admonition
  [config type result]
  (when-let [icon (case (string/lower-case (name type))
                    "note" svg/note
                    "tip" svg/tip
                    "important" svg/important
                    "caution" svg/caution
                    "warning" svg/warning
                    "pinned" svg/pinned
                    nil)]
    [:div.flex.flex-row.admonitionblock.align-items {:class type}
     [:div.pr-4.admonition-icon.flex.flex-col.justify-center
      {:title (string/upper-case type)} (icon)]
     [:div.ml-4.text-lg
      (markup-elements-cp config result)]]))

(rum/defc src-cp < rum/static
  [config options]
  (when options
    (let [{:keys [lines language]} options
          attr (when language
                 {:data-lang language
                  :class "code-block"})
          code (apply str lines)]
      [:pre.pre-wrap-white-space
       [:code attr
        code]])))

(declare block-container)

(defn ^:large-vars/cleanup-todo markup-element-cp
  [{:keys [html-export?] :as config} item]
  (try
    (match item
      ["Drawer" name lines]
      [:div
       [:div.text-sm
        [:div.drawer {:data-drawer-name name}
         [:div.opacity-50.font-medium.drawer-name
          (util/format ":%s:" (string/upper-case name))]
         [:div.opacity-50.font-medium
          (apply str lines)
          [:div ":END:"]]]]]

      ["Paragraph" l]
      (if (util/safe-re-find #"\"Export_Snippet\" \"embed\"" (str l))
        (->elem :div (map-inline config l))
        (->elem :div.is-paragraph (map-inline config l)))

      ["Horizontal_Rule"]
      [:hr]

      ["Heading" h]
      (block-container config h)

      ["List" l]
      (let [lists (divide-lists l)]
        (if (= 1 (count lists))
          (let [l (first lists)]
            (->elem
             (list-element l)
             (map #(list-item config %) l)))
          [:div.list-group
           (for [l lists]
             (->elem
              (list-element l)
              (map #(list-item config %) l)))]))

      ["Table" t]
      (table config t)

      ["Math" s]
      nil
      ;; (latex/html-export s true true)

      ["Example" l]
      [:pre.pre-wrap-white-space
       (join-lines l)]
      ["Quote" l]
      (->elem
       :blockquote
       (markup-elements-cp config l))
      ["Raw_Html" content]
      (when (not html-export?)
        [:div.raw_html {:dangerouslySetInnerHTML
                        {:__html content}}])
      ["Export" "html" _options content]
      (when (not html-export?)
        [:div.export_html {:dangerouslySetInnerHTML
                           {:__html content}}])
      ["Hiccup" content]
      (-> (safe-read-string content)
          (security/remove-javascript-links-in-href))

      ["Export" "latex" _options content]
      ;; (latex/html-export content true false)
      nil

      ["Custom" "query" _options _result content]
      nil

      ["Custom" "note" _options result _content]
      (admonition config "note" result)

      ["Custom" "tip" _options result _content]
      (admonition config "tip" result)

      ["Custom" "important" _options result _content]
      (admonition config "important" result)

      ["Custom" "caution" _options result _content]
      (admonition config "caution" result)

      ["Custom" "warning" _options result _content]
      (admonition config "warning" result)

      ["Custom" "pinned" _options result _content]
      (admonition config "pinned" result)

      ["Custom" "center" _options l _content]
      (->elem
       :div.text-center
       (markup-elements-cp config l))

      ["Custom" name _options l _content]
      (->elem
       :div
       {:class name}
       (markup-elements-cp config l))

      ["Latex_Fragment" l]
      [:p.latex-fragment
       (inline config ["Latex_Fragment" l])]

      ["Latex_Environment" name option content]
      nil
      ;; (let [content (latex-environment-content name option content)]
      ;;   (latex/html-export content true true))

      ["Displayed_Math" content]
      nil
      ;; (latex/html-export content true true)

      ["Footnote_Definition" name definition]
      (let [id (util/url-encode name)]
        [:div.footdef
         [:div.footpara
          (conj
           (markup-element-cp config ["Paragraph" definition])
           [:a.ml-1 {:id (str "fn." id)
                     :style {:font-size 14}
                     :class "footnum"
                     ;; :on-click #(route-handler/jump-to-anchor! (str "fnr." id))
                     }
            [:sup.fn (str name "↩︎")]])]])

      ["Src" options]
      [:div.cp__fenced-code-block
       (src-cp config options)]

      :else
      "")
    (catch :default e
      (println "Convert to html failed, error: " e)
      "")))

(defn markup-elements-cp
  [config col]
  (map #(markup-element-cp config %) col))

(rum/defc block-child
  [block]
  block)

(rum/defc block-content
  [config {:block/keys [uuid content children properties scheduled deadline format pre-block?] :as block}]
  (let [{:keys [result time]} (util/profile-with-time (block/parse-title-and-body uuid format pre-block? content))
        _ (swap! *debug-time update :parsing + time)
        {:block/keys [title body] :as block} (merge block result)]
    [:div.flex.flex-col.block-content-wrapper
    [:div.flex-1.w-full.flex
     [:div.block-content.inline
      {:id (str "block-content-" uuid)}
      [:<>
       (when (seq title)
         (build-block-title config block))

       (when deadline
         (when-let [deadline-ast (get-deadline-ast block)]
           (timestamp-cp block "DEADLINE" deadline-ast)))

       (when scheduled
         (when-let [scheduled-ast (get-scheduled-ast block)]
           (timestamp-cp block "SCHEDULED" scheduled-ast)))

       (when (and (seq properties)
                  (let [hidden? (properties-hidden? properties)]
                    (not hidden?)))
         (properties-cp config block))

       (when (seq body)
         [:div.block-body
          (let [body (block/trim-break-lines (:block/body block))]
            (for [[idx child] (util/indexed body)]
              (when-let [block (markup-element-cp config child)]
                (rum/with-key (block-child block)
                  (str uuid "-" idx)))))])]]]]))

(rum/defc block-children
  [config block children collapsed?]
  (let [children (when (coll? children)
                   (remove nil? children))]
    [:div.block-children-container.flex
     {:style {:margin-left 29}}
     [:div.block-children.w-full {:style {:display (if collapsed? "none" "")}}
      (for [child children]
        (when (map? child)
          (let [child (dissoc child :block/meta)
                config (-> config
                           (assoc :block/uuid (:block/uuid child))
                           (dissoc :breadcrumb-show? :embed-parent))]
            (rum/with-key (block-container config child)
              (:block/uuid child)))))]]))

(rum/defc block-container
  [config block]
  (let [collapsed? (and (:block/collapsed? block)
                        (seq (:block/children block)))
        embed? (:embed? config)
        reference? (:reference? config)
        ref? (:ref? config)
        custom-query? (boolean (:custom-query? config))
        ref-or-custom-query? (or ref? custom-query?)
        breadcrumb-show? (:breadcrumb-show? config)
        {:block/keys [uuid children pre-block? refs format content properties]} block
        heading? (:heading properties)]
    [:div.ls-block
     (cond->
       {:id (str uuid)
        :data-collapsed collapsed?}

       (or reference? embed?)
       (assoc :data-transclude true)

       embed?
       (assoc :data-embed true)

       custom-query?
       (assoc :data-query true))

     (when (and ref? breadcrumb-show?)
       (breadcrumb config {:show-page? false
                           :indent? true}))

     [:div.flex.flex-row.pr-2
      {:class (if (and heading? (seq (:block/title block))) "items-baseline" "")}
      (block-control config block collapsed?)

      (block-content config block)]

     (block-children config block children collapsed?)]))

(defn- block-item
  [config idx item]
  (let [item (dissoc item :block/meta)
        config (assoc config :block/uuid (:block/uuid item))]
    (rum/with-key (block-container config item)
      (str (:block/uuid item)))))

(rum/defc blocks-container
  [blocks config root-id]
  (let [doc-mode? (:document/mode? config)]
    (when (seq blocks)
      (let [{:keys [result time]} (util/profile-with-time (util/blocks->vec-tree blocks root-id))]
        (swap! *debug-time update :blocks->vec-tree + time)
        [:div.blocks-container
         {:class (when doc-mode? "document-mode")}
         (for [[idx item] (util/indexed result)]
           (block-item config idx item))]))))
