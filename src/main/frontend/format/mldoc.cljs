(ns frontend.format.mldoc
  (:require [clojure.string :as string]
            [frontend.format.protocol :as protocol]
            [frontend.utf8 :as utf8]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            [medley.core :as medley]
            ["mldoc" :as mldoc :refer [Mldoc]]
            [linked.core :as linked]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [logseq.graph-parser.util :as gp-util]
            [logseq.graph-parser.config :as gp-config]))

(defonce anchorLink (gobj/get Mldoc "anchorLink"))
(defonce parseOPML (gobj/get Mldoc "parseOPML"))
(defonce parseAndExportMarkdown (gobj/get Mldoc "parseAndExportMarkdown"))
(defonce parseAndExportOPML (gobj/get Mldoc "parseAndExportOPML"))
(defonce export (gobj/get Mldoc "export"))

(defn parse-opml
  [content]
  (parseOPML content))

(defn parse-export-markdown
  [content config references]
  (parseAndExportMarkdown content
                          config
                          (or references gp-mldoc/default-references)))

(defn parse-export-opml
  [content config title references]
  (parseAndExportOPML content
                      config
                      title
                      (or references gp-mldoc/default-references)))

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
  [ast parse-property]
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
                                       (parse-property k v))]
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
                    (remove string/blank?))
          properties (assoc properties :tags tags :alias alias)
          properties (-> properties
                         (update :filetags (constantly filetags)))
          properties (medley/remove-kv (fn [_k v] (or (nil? v) (and (coll? v) (empty? v)))) properties)]
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
                  content (if spaces (remove-indentation-spaces content (count spaces) true)
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

(def parse-property nil)

(defn ->edn
  [content config]
  (if (string? content)
    (try
      (if (string/blank? content)
        []
        (-> content
            (gp-mldoc/parse-json config)
            (gp-util/json->clj)
            (update-src-full-content content)
            (collect-page-properties parse-property)))
      (catch js/Error e
        (js/console.error e)
        []))
    (log/error :edn/wrong-content-type content)))

(defn opml->edn
  [content]
  (try
    (if (string/blank? content)
      {}
      (let [[headers blocks] (-> content (parse-opml) (gp-util/json->clj))]
        [headers (collect-page-properties blocks parse-property)]))
    (catch js/Error e
      (log/error :edn/convert-failed e)
      [])))

(defn inline->edn
  [text config]
  (try
    (if (string/blank? text)
      {}
      (-> text
          (gp-mldoc/inline-parse-json config)
          (gp-util/json->clj)))
    (catch js/Error _e
      [])))

(defrecord MldocMode []
  protocol/Format
  (toEdn [_this content config]
    (->edn content config))
  (toHtml [_this content config references]
    (export "html" content config references))
  (loaded? [_this]
    true)
  (lazyLoad [_this _ok-handler]
    true)
  (exportMarkdown [_this content config references]
    (parse-export-markdown content config references))
  (exportOPML [_this content config title references]
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

(defn link?
  [format link]
  (when (string? link)
    (let [[type link] (first (inline->edn link (gp-mldoc/default-config format)))
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
