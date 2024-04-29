(ns frontend.handler.export.text
  "export blocks/pages as text"
  (:refer-clojure :exclude [map filter mapcat concat remove newline])
  (:require [clojure.string :as string]
            [frontend.db :as db]
            [frontend.extensions.zip :as zip]
            [frontend.handler.export.common :as common :refer
             [*state* indent newline* raw-text simple-ast-malli-schema
              simple-asts->string space]]
            [logseq.graph-parser.schema.mldoc :as mldoc-schema]
            [frontend.state :as state]
            [frontend.util :as util :refer [concatv mapcatv removev]]
            [goog.dom :as gdom]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [malli.core :as m]
            [promesa.core :as p]))

;;; block-ast, inline-ast -> simple-ast

(defn indent-with-2-spaces
  "also consider (get-in *state* [:export-options :indent-style])"
  [level]
  (let [indent-style (get-in *state* [:export-options :indent-style])]
    (case indent-style
      "dashes"               (indent level 2)
      ("spaces" "no-indent") (indent level 0)
      (assert false (print-str "unknown indent-style:" indent-style)))))

(declare inline-ast->simple-ast
         block-ast->simple-ast)

(defn- block-heading
  [{:keys [title _tags marker level _numbering priority _anchor _meta _unordered size]}]
  (let [indent-style (get-in *state* [:export-options :indent-style])
        priority* (and priority (raw-text (common/priority->string priority)))
        heading* (if (= indent-style "dashes")
                   [(indent (dec level) 0) (raw-text "-")]
                   [(indent (dec level) 0)])
        size* (and size [space (raw-text (reduce str (repeat size "#")))])
        marker* (and marker (raw-text marker))]
    (set! *state* (assoc *state* :current-level level))
    (let [simple-asts
          (removev nil? (concatv
                         (when (and (get-in *state* [:export-options :newline-after-block])
                                    (not (get-in *state* [:newline-after-block :current-block-is-first-heading-block?])))
                           [(newline* 2)])
                         heading* size*
                         [space marker* space priority* space]
                         (mapcatv inline-ast->simple-ast title)
                         [(newline* 1)]))]
      (set! *state* (assoc-in *state* [:newline-after-block :current-block-is-first-heading-block?] false))
      simple-asts)))

(declare block-list)
(defn- block-list-item
  [{:keys [content items number _name checkbox]}]
  (let [content* (mapcatv block-ast->simple-ast content)
        number* (raw-text
                 (if number
                   (str number ". ")
                   "* "))
        checkbox* (raw-text
                   (if (some? checkbox)
                     (if (boolean checkbox)
                       "[X]" "[ ]")
                     ""))
        current-level (get *state* :current-level 1)
        indent (when (> current-level 1)
                 (indent (dec current-level) 0))
        items* (block-list items :in-list? true)]
    (concatv [indent number* checkbox* space]
             content*
             [(newline* 1)]
             items*
             [(newline* 1)])))

(defn- block-list
  [l & {:keys [in-list?]}]
  (binding [*state* (update *state* :current-level inc)]
    (concatv (mapcatv block-list-item l)
             (when (and (pos? (count l))
                        (not in-list?))
               [(newline* 2)]))))

(defn- block-property-drawer
  [properties]
  (when-not (get-in *state* [:export-options :remove-properties?])
    (let [level (dec (get *state* :current-level 1))
          indent (indent-with-2-spaces level)]
      (reduce
       (fn [r [k v]]
         (conj r indent (raw-text k "::") space (raw-text v) (newline* 1)))
       [] properties))))

(defn- block-example
  [l]
  (let [level (dec (get *state* :current-level 1))]
    (mapcatv
     (fn [line]
       [(indent-with-2-spaces level)
        (raw-text "    ")
        (raw-text line)
        (newline* 1)])
     l)))

