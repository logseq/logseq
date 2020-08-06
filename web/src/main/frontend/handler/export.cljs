(ns frontend.handler.export
  (:require [frontend.state :as state]
            [frontend.db :as db]
            [frontend.util :as util]
            [cljs-bean.core :as bean]
            [clojure.string :as string]
            [goog.dom :as gdom]))

(defn copy-heading!
  [heading-id]
  (when-let [heading (db/pull [:heading/uuid heading-id])]
    (let [content (:heading/content heading)]
      (util/copy-to-clipboard! content))))

(defn copy-heading-as-json!
  [heading-id]
  (when-let [repo (state/get-current-repo)]
    (let [heading-children (db/get-heading-and-children repo heading-id)]
      (util/copy-to-clipboard! (js/JSON.stringify (bean/->js heading-children))))))

(defn copy-page-as-json!
  [page-name]
  (when-let [repo (state/get-current-repo)]
    (let [directives (db/get-page-directives page-name)
          headings (db/get-page-headings repo page-name)]
      (util/copy-to-clipboard!
       (js/JSON.stringify
        (bean/->js
         {:directives directives
          :headings headings}))))))

(defn export-repo-as-json!
  [repo]
  (when-let [db (db/get-conn repo)]
    (let [db-json (db/db->json db)
          data-str (str "data:text/json;charset=utf-8," (js/encodeURIComponent db-json))]
      (when-let [anchor (gdom/getElement "download-as-json")]
        (.setAttribute anchor "href" data-str)
        (.setAttribute anchor "download" (str (last (string/split repo #"/")) ".json"))
        (.click anchor)))))

(defn download-file!
  [file-path]
  (when-let [repo (state/get-current-repo)]
    (when-let [content (db/get-file repo file-path)]
      (let [data (js/Blob. (array content)
                           (clj->js {:type "text/plain"}))]
        (let [anchor (gdom/getElement "download")
              url (js/window.URL.createObjectURL data)]
          (.setAttribute anchor "href" url)
          (.setAttribute anchor "download" file-path)
          (.click anchor))))))
