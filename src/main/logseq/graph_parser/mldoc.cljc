(ns ^:nbb-compatible logseq.graph-parser.mldoc
  (:require #?(:org.babashka/nbb ["mldoc$default" :refer [Mldoc]]
               :default ["mldoc" :refer [Mldoc]])
            [goog.object :as gobj]
            [cljs-bean.core :as bean]
            [clojure.string :as string]))

(defonce parseJson (gobj/get Mldoc "parseJson"))
(defonce parseInlineJson (gobj/get Mldoc "parseInlineJson"))
(defonce astExportMarkdown (gobj/get Mldoc "astExportMarkdown"))

;; NOTE: All references to js/ have to have a :default conditional because of clojure
(def default-references
  #?(:cljs
     (js/JSON.stringify
      (clj->js {:embed_blocks []
                :embed_pages []}))
     :default {}))

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
          #?(:cljs js/JSON.stringify :default identity)))))
