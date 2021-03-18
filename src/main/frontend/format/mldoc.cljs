(ns frontend.format.mldoc
  (:require [frontend.format.protocol :as protocol]
            [frontend.util :as util]
            [clojure.string :as string]
            [cljs-bean.core :as bean]
            [cljs.core.match :refer-macros [match]]
            [lambdaisland.glogi :as log]
            [goog.object :as gobj]
            [frontend.text :as text]
            ["mldoc" :as mldoc :refer [Mldoc]]
            [medley.core :as medley]))

(defonce parseJson (gobj/get Mldoc "parseJson"))
(defonce parseInlineJson (gobj/get Mldoc "parseInlineJson"))
(defonce parseHtml (gobj/get Mldoc "parseHtml"))
(defonce anchorLink (gobj/get Mldoc "anchorLink"))
(defonce parseAndExportMarkdown (gobj/get Mldoc "parseAndExportMarkdown"))

(defn default-config
  ([format]
   (default-config format false))
  ([format export-heading-to-list?]
   (let [format (string/capitalize (name (or format :markdown)))]
     (js/JSON.stringify
      (bean/->js
       {:toc false
        :heading_number false
        :keep_line_break true
        :format format
        :heading_to_list export-heading-to-list?})))))

(def default-references
  (js/JSON.stringify
   (clj->js {:embed_blocks []
             :embed_pages []
             :refer_blocks []})))

(defn parse-json
  [content config]
  (parseJson content (or config default-config)))

(defn inline-parse-json
  [text config]
  (parseInlineJson text (or config default-config)))

(defn parse-export-markdown
  [content config references]
  (parseAndExportMarkdown content
                          (or config default-config)
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
          [directive-ast other-ast]
          [(get grouped-ast true) (get grouped-ast false)]
          properties (->> (map first directive-ast)
                          (map (fn [[_ k v]]
                                 (let [k (keyword (string/lower-case k))
                                       comma? (contains? #{:tags :alias :roam_tags} k)
                                       v (if (contains? #{:title :description :roam_tags} k)
                                           v
                                           (text/split-page-refs-without-brackets v comma?))]
                                   [k v])))
                          (reverse)
                          (into {}))
          macro-properties (filter (fn [x] (= :macro (first x))) properties)
          macros (if (seq macro-properties)
                   (->>
                    (map
                     (fn [[_ v]]
                       (let [[k v] (util/split-first " " v)]
                         (mapv
                          string/trim
                          [k v])))
                     macro-properties)
                    (into {}))
                   {})
          properties (->> (remove (fn [x] (= :macro (first x))) properties)
                          (into {}))
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
          filetags (if-let [org-file-tags (:filetags properties)]
                     (->> (string/split org-file-tags ":")
                          (remove string/blank?)))
          roam-tags (if-let [org-roam-tags (:roam_tags properties)]
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
          properties (medley/filter-kv (fn [k v] (not (empty? v))) properties)]
      (if (seq properties)
        (cons [["Properties" properties] nil] other-ast)
        original-ast))
    ast))

(defn ->edn
  [content config]
  (try
    (if (string/blank? content)
      {}
      (-> content
          (parse-json config)
          (util/json->clj)
          (collect-page-properties)))
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
  (toHtml [this content config]
    (parseHtml content config))
  (loaded? [this]
    true)
  (lazyLoad [this ok-handler]
    true)
  (exportMarkdown [this content config references]
    (parse-export-markdown content config references))
  )

(defn plain->text
  [plains]
  (string/join (map last plains)))

(defn parse-properties
  [content format]
  (let [ast (->> (->edn content
                        (default-config format))
                 (map first))
        properties (collect-page-properties ast)
        properties (let [properties (and (seq ast)
                                         (= "Properties" (ffirst ast))
                                         (last (first ast)))]
                     (if (and properties (seq properties))
                       properties))]
    (into {} properties)))
