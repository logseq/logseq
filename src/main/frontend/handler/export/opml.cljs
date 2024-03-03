(ns frontend.handler.export.opml
  "export blocks/pages as opml"
  (:refer-clojure :exclude [map filter mapcat concat remove newline])
  (:require ["/frontend/utils" :as utils]
            [clojure.string :as string]
            [clojure.zip :as z]
            [frontend.db :as db]
            [frontend.extensions.zip :as zip]
            [frontend.handler.export.common :as common :refer
             [*state* raw-text simple-asts->string space]]
            [frontend.handler.export.zip-helper :refer [get-level goto-last
                                                        goto-level]]
            [frontend.state :as state]
            [frontend.util :as util :refer [concatv mapcatv removev]]
            [goog.dom :as gdom]
            [hiccups.runtime :as h]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [promesa.core :as p]))

;;; *opml-state*
(def ^:private ^:dynamic
  *opml-state*
  {:outside-em-symbol nil})

;;; utils for construct opml hiccup
;; - a
;;   - b
;;     - c
;;   - d
;; [:outline
;;  {:text "a"}
;;  [:outline {:text "b"} [:outline {:text "c"}]]
;;  [:outline {:text "d"}]]

(defn- branch? [node] (= :outline (first node)))

(defn- outline-hiccup-zip
  [root]
  (z/zipper branch?
            rest
            (fn [node children] (with-meta (apply vector :outline children) (meta node)))
            root))

(def ^:private init-opml-body-hiccup
  (z/down (outline-hiccup-zip [:outline [:placeholder]])))

(defn- goto-last-outline
  "[:outline [:outline [:outline]]]
                       ^
                   goto here"

  [loc]
  (-> loc
      goto-last
      z/up))

(defn- add-same-level-outline-at-right
  [loc attr-map]
  {:pre [(map? attr-map)]}
  (-> loc
      (z/insert-right [:outline attr-map])
      z/right))

(defn- add-next-level-outline
  [loc attr-map]
  {:pre [(map? attr-map)]}
  (-> loc
      (z/append-child [:outline attr-map])
      goto-last-outline))

