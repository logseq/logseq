(ns frontend.fs.capacitor-fs
  "Implementation of fs protocol for mobile"
  (:require ["@capacitor/filesystem" :refer [Encoding Filesystem]]
            [cljs-bean.core :as bean]
            [clojure.string :as string]
            [goog.string :as gstring]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.encrypt :as encrypt]
            [frontend.fs.protocol :as protocol]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.util :as util]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]
            [rum.core :as rum]))

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

(defn- <stat [path]
  (-> (p/chain (.stat Filesystem (clj->js {:path path}))
               #(js->clj % :keywordize-keys true))
      (p/catch (fn [error]
                 (js/console.error "stat Error: " path ": " error)
                 nil))))

(defn readdir
  "readdir recursively"
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
                                               #(assoc file-info :content %))))))]
                       (p/recur (concat result files-result)
                                (concat (rest dirs) files-dir)))))]
    (js->clj result :keywordize-keys true)))

(defn- contents-matched?
  [disk-content db-content]
  (when (and (string? disk-content) (string? db-content))
    (if (encrypt/encrypted-db? (state/get-current-repo))
      (p/let [decrypted-content (encrypt/decrypt disk-content)]
        (= (string/trim decrypted-content) (string/trim db-content)))
      (p/resolved (= (string/trim disk-content) (string/trim db-content))))))

(def backup-dir "logseq/bak")
(defn- get-backup-dir
  [repo-dir path ext]
  (let [relative-path (-> path
                          (string/replace (re-pattern (str "^" (gstring/regExpEscape repo-dir)))
                                          "")
                          (string/replace (re-pattern (str "(?i)" (gstring/regExpEscape (str "." ext)) "$"))
                                          ""))]
    (util/safe-path-join repo-dir (str backup-dir "/" relative-path))))

(defn- truncate-old-versioned-files!
  "reserve the latest 6 version files"
  [dir]
  (p/let [files (readdir dir)
          files (js->clj files :keywordize-keys true)
          old-versioned-files (drop 6 (reverse (sort-by :mtime files)))]
    (mapv (fn [file]
            (.deleteFile Filesystem (clj->js {:path (:uri file)})))
          old-versioned-files)))

(defn backup-file
  [repo-dir path content ext]
  (let [backup-dir (get-backup-dir repo-dir path ext)
        new-path (str backup-dir "/" (string/replace (.toISOString (js/Date.)) ":" "_") "." ext)]
    (<write-file-with-utf8 new-path content)
    (truncate-old-versioned-files! backup-dir)))

(defn backup-file-handle-changed!
  [repo-dir file-path content]
  (let [divider-schema    "://"
        file-schema       (string/split file-path divider-schema)
        file-schema       (if (> (count file-schema) 1) (first file-schema) "")
        dir-schema?       (and (string? repo-dir)
                               (string/includes? repo-dir divider-schema))
        repo-dir          (if-not dir-schema?
                            (str file-schema divider-schema repo-dir) repo-dir)
        backup-root       (util/safe-path-join repo-dir backup-dir)
        backup-dir-parent (util/node-path.dirname file-path)
        backup-dir-parent (string/replace backup-dir-parent repo-dir "")
        backup-dir-name (util/node-path.name file-path)
        file-extname (.extname util/node-path file-path)
        file-root (util/safe-path-join backup-root backup-dir-parent backup-dir-name)
        file-path (util/safe-path-join file-root
                                       (str (string/replace (.toISOString (js/Date.)) ":" "_") "." (mobile-util/platform) file-extname))]
    (<write-file-with-utf8 file-path content)
    (truncate-old-versioned-files! file-root)))

