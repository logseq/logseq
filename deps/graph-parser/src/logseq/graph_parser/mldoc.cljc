(ns logseq.graph-parser.mldoc
  "Wraps https://github.com/logseq/mldoc to parse files into mldoc ast. This ns
  encapsulates mldoc's json api by only taking and returning edn"
  ;; Disable clj linters since we don't support clj
  #?(:clj {:clj-kondo/config {:linters {:unresolved-namespace {:level :off}
                                        :unresolved-symbol {:level :off}}}})
  (:require #?(:org.babashka/nbb ["mldoc$default" :refer [Mldoc]]
               :default ["mldoc" :refer [Mldoc]])
            #?(:org.babashka/nbb [logseq.common.log :as log]
               :default [lambdaisland.glogi :as log])
            [cljs-bean.core :as bean]
            [clojure.string :as string]
            [clojure.walk :as walk]
            [goog.object :as gobj]
            [logseq.common.config :as common-config]
            [logseq.common.util :as common-util]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.graph-parser.utf8 :as utf8]))

(defonce parseJson (gobj/get Mldoc "parseJson"))
(defonce parseInlineJson (gobj/get Mldoc "parseInlineJson"))
(defonce astExportMarkdown (gobj/get Mldoc "astExportMarkdown"))
(defonce getReferences (gobj/get Mldoc "getReferences"))

(def default-references
  (js/JSON.stringify
   (clj->js {:embed_blocks []
             :embed_pages []})))

(defn- convert-export-md-remove-options [opts]
  (->> opts
       (mapv (fn [opt]
               (case opt
                 :page-ref ["Page_ref"]
                 :emphasis ["Emphasis"]
                 [])))
       (remove empty?)))

(defn parse-json
  [content config]
  (parseJson content config))

(defn inline-parse-json
  [text config]
  (parseInlineJson text config))

(defn get-references
  [text config]
  (when-not (string/blank? text)
    (common-util/json->clj (getReferences text config))))

(defn ast-export-markdown
  [ast config references]
  (astExportMarkdown ast
                     config
                     (or references default-references)))

