(ns frontend.format.mldoc
  (:require [cljs-bean.core :as bean]
            [cljs.core.match :refer [match]]
            [clojure.string :as string]
            [frontend.format.protocol :as protocol]
            [frontend.text :as text]
            [frontend.utf8 :as utf8]
            [frontend.util :as util]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            [medley.core :as medley]
            ["mldoc" :as mldoc :refer [Mldoc]]
            [linked.core :as linked]
            [promesa.core :as p]
            [frontend.util.pool :as pool]))

(defonce parseJson (gobj/get Mldoc "parseJson"))
(defonce parseInlineJson (gobj/get Mldoc "parseInlineJson"))
(defonce parseOPML (gobj/get Mldoc "parseOPML"))
(defonce export (gobj/get Mldoc "export"))
(defonce anchorLink (gobj/get Mldoc "anchorLink"))
(defonce parseAndExportMarkdown (gobj/get Mldoc "parseAndExportMarkdown"))
(defonce parseAndExportOPML (gobj/get Mldoc "parseAndExportOPML"))
(defonce astExportMarkdown (gobj/get Mldoc "astExportMarkdown"))

(defn convert-export-md-remove-options [opts]
  (->>
   (mapv (fn [opt]
             (case opt
               :page-ref ["Page_ref"]
               :emphasis ["Emphasis"]
               []))
         opts)
   (remove empty?)))


(defn default-config
  ([format]
   (default-config format {:export-heading-to-list? false}))
  ([format {:keys [export-heading-to-list? export-keep-properties? export-md-indent-style export-md-remove-options]}]
   (let [format (string/capitalize (name (or format :markdown)))]
     (->> {:toc false
           :heading_number false
           :keep_line_break true
           :format format
           :heading_to_list (or export-heading-to-list? false)
           :exporting_keep_properties export-keep-properties?
           :export_md_indent_style export-md-indent-style
           :export_md_remove_options
           (convert-export-md-remove-options export-md-remove-options)}
          (filter #(not(nil? (second %))))
          (into {})
          (bean/->js)
          (js/JSON.stringify)))))

(def default-references
  (js/JSON.stringify
   (clj->js {:embed_blocks []
             :embed_pages []})))

(defn parse-json
  [content config]
  (parseJson content config))

(defn inline-parse-json
  [text config]
  (parseInlineJson text config))

(defn parse-opml
  [content]
  (parseOPML content))

(defn parse-export-markdown
  [content config references]
  (parseAndExportMarkdown content
                          config
                          (or references default-references)))

(defn parse-export-opml
  [content config title references]
  (parseAndExportOPML content
                      config
                      title
                      (or references default-references)))

(defn ast-export-markdown
  [ast config references]
  (astExportMarkdown ast
                     config
                     (or references default-references)))

;; Org-roam
(defn get-tags-from-definition
  [ast]
  (loop [ast ast]
    (if (seq ast)
      (match (first ast)
        ["List" l]
        (when-let [name (:name (first l))]
          (let [name (and (vector? name)
                          (last (first name)))]
            (when (and (string? name)
                       (= (string/lower-case name) "tags"))
              (->>
               (last (first (:content (first l))))
               (map second)
               (filter (and map? :url))
               (map (fn [x]
                      (let [label (last (first (:label x)))
                            search (and (= (first (:url x)) "Search")
                                        (last (:url x)))
                            tag (if-not (string/blank? label)
                                  label
                                  search)]
                        (when tag (string/lower-case tag)))))
               (remove nil?)))))

        ["Heading" _h]
        nil

        :else
        (recur (rest ast)))
      nil)))

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
  [ast]
  (if (seq ast)
    (let [original-ast ast
          ast (map first ast)           ; without position meta
          directive?
          (fn [[item _]] (= "directive" (string/lower-case (first item))))
          grouped-ast (group-by directive? original-ast)
          directive-ast (get grouped-ast true)
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
                                   v (if (contains? #{:title :description :filters :roam_tags :macro} k)
                                       v
                                       (text/split-page-refs-without-brackets v))]
                               [k v]))))
          properties (into (linked/map) properties)
          macro-properties (filter (fn [x] (= :macro (first x))) properties)
          macros (if (seq macro-properties)
                   (->>
                    (map
                     (fn [[_ v]]
                       (do
                         (let [[k v] (util/split-first " " v)]
                          (mapv
                           string/trim
                           [k v]))))
                     macro-properties)
                    (into {}))
                   {})
          properties (->> (remove (fn [x] (= :macro (first x))) properties)
                          (into (linked/map)))
          properties (if (seq properties)
                       (cond-> properties
                         (:roam_key properties)
                         (assoc :key (:roam_key properties)))
                       properties)
          definition-tags (get-tags-from-definition ast)
          properties (cond-> properties
                       (seq macros)
                       (assoc :macros macros))
          alias (->> (->vec-concat (:roam_alias properties) (:alias properties))
                     (remove string/blank?))
          filetags (when-let [org-file-tags (:filetags properties)]
                     (->> (string/split org-file-tags ":")
                          (remove string/blank?)))
          roam-tags (when-let [org-roam-tags (:roam_tags properties)]
                      (let [pat #"\"(.*?)\"" ;; note: lazy, capturing group
                            quoted (map second (re-seq pat org-roam-tags))
                            rest   (string/replace org-roam-tags pat "")
                            rest (->> (string/split rest " ")
                                      (remove string/blank?))]
                        (concat quoted rest)))
          tags (->> (->vec-concat roam-tags (:tags properties) definition-tags filetags)
                    (remove string/blank?))
          properties (assoc properties :tags tags :alias alias)
          properties (-> properties
                         (update :roam_alias ->vec)
                         (update :roam_tags (constantly roam-tags))
                         (update :filetags (constantly filetags)))
          properties (medley/filter-kv (fn [k v] (not (empty? v))) properties)
          properties (medley/map-vals util/unquote-string-if-wrapped properties)]
      (if (seq properties)
        (cons [["Properties" properties] nil] other-ast)
        original-ast))
    ast))

