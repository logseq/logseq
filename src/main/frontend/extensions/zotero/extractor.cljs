(ns frontend.extensions.zotero.extractor
  (:require [clojure.string :as str]
            [frontend.util :as util]
            [frontend.extensions.zotero.schema :as schema]
            [frontend.extensions.html-parser :as html-parser]
            [frontend.date :as date]
            [clojure.string :as string]
            [clojure.set :refer [rename-keys]]
            [frontend.extensions.zotero.setting :as setting]
            [frontend.extensions.zotero.api :as api]))

(defn item-type [item] (-> item :data :item-type))

(defmulti extract item-type)

(defn citation-key [item]
  (let [extra (-> item :data :extra)
        citation (->> extra
                      (str/split-lines)
                      (filterv (fn [s] (str/includes? s "Citation Key: ")))
                      first)]
    (when citation
      (str/trim (str/replace citation "Citation Key: " "")))))

(defn title [item] (-> item :data :title))

(defn item-key [item] (:key item))

(defn page-name [item]
  (let [page-title
        (case (item-type item)
          "journalArticle"
          (let [citation-key (citation-key item)
                title        (title item)]
            (or citation-key title))
          "case"
          (-> item :data :case-name)
          "email"
          (-> item :data :subject)
          "statute"
          (-> item :data :name-of-act)
          ;; default use title
          (title item))]
    (str (setting/setting :page-insert-prefix) page-title "_" (item-key item))))

(defn authors [item]
  (let [creators (-> item :data :creators)
        authors
        (into []
              (comp
               (filter (fn [m] (= "author" (:creator-type m))))
               (map (fn [{:keys [first-name last-name name]}]
                      (string/trim (if name name (str first-name " " last-name))))))
              creators)]
    (distinct authors)))

(defn tags [item]
  (let [tags
        (->> (-> item :data :tags)
             (mapv (fn [{:keys [tag]}] (string/trim tag)))
             (mapcat #(string/split % #",\s?")))]
    (distinct tags)))

(defn date->journal [item]
  (if-let [date (-> item :meta :parsed-date
                      (date/journal-name-s))]
    (util/format "[[%s]]" date)
    (-> item :data :date)))

(defn wrap-in-doublequotes [m]
  (->> m
       (map (fn [[k v]]
              (if (str/includes? (str v) ",")
                [k (pr-str v)]
                [k v])))
       (into (array-map))))

(defn skip-newline-properties [m]
  (->> m
       (remove (fn [[_ v]] (str/includes? (str v) "\n")))
       (into (array-map))))

(defn markdown-link [label link]
  (util/format "[%s](%s)" label link))

(defn local-link [item]
  (let [type (-> item :library :type)
        id   (-> item :library :id)
        library
        (if (= type "user")
          "library"
          (str "groups/" id))
        item-key (-> item :key)]
    (util/format "zotero://select/%s/items/%s" library item-key)))

(defn web-link [item]
  (let [type (-> item :library :type)
        id   (-> item :library :id)
        library
        (if (= type "user")
          (str "users/" id)
          (str "groups/" id))
        item-key (-> item :key)]
    (util/format "https://www.zotero.org/%s/items/%s" library item-key)))

(defn zotero-links [item]
  (str (markdown-link "Local library" (local-link item))
       ", "
       (markdown-link "Web library" (web-link item))))

(defn properties [item]
  (let [type    (item-type item)
        fields  (schema/fields type)
        authors (authors item)
        tags    (tags item)
        links   (zotero-links item)
        date    (date->journal item)
        data    (-> item :data
                         (select-keys fields)
                         (skip-newline-properties)
                         (wrap-in-doublequotes)
                         (assoc :links links
                                :authors authors
                                :tags tags
                                :date date
                                :item-type (util/format "[[%s]]" type))
                         (dissoc :creators)
                         (rename-keys {:title :original-title})
                         (assoc :title (page-name item)))]
    (->> data
         (remove (comp (fn [v] (or (str/blank? v) (empty? v))) second))
         (into {}))))

(defmethod extract "note"
  [item]
  (let [note-html (-> item :data :note)]
    (html-parser/parse :markdown note-html)))

(defmethod extract "attachment"
  [item]
  (let [{:keys [title url link-mode path]} (-> item :data)]
    (case link-mode
      "imported_file"
      (markdown-link title (local-link item))
      "imported_url"
      (markdown-link title url)
      "linked_file"
      (markdown-link title (str "file://" path))
      "linked_url"
      (markdown-link title url)
      nil)))

(defmethod extract :default
  [item]
  (let [page-name  (page-name item)
        properties (properties item)]
    {:page-name  page-name
     :properties properties}))
