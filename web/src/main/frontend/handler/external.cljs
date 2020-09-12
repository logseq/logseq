(ns frontend.handler.external
  (:require [frontend.external :as external]
            [frontend.handler.file :as file-handler]
            [frontend.handler.notification :as notification]
            [frontend.state :as state]
            [frontend.date :as date]
            [frontend.config :as config]
            [clojure.string :as string]
            [frontend.db :as db]))

(defn index-files!
  [repo files error-files]
  (doseq [file files]
    (let [title (:title file)
          journal? (date/valid-journal-title? title)]
      (try
        (when-let [text (:text file)]
          (let [path (str (if journal?
                            config/default-journals-directory
                            config/default-pages-directory)
                          "/"
                          (if journal?
                            (date/journal-title->default title)
                            (string/replace title "/" "-"))
                          ".md")]
            (file-handler/alter-file repo path text {})
            (when journal?
              (let [page-name (string/lower-case title)]
                (db/transact! repo
                  [{:page/name page-name
                    :page/journal? true
                    :page/journal-day (date/journal-title->int title)}])))))
        (catch js/Error e
          (swap! error-files conj file))))))

;; TODO: compute the dependencies
;; TODO: Should it merge the roam daily notes with the month journals
(defn import-from-roam-json!
  [data]
  (when-let [repo (state/get-current-repo)]
    (let [files (external/to-markdown-files :roam data {})
          error-files (atom #{})]
      (index-files! repo files error-files)
      (when (seq @error-files)
        (index-files! repo @error-files (atom nil))))))
