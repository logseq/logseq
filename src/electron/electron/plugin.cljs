(ns electron.plugin
  (:require [promesa.core :as p]
            [cljs-bean.core :as bean]
            ["semver" :as semver]
            ["os" :as os]
            ["fs-extra" :as fs]
            ["path" :as path]
            [clojure.string :as string]
            [electron.utils :refer [logger]]
            [electron.configs :as cfgs]
            [electron.utils :refer [*win fetch extract-zip] :as utils]))

;; update & install
(def *installing-or-updating (atom nil))
(def debug (fn [& args] (apply (.-info logger) (conj args "[Marketplace]"))))
(def emit (fn [type payload]
            (.. ^js @*win -webContents
                (send (name type) (bean/->js payload)))))

;; Get a release by tag name: /repos/{owner}/{repo}/releases/tags/{tag}
;; Get the latest release: /repos/{owner}/{repo}/releases/latest
;; Zipball https://api.github.com/repos/{owner}/{repo}/zipball

(defn fetch-latest-release-asset
  [{:keys [repo theme]}]
  (p/catch
    (p/let [api #(str "https://api.github.com/repos/" repo "/" %)
            endpoint (api "releases/latest")
            ^js res (fetch endpoint)
            res (.json res)
            _ (js/console.debug "[Release Latest] " endpoint)
            res (bean/->clj res)
            version (:tag_name res)
            asset (first (filter #(string/ends-with? (:name %) ".zip") (:assets res)))]

      [(if (and (nil? asset) theme)
         (if-let [zipball (:zipball_url res)]
           zipball
           (api "zipball"))
         asset)
       version])

    (fn [^js e]
      (emit :lsp-installed {:status :error :payload e})
      (throw (js/Error. :release-network-issue)))))

(defn fetch-tag-release-asset
  [repo tag])

(defn download-asset-zip
  [{:keys [id repo title author description effect]} url dot-extract-to]
  (p/catch
    (p/let [^js res (fetch url)
            _ (if-not (.-ok res) (throw (js/Error. :download-network-issue)))
            frm-zip (p/create
                      (fn [resolve1 reject1]
                        (let [headers (. res -headers)
                              body (.-body res)
                              total-size (js/parseInt (.get headers "content-length"))
                              start-at (.now js/Date)
                              *downloaded (atom 0)
                              dest-basename (path/basename url)
                              dest-basename (if-not (string/ends-with? dest-basename ".zip")
                                              (str id "_" dest-basename ".zip") dest-basename)
                              tmp-dest-file (path/join (os/tmpdir) (str dest-basename ".pending"))
                              dest-file (.createWriteStream fs tmp-dest-file)]
                          (doto body
                            (.on "data" (fn [chunk]
                                          (let [downloaded (+ @*downloaded (.-length chunk))]
                                            (.write dest-file chunk)
                                            (reset! *downloaded downloaded))))
                            (.on "error" (fn [^js e]
                                           (reject1 e)))
                            (.on "end" (fn [^js e]
                                         (.close dest-file)
                                         (let [dest-file (string/replace tmp-dest-file ".pending" "")]
                                           (fs/renameSync tmp-dest-file dest-file)
                                           (resolve1 dest-file))))))))
            ;; sync extract
            zip-extracted-path (string/replace frm-zip ".zip" "")

            _ (extract-zip frm-zip (bean/->js
                                     {:dir zip-extracted-path}))

            tmp-extracted-root (let [dirs (fs/readdirSync zip-extracted-path)
                                     pkg? (fn [root]
                                            (when-let [^js stat (fs/statSync root)]
                                              (when (.isDirectory stat)
                                                (fs/pathExistsSync (.join path root "package.json")))))]
                                 (if (pkg? zip-extracted-path)
                                   "."
                                   (last (take-while #(pkg? (.join path zip-extracted-path %)) dirs))))

            _ (if-not tmp-extracted-root
                (throw (js/Error. :invalid-plugin-package)))

            tmp-extracted-root (.join path zip-extracted-path tmp-extracted-root)

            _ (and (fs/existsSync dot-extract-to)
                   (fs/removeSync dot-extract-to))

            _ (fs/moveSync tmp-extracted-root dot-extract-to)

            _ (let [src (.join path dot-extract-to "package.json")
                    ^js pkg (fs/readJsonSync src)]
                (set! (.-repo pkg) repo)
                (set! (.-title pkg) title)
                (set! (.-author pkg) author)
                (set! (.-description pkg) description)
                (set! (.-effect pkg) (boolean effect))
                (fs/writeJsonSync src pkg))

            _ (do
                (fs/removeSync zip-extracted-path)
                (fs/removeSync frm-zip))]
      true)
    (fn [^js e]
      (emit :lsp-installed {:status :error :payload e})
      (throw e))))

(defn install-or-update!
  [{:keys [version repo] :as item}]
  (when (and (not @*installing-or-updating) repo)
    (let [updating? (and version (. semver valid version))]

      (js/console.debug (if updating? "Updating:" "Installing:") repo)

      (-> (p/create
            (fn [resolve reject]
              (reset! *installing-or-updating item)
              ;; get releases
              (-> (p/let [[asset latest-version] (fetch-latest-release-asset item)

                          _ (debug "[Release Asset] #" latest-version " =>" (:url asset))

                          ;; compare latest version
                          _ (when (and updating? latest-version
                                       (. semver valid latest-version))

                              (debug "[Updating Latest?] " version " > " latest-version)

                              (if (. semver lt version latest-version)
                                (debug "[Updating Latest] " latest-version)
                                (throw (js/Error. :no-new-version))))

                          dl-url (if-not (string? asset)
                                   (:browser_download_url asset) asset)

                          _ (when-not dl-url
                              (throw (js/Error. :release-asset-not-found)))

                          dest (.join path cfgs/dot-root "plugins" (:id item))
                          _ (download-asset-zip item dl-url dest)
                          _ (debug "[Updated DONE] " latest-version)]

                    (emit :lsp-installed
                          {:status  :completed
                           :payload (assoc item :zip dl-url :dst dest)})

                    (resolve))
                  (p/catch
                    (fn [^js e]
                      (emit :lsp-installed
                            {:status  :error
                             :payload (.-message e)}))
                    (resolve nil)))))

          (p/finally #(reset! *installing-or-updating nil))))))

(defn uninstall!
  [id]
  (let [id (string/replace id #"^[.\/]+" "")
        plugin-path (.join path (utils/get-ls-dotdir-root) "plugins" id)
        settings-path (.join path (utils/get-ls-dotdir-root) "settings" (str id ".json"))]
    (when (fs/pathExistsSync plugin-path)
      (fs/removeSync plugin-path)
      (fs/removeSync settings-path))))
