(ns frontend.handler.export.html
  "export blocks/pages as html"
  (:require ["/frontend/utils" :as utils]
            [clojure.edn :as edn]
            [clojure.string :as string]
            [clojure.zip :as z]
            [frontend.db :as db]
            [frontend.handler.export.common :as common :refer [*state*]]
            [frontend.handler.export.zip-helper :refer [get-level goto-last
                                                        goto-level]]
            [frontend.state :as state]
            [frontend.util :as util :refer [concatv mapcatv removev]]
            [hiccups.runtime :as h]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [malli.core :as m]))

(def ^:private hiccup-malli-schema
  [:cat :keyword [:* :any]])

;;; utils for construct hiccup
;; - a
;;   - b
;;     - c
;;   - d
;; [:ul [:li "a" [:p "xxx"]] [:ul [:li "b"] [:ul [:li "c"]] [:li "d"]]]
(defn- branch? [node] (= :ul (first node)))

(defn- ul-hiccup-zip
  [root]
  (z/zipper branch?
            rest
            (fn [node children] (with-meta (apply vector :ul children) (meta node)))
            root))

(def ^:private empty-ul-hiccup (ul-hiccup-zip [:ul [:placeholder]]))

(defn- add-same-level-li-at-right
  "[:ul [:li ]"
  [loc]
  (-> loc
      (z/insert-right [:li])
      z/right))

(defn- add-next-level-li-at-right
  [loc]
  (-> loc
      (z/insert-right [:ul [:li]])
      z/right
      z/down))

(defn- add-next-level-ul-at-right
  [loc]
  (-> loc
      (z/insert-right [:ul])
      z/right
      z/down))

(defn- replace-same-level-li
  [loc]
  (z/replace loc [:li]))

(defn- add-items-in-li
  [loc items]
  (z/edit loc (fn [li] (concatv li items))))

;;; utils for construct hiccup(ends)

;;; block/inline-ast -> hiccup
(declare inline-ast->hiccup
         block-ast->hiccup)

(defn- inline-emphasis
  [[[type] inline-coll]]
  (apply vector
         (case type
           "Bold"           :b
           "Italic"         :i
           "Underline"      :ins
           "Strike_through" :del
           "Highlight"      :mark
               ;; else
           :b)
         (mapv inline-ast->hiccup inline-coll)))

(defn- inline-tag
  [inline-coll]
  [:a (str "#" (common/hashtag-value->string inline-coll))])

(defn- inline-link
  [{:keys [url label full_text]}]
  (let [href (case (first url)
               "Search" (second url)
               "Complex" (str (:protocol (second url)) "://" (:link (second url)))
               nil)]
    (cond-> [:a]
      href (conj {:href href})
      href (concatv (mapv inline-ast->hiccup label))
      (not href) (conj full_text))))

(defn- inline-nested-link
  [{:keys [content]}]
  [:a content])

(defn- inline-subscript
  [inline-coll]
  (concatv [:sub] (mapv inline-ast->hiccup inline-coll)))

(defn- inline-superscript
  [inline-coll]
  (concatv [:sup] (mapv inline-ast->hiccup inline-coll)))

(defn- inline-footnote-reference
  [{:keys [name]}]
  [:sup [:a {:href (str "#fnd." name)} name]])

(defn- inline-cookie
  [ast-content]
  [:span
   (case (first ast-content)
     "Absolute"
     (let [[_ current total] ast-content]
       (str "[" current "/" total "]"))
     "Percent"
     (str "[" (second ast-content) "%]"))])

(defn- inline-latex-fragment
  [ast-content]
  (let [[type content] ast-content
        wrapper (case type
                  "Inline" "$"
                  "Displayed" "$$")]
    [:span (str wrapper content wrapper)]))

(defn- inline-macro
  [{:keys [name arguments]}]
  [:code
   (if (= name "cloze")
     (string/join "," arguments)
     (let [l (cond-> ["{{" name]
               (pos? (count arguments)) (conj "(" (string/join "," arguments) ")")
               true (conj "}}"))]
       (string/join l)))])

(defn- inline-entity
  [{unicode :unicode}]
  unicode)

(defn- inline-timestamp
  [ast-content]
  (let [[type timestamp-content] ast-content]
    (->> (case type
           "Scheduled" ["SCHEDULED: " (common/timestamp-to-string timestamp-content)]
           "Deadline" ["DEADLINE: " (common/timestamp-to-string timestamp-content)]
           "Date" [(common/timestamp-to-string timestamp-content)]
           "Closed" ["CLOSED: " (common/timestamp-to-string timestamp-content)]
           "Clock" ["CLOCK: " (common/timestamp-to-string (second timestamp-content))]
           "Range" (let [{:keys [start stop]} timestamp-content]
                     [(str (common/timestamp-to-string start) "--" (common/timestamp-to-string stop))]))
         string/join
         (vector :span))))

