(ns frontend.handler.metadata
  (:require [cljs.pprint]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.fs :as fs]
            [frontend.handler.common :as common-handler]
            [frontend.handler.file :as file-handler]
            [promesa.core :as p]))

(defn set-pages-metadata!
  [repo]
  (let [path (config/get-pages-metadata-path repo)
        all-pages (->> (db/get-all-pages repo)
                       (common-handler/fix-pages-timestamps)
                       (map #(select-keys % [:block/name :block/created-at :block/updated-at]))
                       (sort-by :block/name)
                       (vec))]
    (p/let [_ (-> (file-handler/create-pages-metadata-file repo)
                  (p/catch (fn [] nil)))]
      (let [new-content (with-out-str (cljs.pprint/pprint all-pages))]
        (fs/write-file! repo
                        (config/get-repo-dir repo)
                        path
                        new-content
                        {})))))
