(ns frontend.handler.export
  (:require [frontend.state :as state]
            [frontend.db :as db]
            [frontend.util :as util]
            [cljs-bean.core :as bean]
            [clojure.string :as string]
            [goog.dom :as gdom]
            [frontend.publishing.html :as html]
            [frontend.text :as text]
            [frontend.handler.common :as common-handler]
            [frontend.extensions.zip :as zip]
            [promesa.core :as p]))

(defn copy-block!
  [block-id]
  (when-let [block (db/pull [:block/uuid block-id])]
    (let [content (:block/content block)]
      (common-handler/copy-to-clipboard-without-id-property! content))))

(defn copy-block-as-json!
  [block-id]
  (when-let [repo (state/get-current-repo)]
    (let [block-children (db/get-block-and-children repo block-id)]
      (util/copy-to-clipboard! (js/JSON.stringify (bean/->js block-children))))))

(defn copy-page-as-json!
  [page-name]
  (when-let [repo (state/get-current-repo)]
    (let [properties (db/get-page-properties page-name)
          blocks (db/get-page-blocks repo page-name)]
      (util/copy-to-clipboard!
       (js/JSON.stringify
        (bean/->js
         {:properties properties
          :blocks blocks}))))))

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
      (let [data (js/Blob. ["\ufeff" (array content)] ; prepend BOM
                           (clj->js {:type "text/plain;charset=utf-8,"}))]
        (let [anchor (gdom/getElement "download")
              url (js/window.URL.createObjectURL data)]
          (.setAttribute anchor "href" url)
          (.setAttribute anchor "download" file-path)
          (.click anchor))))))

(defn export-repo-as-html!
  [repo]
  (when-let [db (db/get-conn repo)]
    (let [db           (if (state/all-pages-public?)
                         (db/clean-export! db)
                         (db/filter-only-public-pages-and-blocks db))
          db-str       (db/db->string db)
          state        (select-keys @state/state
                                    [:ui/theme :ui/cycle-collapse
                                     :ui/collapsed-blocks
                                     :ui/sidebar-collapsed-blocks
                                     :ui/show-recent?
                                     :config])
          state        (update state :config (fn [config]
                                               {"local" (get config repo)}))
          raw-html-str (html/publishing-html db-str (pr-str state))
          html-str     (str "data:text/html;charset=UTF-8,"
                            (js/encodeURIComponent raw-html-str))]
      (if (util/electron?)
        (js/window.apis.exportPublishAssets raw-html-str)
        (when-let [anchor (gdom/getElement "download-as-html")]
          (.setAttribute anchor "href" html-str)
          (.setAttribute anchor "download" "index.html")
          (.click anchor))))))

(defn export-repo-as-zip!
  [repo]
  (let [files (db/get-file-contents repo)
        [owner repo-name] (util/get-git-owner-and-repo repo)
        repo-name (str owner "-" repo-name)]
    (when (seq files)
      (p/let [zipfile (zip/make-zip repo-name files)]
        (when-let [anchor (gdom/getElement "download-as-zip")]
          (.setAttribute anchor "href" (js/window.URL.createObjectURL zipfile))
          (.setAttribute anchor "download" (.-name zipfile))
          (.click anchor))))))
