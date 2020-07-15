(ns frontend.handler.page
  (:require [clojure.string :as string]
            [frontend.db :as db]
            [frontend.state :as state]
            [frontend.util :as util :refer-macros [profile]]
            [frontend.tools.html-export :as html-export]
            [frontend.config :as config]
            [frontend.handler :as handler]
            [frontend.handler.project :as project]
            [clojure.walk :as walk]))

(defn page-add-directives!
  [page-name directives]
  (when-let [directives-content (string/trim (db/get-page-directives-content page-name))]
    (let [page (db/entity [:page/name page-name])
          file (db/entity (:db/id (:page/file page)))
          file-path (:file/path file)
          file-content (db/get-file file-path)
          after-content (subs file-content (inc (count directives-content)))
          page-format (db/get-page-format page-name)
          new-directives-content (db/add-directives! page-format directives-content directives)
          full-content (str new-directives-content "\n\n" (string/trim after-content))]
      (handler/alter-file (state/get-current-repo)
                          file-path
                          full-content
                          {:reset? true
                           :re-render-root? true}))))

(defn page-remove-directive!
  [page-name k]
  (when-let [directives-content (string/trim (db/get-page-directives-content page-name))]
    (let [page (db/entity [:page/name page-name])
          file (db/entity (:db/id (:page/file page)))
          file-path (:file/path file)
          file-content (db/get-file file-path)
          after-content (subs file-content (count directives-content))
          page-format (db/get-page-format page-name)
          new-directives-content (let [lines (string/split-lines directives-content)
                                       prefix (case page-format
                                                :org (str "#+" (string/upper-case k) ": ")
                                                :markdown (str (string/lower-case k) ": ")
                                                "")
                                       exists? (atom false)
                                       lines (remove #(string/starts-with? % prefix) lines)]
                                   (string/join "\n" lines))
          full-content (str new-directives-content "\n\n" (string/trim after-content))]
      (handler/alter-file (state/get-current-repo)
                          file-path
                          full-content
                          {:reset? true
                           :re-render-root? true}))))

(defn published-success-handler
  [page-name]
  (fn [result]
    (let [permalink (:permalink result)]
      (page-add-directives! page-name {"permalink" permalink})
      (let [win (js/window.open (str
                                 config/website
                                 "/@"
                                 (:name (state/get-me))
                                 "/"
                                 permalink))]
        (.focus win)))))

(defn published-failed-handler
  [error]
  (handler/show-notification!
   "Publish failed, please give it another try."
   :error))

(defn get-plugins
  [headings]
  (let [plugins (atom {})
        add-plugin #(swap! plugins assoc % true)]
    (walk/postwalk
     (fn [x]
       (if (and (vector? x)
                (>= (count x) 2))
         (let [[type option] x]
           (case type
             "Src" (when (:language option)
                     (add-plugin "highlight"))
             "Export" (when (= option "latex")
                        (add-plugin "latex"))
             "Latex_Fragment" (add-plugin "latex")
             "Math" (add-plugin "latex")
             "Latex_Environment" (add-plugin "latex")
             nil)
           x)
         x))
     (map :heading/body headings))
    @plugins))

(defn publish-page-as-slide!
  ([page-name]
   (publish-page-as-slide! page-name (db/get-page-headings page-name)))
  ([page-name headings]
   (project/exists-or-create!
    (fn [project]
      (page-add-directives! page-name {"published" true
                                       "slide" true})
      (let [directives (db/get-page-directives page-name)
            plugins (get-plugins headings)
            data {:project project
                  :title page-name
                  :permalink (:permalink directives)
                  :html (html-export/export-page page-name headings handler/show-notification!)
                  :tags (:tags directives)
                  :settings (merge
                             (assoc directives
                                    :slide true
                                    :published true)
                             plugins)}]
        (util/post (str config/api "pages")
                   data
                   (published-success-handler page-name)
                   published-failed-handler))))))

(defn publish-page!
  [page-name]
  (project/exists-or-create!
   (fn [project]
     (let [directives (db/get-page-directives page-name)
           slide? (let [slide (:slide directives)]
                    (or (true? slide)
                        (= "true" slide)))
           headings (db/get-page-headings page-name)
           plugins (get-plugins headings)]
       (if slide?
         (publish-page-as-slide! page-name headings)
         (do
           (page-add-directives! page-name {"published" true})
           (let [data {:project project
                       :title page-name
                       :permalink (:permalink directives)
                       :html (html-export/export-page page-name headings handler/show-notification!)
                       :tags (:tags directives)
                       :settings (merge directives plugins)}]
             (util/post (str config/api "pages")
                        data
                        (published-success-handler page-name)
                        published-failed-handler))))))))

(defn unpublished-success-handler
  [page-name]
  (fn [result]
    (handler/show-notification!
     "Un-publish successfully!"
     :success)))

(defn unpublished-failed-handler
  [error]
  (handler/show-notification!
   "Un-publish failed, please give it another try."
   :error))

(defn unpublish-page!
  [page-name]
  (page-add-directives! page-name {"published" false})
  (let [directives (db/get-page-directives page-name)
        permalink (:permalink directives)]
    (if permalink
      (util/delete (str config/api "pages/" permalink)
                   (unpublished-success-handler page-name)
                   unpublished-failed-handler)
      (handler/show-notification!
       "Can't find the permalink of this page!"
       :error))))
