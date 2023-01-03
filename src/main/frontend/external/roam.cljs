(ns frontend.external.roam
  "Provides roam import by implementing the external protocol"
  (:require [cljs-bean.core :as bean]
            [frontend.external.protocol :as protocol]
            [frontend.date :as date]
            [clojure.walk :as walk]
            [clojure.string :as string]
            [goog.string :as gstring]
            [logseq.graph-parser.util.block-ref :as block-ref]
            [logseq.graph-parser.util :as gp-util]
            [logseq.graph-parser.text :as text]))

(defonce all-refed-uids (atom #{}))
(defonce uid->uuid (atom {}))

(defn reset-state!
  []
  (reset! all-refed-uids #{})
  (reset! uid->uuid {}))

;; DONE: 1. uid converted to a uuid
;; DONE: 2. merge pages with same names (case-sensitive)
;; DONE: 3. mldoc add support to roam research macros, or we can transform here.
;; DONE: 4. mldoc add support to nested links
;; DONE: 5. Roam attributes -> properties
;; TODO: 6. hiccup

(defonce uid-pattern #"\(\(([a-zA-Z0-9_\\-]{6,24})\)\)")
(defonce macro-pattern #"\{\{([^{}]+)\}\}")

(defn uid-transform
  [text]
  (string/replace text uid-pattern (fn [[_ uid]]
                                     (let [id (get @uid->uuid uid uid)]
                                       (block-ref/->block-ref id)))))

(defn macro-transform
  [text]
  (string/replace text macro-pattern (fn [[original text]]
                                       (let [[name arg] (gp-util/split-first ":" text)]
                                         (if name
                                           (let [name (text/page-ref-un-brackets! name)]
                                             (gstring/format "{{%s %s}}" name arg))
                                           original)))))

(defn- fenced-code-transform
  [text]
  (string/replace text #"```" "\n```"))

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
        (swap! uid->uuid assoc uid (random-uuid))))))

(defn transform
  [text]
  (-> text
      (string/replace "{{[[TODO]]}}" "TODO")
      (string/replace "{{[[DONE]]}}" "DONE")
      (uid-transform)
      (macro-transform)
      (fenced-code-transform)))

(declare children->text)
(defn child->text
  [{:keys [uid string children]} level]
  (when-not (and (get @uid->uuid uid) uid)
    (swap! uid->uuid assoc uid (random-uuid)))
  (let [children-text (children->text children (inc level))
        level-pattern (str (apply str (repeat level "\t"))
                           (if (zero? level)
                             "-"
                             " -"))
        properties (when (contains? @all-refed-uids uid)
                     (str
                      (gstring/format "id:: %s"
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

(defn json->edn
  [raw-string]
  (-> raw-string js/JSON.parse bean/->clj))

(defn ->file
  [page-data]
  (let [{:keys [create-time title children edit-time]} page-data
        initial-level 1
        text (when (seq children)
               (when-let [text (children->text children (dec initial-level))]
                 (let [journal? (date/valid-journal-title? title)
                       front-matter (if journal?
                                      ""
                                      (gstring/format "---\ntitle: %s\n---\n\n" title))]
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

(defrecord Roam []
  protocol/External
  (toMarkdownFiles [_this content _config]
                   (-> content json->edn ->files)))

(comment
  (defonce test-roam-json (frontend.db/get-file "same.json"))
  (defonce edn-data (bean/->clj (js/JSON.parse test-roam-json))))
