(ns exporter.writer
    (:require ["fs-extra" :as fs]
              ["process" :as process]
              [promesa.core :as p]
              ["path" :as path]
              [frontend.config :as config]))


(defn export-publish-assets [html repo-path asset-filenames root-dir]
  (p/let [app-path "./static"
          asset-filenames (js->clj asset-filenames)]
    (when root-dir
      (let [static-dir (path/join root-dir "static")
            assets-from-dir (path/join repo-path "assets")
            assets-to-dir (path/join root-dir "assets")
            index-html-path (path/join root-dir "index.html")
            custom-css-path (path/join repo-path (str config/app-name "/" config/custom-css-file))
            export-css-path (path/join repo-path (str config/app-name "/" config/export-css-file))
            export-or-custom-css-path (if (fs/existsSync export-css-path) export-css-path custom-css-path)]
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
                                    (println (str "Failed to copy " (path/join assets-from-dir filename) " to " (path/join assets-to-dir filename)))
                                    (js/console.error e)))))
                           asset-filenames)

                          (map
                           (fn [part]
                             (. fs copy (path/join app-path part) (path/join static-dir part)))
                           ["css" "fonts" "icons" "img" "js"])))
                export-css (. fs readFile export-or-custom-css-path)
                _ (. fs writeFile (path/join static-dir "css" "export.css") export-css)
                js-files ["main.js" "code-editor.js" "excalidraw.js"]
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
                              ["main.js" "code-editor.js" "excalidraw.js" "age-encryption.js"]))]
          (println "Export complete")
          (. process exit 0))))))