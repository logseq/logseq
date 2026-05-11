(ns mobile.search
  "Mobile search"
  (:require [clojure.string :as string]
            [frontend.components.block.breadcrumb-model :as breadcrumb-model]
            [frontend.components.cmdk.core :as cmdk]
            [frontend.db :as db]
            [frontend.search :as search]
            [frontend.state :as state]
            [promesa.core :as p]))

(defn- search-blocks
  [input]
  (p/let [repo (state/get-current-repo)
          blocks (search/block-search repo input
                                      {:limit 100
                                       :built-in? true
                                       :enable-snippet? false})
          blocks (remove nil? blocks)
          blocks (search/fuzzy-search blocks input {:limit 100
                                                    :extract-fn :block/title})
          items (keep (fn [block]
                        (if (:page? block)
                          (assoc (cmdk/page-item repo block nil input) :page? true)
                          (cmdk/block-item repo block nil input))) blocks)]
    items))

(defn- block->page-name
  [block]
  (let [page (:block/page block)
        page-block (cond
                     (map? page) page
                     (uuid? page) (db/entity [:block/uuid page])
                     (number? page) (db/entity page)
                     :else nil)]
    (:block/title page-block)))

(defn- block->nearest-parent-text
  "Returns the text of the nearest non-page parent block, or nil."
  [block]
  (let [parent (:block/parent block)
        parent-entity (cond
                        (map? parent) parent
                        (number? parent) (db/entity parent)
                        :else nil)]
    (when (and parent-entity (not (:block/name parent-entity)))
      (:text (breadcrumb-model/block->breadcrumb-segment parent-entity)))))

(def ^:private native-subtitle-max-length 96)

(defn- build-native-subtitle
  "Builds a subtitle string of the form 'Page' or 'Page / Parent' for native search.
   Safely truncated to native-subtitle-max-length."
  [block]
  (let [page-name (block->page-name block)
        parent-text (block->nearest-parent-text block)
        subtitle (cond
                   (and (not (string/blank? page-name))
                        (not (string/blank? parent-text)))
                   (str page-name " / " parent-text)
                   (not (string/blank? page-name)) page-name
                   :else parent-text)]
    (when-not (string/blank? subtitle)
      (if (> (count subtitle) native-subtitle-max-length)
        (str (subs subtitle 0 native-subtitle-max-length) "…")
        subtitle))))

(defn safe-truncate [s]
  (if (<= (count s) 256)
    s
    (str (subs s 0 256) "…")))

(defn- native-search-result
  [item]
  (let [block (:source-block item)
        id (:block/uuid block)
        title (some-> block :block.temp/original-title string/trim)
        subtitle (build-native-subtitle block)]
    (when (and id (not (string/blank? title)))
      (let [short-title (when title (safe-truncate title))]
        {:id (str id)
         :title short-title
         :subtitle (when-not (:page? block)
                     (when-not (string/blank? subtitle)
                       subtitle))}))))

(defn search
  [input]
  (if (string/blank? input)
    (p/resolved [])
    (p/let [items (search-blocks input)]
      (some->> items
               (keep native-search-result)
               distinct
               vec))))
