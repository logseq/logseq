(ns electron.plugin
  (:require [promesa.core :as p]
            [cljs-bean.core :as bean]
            ["semver" :as semver]
            ["os" :as os]
            ["fs-extra" :as fs]
            ["path" :as path]
            [clojure.string :as string]
            [electron.configs :as cfgs]
            [electron.utils :refer [*win fetch extract-zip] :as utils]))

(def *installing (atom nil))
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
            _   (js/console.debug "[Release Latest]" endpoint ": " res)
            res (bean/->clj res)
            asset (first (filter #(= "application/zip" (:content_type %)) (:assets res)))]
      (if (and (nil? asset) theme)
        (if-let [zipball (:zipball_url res)] zipball (api "zipball"))
        asset))

    (fn [^js e]
      (emit :lsp-installed {:status :error :payload e})
      (throw (js/Error. :release-network-issue)))))

(defn fetch-tag-release-asset
  [repo tag])

(defn download-asset-zip
  [{:keys [id]} url dot-extract-to]
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

            _ (do
                (fs/removeSync zip-extracted-path)
                (fs/removeSync frm-zip))]
      true)
    (fn [^js e]
      (emit :lsp-installed {:status :error :payload e})
      (throw e))))

(defn install!
  [item]
  (when-let [repo (and (not @*installing) (:repo item))]
    (js/console.debug "Installing:" repo)
    (-> (p/create
          (fn [resolve reject]
            (reset! *installing item)
            ;; get releases
            (-> (p/let [asset (fetch-latest-release-asset item)
                        _ (js/console.debug "[Asset] " asset)
                        dl-url (if-not (string? asset)
                                 (:browser_download_url asset) asset)
                        _ (when-not dl-url
                            (throw (js/Error. :release-asset-not-found)))
                        dest (.join path cfgs/dot-root "plugins" (:id item))
                        _ (download-asset-zip item dl-url dest)]

                  (emit :lsp-installed
                        {:status  :completed
                         :payload (assoc item :zip dl-url :dst dest)})

                  (resolve))
                (p/catch
                  (fn [^js e]
                    (emit :lsp-installed
                          {:status  :error
                           :payload (.toString e)}))
                  (resolve nil)))))
        (p/finally #(reset! *installing nil)))))

(defn uninstall!
  [id]
  (let [id (string/replace id #"^[.\/]+" "")
        plugin-path (.join path (utils/get-ls-dotdir-root) "plugins" id)
        settings-path (.join path (utils/get-ls-dotdir-root) "settings" (str id ".json"))]
    (when (fs/pathExistsSync plugin-path)
      (fs/removeSync plugin-path)
      (fs/removeSync settings-path))))
