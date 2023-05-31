(ns frontend.fs.capacitor-fs
  "Implementation of fs protocol for mobile"
  (:require ["@capacitor/filesystem" :refer [Encoding Filesystem]]
            [cljs-bean.core :as bean]
            [clojure.string :as string]
            [goog.string :as gstring]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.fs.protocol :as protocol]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.util :as util]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]
            [rum.core :as rum]
            [logseq.common.path :as path]))

(when (mobile-util/native-ios?)
  (defn ios-ensure-documents!
    []
    (.ensureDocuments mobile-util/ios-file-container)))

(when (mobile-util/native-android?)
  (defn- android-check-permission []
    (p/let [permission (.checkPermissions Filesystem)
            permission (-> permission
                           bean/->clj
                           :publicStorage)]
      (when-not (= permission "granted")
        (p/do!
         (.requestPermissions Filesystem))))))

(defn- <dir-exists?
  [fpath]
  (p/catch (p/let [fpath (path/path-normalize fpath)
                   stat (.stat Filesystem (clj->js {:path fpath}))]
             (-> stat
                 bean/->clj
                 :type
                 (= "directory")))
           (fn [_error]
             false)))

(defn- <write-file-with-utf8
  [path content]
  (when-not (string/blank? path)
    (-> (p/chain (.writeFile Filesystem (clj->js {:path path
                                                  :data content
                                                  :encoding (.-UTF8 Encoding)
                                                  :recursive true}))
                 #(js->clj % :keywordize-keys true))
        (p/catch (fn [error]
                   (js/console.error "writeFile Error: " path ": " error)
                   nil)))))

(defn- <read-file-with-utf8
  [path]
  (when-not (string/blank? path)
    (-> (p/chain (.readFile Filesystem (clj->js {:path path
                                                 :encoding (.-UTF8 Encoding)}))
                 #(js->clj % :keywordize-keys true)
                 #(get % :data nil))
        (p/catch (fn [error]
                   (js/console.error "readFile Error: " path ": " error)
                   nil)))))

(defn- <readdir [path]
  (-> (p/chain (.readdir Filesystem (clj->js {:path path}))
              #(js->clj % :keywordize-keys true)
              :files)
      (p/catch (fn [error]
                 (js/console.error "readdir Error: " path ": " error)
                 nil))))

(defn- get-file-paths
  "get all file paths recursively"
  [path]
  (p/let [result (p/loop [result []
                          dirs [path]]
                   (if (empty? dirs)
                     result
                     (p/let [d (first dirs)
                             files (<readdir d)
                             files (->> files
                                        (remove (fn [{:keys [name  type]}]
                                                  (or (string/starts-with? name ".")
                                                      (and (= type "directory")
                                                           (or (= name "bak")
                                                               (= name "version-files")))))))
                             files-dir (->> files
                                            (filterv #(= (:type %) "directory"))
                                            (mapv :uri))
                             paths-result (->> files
                                               (filterv #(= (:type %) "file"))
                                               (mapv :uri))]
                       (p/recur (concat result paths-result)
                                (concat (rest dirs) files-dir)))))]
    result))

(defn- get-files
  "get all files recursively"
  [path]
  (p/let [result (p/loop [result []
                          dirs [path]]
                   (if (empty? dirs)
                     result
                     (p/let [d (first dirs)
                             files (<readdir d)
                             files (->> files
                                        (remove (fn [{:keys [name  type]}]
                                                  (or (string/starts-with? name ".")
                                                      (and (= type "directory")
                                                           (or (= name "bak")
                                                               (= name "version-files")))))))
                             files-dir (->> files
                                            (filterv #(= (:type %) "directory"))
                                            (mapv :uri))
                             files-result
                             (p/all
                              (->> files
                                   (filter #(= (:type %) "file"))
                                   (filter
                                    (fn [{:keys [uri]}]
                                      (some #(string/ends-with? uri %)
                                            [".md" ".markdown" ".org" ".edn" ".css"])))
                                   (mapv
                                    (fn [{:keys [uri] :as file-info}]
                                      (p/chain (<read-file-with-utf8 uri)
                                               #(assoc (dissoc file-info :uri)
                                                       :content %
                                                       :path uri))))))]
                       (p/recur (concat result files-result)
                                (concat (rest dirs) files-dir)))))]
    (js->clj result :keywordize-keys true)))

(defn- contents-matched?
  [disk-content db-content]
  (when (and (string? disk-content) (string? db-content))
    (p/resolved (= (string/trim disk-content) (string/trim db-content)))))

(def backup-dir "logseq/bak")
(def version-file-dir "logseq/version-files/local")

(defn- get-backup-dir
  [repo-dir path bak-dir ext]
  (let [relative-path (-> path
                          (string/replace (re-pattern (str "^" (gstring/regExpEscape repo-dir)))
                                          "")
                          (string/replace (re-pattern (str "(?i)" (gstring/regExpEscape (str "." ext)) "$"))
                                          ""))]
    (path/path-join repo-dir bak-dir relative-path)))

(defn- truncate-old-versioned-files!
  "reserve the latest 6 version files"
  [dir]
  (->
   (p/let [files (get-files dir)
           files (js->clj files :keywordize-keys true)
           old-versioned-files (drop 6 (reverse (sort-by :mtime files)))]
     (mapv (fn [file]
             (.deleteFile Filesystem (clj->js {:path (:path file)})))
           old-versioned-files))
   (p/catch (fn [_]))))

;; TODO: move this to FS protocol
(defn backup-file
  "backup CONTENT under DIR :backup-dir or :version-file-dir
  :backup-dir = `backup-dir`
  :version-file-dir = `version-file-dir`"
  [repo dir path content]
  {:pre [(contains? #{:backup-dir :version-file-dir} dir)]}
  (let [repo-dir (config/get-local-dir repo)
        ext (util/get-file-ext path)
        dir (case dir
              :backup-dir (get-backup-dir repo-dir path backup-dir ext)
              :version-file-dir (get-backup-dir repo-dir path version-file-dir ext))
        new-path (path/path-join dir (str (string/replace (.toISOString (js/Date.)) ":" "_") "." (mobile-util/platform) "." ext))]

    (<write-file-with-utf8 new-path content)
    (truncate-old-versioned-files! dir)))

(defn backup-file-handle-changed!
  [repo-dir file-path content]
  (let [divider-schema    "://"
        file-schema       (string/split file-path divider-schema)
        file-schema       (if (> (count file-schema) 1) (first file-schema) "")
        dir-schema?       (and (string? repo-dir)
                               (string/includes? repo-dir divider-schema))
        repo-dir          (if-not dir-schema?
                            (str file-schema divider-schema repo-dir) repo-dir)
        backup-root       (path/path-join repo-dir backup-dir)
        backup-dir-parent (util/node-path.dirname file-path)
        backup-dir-parent (string/replace backup-dir-parent repo-dir "")
        backup-dir-name (util/node-path.name file-path)
        file-extname (.extname util/node-path file-path)
        file-root (path/path-join backup-root backup-dir-parent backup-dir-name)
        file-path (path/path-join file-root
                                  (str (string/replace (.toISOString (js/Date.)) ":" "_") "." (mobile-util/platform) file-extname))]
    (<write-file-with-utf8 file-path content)
    (truncate-old-versioned-files! file-root)))

(defn- write-file-impl!
  [repo dir rpath content {:keys [ok-handler error-handler old-content skip-compare?]} stat]
  (let [fpath (path/path-join dir rpath)]
    (if (or (string/blank? repo) skip-compare?)
      (p/catch
       (p/let [result (<write-file-with-utf8 fpath content)]
         (when ok-handler
           (ok-handler repo fpath result)))
       (fn [error]
         (if error-handler
           (error-handler error)
           (log/error :write-file-failed error))))

    ;; Compare with disk content and backup if not equal
      (p/let [disk-content (if (not= stat :not-found)
                             (<read-file-with-utf8 fpath)
                             "")
              disk-content (or disk-content "")
              repo-dir (config/get-local-dir repo)
              ext (util/get-file-ext rpath)
              db-content (or old-content (db/get-file repo rpath) "")
              contents-matched? (contents-matched? disk-content db-content)]
        (cond
          (and
           (not= stat :not-found)   ; file on the disk was deleted
           (not contents-matched?)
           (not (contains? #{"excalidraw" "edn" "css"} ext))
           (not (string/includes? fpath "/.recycle/")))
          (p/let [disk-content disk-content]
            (state/pub-event! [:file/not-matched-from-disk rpath disk-content content]))

          :else
          (->
           (p/let [result (<write-file-with-utf8 fpath content)
                   mtime (-> (js->clj stat :keywordize-keys true)
                             :mtime)]
             (when-not contents-matched?
               (backup-file repo-dir :backup-dir fpath disk-content))
             (db/set-file-last-modified-at! repo rpath mtime)
             (db/set-file-content! repo rpath content)
             (when ok-handler
               (ok-handler repo fpath result))
             result)
           (p/catch (fn [error]
                      (if error-handler
                        (error-handler error)
                        (log/error :write-file-failed error))))))))))

(defn ios-force-include-private
  "iOS sometimes return paths without the private part."
  [path]
  (if (mobile-util/native-ios?)
    (cond
      (or (string/includes? path "///private/")
          ;; virtual matchine
          (string/starts-with? path "file:///Users/"))
      path

      (string/includes? path "///")
      (let [[prefix others] (string/split path "///")]
        (str prefix "///private/" others))

      :else
      path)
    path))

(defn- local-container-path?
  "Check whether `path' is logseq's container `localDocumentsPath' on iOS"
  [path localDocumentsPath]
  (string/includes? path localDocumentsPath))

(rum/defc instruction
  []
  [:div.instruction
   [:h1.title "Please choose a valid directory!"]
   [:p.leading-6 "Logseq app can only save or access your graphs stored in a specific directory with a "
    [:strong "Logseq icon"]
    " inside, located either in \"iCloud Drive\", \"On My iPhone\" or \"On My iPad\"."]
   [:p.leading-6 "Please watch the following short instruction video. "
    [:small.text-gray-500 "(may take few seconds to load...)"]]
   [:iframe
    {:src "https://www.loom.com/embed/dae612ae5fd94e508bd0acdf02efb888"
     :frame-border "0"
     :position "relative"
     :allow-full-screen "allowfullscreen"
     :webkit-allow-full-screen "webkitallowfullscreen"
     :height "100%"}]])

(defn- open-dir
  [dir]
  (p/let [_ (when (mobile-util/native-android?) (android-check-permission))
          {:keys [path localDocumentsPath]} (-> (.pickFolder mobile-util/folder-picker
                                                             (clj->js (when (and dir (mobile-util/native-ios?))
                                                                        {:path dir})))
                                                (p/then #(js->clj % :keywordize-keys true))
                                                (p/catch (fn [e]
                                                           (js/alert (str e))
                                                           nil))) ;; NOTE: If pick folder fails, let it crash
          _ (when (and (mobile-util/native-ios?)
                       (not (or (local-container-path? path localDocumentsPath)
                                (mobile-util/in-iCloud-container-path? path))))
              (state/pub-event! [:modal/show-instruction]))
          exists? (<dir-exists? path)
          _ (when-not exists?
             (p/rejected (str "Cannot access selected directory: " path)))
          _ (when (mobile-util/is-iCloud-container-path? path)
              (p/rejected (str "Please avoid accessing the top-level iCloud container path: " path)))
          path (if (mobile-util/native-ios?)
                 (ios-force-include-private path)
                 path)
          _ (js/console.log "Opening or Creating graph at directory: " path)
          files (get-files path)]
    {:path path
     :files (into [] files)}))

(defrecord ^:large-vars/cleanup-todo Capacitorfs []
  protocol/Fs
  (mkdir! [_this dir]
    (-> (<dir-exists? dir)
        (p/then (fn [exists?]
                  (if exists?
                    (p/resolved true)
                    (.mkdir Filesystem
                            (clj->js
                             {:path dir})))))
        (p/catch (fn [error]
                   (log/error :mkdir! {:path dir
                                       :error error})))))
  (mkdir-recur! [_this dir]
    (-> (<dir-exists? dir)
        (p/then (fn [exists?]
                  (if exists?
                    (p/resolved true)
                    (.mkdir Filesystem
                            (clj->js
                             {:path dir
                              :recursive true})))))
        (p/catch (fn [error]
                   (log/error :mkdir-recur! {:path dir
                                             :error error})))))
  (readdir [_this dir]                  ; recursive
    (let [dir (path/path-normalize dir)]
      (get-file-paths dir)))
  (unlink! [this repo fpath _opts]
    (p/let [repo-dir (config/get-local-dir repo)
            recycle-dir (path/path-join repo-dir config/app-name ".recycle") ;; logseq/.recycle
            ;; convert url to pure path
            file-name (-> (path/trim-dir-prefix repo-dir fpath)
                          (string/replace "/" "_"))
            new-path (path/path-join recycle-dir file-name)
            _ (protocol/mkdir-recur! this recycle-dir)]
      (protocol/rename! this repo fpath new-path)))
  (rmdir! [_this _dir]
    ;; Too dangerous!!! We'll never implement this.
    nil)
  (read-file [_this dir path _options]
    (let [fpath (path/path-join dir path)]
      (->
       (<read-file-with-utf8 fpath)
       (p/catch (fn [error]
                  (log/error :read-file-failed error))))))
  (write-file! [_this repo dir path content opts]
    (let [fpath (path/path-join dir path)]
      (p/let [stat (p/catch
                    (.stat Filesystem (clj->js {:path fpath}))
                    (fn [_e] :not-found))]
        ;; `path` is full-path
        (write-file-impl! repo dir path content opts stat))))
  (rename! [_this _repo old-fpath new-fpath]
    (-> (.rename Filesystem
                 (clj->js
                  {:from old-fpath
                   :to new-fpath}))
        (p/catch (fn [error]
                   (log/error :rename-file-failed error)))))
  (copy! [_this _repo old-path new-path]
    (-> (.copy Filesystem
               (clj->js
                {:from old-path
                 :to new-path}))
        (p/catch (fn [error]
                   (log/error :copy-file-failed error)))))
  (stat [_this fpath]
    (-> (p/chain (.stat Filesystem (clj->js {:path fpath}))
                 #(js->clj % :keywordize-keys true))
        (p/catch (fn [error]
                   (let [errstr (if error (.toString error) "")]
                     (when (string/includes? errstr "because you don’t have permission to view it")
                       (state/pub-event! [:notification/show
                                          {:content "No permission, please clear cache and re-open graph folder."
                                           :status :error}]))
                     (p/rejected error))))))
  (open-dir [_this dir]
    (open-dir dir))
  (get-files [_this dir]
    (get-files dir))
  (watch-dir! [_this dir _options]
    (p/do!
     (.unwatch mobile-util/fs-watcher)
     (.watch mobile-util/fs-watcher (clj->js {:path dir}))))
  (unwatch-dir! [_this _dir]
    (.unwatch mobile-util/fs-watcher)))
