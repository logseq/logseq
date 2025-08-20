(ns logseq.cli.commands.export
  "Export command"
  (:require ["fs" :as fs]
            [cljs.pprint]
            [clojure.string :as string]
            [datascript.core :as d]
            [logseq.cli.common.export.text :as cli-export-text]
            [logseq.cli.common.export.common :as cli-export-common]
            [logseq.cli.common.file :as cli-common-file]
            [logseq.cli.common.zip :as cli-common-zip]
            [logseq.cli.util :as cli-util]
            [logseq.common.config :as common-config]
            [logseq.common.util :as common-util]
            [logseq.db.common.entity-plus :as entity-plus]
            [logseq.db.common.sqlite-cli :as sqlite-cli]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]))

(defn get-all-page->content
  [repo db options]
  ;; TODO: entity-plus or sqlite-util load faster?
  (let [filter-fn (if (entity-plus/db-based-graph? db)
                    (fn [ent]
                      (or (not (:logseq.property/built-in? ent))
                          (contains? sqlite-create-graph/built-in-pages-names (:block/title ent))))
                    (constantly true))]
    (->> (d/datoms db :avet :block/name)
         (map #(d/entity db (:e %)))
         (filter filter-fn)
         (map (fn [e]
                [(:block/title e)
                 (cli-common-file/block->content repo db (:block/uuid e) {} options)])))))

(defn <get-file-contents
  [repo db suffix]
  ;; TODO: p/let
  (let [page->content (get-all-page->content repo
                                             db
                                             ;; TODO: Indentation
                                             {:export-bullet-indentation "\t"})]
    (map (fn [[page-title content]]
           {:path (str page-title "." suffix)
            :content content
            :title page-title
            :format :markdown})
         page->content)))

(defn export-files-as-markdown
  "options see also `export-blocks-as-markdown`"
  [repo files options]
  (mapv
   (fn [{:keys [path title content]}]
     [(or path title) (cli-export-text/export-helper repo content :markdown options)])
   files))

(defn export-repo-as-markdown!
  [repo db]
  (let [files* (<get-file-contents repo db "md")]
    (when (seq files*)
      (let [files (binding [cli-export-common/*current-db* db
                            cli-export-common/*current-repo* repo
                            cli-export-common/*content-config* {:export-bullet-indentation "\t"}]
                    (export-files-as-markdown repo files* nil))
            repo' (string/replace repo common-config/db-version-prefix "")
            zip-file-name (str repo' "_markdown_" (quot (common-util/time-ms) 1000))]
        (prn :files files)
        (let [zip (cli-common-zip/make-zip zip-file-name files repo')]
          (-> (.generateNodeStream zip #js {:streamFiles true :type "nodebuffer"})
              (.pipe (fs/createWriteStream (str zip-file-name ".zip"))))
          (println "Exported graph to" (str zip-file-name ".zip")))))))

(defn export [{{:keys [graph]} :opts}]
  (if (fs/existsSync (cli-util/get-graph-dir graph))
    (let [conn (apply sqlite-cli/open-db! (cli-util/->open-db-args graph))]
      (export-repo-as-markdown! (str common-config/db-version-prefix graph) @conn))
    (cli-util/error "Graph" (pr-str graph) "does not exist")))