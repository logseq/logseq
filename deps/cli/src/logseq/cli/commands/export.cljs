(ns logseq.cli.commands.export
  "Export MD command"
  (:require ["fs" :as fs]
            [cljs.pprint]
            [clojure.string :as string]
            [datascript.core :as d]
            [logseq.cli.common.export.common :as cli-export-common]
            [logseq.cli.common.export.text :as cli-export-text]
            [logseq.cli.common.file :as common-file]
            [logseq.cli.common.util :as cli-common-util]
            [logseq.cli.util :as cli-util]
            [logseq.common.config :as common-config]
            [logseq.common.util :as common-util]
            [logseq.db.common.sqlite-cli :as sqlite-cli]))

(defn- get-content-config [db]
  (let [repo-config (-> (d/q '[:find ?content
                               :where [?b :file/path "logseq/config.edn"] [?b :file/content ?content]]
                             db)
                        ffirst
                        common-util/safe-read-map-string)
        indent
        ;; Copy of state/get-export-bullet-indentation
        (case (get repo-config :export/bullet-indentation :tab)
          :eight-spaces
          "        "
          :four-spaces
          "    "
          :two-spaces
          "  "
          :tab
          "\t")]
    {:export-bullet-indentation indent}))

(defn- get-file-contents
  "Modified version of export.common/<get-file-contents which doesn't have to deal with worker threads"
  [repo db content-config suffix]
  (let [page->content (common-file/get-all-page->content repo db content-config)]
    (map (fn [[page-title content]]
           {:path (str page-title "." suffix)
            :content content
            :title page-title
            :format :markdown})
         page->content)))

(defn- export-files-as-markdown
  "Modified version of handler.export.text/export-files-as-markdown for the CLI"
  [repo files options]
  (mapv
   (fn [{:keys [path title content]}]
     [(or path title) (cli-export-text/export-helper repo content :markdown options)])
   files))

(defn- export-repo-as-markdown!
  "Modified version of handler.export.text/export-repo-as-markdown for the CLI"
  [repo db {:keys [file]}]
  (let [content-config (get-content-config db)
        files* (get-file-contents repo db content-config "md")]
    (when (seq files*)
      (let [files (binding [cli-export-common/*current-db* db
                            cli-export-common/*current-repo* repo
                            cli-export-common/*content-config* content-config]
                    (export-files-as-markdown repo files* nil))
            repo' (string/replace repo common-config/db-version-prefix "")
            zip-file-name (if file
                            (string/replace-first file #"(?i)\.zip$" "")
                            (str repo' "_markdown_" (quot (common-util/time-ms) 1000)))
            file-name (or file (str zip-file-name ".zip"))
            zip (cli-common-util/make-export-zip zip-file-name files)
            ;; matches behavior in make-export-zip
            exported-files (remove #(string/blank? (second %)) files)]
        (-> (.generateNodeStream zip #js {:streamFiles true :type "nodebuffer"})
            (.pipe (fs/createWriteStream file-name)))
        (println "Exported" (count exported-files) "pages to" file-name)))))

(defn export [{{:keys [graph] :as opts} :opts}]
  (when-not graph
    (cli-util/error "Command missing required option 'graph'"))
  (if (fs/existsSync (cli-util/get-graph-path graph))
    (let [conn (apply sqlite-cli/open-db! (cli-util/->open-db-args graph))]
      (cli-util/ensure-db-graph-for-command @conn)
      (export-repo-as-markdown! (str common-config/db-version-prefix graph) @conn opts))
    (cli-util/error "Graph" (pr-str graph) "does not exist")))