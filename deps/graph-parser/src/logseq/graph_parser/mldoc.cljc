(ns logseq.graph-parser.mldoc
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
            [linked.core :as linked]
            [logseq.graph-parser.util :as gp-util]
            [logseq.graph-parser.config :as gp-config]))

(defonce parseJson (gobj/get Mldoc "parseJson"))
(defonce parseInlineJson (gobj/get Mldoc "parseInlineJson"))
(defonce astExportMarkdown (gobj/get Mldoc "astExportMarkdown"))

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

(defn- ->vec
  [s]
  (if (string? s) [s] s))

(defn- ->vec-concat
  [& coll]
  (->> (map ->vec coll)
       (remove nil?)
       (apply concat)
       (distinct)))

(defn collect-page-properties
  [ast parse-property config-state]
  (if (seq ast)
    (let [original-ast ast
          ast (map first ast)           ; without position meta
          directive? (fn [[item _]] (= "directive" (string/lower-case (first item))))
          grouped-ast (group-by directive? original-ast)
          directive-ast (take-while directive? original-ast)
          [properties-ast other-ast] (if (= "Property_Drawer" (ffirst ast))
                                       [(last (first ast))
                                        (rest original-ast)]
                                       [(->> (map first directive-ast)
                                             (map rest))
                                        (get grouped-ast false)])
          properties (->>
                      properties-ast
                      (map (fn [[k v]]
                             (let [k (keyword (string/lower-case k))
                                   v (if (contains? #{:title :description :filters :macro} k)
                                       v
                                       (parse-property k v config-state))]
                               [k v]))))
          properties (into (linked/map) properties)
          macro-properties (filter (fn [x] (= :macro (first x))) properties)
          macros (if (seq macro-properties)
                   (->>
                    (map
                     (fn [[_ v]]
                       (let [[k v] (gp-util/split-first " " v)]
                         (mapv
                          string/trim
                          [k v])))
                     macro-properties)
                    (into {}))
                   {})
          properties (->> (remove (fn [x] (= :macro (first x))) properties)
                          (into (linked/map)))
          properties (cond-> properties
                             (seq macros)
                             (assoc :macros macros))
          alias (:alias properties)
          alias (when alias
                  (if (coll? alias)
                    (remove string/blank? alias)
                    [alias]))
          filetags (when-let [org-file-tags (:filetags properties)]
                     (->> (string/split org-file-tags ":")
                          (remove string/blank?)))
          tags (:tags properties)
          tags (->> (->vec-concat tags filetags)
                    (remove string/blank?)
                    vec)
          properties (assoc properties :tags tags :alias alias)
          properties (-> properties
                         (update :filetags (constantly filetags)))
          properties (into (linked/map)
                           (remove (fn [[_k v]]
                                     (or (nil? v) (and (coll? v) (empty? v))))
                                   properties))]
      (if (seq properties)
        (cons [["Properties" properties] nil] other-ast)
        original-ast))
    ast))

(def parse-property nil)

(defn ->edn
  [content config config-state]
  (if (string? content)
    (try
      (if (string/blank? content)
        []
        (-> content
            (parse-json config)
            (gp-util/json->clj)
            (update-src-full-content content)
            (collect-page-properties parse-property config-state)))
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

(defn link?
  [format link]
  (when (string? link)
    (let [[type link] (first (inline->edn link (default-config format)))
          [ref-type ref-value] (:url link)]
      (and (= "Link" type)
           (or
            ;; 1. url
            (not (contains? #{"Page_ref" "Block_ref"} ref-type))

            (and (contains? #{"Page_ref"} ref-type)
                 (or
                  ;; 2. excalidraw link
                  (gp-config/draw? ref-value)

                  ;; 3. local asset link
                  (boolean (gp-config/local-asset? ref-value)))))))))
