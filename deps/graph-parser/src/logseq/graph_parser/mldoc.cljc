(ns logseq.graph-parser.mldoc
  "Wraps https://github.com/logseq/mldoc to parse files into mldoc ast. This ns
  encapsulates mldoc's json api by only taking and returning edn"
  ;; Disable clj linters since we don't support clj
  #?(:clj {:clj-kondo/config {:linters {:unresolved-namespace {:level :off}
                                        :unresolved-symbol {:level :off}}}})
  (:require #?(:org.babashka/nbb ["mldoc$default" :refer [Mldoc]]
               :default ["mldoc" :refer [Mldoc]])
            #?(:org.babashka/nbb [logseq.graph-parser.log :as log]
               :default [lambdaisland.glogi :as log])
            [goog.object :as gobj]
            [cljs-bean.core :as bean]
            [logseq.graph-parser.utf8 :as utf8]
            [clojure.string :as string]
            [logseq.graph-parser.util :as gp-util]
            [logseq.graph-parser.config :as gp-config]))

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
    (gp-util/json->clj (getReferences text config))))

(defn ast-export-markdown
  [ast config references]
  (astExportMarkdown ast
                     config
                     (or references default-references)))

(defn default-config
  ([format]
   (default-config format {:export-heading-to-list? false}))
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
          (into {})
          (bean/->js)
          js/JSON.stringify))))

(defn remove-indentation-spaces
  [s level remove-first-line?]
  (let [lines (string/split-lines s)
        [f & r] lines
        body (map (fn [line]
                    (if (string/blank? (gp-util/safe-subs line 0 level))
                      (gp-util/safe-subs line level)
                      line))
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

(defn ->edn
  [content config]
  (if (string? content)
    (try
      (if (string/blank? content)
        []
        (-> content
            (parse-json config)
            (gp-util/json->clj)
            (update-src-full-content content)
            (collect-page-properties config)))
      (catch :default e
        (log/error :unexpected-error e)
        []))
    (log/error :edn/wrong-content-type content)))

(defn inline->edn
  [text config]
  (try
    (if (string/blank? text)
      {}
      (-> text
          (inline-parse-json config)
          (gp-util/json->clj)))
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
               (or
                ;; 2. excalidraw link
                (gp-config/draw? ref-value)

                ;; 3. local asset link
                (boolean (gp-config/local-asset? ref-value))))))))

(defn link?
  [format link]
  (when (string? link)
    (some-> (first (inline->edn link (default-config format)))
            ast-link?)))