(defn- append-text-to-current-outline
  [loc text]
  (-> loc
      z/down
      (z/edit #(update % :text str text))
      z/up))

(defn- append-text-to-current-outline*
  "if current-level = 0(it's just `init-opml-body-hiccup`), need to add a new outline item."
  [loc text]
  (if (pos? (get-level loc))
    (append-text-to-current-outline loc text)
    ;; at root
    (-> loc
        z/down
        (add-same-level-outline-at-right {:text nil})
        (append-text-to-current-outline text))))

(defn- zip-loc->opml
  [hiccup title]
  (let [[_ _ & body] hiccup]
    (str
     "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
     (utils/prettifyXml
      (h/render-html
       [:opml {:version "2.0"}
        [:head [:title title]]
        (concatv [:body] body)])))))

;;; utils for construct opml hiccup (ends)

;;; block/inline-ast -> hiccup & simple-ast

(declare inline-ast->simple-ast
         block-ast->hiccup)

(defn- emphasis-wrap-with
  [inline-coll em-symbol]
  (binding [*opml-state* (assoc *opml-state* :outside-em-symbol (first em-symbol))]
    (concatv [(raw-text em-symbol)]
             (mapcatv inline-ast->simple-ast inline-coll)
             [(raw-text em-symbol)])))

(defn- inline-emphasis
  [[[type] inline-coll]]
  (let [outside-em-symbol (:outside-em-symbol *opml-state*)]
    (case type
      "Bold"
      (emphasis-wrap-with
       inline-coll (if (= outside-em-symbol "*") "__" "**"))
      "Italic"
      (emphasis-wrap-with
       inline-coll (if (= outside-em-symbol "*") "_" "*"))
      "Underline"
      (binding [*opml-state* (assoc *opml-state* :outside-em-symbol outside-em-symbol)]
        (mapcatv (fn [inline] (cons space (inline-ast->simple-ast inline))) inline-coll))
      "Strike_through"
      (emphasis-wrap-with inline-coll "~~")
      "Highlight"
      (emphasis-wrap-with inline-coll "^^")
      ;; else
      (assert false (print-str :inline-emphasis type "is invalid")))))

;; FIXME: how to add newlines to opml text attr?
(defn- inline-break-line
  []
  [space])

(defn- inline-link
  [{full-text :full_text}]
  [(raw-text full-text)])

(defn- inline-nested-link
  [{content :content}]
  [(raw-text content)])

(defn- inline-subscript
  [inline-coll]
  (concatv [(raw-text "_{")]
           (mapcatv (fn [inline] (cons space (inline-ast->simple-ast inline))) inline-coll)
           [(raw-text "}")]))


(defn- inline-superscript
  [inline-coll]
  (concatv [(raw-text "^{")]
           (mapcatv (fn [inline] (cons space (inline-ast->simple-ast inline))) inline-coll)
           [(raw-text "}")]))

(defn- inline-footnote-reference
  [{name :name}]
  [(raw-text  "[" name "]")])

(defn- inline-cookie
  [ast-content]
  [(raw-text
    (case (first ast-content)
      "Absolute"
      (let [[_ current total] ast-content]
        (str "[" current "/" total "]"))
      "Percent"
      (str "[" (second ast-content) "%]")))])

(defn- inline-latex-fragment
  [ast-content]
  (let [[type content] ast-content
        wrapper (case type
                  "Inline" "$"
                  "Displayed" "$$")]
    [space (raw-text (str wrapper content wrapper)) space]))

(defn- inline-macro
  [{:keys [name arguments]}]
  (->
   (if (= name "cloze")
     (string/join "," arguments)
     (let [l (cond-> ["{{" name]
               (pos? (count arguments)) (conj "(" (string/join "," arguments) ")")
               true (conj "}}"))]
       (string/join l)))
   raw-text
   vector))

(defn- inline-entity
  [{unicode :unicode}]
  [(raw-text unicode)])

(defn- inline-timestamp
  [ast-content]
  (let [[type timestamp-content] ast-content]
    (-> (case type
          "Scheduled" ["SCHEDULED: " (common/timestamp-to-string timestamp-content)]
          "Deadline" ["DEADLINE: " (common/timestamp-to-string timestamp-content)]
          "Date" [(common/timestamp-to-string timestamp-content)]
          "Closed" ["CLOSED: " (common/timestamp-to-string timestamp-content)]
          "Clock" ["CLOCK: " (common/timestamp-to-string (second timestamp-content))]
          "Range" (let [{:keys [start stop]} timestamp-content]
                    [(str (common/timestamp-to-string start) "--" (common/timestamp-to-string stop))]))
        string/join
        raw-text
        vector)))

(defn- inline-email
  [{:keys [local_part domain]}]
  [(raw-text (str "<" local_part "@" domain ">"))])


(defn- inline-ast->simple-ast
  [inline]
  (let [[ast-type ast-content] inline]
    (case ast-type
      "Emphasis"
      (inline-emphasis ast-content)
      ("Break_Line" "Hard_Break_Line")
      (inline-break-line)
      "Verbatim"
      [(raw-text ast-content)]
      "Code"
      [(raw-text "`" ast-content "`")]
      "Tag"
      [(raw-text "#" (common/hashtag-value->string ast-content))]
      "Spaces"                          ; what's this ast-type for ?
      nil
      "Plain"
      [(raw-text ast-content)]
      "Link"
      (inline-link ast-content)
      "Nested_link"
      (inline-nested-link ast-content)
      "Target"
      [(raw-text (str "<<" ast-content ">>"))]
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
      "Radio_Target"
      [(raw-text (str "<<<" ast-content ">>>"))]
      "Email"
      (inline-email ast-content)
      "Inline_Hiccup"
      [(raw-text ast-content)]
      "Inline_Html"
      [(raw-text ast-content)]
      ("Export_Snippet" "Inline_Source_Block")
      nil
      (assert false (print-str :inline-ast->simple-ast ast-type "not implemented yet")))))

(defn- block-paragraph
  [loc inline-coll]
  (-> loc
      goto-last-outline
      (append-text-to-current-outline*
       (simple-asts->string
        (cons space (mapcatv inline-ast->simple-ast inline-coll))))))

(defn- block-heading
  [loc {:keys [title _tags marker level _numbering priority _anchor _meta _unordered _size]}]
  (let [loc (goto-last-outline loc)
        current-level (get-level loc)
        title* (mapcatv inline-ast->simple-ast title)
        marker* (and marker (raw-text marker))
        priority* (and priority (raw-text (common/priority->string priority)))
        simple-asts (removev nil? (concatv [marker* space priority* space] title*))
        ;; remove leading spaces
        simple-asts (drop-while #(= % space) simple-asts)
        s (simple-asts->string simple-asts)]
    (if (> level current-level)
      (add-next-level-outline loc {:text s})
      (-> loc
          (goto-level level)
          z/rightmost
          (add-same-level-outline-at-right {:text s})))))

(declare block-list)
(defn- block-list-item
  [loc {:keys [content items]}]
  (let [current-level (get-level loc)
        ;; if current loc node is empty(= {}),
        ;; the outline node is already created.
        loc (if (empty? (second (z/node loc)))
              loc
              (add-same-level-outline-at-right loc {:text nil}))
        loc* (reduce block-ast->hiccup loc content)
        loc** (if (seq items) (block-list loc* items) loc*)]
    (-> loc**
        (goto-level current-level)
        z/rightmost)))

(defn- block-list
  [loc list-items]
  (reduce block-list-item (add-next-level-outline loc {}) list-items))

(defn- block-example
  [loc str-coll]
  (append-text-to-current-outline* loc (string/join " " str-coll)))

(defn- block-src
  [loc {:keys [_language lines]}]
  (append-text-to-current-outline* loc (string/join " " lines)))

(defn- block-quote
  [loc block-ast-coll]
  (reduce block-ast->hiccup loc block-ast-coll))

(defn- block-latex-env
  [loc [name options content]]
  (append-text-to-current-outline*
   loc
   (str "\\begin{" name "}" options "\n"
        content "\n"
        "\\end{" name "}")))

(defn- block-displayed-math
  [loc s]
  (append-text-to-current-outline* loc s))

(defn- block-footnote-definition
  [loc [name inline-coll]]
  (let [inline-simple-asts (mapcatv inline-ast->simple-ast inline-coll)]
    (append-text-to-current-outline*
     loc
     (str "[^" name "]: " (simple-asts->string inline-simple-asts)))))

(defn- block-ast->hiccup
  [loc block-ast]
  (let [[ast-type ast-content] block-ast]
    (case ast-type
      "Paragraph"
      (block-paragraph loc ast-content)
      "Paragraph_line"
      (assert false "Paragraph_line is mldoc internal ast")
      "Paragraph_Sep"
      loc
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
      (append-text-to-current-outline* loc (simple-asts->string (inline-latex-fragment ast-content)))
      "Latex_Environment"
      (block-latex-env loc (rest block-ast))
      "Displayed_Math"
      (block-displayed-math loc ast-content)
      "Drawer"
      loc
      "Footnote_Definition"
      (block-footnote-definition loc (rest block-ast))
      "Horizontal_Rule"
      loc
      "Table"
      loc
      "Comment"
      loc
      "Raw_Html"
      loc
      "Hiccup"
      loc
      (assert false (print-str :block-ast->simple-ast ast-type "not implemented yet")))))

;;; block/inline-ast -> hiccup (ends)

;;; export fns
(defn- export-helper
  [content format options & {:keys [title] :or {title "untitled"}}]
  (let [remove-options (set (:remove-options options))
        other-options (:other-options options)]
    (binding [*state* (merge *state*
                             {:export-options
                              {:remove-emphasis? (contains? remove-options :emphasis)
                               :remove-page-ref-brackets? (contains? remove-options :page-ref)
                               :remove-tags? (contains? remove-options :tag)
                               :keep-only-level<=N (:keep-only-level<=N other-options)}})
              *opml-state* *opml-state*]
      (let [ast (gp-mldoc/->edn content (gp-mldoc/default-config format))
            ast (mapv common/remove-block-ast-pos ast)
            ast (removev common/Properties-block-ast? ast)
            keep-level<=n (get-in *state* [:export-options :keep-only-level<=N])
            ast (if (pos? keep-level<=n)
                  (common/keep-only-level<=n ast keep-level<=n)
                  ast)
            ast* (common/replace-block&page-reference&embed ast)
            ast** (if (= "no-indent" (get-in *state* [:export-options :indent-style]))
                    (mapv common/replace-Heading-with-Paragraph ast*)
                    ast*)
            config-for-walk-block-ast (cond-> {}
                                        (get-in *state* [:export-options :remove-emphasis?])
                                        (update :mapcat-fns-on-inline-ast conj common/remove-emphasis)

                                        (get-in *state* [:export-options :remove-page-ref-brackets?])
                                        (update :map-fns-on-inline-ast conj common/remove-page-ref-brackets)

                                        (get-in *state* [:export-options :remove-tags?])
                                        (update :mapcat-fns-on-inline-ast conj common/remove-tags)

                                        (= "no-indent" (get-in *state* [:export-options :indent-style]))
                                        (update :mapcat-fns-on-inline-ast conj common/remove-prefix-spaces-in-Plain))
            ast*** (if-not (empty? config-for-walk-block-ast)
                     (mapv (partial common/walk-block-ast config-for-walk-block-ast) ast**)
                     ast**)
            hiccup (z/root (reduce block-ast->hiccup init-opml-body-hiccup ast***))]
        (zip-loc->opml hiccup title)))))

(defn export-blocks-as-opml
  "options: see also `export-blocks-as-markdown`"
  [repo root-block-uuids-or-page-name options]
  {:pre [(or (coll? root-block-uuids-or-page-name)
             (string? root-block-uuids-or-page-name))]}
  (util/profile
   :export-blocks-as-opml
   (let [content
         (if (string? root-block-uuids-or-page-name)
           ;; page
           (common/get-page-content root-block-uuids-or-page-name)
           (common/root-block-uuids->content repo root-block-uuids-or-page-name))
         title (if (string? root-block-uuids-or-page-name)
                 root-block-uuids-or-page-name
                 "untitled")
         first-block (db/entity [:block/uuid (first root-block-uuids-or-page-name)])
         format (or (:block/format first-block) (state/get-preferred-format))]
     (export-helper content format options :title title))))

(defn export-files-as-opml
  "options see also `export-blocks-as-opml`"
  [files options]
  (mapv
   (fn [{:keys [path content names format]}]
     (when (first names)
       (util/profile (print-str :export-files-as-opml path)
                     [path (export-helper content format options :title (first names))])))
   files))

(defn export-repo-as-opml!
  [repo]
  (when-let [files (common/get-file-contents-with-suffix repo)]
    (let [files (export-files-as-opml files nil)
          zip-file-name (str repo "_opml_" (quot (util/time-ms) 1000))]
      (p/let [zipfile (zip/make-zip zip-file-name files repo)]
        (when-let [anchor (gdom/getElement "export-as-opml")]
          (.setAttribute anchor "href" (js/window.URL.createObjectURL zipfile))
          (.setAttribute anchor "download" (.-name zipfile))
          (.click anchor))))))

;;; export fns (ends)
