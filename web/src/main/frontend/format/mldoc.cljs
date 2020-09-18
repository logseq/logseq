(ns frontend.format.mldoc
  (:require [frontend.format.protocol :as protocol]
            [frontend.util :as util]
            [frontend.config :as config]
            [clojure.string :as string]
            [frontend.loader :as loader]
            [cljs-bean.core :as bean]
            [medley.core :as medley]
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
    (let [comma? (re-find #"," s)]
      (some->>
       (string/split s #"[\"|\,]{1}")
       (remove string/blank?)
       (map (fn [s]
              (if (and (not comma?)
                       (or (= " " (first s)) (= " " (last s))))
                ;; space separated tags
                (string/split (string/trim s) #" ")
                s)))
       flatten
       distinct
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

(defn collect-page-directives
  [ast]
  (if (seq ast)
    (let [original-ast ast
          ast (map first ast)           ; without position meta
          directive? (fn [item] (= "directive" (string/lower-case (first item))))
          directives (->> (take-while directive? ast)
                          (map (fn [[_ k v]]
                                 [(keyword (string/lower-case k))
                                  v]))
                          (into {}))
          macro-directives (filter (fn [x] (= :macro (first x))) directives)
          macros (if (seq macro-directives)
                   (->>
                    (map
                      (fn [[_ v]]
                        (let [[k v] (util/split-first " " v)]
                          (mapv
                           string/trim
                           [k v])))
                      macro-directives)
                    (into {}))
                   {})
          directives (->> (remove (fn [x] (= :macro (first x))) directives)
                          (into {}))
          directives (if (:roam_alias directives)
                       (assoc directives :alias (:roam_alias directives))
                       directives)
          directives (if (seq directives)
                       (cond-> directives
                         (:roam_key directives)
                         (assoc :key (:roam_key directives))
                         (:alias directives)
                         (update :alias sep-by-quote-or-space-or-comma)
                         (:tags directives)
                         (update :tags sep-by-quote-or-space-or-comma)
                         (:roam_tags directives)
                         (update :roam_tags sep-by-quote-or-space-or-comma))
                       directives)
          definition-tags (get-tags-from-definition ast)
          directives (if definition-tags
                       (update directives :tags (fn [tags]
                                                  (-> (concat tags definition-tags)
                                                      distinct)))
                       directives)
          directives (cond-> directives
                       (seq macros)
                       (assoc :macros macros))
          other-ast (drop-while (fn [[item _pos]] (directive? item)) original-ast)]
      (if (seq directives)
        (cons [["Directives" directives] nil] other-ast)
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
          (collect-page-directives)))
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