(defn default-config-map
  ([format]
   (default-config-map format {:export-heading-to-list? false}))
  ([format {:keys [export-heading-to-list? export-keep-properties? export-md-indent-style export-md-remove-options parse_outline_only?]}]
   (let [format (string/capitalize (name (or format :markdown)))]
     (->> {:toc false
           :parse_outline_only (or parse_outline_only? false)
           :heading_number false
           :keep_line_break true
           :format format
           :heading_to_list (or export-heading-to-list? false)
           :exporting_keep_properties export-keep-properties?
           :export_md_indent_style export-md-indent-style
           :export_md_remove_options
           (convert-export-md-remove-options export-md-remove-options)}
          (filter #(not (nil? (second %))))
          (into {})))))

(defn default-config
  ([format]
   (default-config format {:export-heading-to-list? false}))
  ([format opts]
   (->> (default-config-map format opts)
        bean/->js
        js/JSON.stringify)))

(defn remove-indentation-spaces
  "Remove the indentation spaces from the content. Only for markdown.
   level - ast level + 1 (2 for the first level, 3 for the second level, etc., as the non-first line of multi-line block has 2 more space
           Ex.
              - level 1 multiline block first line
                level 1 multiline block second line
              \t- level 2 multiline block first line
              \t  level 2 multiline block second line
   remove-first-line? - apply the indentation removal to the first line or not"
  [s level remove-first-line?]
  (let [lines (string/split-lines s)
        [f & r] lines
        body (map (fn [line]
                    ;; Check if the indentation area only contains white spaces
                    ;; Level = ast level + 1, 1-based indentation level
                    ;; For markdown in Logseq, the indentation area for the non-first line of multi-line block is (ast level - 1) * "\t" + 2 * "(space)"
                    (if (string/blank? (common-util/safe-subs line 0 level))
                      ;; If valid, then remove the indentation area spaces. Keep the rest of the line (might contain leading spaces)
                      (common-util/safe-subs line level)
                      ;; Otherwise, trim these invalid spaces
                      (string/triml line)))
                  (if remove-first-line? lines r))
        content (if remove-first-line? body (cons f body))]
    (string/join "\n" content)))

(defn- update-src-full-content
  [ast content]
  (let [content (utf8/encode content)]
    (map (fn [[block pos-meta]]
           (if (and (vector? block)
                    (= "Src" (first block)))
             (let [{:keys [start_pos end_pos]} pos-meta
                   content (utf8/substring content start_pos end_pos)
                   spaces (re-find #"^[\t ]+" (first (string/split-lines content)))
                   content (if spaces (remove-indentation-spaces content (count spaces) true)
                               content)
                   block ["Src" (assoc (second block) :full_content content)]]
               [block pos-meta])
             [block pos-meta])) ast)))

(def ^:private inline-ast-types
  #{"Plain" "Spaces" "Link" "Nested_link" "Target" "Subscript" "Superscript"
    "Footnote_Reference" "Cookie" "Latex_Fragment" "Macro" "Entity" "Timestamp"
    "Radio_Target" "Export_Snippet" "Inline_Source_Block" "Email" "Inline_Hiccup"
    "Inline_Html" "Emphasis" "Verbatim" "Code" "Break_Line" "Hard_Break_Line"})

(defn- inline-coll?
  [x]
  (and (vector? x)
       (seq x)
       (every? #(and (vector? %)
                     (string? (first %))
                     (contains? inline-ast-types (first %)))
               x)))

(defn- inline-ast->source
  ;; Only reconstructs the source text for the node types that appear when
  ;; mldoc splits a macro containing ^{}/{_{}. Nested rich-inline types
  ;; (Emphasis, Code, etc.) inside a Superscript/Subscript will produce nil,
  ;; which (apply str ...) silently drops. This is intentional: the function
  ;; is only called during macro-recovery, not for general rendering.
  [[typ content]]
  (case typ
    "Plain" content
    "Spaces" content
    "Link" (:full_text content)
    ;; Nested_link is the AST node for [[page name]]; :content is the page name
    ;; string. Without this case, collect-macro-source aborts via when-let
    ;; whenever a page ref appears inside a fragmented macro.
    "Nested_link" (str "[[" (:content content) "]]")
    "Superscript" (str "^{" (apply str (map inline-ast->source content)) "}")
    "Subscript" (str "_{" (apply str (map inline-ast->source content)) "}")
    nil))

(defn- starts-with-at?
  [s prefix idx]
  (let [end (+ idx (count prefix))]
    (and (<= end (count s))
         (= prefix (subs s idx end)))))

(defn- unclosed-script-markup?
  [s]
  (loop [idx 0
         depth 0]
    (if (< idx (count s))
      (cond
        (or (starts-with-at? s "^{" idx)
            (starts-with-at? s "_{" idx))
        (recur (+ idx 2) (inc depth))

        (and (pos? depth) (= \} (nth s idx)))
        (recur (inc idx) (dec depth))

        :else
        (recur (inc idx) depth))
      (pos? depth))))

(defn- split-macro-arguments
  [s]
  (if (string/blank? s)
    []
    (loop [idx 0
           start 0
           page-ref-depth 0
           script-depth 0
           quoted? false
           escaped? false
           result []]
      (if (< idx (count s))
        (let [c (nth s idx)]
          (cond
            escaped?
            (recur (inc idx) start page-ref-depth script-depth quoted? false result)

            (= \\ c)
            (recur (inc idx) start page-ref-depth script-depth quoted? true result)

            (= \" c)
            (recur (inc idx) start page-ref-depth script-depth (not quoted?) false result)

            quoted?
            (recur (inc idx) start page-ref-depth script-depth quoted? false result)

            (starts-with-at? s "[[" idx)
            (recur (+ idx 2) start (inc page-ref-depth) script-depth quoted? false result)

            (and (pos? page-ref-depth) (starts-with-at? s "]]" idx))
            (recur (+ idx 2) start (dec page-ref-depth) script-depth quoted? false result)

            (or (starts-with-at? s "^{" idx)
                (starts-with-at? s "_{" idx))
            (recur (+ idx 2) start page-ref-depth (inc script-depth) quoted? false result)

            (and (pos? script-depth) (= \} c))
            (recur (inc idx) start page-ref-depth (dec script-depth) quoted? false result)

            (and (zero? page-ref-depth) (zero? script-depth) (= \, c))
            (recur (inc idx) (inc idx) page-ref-depth script-depth quoted? false
                   (conj result (string/trim (subs s start idx))))

            :else
            (recur (inc idx) start page-ref-depth script-depth quoted? false result)))
        (conj result (string/trim (subs s start)))))))

(defn- macro-source->ast
  [s]
  (when (and (string/starts-with? s "{{")
             (string/ends-with? s "}}"))
    (let [content (-> s
                      (subs 2 (- (count s) 2))
                      string/triml)
          [_ name arguments] (re-matches #"([^\s]+)(?:\s+([\s\S]*))?" content)]
      (when name
        ["Macro" {:name name
                  :arguments (split-macro-arguments arguments)}]))))

(defn- collect-macro-source
  [items]
  (loop [remaining items
         source ""]
    (when-let [[item & more] (seq remaining)]
      (let [[typ content] item]
        (cond
          (= "Plain" typ)
          (if-let [idx (string/index-of content "}}")]
            (let [macro-source (str source (subs content 0 (+ idx 2)))]
              (when-let [macro (macro-source->ast macro-source)]
                (let [suffix (subs content (+ idx 2))]
                  {:macro macro
                   :suffix (when-not (string/blank? suffix) ["Plain" suffix])
                   :remaining more})))
            (recur more (str source content)))

          :else
          (when-let [item-source (inline-ast->source item)]
            (recur more (str source item-source))))))))

(defn- close-script-markup-in-macro
  ;; Appends a single "}" to the last argument to close the outermost
  ;; unmatched ^{/{_ bracket. Handles only depth-1 cases; deeper nesting
  ;; (e.g. Ca^{^{2}}) is not supported and is not expected in practice.
  [macro]
  (update-in macro [1 :arguments]
             (fn [arguments]
               (update arguments (dec (count arguments)) str "}"))))

(defn- recover-inline-macros
  [inline-list]
  (loop [remaining inline-list
         result []]
    (if-let [[item & more] (seq remaining)]
      (let [[typ content] item]
        (cond
          (and (= "Plain" typ)
               (string/includes? content "{{"))
          (let [idx (string/index-of content "{{")
                prefix (subs content 0 idx)
                start-item ["Plain" (subs content idx)]]
            (if-let [{:keys [macro suffix remaining]} (collect-macro-source (cons start-item more))]
              (recur (if suffix
                       (cons suffix remaining)
                       remaining)
                     (cond-> result
                       (not (string/blank? prefix)) (conj ["Plain" prefix])
                       true (conj macro)))
              (recur more (conj result item))))

          (and (= "Macro" typ)
               (seq (:arguments content))
               (unclosed-script-markup? (last (:arguments content)))
               (= "Plain" (ffirst more))
               (string/starts-with? (second (first more)) "}"))
          (let [[_ plain] (first more)
                suffix (subs plain 1)]
            (recur (if (string/blank? suffix)
                     (rest more)
                     (cons ["Plain" suffix] (rest more)))
                   (conj result (close-script-markup-in-macro item))))

          :else
          (recur more (conj result item))))
      result)))

(defn- normalize-macro-asts
  [ast]
  (walk/postwalk
   (fn [x]
     (if (inline-coll? x)
       (recover-inline-macros x)
       x))
   ast))

(defn- macro-with-script-markup?
  [content]
  (and (string/includes? content "{{")
       (or (string/includes? content "^{")
           (string/includes? content "_{"))))

(defn collect-page-properties
  [ast config]
  (when (seq ast)
    (let [original-ast ast
          directive? (fn [[item _]] (= "directive" (string/lower-case (first item))))
          grouped-ast (group-by directive? original-ast)
          [properties-ast other-ast] [(->> (get grouped-ast true)
                                           (map first))
                                      (get grouped-ast false)]
          properties (map (fn [[_directive k v]]
                            [k v (get-references v config)])
                          properties-ast)]
      (if (seq properties)
        (cons [["Properties" properties] nil] other-ast)
        original-ast))))

(defn get-default-config
  "Gets a mldoc default config for the given format. Works for DB and file graphs"
  [repo format]
  (let [db-based? (sqlite-util/db-based-graph? repo)]
    (->>
     (cond-> (default-config-map format)
       db-based?
       (assoc :enable_drawers false
              :parse_marker false
              :parse_priority false))
     bean/->js
     js/JSON.stringify)))

(defn ->edn
  ;; TODO: Re-enable schema
  ;; {:malli/schema [:=> [:cat :string :string] mldoc-schema/block-ast-with-pos-coll-schema]}
  ([content config]
   (if (string? content)
     (try
       (if (string/blank? content)
         []
         (-> content
             (parse-json config)
             (common-util/json->clj)
             (cond-> (macro-with-script-markup? content)
               (normalize-macro-asts))
             (update-src-full-content content)
             (collect-page-properties config)))
       (catch :default e
         (log/error :unexpected-error e)
         []))
     (log/error :edn/wrong-content-type content)))
  ([repo content format]
   (->edn content (get-default-config repo format))))

(defn ->db-edn
  "Wrapper around ->edn for DB graphs"
  [content format]
  (->edn "logseq_db_repo_stub" content format))

(defn inline->edn
  [text config]
  (try
    (if (string/blank? text)
      {}
      (-> text
          (inline-parse-json config)
          (common-util/json->clj)
          (cond-> (macro-with-script-markup? text)
            (normalize-macro-asts))))
    (catch :default _e
      [])))

(defn ast-link?
  [[type link]]
  (let [[ref-type ref-value] (:url link)]
    (and (= "Link" type)
         (or
          ;; 1. url
          (not (contains? #{"Page_ref" "Block_ref"} ref-type))

          (and (contains? #{"Page_ref"} ref-type)
               (boolean (common-config/local-relative-asset? ref-value)))))))

(defn mldoc-link?
  "Check whether s is a link (including page/block refs)."
  [format s]
  (let [result (inline->edn s (default-config format))]
    (and
     (= 1 (count result))
     (let [result' (first result)]
       (or (contains? #{"Nested_link"} (first result'))
           (contains? #{"Page_ref" "Block_ref" "Complex"} (first (:url (second result')))))))))

(defn block-with-title?
  [type]
  (contains? #{"Paragraph"
               "Raw_Html"
               "Hiccup"
               "Heading"} type))