(defn- inline-email
  [{:keys [local_part domain]}]
  (str local_part "@" domain))

(defn- block-paragraph
  [loc inline-coll]
  (-> loc
      goto-last
      (add-items-in-li
       [(apply vector :p (mapv inline-ast->hiccup inline-coll))])))

(defn- block-heading
  [loc {:keys [title _tags marker level _numbering priority _anchor _meta _unordered _size]}]
  (let [loc (goto-last loc)
        current-level (get-level loc)
        title* (mapv inline-ast->hiccup title)
        items (cond-> []
                marker (conj marker " ")
                priority (conj (common/priority->string priority) " ")
                true (concatv title*))]
    (if (> level current-level)
      (-> loc
          add-next-level-li-at-right
          (add-items-in-li items))
      (-> loc
          (goto-level level)
          z/rightmost
          add-same-level-li-at-right
          (add-items-in-li items)))))

(declare block-list)
(defn- block-list-item
  [loc {:keys [content items]}]
  (let [current-level (get-level loc)
        ;; [:ul ] or [:ul [:li]]
        ;;     ^          ^
        ;;    loc        loc
        loc* (if (nil? (z/node loc))
               (replace-same-level-li loc)
               (add-same-level-li-at-right loc))
        loc** (reduce block-ast->hiccup loc* content)
        loc*** (if (seq items) (block-list loc** items) loc**)]
    (-> loc***
        (goto-level current-level)
        z/rightmost)))

(defn- block-list
  [loc list-items]
  (reduce block-list-item (add-next-level-ul-at-right loc) list-items))

(defn- block-example
  [loc str-coll]
  (add-items-in-li loc [[:pre str-coll]]))

(defn- block-src
  [loc {:keys [language lines]}]
  (let [code (cond-> [:pre]
               (some? language) (conj {:data-lang language})
               true (concatv lines))]
    (add-items-in-li loc [code])))

(defn- block-quote
  [loc block-ast-coll]
  (add-items-in-li
   loc
   [(z/root (reduce block-ast->hiccup (goto-last (ul-hiccup-zip [:blockquote])) block-ast-coll))]))

(defn- block-latex-env
  [loc [name options content]]
  (add-items-in-li
   loc
   [[:pre
     (str "\\begin{" name "}" options)
     [:br]
     content
     [:br]
     (str "\\end{" name "}")]]))

(defn- block-displayed-math
  [loc s]
  (add-items-in-li loc [[:span s]]))

(defn- block-footnote-definition
  [loc [name inline-coll]]
  (let [inline-hiccup-coll (mapv inline-ast->hiccup inline-coll)]
    (add-items-in-li
     loc
     [(concatv [:div]
               inline-hiccup-coll
               [[:sup {:id (str "fnd." name)} (str name "↩")]])])))

(defn- block-table
  [loc {:keys [header groups]}]
  (let [header*
        (concatv [:tr]
                 (mapv
                  (fn [col]
                    (concatv [:th] (mapv inline-ast->hiccup col)))
                  header))
        groups*
        (mapcatv
         (fn [group]
           (mapv
            (fn [row]
              (concatv [:tr]
                       (mapv
                        (fn [col]
                          (concatv [:td] (mapv inline-ast->hiccup col)))
                        row)))
            group))
         groups)]
    (add-items-in-li loc [(concatv [:table {:style "width:100%"} header*] groups*)])))

(defn- block-comment
  [loc s]
  (add-items-in-li loc [(str "<!---\n" s "\n-->\n")]))

(m/=> inline-ast->hiccup [:=> [:cat [:sequential :any]] [:or hiccup-malli-schema :string :nil]])
(defn- inline-ast->hiccup
  [inline-ast]
  (let [[ast-type ast-content] inline-ast]
    (case ast-type
      "Emphasis"
      (inline-emphasis ast-content)
      ("Break_Line" "Hard_Break_Line")
      [:br]
      ("Verbatim" "Code")
      [:code ast-content]
      "Tag"
      (inline-tag ast-content)
      "Spaces"                          ; what's this ast-type for ?
      nil
      "Plain"
      ast-content
      "Link"
      (inline-link ast-content)
      "Nested_link"
      (inline-nested-link ast-content)
      "Target"
      [:a ast-content]
      "Subscript"
      (inline-subscript ast-content)
      "Superscript"
      (inline-superscript ast-content)
      "Footnote_Reference"
      (inline-footnote-reference ast-content)
      "Cookie"
      (inline-cookie ast-content)
      "Latex_Fragment"
      (inline-latex-fragment ast-content)
      "Macro"
      (inline-macro ast-content)
      "Entity"
      (inline-entity ast-content)
      "Timestamp"
      (inline-timestamp ast-content)
      "Email"
      (inline-email ast-content)
      "Inline_Hiccup"
      (edn/read-string ast-content)
      ("Radio_Target" "Inline_Html" "Export_Snippet" "Inline_Source_Block")
      nil
      (assert false (str :inline-ast->simple-ast " " ast-type " not implemented yet")))))

