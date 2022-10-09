(ns logseq.graph-parser.property
  "Core vars and util fns for properties"
  (:require [logseq.graph-parser.util :as gp-util]
            [clojure.string :as string]
            [clojure.set :as set]
            [goog.string :as gstring]
            [goog.string.format]))

(def colons "Property delimiter for markdown mode" "::")

(defn ->block-content
  "Creates a block content string from properties map"
  [properties]
  (->> properties
       (map #(str (name (key %)) (str colons " ") (val %)))
       (string/join "\n")))

(defn valid-property-name?
  [s]
  [:pre (string? s)]
  (and (gp-util/valid-edn-keyword? s)
       (not (re-find #"[\"|^|(|)|{|}]+" s))))

(defn properties-ast?
  [block]
  (and
   (vector? block)
   (contains? #{"Property_Drawer" "Properties"}
              (first block))))

(def markers
  #{"now" "later" "todo" "doing" "done" "wait" "waiting"
    "canceled" "cancelled" "started" "in-progress"})

;; Built-in properties are properties that logseq uses for its features. Most of
;; these properties are hidden from the user but a few like the editable ones
;; are visible for the user to edit.

(def built-in-extended-properties (atom #{}))
(defn register-built-in-properties
  [props]
  (reset! built-in-extended-properties (set/union @built-in-extended-properties props)))

(def editable-linkable-built-in-properties
  "Properties used by logseq that user can edit and that can have linkable property values"
  #{:alias :aliases :tags})

(defn editable-built-in-properties
  "Properties used by logseq that user can edit"
  []
  (into #{:title :icon :template :template-including-parent :public :filters :exclude-from-graph-view
          ;; org-mode only
          :macro :filetags}
        editable-linkable-built-in-properties))

(defn hidden-built-in-properties
  "Properties used by logseq that user can't edit or see"
  []
  (set/union
   #{:id :custom-id :background-color :background_color :heading :collapsed
     :created-at :updated-at :last-modified-at :created_at :last_modified_at
     :query-table :query-properties :query-sort-by :query-sort-desc :ls-type
     :hl-type :hl-page :hl-stamp :logseq.macro-name :logseq.macro-arguments
     :logseq.tldraw.page :logseq.tldraw.shape}
   (set (map keyword markers))
   @built-in-extended-properties))

(defonce properties-start ":PROPERTIES:")
(defonce properties-end ":END:")
(defonce properties-end-pattern
  (re-pattern (gstring/format "%s[\t\r ]*\n|(%s\\s*$)" properties-end properties-end)))

(defn contains-properties?
  [content]
  (when content
    (and (string/includes? content properties-start)
         (re-find properties-end-pattern content))))

(defn ->new-properties
  "New syntax: key:: value"
  [content]
  (if (contains-properties? content)
    (let [lines (string/split-lines content)
          start-idx (.indexOf lines properties-start)
          end-idx (.indexOf lines properties-end)]
      (if (and (>= start-idx 0) (> end-idx 0) (> end-idx start-idx))
        (let [before (subvec lines 0 start-idx)
              middle (->> (subvec lines (inc start-idx) end-idx)
                          (map (fn [text]
                                 (let [[k v] (gp-util/split-first ":" (subs text 1))]
                                   (if (and k v)
                                     (let [k (string/replace k "_" "-")
                                           compare-k (keyword (string/lower-case k))
                                           k (if (contains? #{:id :custom_id :custom-id} compare-k) "id" k)
                                           k (if (contains? #{:last-modified-at} compare-k) "updated-at" k)]
                                       (str k colons " " (string/trim v)))
                                     text)))))
              after (subvec lines (inc end-idx))
              lines (concat before middle after)]
          (string/join "\n" lines))
        content))
    content))