(defn- write-file-impl!
  [_this repo _dir path content {:keys [ok-handler error-handler old-content skip-compare?]} stat]
  (if skip-compare?
    (p/catch
     (p/let [result (<write-file-with-utf8 path content)]
       (when ok-handler
         (ok-handler repo path result)))
     (fn [error]
       (if error-handler
         (error-handler error)
         (log/error :write-file-failed error))))

    ;; Compare with disk content and backup if not equal
    (p/let [disk-content (<read-file-with-utf8 path)
            disk-content (or disk-content "")
            repo-dir (config/get-local-dir repo)
            ext (util/get-file-ext path)
            db-content (or old-content (db/get-file repo path) "")
            contents-matched? (contents-matched? disk-content db-content)]
      (cond
        (and
         (not= stat :not-found)   ; file on the disk was deleted
         (not contents-matched?)
         (not (contains? #{"excalidraw" "edn" "css"} ext))
         (not (string/includes? path "/.recycle/")))
        (p/let [disk-content (encrypt/decrypt disk-content)]
          (state/pub-event! [:file/not-matched-from-disk path disk-content content]))

        :else
        (->
         (p/let [result (<write-file-with-utf8 path content)
                 mtime (-> (js->clj stat :keywordize-keys true)
                           :mtime)]
           (when-not contents-matched?
             (backup-file repo-dir path disk-content ext))
           (db/set-file-last-modified-at! repo path mtime)
           (p/let [content (if (encrypt/encrypted-db? (state/get-current-repo))
                             (encrypt/decrypt content)
                             content)]
             (db/set-file-content! repo path content))
           (when ok-handler
             (ok-handler repo path result))
           result)
         (p/catch (fn [error]
                    (if error-handler
                      (error-handler error)
                      (log/error :write-file-failed error)))))))))

(defn get-file-path [dir path]
  (let [dir (some-> dir (string/replace #"/+$" ""))
        dir (if (and (not-empty dir) (string/starts-with? dir "/"))
              (do
                (js/console.trace "WARN: detect absolute path, use URL instead")
                (str "file://" (js/encodeURI dir)))
              dir)
        path (some-> path (string/replace #"^/+" ""))]
    (cond (nil? path)
          dir

          (nil? dir)
          path

          (string/starts-with? path dir)
          path

          :else
          (str dir "/" path))))

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

(defrecord ^:large-vars/cleanup-todo Capacitorfs []
  protocol/Fs
  (mkdir! [_this dir]
    (-> (.mkdir Filesystem
                (clj->js
                 {:path dir}))
        (p/catch (fn [error]
                   (log/error :mkdir! {:path dir
                                       :error error})))))
  (mkdir-recur! [_this dir]
    (p/let
     [_ (-> (.mkdir Filesystem
                    (clj->js
                     {:path dir
                      :recursive true}))
            (p/catch (fn [error]
                       (log/error :mkdir-recur! {:path dir
                                                 :error error}))))
      stat (<stat dir)]
      (if (= (:type stat) "directory")
        (p/resolved true)
        (p/rejected (js/Error. "mkdir-recur! failed")))))
  (readdir [_this dir]                  ; recursive
    (let [dir (if-not (string/starts-with? dir "file://")
                (str "file://" dir)
                dir)]
      (readdir dir)))
  (unlink! [this repo path _opts]
    (p/let [path (get-file-path nil path)
            repo-url (config/get-local-dir repo)
            recycle-dir (util/safe-path-join repo-url config/app-name ".recycle") ;; logseq/.recycle
            ;; convert url to pure path
            file-name (-> (string/replace path repo-url "")
                          (string/replace "/" "_")
                          (string/replace "\\" "_"))
            new-path (str recycle-dir "/" file-name)
            _ (protocol/mkdir-recur! this recycle-dir)]
      (protocol/rename! this repo path new-path)))
  (rmdir! [_this _dir]
    ;; Too dangerous!!! We'll never implement this.
    nil)
  (read-file [_this dir path _options]
    (let [path (get-file-path dir path)]
      (->
       (<read-file-with-utf8 path)
       (p/catch (fn [error]
                  (log/error :read-file-failed error))))))
  (write-file! [this repo dir path content opts]
    (let [path (get-file-path dir path)]
      (p/let [stat (p/catch
                    (.stat Filesystem (clj->js {:path path}))
                    (fn [_e] :not-found))]
        ;; `path` is full-path
        (write-file-impl! this repo dir path content opts stat))))
  (rename! [_this _repo old-path new-path]
    (let [[old-path new-path] (map #(get-file-path "" %) [old-path new-path])]
      (p/catch
       (p/let [_ (.rename Filesystem
                          (clj->js
                           {:from old-path
                            :to new-path}))])
       (fn [error]
         (log/error :rename-file-failed error)))))
  (copy! [_this _repo old-path new-path]
    (let [[old-path new-path] (map #(get-file-path "" %) [old-path new-path])]
      (p/catch
       (p/let [_ (.copy Filesystem
                        (clj->js
                         {:from old-path
                          :to new-path}))])
       (fn [error]
         (log/error :copy-file-failed error)))))
  (stat [_this dir path]
    (let [path (get-file-path dir path)]
      (p/chain (.stat Filesystem (clj->js {:path path}))
               #(js->clj % :keywordize-keys true))))
  (open-dir [_this _ok-handler]
    (p/let [_ (when (mobile-util/native-android?) (android-check-permission))
            {:keys [path localDocumentsPath]} (-> (.pickFolder mobile-util/folder-picker)
                                                  (p/then #(js->clj % :keywordize-keys true))
                                                  (p/catch (fn [e]
                                                             (js/alert (str e))
                                                             nil))) ;; NOTE: If pick folder fails, let it crash
            _ (when (and (mobile-util/native-ios?)
                         (not (or (local-container-path? path localDocumentsPath)
                                  (mobile-util/iCloud-container-path? path))))
                (state/pub-event! [:modal/show-instruction]))
            _ (js/console.log "Opening or Creating graph at directory: " path)
            files (readdir path)
            files (js->clj files :keywordize-keys true)]
      (into [] (concat [{:path path}] files))))
  (get-files [_this path-or-handle _ok-handler]
    (readdir path-or-handle))
  (watch-dir! [_this dir _options]
    (p/do!
     (.unwatch mobile-util/fs-watcher)
     (.watch mobile-util/fs-watcher (clj->js {:path dir}))))
  (unwatch-dir! [_this _dir]
    (.unwatch mobile-util/fs-watcher)))
