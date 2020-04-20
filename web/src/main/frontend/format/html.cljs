(ns frontend.format.html
  (:require [frontend.format.org-mode :as org]
            [cljs.core.match :refer-macros [match]]
            [clojure.string :as string]
            [frontend.util :as util]
            [goog.crypt.base64 :as b64]))

(declare map-inline)
(defn inline
  [item]
  (match item
    (:or ["Plain" s] ["Spaces" s])
    s
    ["Superscript" l]
    [:sup (map-inline l)]
    ["Subscript" l]
    [:sub (map-inline l)]
    ["Emphasis" kind data]
    (let [elem (case kind
                 "Bold" :b
                 "Italic" :i
                 "Underline" :u
                 "Strike_through" :del)]
      [elem (map-inline data)])
    ["Entity" e]
    [:span {:dangerouslySetInnerHTML
            {:__html (:html e)}}]

    :else
    ""
    ))

(defn map-inline
  [col]
  (mapcat inline col))

(defn heading
  [config h]
  )

(defn list-element
  [l]
  (match l
    [{:keys [ordered name]} & tl]
    (cond
      name
      "dl"
      ordered
      "ol"
      :else
      "ul")

    :else
    "ul"))

;; TODO: safe encoding asciis
(defn handle-image-link [url href label]
  [:img {:src href
         :title label}])

(defn range [{:keys [start stop]} stopped?]
  [:div {:class "timestamp-range"
         :stopped stopped?}
   (timestamp start "Start")
   (timestamp stop "Stop")])

;; TODO: timestamp_to_string, maybe need to export it
(defn timestamp [{:keys [active date time repetition] :as t} kind]
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
    [:span.timestamp {:class (if (= kind "Closed")
                               "line-through")
                      :active active}
     prefix t]))

(defn list-item
  [config item]
  )

(defn table
  [t])

(defn join-lines
  [l]
  (string/join "\n" l))

(declare blocks)

(defn block
  [config item]
  (match item
    ["Paragraph" l]
    [:p (map-inline l)]
    ["Horizontal_Rule"]
    [:hr]
    ["Heading" h]
    (heading config h)
    ["List" l]
    [(list-item config l)
     (mapcat #(list-item config %) l)]
    ["Table" t]
    (table t)
    ["Math" s]
    [:div.mathblock
     (str "$$" s "$$")]
    ["Example" l]
    [:pre
     (join-lines l)]
    ["Src" {:keys [language options lines]}]
    (let [attr (if language
                 {:data-lang language
                  :class lines})]
      [:pre
       [:code attr
        (join-lines lines)]])
    ["Quote" l]
    [:blockquote
     (blocks config l)]
    ["Export" "html" options content]
    (util/raw-html content)
    ["Custom" name options l]
    [:div {:class name}
     (blocks config l)]
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
    (let [id (b64/encode name)]
      [:div.footdef
       [:div.footpara
        (block config ["Paragraph" definition])]
       [:sup
        [:a {:id (str "fn." id)
             :class "footnum"
             :href (str "#fnr." id)}]
        (str name "↩︎")]])

    :else
    ""))

(defn blocks
  [config col]
  (map #(block config %) col))

(defn org-content->html
  [content]
  [:div
   (->> (org/->clj content)
        (blocks {}))])
