(ns logseq.publish-spa
  (:require [promesa.core :as p]
            ["path" :as path]
            ["fs-extra$default" :as fs]
            [datascript.transit :as dt]
            [logseq.graph-parser.cli :as gp-cli]
            [logseq.publish-spa.html :as html]))

(defn- handle-export-publish-assets
  [html custom-css-path export-css-path repo-path asset-filenames output-path]
  (let [app-path "../../static"
        root-dir output-path
        static-dir (path/join root-dir "static")
        assets-from-dir (path/join repo-path "assets")
        assets-to-dir (path/join root-dir "assets")
        index-html-path (path/join root-dir "index.html")]
    (p/let [_ (. fs ensureDir static-dir)
            _ (. fs ensureDir assets-to-dir)
            _ (p/all (concat
                      [(. fs writeFile index-html-path html)


                       (. fs copy (path/join app-path "404.html") (path/join root-dir "404.html"))]

                      (map
                       (fn [filename]
                         (-> (. fs copy (path/join assets-from-dir filename) (path/join assets-to-dir filename))
                             (p/catch
                              (fn [e]
                                ;; TODO: Make into a callback
                                (println "Failed to copy"
                                         (str {:from (path/join assets-from-dir filename)
                                               :to (path/join assets-to-dir filename)})
                                         e)))))
                       asset-filenames)

                      (map
                       (fn [part]
                         (. fs copy (path/join app-path part) (path/join static-dir part)))
                       ["css" "fonts" "icons" "img" "js"])))
            export-css (if (fs/existsSync export-css-path) (. fs readFile export-css-path) "")
            _ (. fs writeFile (path/join static-dir "css" "export.css")  export-css)
            custom-css (if (fs/existsSync custom-css-path) (. fs readFile custom-css-path) "")
            _ (. fs writeFile (path/join static-dir "css" "custom.css") custom-css)
            js-files ["main.js" "code-editor.js" "excalidraw.js" "tldraw.js"]
            _ (p/all (map (fn [file]
                            (. fs removeSync (path/join static-dir "js" file)))
                          js-files))
            _ (p/all (map (fn [file]
                            (. fs moveSync
                              (path/join static-dir "js" "publishing" file)
                              (path/join static-dir "js" file)))
                          js-files))
            _ (. fs removeSync (path/join static-dir "js" "publishing"))
            ;; remove source map files
            ;; TODO: ugly, replace with ls-files and filter with ".map"
            _ (p/all (map (fn [file]
                            (. fs removeSync (path/join static-dir "js" (str file ".map"))))
                          ["main.js" "code-editor.js" "excalidraw.js"]))]

           ;; TODO: Make into a callback
           (println
            :notification
            {:type "success"
             :payload (str "Export public pages and publish assets to " root-dir " successfully 🎉")}))))

(defn- get-app-state
  []
  {:ui/theme "dark", :ui/sidebar-collapsed-blocks {}, :ui/show-recent? false
   :config {"local" {:feature/enable-whiteboards? true, :shortcuts {:editor/right ["mod+l" "right"], :ui/toggle-theme "t z"}, :ignored-page-references-keywords #{:description :desc}, :repo/dir-version 3, :default-templates {:journals ""}, :macros {"poem" "Rose is $1, violet's $2. Life's ordered: Org assists you."}, :shortcut/doc-mode-enter-for-new-block? false, :favorites ["foob"], :ui/show-empty-bullets? false, :preferred-file-format :edn, :preferred-workflow :now, :publishing/all-pages-public? true, :ref/default-open-blocks-level 2, :feature/enable-block-timestamps? false, :ref/linked-references-collapsed-threshold 50, :commands [], :meta/version 1, :hidden [], :default-queries {:journals '[{:title "🔨 NOW", :query [:find (pull ?h [*]) :in $ ?start ?today :where [?h :block/marker ?marker] [(contains? #{"NOW" "DOING"} ?marker)] [?h :block/page ?p] [?p :block/journal? true] [?p :block/journal-day ?d] [(>= ?d ?start)] [(<= ?d ?today)]], :inputs [:14d :today], :result-transform (fn [result] (sort-by (fn [h] (get h :block/priority "Z")) result)), :collapsed? false} {:title "📅 NEXT", :query [:find (pull ?h [*]) :in $ ?start ?next :where [?h :block/marker ?marker] [(contains? #{"NOW" "LATER" "TODO"} ?marker)] [?h :block/ref-pages ?p] [?p :block/journal? true] [?p :block/journal-day ?d] [(> ?d ?start)] [(< ?d ?next)]], :inputs [:today :7d-after], :collapsed? false}]}, :ui/enable-tooltip? true, :rich-property-values? false, :property/separated-by-commas #{:comma-prop}, :property-pages/excludelist #{:author}, :graph/settings {:journal? true, :excluded-pages? true, :orphan-pages? false, :builtin-pages? false}, :property-pages/enabled? true, :ui/show-command-doc? true, :preferred-format :markdown}}})

(defn- get-db [graph-dir]
  (let [{:keys [conn]} (gp-cli/parse-graph graph-dir {:verbose false})] @conn))

(defn -main
  [& args]
  (let [repo-path  (or (first args)
                       (throw (ex-info "GRAPH DIR required" {})))
        output-path (or (second args)
                        (throw (ex-info "OUT DIR required" {})))
        ; html "WOOHOO"
        db-str (dt/write-transit-str (get-db repo-path))
        html (html/publishing-html db-str (pr-str (get-app-state)))
        custom-css-path (path/join repo-path "logseq" "custom.css")
        export-css-path (path/join repo-path "logseq" "export.css")
        ;; TODO: Read from repo-path
        asset-filenames []]
    (handle-export-publish-assets html custom-css-path export-css-path repo-path asset-filenames output-path)))
