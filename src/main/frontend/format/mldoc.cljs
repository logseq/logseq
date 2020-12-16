(ns frontend.format.mldoc
  (:require [frontend.format.protocol :as protocol]
            [frontend.util :as util]
            [clojure.string :as string]
            [cljs-bean.core :as bean]
            [cljs.core.match :refer-macros [match]]))

(defn default-config
  [format]
  (let [format (string/capitalize (name (or format :markdown)))]
    (js/JSON.stringify
     (bean/->js
      (assoc {:toc false
              :heading_number false
              :keep_line_break true}
             :format format)))))

(defn loaded? []
  js/window.Mldoc)

(defn parse-json
  [content config]
  (when (loaded?)
    (.parseJson js/window.Mldoc content (or config default-config))))

(defn inline-parse-json
  [text config]
  (when (loaded?)
    (.parseInlineJson js/window.Mldoc text (or config default-config))))

;; E.g "Foo Bar \"Bar Baz\""
(defn- sep-by-quote-or-space-or-comma
  [s]
  (when s
    (let [comma? (re-find #"[,|，]+" s)]
      (some->>
       (string/split s #"[\"|\,|，]{1}")
       (remove string/blank?)
       (map (fn [s]
              (if (and (not comma?)
                       (or (contains? #{" " "#"} (first s))
                           (= " " (last s))))
                ;; space/hashtag separated tags
                (string/split (string/trim s) #" ")
                s)))
       flatten
       distinct
       (remove string/blank?)
       (map string/lower-case)
       (map string/trim)))))

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

(defn collect-page-properties
  [ast]
  (if (seq ast)
    (let [original-ast ast
          ast (map first ast)           ; without position meta
          directive? (fn [item] (= "directive" (string/lower-case (first item))))
          properties (->> (take-while directive? ast)
                          (map (fn [[_ k v]]
                                 [(keyword (string/lower-case k))
                                  v]))
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
          properties (if (:roam_alias properties)
                       (assoc properties :alias (:roam_alias properties))
                       properties)
          properties (if (seq properties)
                       (cond-> properties
                         (:roam_key properties)
                         (assoc :key (:roam_key properties))
                         (:alias properties)
                         (update :alias sep-by-quote-or-space-or-comma)
                         (:tags properties)
                         (update :tags sep-by-quote-or-space-or-comma)
                         (:roam_tags properties)
                         (update :roam_tags sep-by-quote-or-space-or-comma))
                       properties)
          definition-tags (get-tags-from-definition ast)
          properties (if definition-tags
                       (update properties :tags (fn [tags]
                                                  (-> (concat tags definition-tags)
                                                      distinct)))
                       properties)
          properties (cond-> properties
                       (seq macros)
                       (assoc :macros macros))
          other-ast (drop-while (fn [[item _pos]] (directive? item)) original-ast)]
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
    (catch js/Error _e
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
    (.parseHtml js/window.Mldoc content config))
  (loaded? [this]
    (some? (loaded?)))
  (lazyLoad [this ok-handler]
    true))

(defn plain->text
  [plains]
  (string/join (map last plains)))

(defn parse-properties
  [content format]
  (let [ast (->> (->edn content
                        (default-config format))
                 (map first))
        properties (let [properties (and (seq ast)
                                         (= "Properties" (ffirst ast))
                                         (last (first ast)))]
                     (if (and properties (seq properties))
                       properties))]
    (into {} properties)))