(m/=> block-ast->hiccup [:=> [:cat :some [:sequential :any]] :some])
(defn- block-ast->hiccup
  [loc block-ast]
  (let [[ast-type ast-content] block-ast]
    (case ast-type
      "Paragraph"
      (block-paragraph loc ast-content)
      "Paragraph_line"
      (assert false "Paragraph_line is mldoc internal ast")
      "Paragraph_Sep"
      (-> loc
          goto-last
          (add-items-in-li (repeat ast-content [:br])))
      "Heading"
      (block-heading loc ast-content)
      "List"
      (block-list loc ast-content)
      ("Directive" "Results" "Property_Drawer" "Export" "CommentBlock" "Custom")
      loc
      "Example"
      (block-example loc ast-content)
      "Src"
      (block-src loc ast-content)
      "Quote"
      (block-quote loc ast-content)
      "Latex_Fragment"
      (add-items-in-li loc [(inline-latex-fragment ast-content)])
      "Latex_Environment"
      (block-latex-env loc (rest block-ast))
      "Displayed_Math"
      (block-displayed-math loc ast-content)
      "Drawer"
      loc
      "Footnote_Definition"
      (block-footnote-definition loc (rest block-ast))
      "Horizontal_Rule"
      (add-items-in-li loc [[:hr]])
      "Table"
      (block-table loc ast-content)
      "Comment"
      (block-comment loc ast-content)
      "Raw_Html"
      loc
      "Hiccup"
      (add-items-in-li loc [(edn/read-string ast-content)])
      (assert false (str :block-ast->simple-ast " " ast-type " not implemented yet")))))

;;; block/inline-ast -> hiccup (ends)

;;; export fns
(defn- export-helper
  [content format options]
  (let [remove-options (set (:remove-options options))
        other-options (:other-options options)]
    (binding [*state* (merge *state*
                             {:export-options
                              {:remove-emphasis? (contains? remove-options :emphasis)
                               :remove-page-ref-brackets? (contains? remove-options :page-ref)
                               :remove-tags? (contains? remove-options :tag)
                               :keep-only-level<=N (:keep-only-level<=N other-options)}})]
      (let [ast (util/profile :gp-mldoc/->edn (gp-mldoc/->edn content (gp-mldoc/default-config format)))
            ast (util/profile :remove-pos (mapv common/remove-block-ast-pos ast))
            ast (removev common/Properties-block-ast? ast)
            keep-level<=n (get-in *state* [:export-options :keep-only-level<=N])
            ast (if (pos? keep-level<=n)
                  (common/keep-only-level<=n ast keep-level<=n)
                  ast)
            ast* (util/profile :replace-block&page-reference&embed (common/replace-block&page-reference&embed ast))
            ast** (if (= "no-indent" (get-in *state* [:export-options :indent-style]))
                    (util/profile :replace-Heading-with-Paragraph (mapv common/replace-Heading-with-Paragraph ast*))
                    ast*)
            config-for-walk-block-ast (cond-> {}
                                        (get-in *state* [:export-options :remove-emphasis?])
                                        (update :mapcat-fns-on-inline-ast conj common/remove-emphasis)

                                        (get-in *state* [:export-options :remove-page-ref-brackets?])
                                        (update :map-fns-on-inline-ast conj common/remove-page-ref-brackets)

                                        (get-in *state* [:export-options :remove-tags?])
                                        (update :mapcat-fns-on-inline-ast conj common/remove-tags))
            ast*** (if-not (empty? config-for-walk-block-ast)
                     (util/profile :walk-block-ast (mapv (partial common/walk-block-ast config-for-walk-block-ast) ast**))
                     ast**)
            hiccup (util/profile :block-ast->hiccup  (z/root (reduce block-ast->hiccup empty-ul-hiccup ast***)))
            ;; remove placeholder tag
            hiccup* (vec (cons :ul (drop 2 hiccup)))]
        (-> hiccup* h/render-html utils/prettifyXml)))))

(defn export-blocks-as-html
  "options: see also `export-blocks-as-markdown`"
  [repo root-block-uuids-or-page-name options]
  {:pre [(or (coll? root-block-uuids-or-page-name)
             (string? root-block-uuids-or-page-name))]}
  (let [content
        (if (string? root-block-uuids-or-page-name)
          ;; page
          (common/get-page-content root-block-uuids-or-page-name)
          (common/root-block-uuids->content repo root-block-uuids-or-page-name))
        first-block (db/entity [:block/uuid (first root-block-uuids-or-page-name)])
        format (or (:block/format first-block) (state/get-preferred-format))]
    (export-helper content format options)))

;;; export fns (ends)
