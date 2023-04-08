(ns logseq.publish-spa.export
  (:require ["fs-extra$default" :as fs]
            ["path" :as path]
            [promesa.core :as p]))

(defn handle-export-publish-assets
  [html app-path custom-css-path export-css-path repo-path asset-filenames output-path]
  (let [root-dir output-path
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
