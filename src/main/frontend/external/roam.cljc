(ns frontend.external.roam
  (:require #?(:cljs [cljs-bean.core :as bean]
               :clj [cheshire.core :as json])
            [frontend.external.protocol :as protocol]
            [medley.core :as medley]
            [clojure.walk :as walk]
            [clojure.string :as string]
            [frontend.util :as util]))

(defonce all-refed-uids (atom #{}))
(defonce uid->uuid (atom {}))

(defn- reset-state!
  []
  (reset! all-refed-uids #{})
  (reset! uid->uuid {}))

;; DONE: 1. uid converted to a uuid
;; DONE: 2. merge pages with same names (case-sensitive)
;; DONE: 3. mldoc add support to roam research macros, or we can transform here.
;; DONE: 4. mldoc add support to nested links
;; TODO: 5. Roam attributes -> properties
;; TODO: 6. hiccup

(defonce uid-pattern #"\(\(([a-zA-Z0-9_\\-]{6,24})\)\)")
(defonce macro-pattern #"\{\{([^{}]+)\}\}")

(defn uid-transform
  [text]
  (string/replace text uid-pattern (fn [[_ uid]]
                                     (let [id (get @uid->uuid uid uid)]
                                       (str "((" id "))")))))

(defn macro-transform
  [text]
  (string/replace text macro-pattern (fn [[original text]]
                                       (let [[name arg] (-> (string/replace text #" " "")
                                                            (string/split #":"))]
                                         (if name
                                           (let [name (case name
                                                        "[[embed]]" "embed"
                                                        name)]
                                             (util/format "{{%s %s}}" name arg))
                                           original)))))

(defn load-all-refed-uids!
  [data]
  (let [full-text (atom "")]
    (walk/postwalk
     (fn [f]
       (when (and (map? f) (:string f))
         (swap! full-text (fn [v] (str v (:string f)))))
       f)
     data)
    (let [uids (->> (re-seq uid-pattern @full-text)
                    (map last)
                    (distinct)
                    (set))]
      (reset! all-refed-uids uids)
      (doseq [uid uids]
        (swap! uid->uuid assoc uid (medley/random-uuid))))))

(defn transform
  [text]
  (-> text
      (string/replace "{{[[TODO]]}}" "TODO")
      (string/replace "{{[[DONE]]}}" "DONE")
      (uid-transform)
      (macro-transform)))

(declare children->text)
(defn child->text
  [{:keys [uid string children] :as child} level]
  (when-not (and (get @uid->uuid uid) uid)
    (swap! uid->uuid assoc uid (medley/random-uuid)))
  (let [children-text (children->text children (inc level))
        level-pattern (apply str (repeat level "#"))
        properties (when (contains? @all-refed-uids uid)
                     (str
                      (util/format ":PROPERTIES:\n:ID:%s\n:END:"
                                   (str (get @uid->uuid uid)))
                      "\n"))]
    (if string
      (str level-pattern " " (string/triml string) "\n" properties children-text)
      children-text)))

(defn children->text
  [children level]
  (->> (map #(child->text % level) children)
       (interpose "\n")
       (apply str)))

(defn ->file
  [page-data]
  (let [{:keys [create-time title children edit-time]} page-data
        initial-level 2
        text (when (seq children)
               (when-let [text (children->text children initial-level)]
                 (let [front-matter (util/format "---\ntitle: %s\n---\n\n" title)]
                   (str front-matter (transform text)))))]
    (when (and (not (string/blank? title))
               text)
      {:title title
       :created-at create-time
       :last-modified-at edit-time
       :text text})))

(defn ->files
  [edn-data]
  (load-all-refed-uids! edn-data)
  (let [files (map ->file edn-data)
        files (remove #(nil? (:title %)) files)
        files (group-by (fn [f] (string/lower-case (:title f)))
                        files)]
    (map
     (fn [[_ [fst & others]]]
       (assoc fst :text
              (->> (map :text (cons fst others))
                   (interpose "\n")
                   (apply str))))
     files)))

(defn json->edn
  [raw-string]
  #?(:cljs (-> raw-string js/JSON.parse bean/->clj)
     :clj (-> raw-string json/parse-string clojure.walk/keywordize-keys)))

(defrecord Roam []
  protocol/External
  (toMarkdownFiles [this content _config]
    (->files content)))

(comment
  (defonce test-roam-json (frontend.db/get-file "same.json"))
  (defonce edn-data (bean/->clj (js/JSON.parse test-roam-json))))
