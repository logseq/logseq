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
            [medley.core :as medley]
            [cljs.test :refer [deftest are testing]]))

(defonce parseJson (gobj/get Mldoc "parseJson"))
(defonce parseInlineJson (gobj/get Mldoc "parseInlineJson"))
(defonce parseHtml (gobj/get Mldoc "parseHtml"))
(defonce anchorLink (gobj/get Mldoc "anchorLink"))

(defn default-config
  [format]
  (let [format (string/capitalize (name (or format :markdown)))]
    (js/JSON.stringify
     (bean/->js
      (assoc {:toc false
              :heading_number false
              :keep_line_break true}
             :format format)))))

(defn parse-json
  [content config]
  (parseJson content (or config default-config)))

(defn inline-parse-json
  [text config]
  (parseInlineJson text (or config default-config)))

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
          directive? (fn [item] (= "directive" (string/lower-case (first item))))
          properties (->> (take-while directive? ast)
                          (map (fn [[_ k v]]
                                 (let [k (keyword (string/lower-case k))
                                       v (if (contains? #{:title :description} k)
                                           v
                                           (text/split-page-refs-without-brackets v))]
                                   [k v])))
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
          alias (->vec-concat (:roam_alias properties) (:alias properties))
          filetags (if-let [org-file-tags (:filetags properties)]
                     (->> (string/split org-file-tags ":")
                          (remove string/blank?)))
          roam-tags (if-let [org-roam-tags (:roam_tags properties)]
                      (->> (string/split org-roam-tags " ")
                           (remove string/blank?)))
          tags (->vec-concat roam-tags (:tags properties) definition-tags filetags)
          properties (assoc properties :tags tags :alias alias)
          properties (-> properties
                         (update :roam_alias ->vec)
                         (update :roam_tags (constantly roam-tags))
                         (update :filetags (constantly filetags)))
          properties (medley/filter-kv (fn [k v] (not (empty? v))) properties)
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
    true))

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


(deftest test-parse-org-properties
  []
  (testing "just title"
    (let [content "#+TITLE:   some title   "
          props (parse-properties content "org")]
      (are [x y] (= x y)
        ;; TODO: should we trim in parse-properties?
        "some title" (string/trim (:title props)))))

  (testing "filetags"
    (let [content "
#+FILETAGS:   :tag1:tag_2:@tag:
#+ROAM_TAGS:  roamtag
body"
          props (parse-properties content "org")]
      (are [x y] (= x y)
        (list "@tag" "tag1" "tag_2") (sort (:filetags props))
        ["roamtag"] (:roam_tags props)
        (list "@tag" "roamtag" "tag1" "tag_2") (sort (:tags props)))))

  (testing "roam tags"
    (let [content "
#+FILETAGS: filetag
#+ROAM_TAGS: roam1 roam2
body
"
          props (parse-properties content "org")]
      (are [x y] (= x y)
        ["roam1" "roam2"] (:roam_tags props)
        (list "filetag" "roam1" "roam2") (sort (:tags props))))))
