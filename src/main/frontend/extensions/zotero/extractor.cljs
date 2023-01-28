(ns frontend.extensions.zotero.extractor
  (:require [clojure.set :refer [rename-keys]]
            [clojure.string :as string]
            [frontend.date :as date]
            [frontend.extensions.html-parser :as html-parser]
            [frontend.extensions.zotero.schema :as schema]
            [frontend.extensions.zotero.setting :as setting]
            [frontend.util :as util]
            [logseq.graph-parser.util.page-ref :as page-ref]))

(defn item-type [item] (-> item :data :item-type))

(defmulti extract item-type)

(defn citation-key [item]
  (let [extra (-> item :data :extra)
        citation (->> extra
                      (string/split-lines)
                      (filterv (fn [s] (string/includes? s "Citation Key: ")))
                      first)]
    (when citation
      (string/trim (string/replace citation "Citation Key: " "")))))

(defn title [item] (-> item :data :title))

(defn item-key [item] (:key item))

(defn page-name [item]
  (let [page-title
        (case (item-type item)
          "case"
          (-> item :data :case-name)
          "email"
          (-> item :data :subject)
          "statute"
          (-> item :data :name-of-act)
          ;; default use title
          (title item))
        citekey (citation-key item)]
    (if (and (setting/setting :prefer-citekey?)
             (not (string/blank? citekey)))
      (str (setting/setting :page-insert-prefix) citekey)
      (str (setting/setting :page-insert-prefix) page-title))))

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
             (mapcat #(string/split % #",\s?")))
        extra-tags (->> (string/split (setting/setting :extra-tags) #",")
                        (map string/trim)
                        (remove string/blank?))]
    (distinct (concat tags extra-tags))))

(defn date->journal [item]
  (if-let [date (-> item :meta :parsed-date
                    (date/journal-name-s))]
    (page-ref/->page-ref date)
    (-> item :data :date)))

(defn wrap-in-doublequotes [m]
  (->> m
       (map (fn [[k v]]
              (if (string/includes? (str v) ",")
                [k (pr-str v)]
                [k v])))
       (into (array-map))))

(defn skip-newline-properties [m]
  (->> m
       (remove (fn [[_ v]] (string/includes? (str v) "\n")))
       (into (array-map))))

(defn markdown-link
  ([label link]
   (markdown-link label link false))
  ([label link display?]
   (if display?
     (util/format "![%s](%s)" label link)
     (util/format "[%s](%s)" label link))))

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
                                :item-type (page-ref/->page-ref type))
                         (dissoc :creators :abstract-note)
                         (rename-keys {:title :original-title})
                         (assoc :title (page-name item)))]
    (->> data
         (remove (comp (fn [v] (or (string/blank? v) (empty? v))) second))
         (into {}))))

(defmethod extract "note"
  [item]
  (let [note-html (-> item :data :note)]
    (html-parser/convert :markdown note-html)))

(defn zotero-imported-file-macro [item-key filename]
  (util/format "{{zotero-imported-file %s, %s}}" item-key (pr-str filename)))

(defn zotero-linked-file-macro [path]
  (util/format "{{zotero-linked-file %s}}" (pr-str (string/replace-first path "attachments:" ""))))

(defmethod extract "attachment"
  [item]
  (let [{:keys [title url link-mode path filename]} (-> item :data)]
    (case link-mode
      "imported_file"
      (str
       (markdown-link title (local-link item))
       " "
       (zotero-imported-file-macro (item-key item) filename))
      "linked_file"
      (str
       (markdown-link title (local-link item))
       " "
       (zotero-linked-file-macro path))
      "imported_url"
      (str
       (markdown-link title url)
       " "
       (zotero-imported-file-macro (item-key item) filename))
      "linked_url"
      (markdown-link title url))))

(defmethod extract :default
  [item]
  (let [page-name  (page-name item)
        properties (properties item)
        abstract-note (-> item :data :abstract-note)]
    {:page-name  page-name
     :properties properties
     :abstract-note abstract-note}))