(defn update-src-full-content
  [ast content]
  (let [content (utf8/encode content)]
    (map (fn [[block pos-meta]]
          (if (and (vector? block)
                   (= "Src" (first block)))
            (let [{:keys [start_pos end_pos]} pos-meta
                  content (utf8/substring content start_pos end_pos)
                  spaces (re-find #"^[\t ]+" (first (string/split-lines content)))
                  content (if spaces (text/remove-indentation-spaces content (count spaces) true)
                              content)
                  block ["Src" (assoc (second block) :full_content content)]]
              [block pos-meta])
            [block pos-meta])) ast)))

(defn block-with-title?
  [type]
  (contains? #{"Paragraph"
               "Raw_Html"
               "Hiccup"
               "Heading"} type))

(defn ->edn
  [content config]
  (if (string? content)
    (try
      (if (string/blank? content)
        []
        (-> content
            (parse-json config)
            (util/json->clj)
            (update-src-full-content content)
            (collect-page-properties)))
      (catch js/Error e
        (log/error :edn/convert-failed e)
        []))
    (log/error :edn/wrong-content-type content)))

(defn ->edn-async
  [content config]
  (if util/node-test?
    (p/resolved (->edn content config))
    (try
      (if (string/blank? content)
        (p/resolved [])
        (p/let [v (pool/add-parse-job! content config)]
          (-> v
              (util/json->clj)
              (update-src-full-content content)
              (collect-page-properties))))
      (catch js/Error e
        (log/error :edn/convert-failed e)
        (p/resolved [])))))

(defn opml->edn
  [content]
  (try
    (if (string/blank? content)
      {}
      (let [[headers blocks] (-> content (parse-opml) (util/json->clj))]
        [headers (collect-page-properties blocks)]))
    (catch js/Error e
      (log/error :edn/convert-failed e)
      [])))

(defn inline->edn
  [text config]
  (try
    (if (string/blank? text)
      {}
      (-> text
          (inline-parse-json config)
          (util/json->clj)))
    (catch js/Error _e
      [])))

(defrecord MldocMode []
  protocol/Format
  (toEdn [this content config]
    (->edn content config))
  (toHtml [this content config references]
    (export "html" content config references))
  (loaded? [this]
    true)
  (lazyLoad [this ok-handler]
    true)
  (exportMarkdown [this content config references]
    (parse-export-markdown content config references))
  (exportOPML [this content config title references]
    (parse-export-opml content config title references)))

(defn plain->text
  [plains]
  (string/join (map last plains)))

(defn properties?
  [ast]
  (contains? #{"Properties" "Property_Drawer"} (ffirst ast)))

(defn typ-drawer?
  [ast typ]
  (and (contains? #{"Drawer"} (ffirst ast))
       (= typ (second (first ast)))))
