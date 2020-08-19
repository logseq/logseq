(ns frontend.handler.external
  (:require [frontend.external :as external]
            [frontend.handler.file :as file-handler]
            [frontend.handler.notification :as notification]
            [frontend.state :as state]
            [clojure.string :as string]))

(defn import-from-roam-json!
  [data]
  (when-let [repo (state/get-current-repo)]
    (let [files (external/to-markdown-files :roam data {})]
     (doseq [file files]
       (try
         (when-let [text (:text file)]
           (let [path (str "pages/" (string/replace (:title file) "/" "-") ".md")]
             (file-handler/alter-file repo path text {})))
         (catch js/Error e
           (let [message (str "File " (:title file) " imported failed.")]
             (println message)
             (js/console.error e)
             (notification/show! message :error))))))))