(defn- remove-max-prefix-spaces
  [lines]
  (let [common-prefix-spaces
        (reduce
         (fn [r line]
           (if (string/blank? line)
             r
             (let [leading-spaces (re-find #"^\s+" line)]
               (if (nil? r)
                 leading-spaces
                 (if (string/starts-with? r leading-spaces)
                   leading-spaces
                   r)))))
         nil
         lines)
        pattern (re-pattern (str "^" common-prefix-spaces))]
    (mapv (fn [line] (string/replace-first line pattern "")) lines)))

(defn- block-src
  [{:keys [lines language]}]
  (let [level (dec (get *state* :current-level 1))
        lines* (if (= "no-indent" (get-in *state* [:export-options :indent-style]))
                 (remove-max-prefix-spaces lines)
                 lines)]
    (concatv
     [(indent-with-2-spaces level) (raw-text "```")]
     (when language [(raw-text language)])
     [(newline* 1)]
     (mapv raw-text lines*)
     [(indent-with-2-spaces level) (raw-text "```") (newline* 1)])))

(defn- block-quote
  [block-coll]
  (let [level (dec (get *state* :current-level 1))]
    (binding [*state* (assoc *state* :indent-after-break-line? true)]
      (concatv (mapcatv (fn [block]
                          (let [block-simple-ast (block-ast->simple-ast block)]
                            (when (seq block-simple-ast)
                              (concatv [(indent-with-2-spaces level) (raw-text ">") space]
                                       block-simple-ast))))
                        block-coll)
               [(newline* 2)]))))

(declare inline-latex-fragment)
(defn- block-latex-fragment
  [ast-content]
  (inline-latex-fragment ast-content))

(defn- block-latex-env
  [[name options content]]
  (let [level (dec (get *state* :current-level 1))]
    [(indent-with-2-spaces level) (raw-text "\\begin{" name "}" options)
     (newline* 1)
     (indent-with-2-spaces level) (raw-text content)
     (newline* 1)
     (indent-with-2-spaces level) (raw-text "\\end{" name "}")
     (newline* 1)]))

(defn- block-displayed-math
  [ast-content]
  [space (raw-text "$$" ast-content "$$") space])

(defn- block-drawer
  [[name lines]]
  (let [level (dec (get *state* :current-level))]
    (concatv
     [(raw-text ":" name ":")
      (newline* 1)]
     (mapcatv (fn [line] [(indent-with-2-spaces level) (raw-text line)]) lines)
     [(newline* 1) (raw-text ":END:") (newline* 1)])))

(defn- block-footnote-definition
  [[name content]]
  (concatv
   [(raw-text "[^" name "]:") space]
   (mapcatv inline-ast->simple-ast content)
   [(newline* 1)]))

(def ^:private block-horizontal-rule [(newline* 1) (raw-text "---") (newline* 1)])

(defn- block-table
  [{:keys [header groups]}]
  (let [level    (dec (get *state* :current-level 1))
        sep-line (raw-text "|" (string/join "|" (repeat (count header) "---")) "|")
        header-line
        (concatv (mapcatv
                  (fn [h] (concatv [space (raw-text "|") space] (mapcatv inline-ast->simple-ast h)))
                  header)
                 [space (raw-text "|")])
        group-lines
        (mapcatv
         (fn [group]
           (mapcatv
            (fn [row]
              (concatv [(indent-with-2-spaces level)]
                       (mapcatv
                        (fn [col]
                          (concatv [(raw-text "|") space]
                                   (mapcatv inline-ast->simple-ast col)
                                   [space]))
                        row)
                       [(raw-text "|") (newline* 1)]))
            group))
         groups)]
    (concatv [(newline* 1) (indent-with-2-spaces level)]
             (when (seq header) header-line)
             (when (seq header) [(newline* 1) (indent-with-2-spaces level) sep-line (newline* 1)])
             group-lines)))

(defn- block-comment
  [s]
  (let [level (dec (get *state* :current-level 1))]
    [(indent-with-2-spaces level) (raw-text "<!---") (newline* 1)
     (indent-with-2-spaces level) (raw-text s) (newline* 1)
     (indent-with-2-spaces level) (raw-text "-->") (newline* 1)]))

(defn- block-raw-html
  [s]
  (let [level (dec (get *state* :current-level 1))]
    [(indent-with-2-spaces level) (raw-text s) (newline* 1)]))

(defn- block-hiccup
  [s]
  (let [level (dec (get *state* :current-level 1))]
    [(indent-with-2-spaces level) (raw-text s) space]))

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

(defn- emphasis-wrap-with
  [inline-coll em-symbol]
  (binding [*state* (assoc *state* :outside-em-symbol (first em-symbol))]
    (concatv [(raw-text em-symbol)]
             (mapcatv inline-ast->simple-ast inline-coll)
             [(raw-text em-symbol)])))

(defn- inline-emphasis
  [emphasis]
  (let [[[type] inline-coll] emphasis
        outside-em-symbol (:outside-em-symbol *state*)]
    (case type
      "Bold"
      (emphasis-wrap-with inline-coll (if (= outside-em-symbol "*") "__" "**"))
      "Italic"
      (emphasis-wrap-with inline-coll (if (= outside-em-symbol "*") "_" "*"))
      "Underline"
      (binding [*state* (assoc *state* :outside-em-symbol outside-em-symbol)]
        (mapcatv (fn [inline] (cons space (inline-ast->simple-ast inline))) inline-coll))
      "Strike_through"
      (emphasis-wrap-with inline-coll "~~")
      "Highlight"
      (emphasis-wrap-with inline-coll "^^")
      ;; else
      (assert false (print-str :inline-emphasis emphasis "is invalid")))))

(defn- inline-break-line
  []
  [(if (= "no-indent" (get-in *state* [:export-options :indent-style]))
     (raw-text "\n")
     (raw-text "  \n"))
   (when (:indent-after-break-line? *state*)
     (let [current-level (get *state* :current-level 1)]
       (when (> current-level 1)
         (indent-with-2-spaces (dec current-level)))))])

;; {:malli/schema ...} only works on public vars, so use m/=> here
(m/=> block-ast->simple-ast [:=> [:cat mldoc-schema/block-ast-schema] [:sequential simple-ast-malli-schema]])
(defn- block-ast->simple-ast
  [block]
  (let [newline-after-block? (get-in *state* [:export-options :newline-after-block])]
    (removev
     nil?
     (let [[ast-type ast-content] block]
       (case ast-type
         "Paragraph"
         (let [{:keys [origin-ast]} (meta block)
               current-block-is-first-heading-block? (get-in *state* [:newline-after-block :current-block-is-first-heading-block?])]
           (set! *state* (assoc-in *state* [:newline-after-block :current-block-is-first-heading-block?] false))
           (concatv
            (when (and origin-ast newline-after-block? (not current-block-is-first-heading-block?))
              [(newline* 2)])
            (mapcatv inline-ast->simple-ast ast-content)
            (let [last-element (last ast-content)
                  [last-element-type] last-element]
              (when (and newline-after-block? (= "Break_Line" last-element-type))
                (inline-break-line)))
            [(newline* 1)]))
         "Paragraph_line"
         (assert false "Paragraph_line is mldoc internal ast")
         "Paragraph_Sep"
         [(newline* ast-content)]
         "Heading"
         (block-heading ast-content)
         "List"
         (block-list ast-content)
         ("Directive" "Results" "Export" "CommentBlock" "Custom")
         nil
         "Example"
         (block-example ast-content)
         "Src"
         (block-src ast-content)
         "Quote"
         (block-quote ast-content)
         "Latex_Fragment"
         (block-latex-fragment ast-content)
         "Latex_Environment"
         (block-latex-env (rest block))
         "Displayed_Math"
         (block-displayed-math ast-content)
         "Drawer"
         (block-drawer (rest block))
         "Property_Drawer"
         (block-property-drawer ast-content)
         "Footnote_Definition"
         (block-footnote-definition (rest block))
         "Horizontal_Rule"
         block-horizontal-rule
         "Table"
         (block-table ast-content)
         "Comment"
         (block-comment ast-content)
         "Raw_Html"
         (block-raw-html ast-content)
         "Hiccup"
         (block-hiccup ast-content)
         (assert false (print-str :block-ast->simple-ast ast-type "not implemented yet")))))))

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
      [(raw-text (str "#" (common/hashtag-value->string ast-content)))]
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

;;; block-ast, inline-ast -> simple-ast (ends)

;;; export fns

(defn- export-helper
  [content format options]
  (let [remove-options (set (:remove-options options))
        other-options (:other-options options)]
    (binding [*state* (merge *state*
                             {:export-options
                              {:indent-style (or (:indent-style options) "dashes")
                               :remove-emphasis? (contains? remove-options :emphasis)
                               :remove-page-ref-brackets? (contains? remove-options :page-ref)
                               :remove-tags? (contains? remove-options :tag)
                               :remove-properties? (contains? remove-options :property)
                               :keep-only-level<=N (:keep-only-level<=N other-options)
                               :newline-after-block (:newline-after-block other-options)}})]
      (let [ast (gp-mldoc/->edn content (gp-mldoc/default-config format))
            ast (mapv common/remove-block-ast-pos ast)
            ast (removev common/Properties-block-ast? ast)
            ast* (common/replace-block&page-reference&embed ast)
            keep-level<=n (get-in *state* [:export-options :keep-only-level<=N])
            ast* (if (pos? keep-level<=n)
                   (common/keep-only-level<=n ast* keep-level<=n)
                   ast*)
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
                                        (update :fns-on-inline-coll conj common/remove-prefix-spaces-in-Plain))
            ast*** (if-not (empty? config-for-walk-block-ast)
                     (mapv (partial common/walk-block-ast config-for-walk-block-ast) ast**)
                     ast**)
            simple-asts (mapcatv block-ast->simple-ast ast***)]
        (simple-asts->string simple-asts)))))


(defn export-blocks-as-markdown
  "options:
  :indent-style \"dashes\" | \"spaces\" | \"no-indent\"
  :remove-options [:emphasis :page-ref :tag :property]
  :other-options {:keep-only-level<=N int :newline-after-block bool}"
  [repo root-block-uuids-or-page-name options]
  {:pre [(or (coll? root-block-uuids-or-page-name)
             (string? root-block-uuids-or-page-name))]}
  (util/profile
      :export-blocks-as-markdown
      (let [content
            (if (string? root-block-uuids-or-page-name)
              ;; page
              (common/get-page-content root-block-uuids-or-page-name)
              (common/root-block-uuids->content repo root-block-uuids-or-page-name))
            first-block (db/entity [:block/uuid (first root-block-uuids-or-page-name)])
            format (or (:block/format first-block) (state/get-preferred-format))]
        (export-helper content format options))))

(defn export-files-as-markdown
  "options see also `export-blocks-as-markdown`"
  [files options]
  (mapv
   (fn [{:keys [path content names format]}]
     (when (first names)
       (util/profile (print-str :export-files-as-markdown path)
                     [path (export-helper content format options)])))
   files))

(defn export-repo-as-markdown!
  "TODO: indent-style and remove-options"
  [repo]
  (when-let [files (util/profile :get-file-content (common/get-file-contents-with-suffix repo))]
    (let [files (export-files-as-markdown files nil)
          zip-file-name (str repo "_markdown_" (quot (util/time-ms) 1000))]
      (p/let [zipfile (zip/make-zip zip-file-name files repo)]
        (when-let [anchor (gdom/getElement "export-as-markdown")]
          (.setAttribute anchor "href" (js/window.URL.createObjectURL zipfile))
          (.setAttribute anchor "download" (.-name zipfile))
          (.click anchor))))))

;;; export fns (ends)
