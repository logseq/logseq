(ns ^:node-only logseq.publishing.export
  "This electron only ns (for the main process) exports files from multiple
  locations to provide a complete publishing app"
  (:require ["fs-extra" :as fse]
            ["path" :as node-path]
            ["fs" :as fs]
            [promesa.core :as p]))

(def ^:api js-files
  "js files from publishing release build"
  ["main.js" "code-editor.js" "excalidraw.js" "tldraw.js"])

(def ^:api static-dirs
  "dirs under static dir to copy over"
  ["css" "fonts" "icons" "img" "js"])

(defn- default-notification
  [msg]
  (if (= (:type msg) "success")
    (js/console.log (:payload msg))
    (js/console.error (:payload msg))))

(defn- cleanup-js-dir
  "Moves used js files to the correct dir and removes unused js files"
  [output-static-dir source-static-dir {:keys [dev?]}]
  (let [publishing-dir (node-path/join output-static-dir "js" "publishing")]
    (p/let [_ (p/all (map (fn [file]
                            (fs/rmSync (node-path/join output-static-dir "js" file) #js {:force true}))
                          js-files))
            _ (when dev?
                (fse/remove (node-path/join output-static-dir "js" "cljs-runtime")))
            _ (p/all (map (fn [file]
                            (if dev?
                              (fs/symlinkSync
                               (node-path/join source-static-dir "js" "publishing" file)
                               (node-path/join output-static-dir "js" file))
                              (fs/renameSync
                               (node-path/join publishing-dir file)
                               (node-path/join output-static-dir "js" file))))
                          js-files))
            _ (when dev?
                (fs/symlinkSync (node-path/join source-static-dir "js" "publishing" "cljs-runtime")
                                (node-path/join output-static-dir "js" "cljs-runtime")))
            ;; remove publishing-dir
            _ (when-not dev? (fse/remove publishing-dir))
            ;; remove source map files
            _ (p/all (map (fn [file]
                            (fs/rmSync (node-path/join output-static-dir "js" (str file ".map")) #js {:force true}))
                          ["main.js" "code-editor.js" "excalidraw.js"]))])))

(defn- copy-static-files-and-assets
  [static-dir repo-path output-dir {:keys [log-error-fn asset-filenames]
                                    :or {asset-filenames []
                                         log-error-fn js/console.error}}]
  (let [assets-from-dir (node-path/join repo-path "assets")
        assets-to-dir (node-path/join output-dir "assets")
        output-static-dir (node-path/join output-dir "static")]
    (p/let [_ (fs/mkdirSync assets-to-dir #js {:recursive true})
            _ (p/all (concat
                      [(fse/copy (node-path/join static-dir "404.html") (node-path/join output-dir "404.html"))]

                      (map
                       (fn [filename]
                         (-> (fse/copy (node-path/join assets-from-dir filename) (node-path/join assets-to-dir filename))
                             (p/catch
                              (fn [e]
                                (log-error-fn "Failed to copy"
                                              (str {:from (node-path/join assets-from-dir filename)
                                                    :to (node-path/join assets-to-dir filename)})
                                              e)))))
                       asset-filenames)

                      (map
                       (fn [part]
                         (fse/copy (node-path/join static-dir part) (node-path/join output-static-dir part)))
                       static-dirs)))])))

(defn create-export
  "Given a graph's directory, the generated html and the directory containing
  html/static assets, creates the export at the specified output-dir and
  includes the index.html with supporting assets"
  [html static-dir repo-path output-dir {:keys [notification-fn]
                                         :or {notification-fn default-notification}
                                         :as options}]
  (let [custom-css-path (node-path/join repo-path "logseq" "custom.css")
        export-css-path (node-path/join repo-path "logseq" "export.css")
        custom-js-path (node-path/join repo-path "logseq" "custom.js")
        output-static-dir (node-path/join output-dir "static")
        index-html-path (node-path/join output-dir "index.html")]
    (-> (p/let [_ (fs/mkdirSync output-static-dir #js {:recursive true})
                _ (fs/writeFileSync index-html-path html)
                _ (copy-static-files-and-assets static-dir repo-path output-dir options)
                export-css (if (fs/existsSync export-css-path) (str (fs/readFileSync export-css-path)) "")
                _ (fs/writeFileSync (node-path/join output-static-dir "css" "export.css")  export-css)
                custom-css (if (fs/existsSync custom-css-path) (str (fs/readFileSync custom-css-path)) "")
                _ (fs/writeFileSync (node-path/join output-static-dir "css" "custom.css") custom-css)
                custom-js (if (fs/existsSync custom-js-path) (str (fs/readFileSync custom-js-path)) "")
                _ (fs/writeFileSync (node-path/join output-static-dir "js" "custom.js") custom-js)
                _ (cleanup-js-dir output-static-dir static-dir options)]
               (notification-fn {:type "success"
                                 :payload (str "Export public pages and publish assets to " output-dir " successfully 🎉")}))
        (p/catch (fn [error]
                   (notification-fn {:type "error"
                                     :payload (str "Export public pages unexpectedly failed with: " error)}))))))
