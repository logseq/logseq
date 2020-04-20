(ns frontend.format.html
  (:refer-clojure :exclude [range])
  (:require [frontend.config :as config]
            [cljs.core.match :refer-macros [match]]
            [clojure.string :as string]
            [frontend.util :as util]))

;; TODO:
;; add `key`

(defn- remove-nils
  [col]
  (remove nil? col))

(defn anchor-link
  [s]
  (.anchorLink js/window.MldocOrg s))

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
  [:img {:src href
         :title label}])

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
                      :style {:margin-right 6}}]
                 "Deadline"
                 [:i {:class "fa fa-calendar-times-o"
                      :style {:margin-right 6}}]
                 "Date"
                 nil
                 "Closed"
                 nil
                 "Started"
                 [:i {:class "fa fa-clock-o"
                      :style {:margin-right 6}}]
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
(defn inline
  [item]
  (match item
    ["Plain" s]
    s
    ["Spaces" s]
    s
    ["Superscript" l]
    (->elem :sup (map-inline l))
    ["Subscript" l]
    (->elem :sub (map-inline l))
    ["Emphasis" [[kind] data] ]
    (let [elem (case kind
                 "Bold" :b
                 "Italic" :i
                 "Underline" :u
                 "Strike_through" :del)]
      (->elem elem (map-inline data)))
    ["Entity" e]
    (:html e)

    ["Latex_Fragment" ["Displayed" s]]
    (util/format "\\[%s\\]" s)

    ["Latex_Fragment" ["Inline" s]]
    (util/format "\\(%s\\)" s)

    ["Target" s]
    [:a {:id s} s]

    ["Link" link]
    (let [{:keys [url label]} link]
      (let [href (string-of-url url)
            img-formats (set (map name config/img-formats))]
        (if (some (fn [fmt] (re-find (re-pattern (str "\\." fmt)) href)) img-formats)
          (image-link url href label)
          (let [[href label] (match url
                               ["Search" s]
                               [(str "#" (anchor-link s))
                                s]
                               :else
                               [href
                                (map-inline label)])]
            (->elem
             :a
             {:href href}
             label)))))

    ["Verbatim" s]
    [:code s]

    ["Code" s]
    [:code s]

    ["Inline_Source_Block" x]
    [:code (:code x)]

    ["Export_Snippet" "html" s]
    [:span {:dangerouslySetInnerHTML
            {:__html s}}]

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
      [:sup
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

(defn heading
  [config {:keys [title tags marker level priority anchor meta numbering]
           :as t}]
  (let [marker (if marker
                 [:span {:class (str "task-status " (string/lower-case marker))
                         :style {:margin-right 6}}
                  (string/upper-case marker)])
        priority (if priority
                   [:span {:class "priority"
                           :style {:margin-right 6}}
                    (util/format "[#%s]" (str priority))])
        tags (when-not (empty? tags)
               [:span.heading-tags
                (for [tag tags]
                  [:span.tag {:key tag}
                   [:span {:class tag}
                    tag]])])
        element (keyword (str "h" level))]

    (->elem element
            {:id anchor}
            (remove-nils
             (concat
              [marker
               priority]
              (map-inline title)
              [tags])))))

(defn list-element
  [l]
  (match l
    [l1 & tl]
    (let [{:keys [ordered name]} l1]
      (cond
        name
        :dl
        ordered
        :ol
        :else
        :ul))

    :else
    :ul))

(declare blocks)

(defn list-item
  [config {:keys [name content checkbox items number] :as l}]
  (let [content (when-not (empty? content)
                  (match content
                    [["Paragraph" i] & rest]
                    (map-inline i (blocks config rest))
                    :else
                    (blocks config content)))
        checked? (some? checkbox)
        items (if (seq items)
                (->elem
                 (list-element items)
                 (for [item items]
                   (list-item config item))))]
    (cond
      number
      (->elem
       :li
       {:checked checked?}
       (vec-cat
        [(->elem
          :p
          (vec
           (cons (str number ". ")
                 content)))]
        [items]))

      name
      [:dl {:checked checked?}
       [:dt name]
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
  [{:keys [header groups col_groups]}]
  (let [tr (fn [elm cols]
             (->elem
              :tr
              (mapv (fn [col]
                      (->elem
                       elm
                       {:scope "col"
                        :class "org-left"}
                       (map-inline col)))
                    cols)))
        col-groups (try
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
    (->elem
     :table
     {:border 2
      :cell-spacing 0
      :cell-padding 6
      :rules "groups"
      :frame "hsides"}
     (vec-cat
      col-groups
      (cons head groups)))))

(defn map-inline
  [col]
  (map inline col))

(defn block
  [config item]
  (try
    (match item
      ["Paragraph" l]
      (->elem :p (map-inline l))
      ["Horizontal_Rule"]
      [:hr]
      ["Heading" h]
      (heading config h)
      ["List" l]
      (->elem
       (list-element l)
       (map #(list-item config %) l))
      ["Table" t]
      (table t)
      ["Math" s]
      [:div.mathblock
       (str "$$" s "$$")]
      ["Example" l]
      [:pre
       (join-lines l)]
      ["Src" options]
      (let [{:keys [language options lines]} options
            attr (if language
                   {:data-lang language
                    :class lines})]
        [:pre
         [:code attr
          (join-lines lines)]])
      ["Quote" l]
      (->elem
       :blockquote
       (blocks config l))
      ["Export" "html" options content]
      [:div {:dangerouslySetInnerHTML
             {:__html content}}]
      ["Custom" name options l]
      (->elem
       :div
       {:class name}
       (blocks config l))
      ["Latex_Fragment" l]
      [:p.latex-fragment
       (inline ["Latex_Fragment" l])]
      ["Latex_Environment" name option content]
      (let [content (util/format "\n\begin{%s} {%s}\n%s\n\\end{%s}"
                                 name
                                 option
                                 (join-lines content)
                                 name)]
        [:div.latex-environment
         content])
      ["Footnote_Definition" name definition]
      (let [id (util/url-encode name)]
        [:div.footdef
         [:div.footpara
          (block config ["Paragraph" definition])]
         [:sup
          [:a {:id (str "fn." id)
               :class "footnum"
               :href (str "#fnr." id)}
           (str name "↩︎")]]])

      :else
      "")
    (catch js/Error e
      (prn "Convert to html failed, error: " e)
      "")))

(defn blocks
  [config col]
  (map #(block config %) col))

(comment
  (def ->html fronend. org-content->html)

  ;; timestamps
  ;; [2020-02-10 Mon 13:22]
  ;; repetition
  (def r1 "<2005-10-01 Sat +1m>")
  ;; TODO: mldoc_org add supports
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
