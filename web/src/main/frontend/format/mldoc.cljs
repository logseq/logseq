(ns frontend.format.mldoc
  (:require [frontend.format.protocol :as protocol]
            [frontend.util :as util]
            [frontend.config :as config]
            [clojure.string :as string]
            [frontend.loader :as loader]
            [cljs-bean.core :as bean]
            [medley.core :as medley]))

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

;; E.g "Foo Bar \"Bar Baz\""
(defn- sep-by-quote-or-space
  [s]
  (some->>
   (string/split s #"\"")
   (remove string/blank?)
   (map (fn [s]
          (if (or (= " " (first s)) (= " " (last s)))
            ;; space separated tags
            (string/split (string/trim s) #" ")
            s)))
   flatten
   distinct
   (map string/lower-case)))

(defn collect-page-directives
  [ast]
  (if (seq ast)
    (let [directive? (fn [item] (= "directive" (string/lower-case (first item))))
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
          directives (if (seq directives)
                       (let [directives (->
                                         (cond-> directives
                                           (:roam_alias directives)
                                           (assoc :alias (:roam_alias directives))
                                           (:roam_tags directives)
                                           (assoc :tags (:roam_tags directives))
                                           (:roam_key directives)
                                           (assoc :key (:roam_key directives)))
                                         (dissoc :roam_alias :roam_tags :roam_key))]
                         (-> directives
                             (update :alias sep-by-quote-or-space)
                             (update :tags sep-by-quote-or-space)))
                       directives)
          directives (assoc directives :macros macros)
          other-ast (drop-while directive? ast)]
      (if (seq directives)
        (cons ["Directives" directives] other-ast)
        ast))
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
