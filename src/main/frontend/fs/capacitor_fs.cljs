(ns frontend.fs.capacitor-fs
  (:require ["@capacitor/filesystem" :refer [Encoding Filesystem]]
            [cljs-bean.core :as bean]
            [clojure.string :as string]
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
  (defn iOS-ensure-documents!
    []
    (.ensureDocuments mobile-util/ios-file-container)))

(defn check-permission-android []
  (p/let [permission (.checkPermissions Filesystem)
          permission (-> permission
                         bean/->clj
                         :publicStorage)]
    (when-not (= permission "granted")
      (p/do!
       (.requestPermissions Filesystem)))))

(defn- clean-uri
  [uri]
  (when (string? uri)
    (util/url-decode uri)))

(defn- read-file-utf8
  [path]
  (when-not (string/blank? path)
    (.readFile Filesystem
               (clj->js
                {:path path
                 :encoding (.-UTF8 Encoding)}))))

(defn readdir
  "readdir recursively"
  [path]
  (p/let [result (p/loop [result []
                          dirs [path]]
                   (if (empty? dirs)
                     result
                     (p/let [d (first dirs)
                             files (.readdir Filesystem (clj->js {:path d}))
                             files (-> files
                                       js->clj
                                       (get "files" []))
                             files (->> files
                                        (remove (fn [file]
                                                  (or (string/starts-with? file ".")
                                                      (and (mobile-util/native-android?)
                                                           (or (string/includes? file "#")
                                                               (string/includes? file "%")))
                                                      (= file "bak")))))
                             files (->> files
                                        (map (fn [file]
                                               (str (string/replace d #"/+$" "")
                                                    "/"
                                                    (if (mobile-util/native-ios?)
                                                      (util/url-encode file)
                                                      file)))))
                             files-with-stats (p/all
                                               (mapv
                                                (fn [file]
                                                  (p/chain
                                                   (.stat Filesystem (clj->js {:path file}))
                                                   #(js->clj % :keywordize-keys true)))
                                                files))
                             files-dir (->> files-with-stats
                                            (filterv
                                             (fn [{:keys [type]}]
                                               (contains? #{"directory" "NSFileTypeDirectory"} type)))
                                            (mapv :uri))
                             files-result
                             (p/all
                              (->> files-with-stats
                                   (filter
                                    (fn [{:keys [type]}]
                                      (contains? #{"file" "NSFileTypeRegular"} type)))
                                   (filter
                                    (fn [{:keys [uri]}]
                                      (some #(string/ends-with? uri %)
                                            [".md" ".markdown" ".org" ".edn" ".css"])))
                                   (mapv
                                    (fn [{:keys [uri] :as file-result}]
                                      (p/chain
                                       (read-file-utf8 uri)
                                       #(js->clj % :keywordize-keys true)
                                       :data
                                       #(assoc file-result :content %))))))]
                       (p/recur (concat result files-result)
                                (concat (rest dirs) files-dir)))))
          result (js->clj result :keywordize-keys true)]
    (map (fn [result] (update result :uri clean-uri)) result)))

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
  (let [relative-path (-> (string/replace path repo-dir "")
                          (string/replace (str "." ext) ""))]
    (str repo-dir backup-dir "/" relative-path)))

(defn- truncate-old-versioned-files!
  "reserve the latest 3 version files"
  [dir]
  (p/let [files (readdir dir)
          files (js->clj files :keywordize-keys true)
          old-versioned-files (drop 3 (reverse (sort-by :mtime files)))]
    (mapv (fn [file]
            (.deleteFile Filesystem (clj->js {:path (js/encodeURI (:uri file))})))
          old-versioned-files)))

(defn backup-file
  [repo-dir path content ext]
  (let [backup-dir (get-backup-dir repo-dir path ext)
        new-path (str backup-dir "/" (string/replace (.toISOString (js/Date.)) ":" "_") "." ext)]
    (.writeFile Filesystem (clj->js {:data content
                                     :path new-path
                                     :encoding (.-UTF8 Encoding)
                                     :recursive true}))
    (truncate-old-versioned-files! backup-dir)))

(defn- write-file-impl!
  [_this repo _dir path content {:keys [ok-handler error-handler old-content skip-compare?]} stat]
  (if skip-compare?
    (p/catch
     (p/let [result (.writeFile Filesystem (clj->js {:path path
                                                     :data content
                                                     :encoding (.-UTF8 Encoding)
                                                     :recursive true}))]
       (when ok-handler
         (ok-handler repo path result)))
     (fn [error]
       (if error-handler
         (error-handler error)
         (log/error :write-file-failed error))))

    (p/let [disk-content (-> (p/chain (read-file-utf8 path)
                                      #(js->clj % :keywordize-keys true)
                                      :data)
                             (p/catch (fn [error]
                                        (js/console.error error)
                                        nil)))
            disk-content (or disk-content "")
            repo-dir (config/get-local-dir repo)
            ext (string/lower-case (util/get-file-ext path))
            db-content (or old-content (db/get-file repo (js/decodeURI path)) "")
            contents-matched? (contents-matched? disk-content db-content)
            pending-writes (state/get-write-chan-length)]
      (cond
        (and
         (not= stat :not-found)   ; file on the disk was deleted
         (not contents-matched?)
         (not (contains? #{"excalidraw" "edn" "css"} ext))
         (not (string/includes? path "/.recycle/"))
         (zero? pending-writes))
        (p/let [disk-content (encrypt/decrypt disk-content)]
          (state/pub-event! [:file/not-matched-from-disk path disk-content content]))

        :else
        (->
         (p/let [result (.writeFile Filesystem (clj->js {:path path
                                                         :data content
                                                         :encoding (.-UTF8 Encoding)
                                                         :recursive true}))
                 mtime (-> (js->clj stat :keywordize-keys true)
                           :mtime)]
           (when-not contents-matched?
             (backup-file repo-dir path disk-content ext))
           (db/set-file-last-modified-at! repo path mtime)
           (p/let [content (if (encrypt/encrypted-db? (state/get-current-repo))
                             (encrypt/decrypt content)
                             content)]
             (db/set-file-content! repo (js/decodeURI path) content))
           (when ok-handler
             (ok-handler repo path result))
           result)
         (p/catch (fn [error]
                    (if error-handler
                      (error-handler error)
                      (log/error :write-file-failed error)))))))))

(defn get-file-path [dir path]
  (let [[dir path] (map #(some-> %
                                 js/decodeURI)
                        [dir path])
        dir (some-> dir (string/replace #"/+$" ""))
        path (some-> path (string/replace #"^/+" ""))
        path (cond (nil? path)
                   dir

                   (nil? dir)
                   path

                   (string/starts-with? path dir)
                   path

                   :else
                   (str dir "/" path))]
    (if (mobile-util/native-ios?)
      (js/encodeURI (js/decodeURI path))
      path)))

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

(defrecord Capacitorfs []
  protocol/Fs
  (mkdir! [_this dir]
    (-> (.mkdir Filesystem
                (clj->js
                 {:path dir}))
        (p/catch (fn [error]
                   (log/error :mkdir! {:path dir
                                       :error error})))))
  (mkdir-recur! [_this dir]
    (p/let [result (.mkdir Filesystem
                           (clj->js
                            {:path dir
                             ;; :directory (.-ExternalStorage Directory)
                             :recursive true}))]
      (js/console.log result)
      result))
  (readdir [_this dir]                  ; recursive
    (readdir dir))
  (unlink! [this repo path _opts]
    (p/let [path (get-file-path nil path)
            path (if (string/starts-with? path "file://")
                   (string/replace-first path "file://" "")
                   path)
            repo-dir (config/get-local-dir repo)
            recycle-dir (str repo-dir config/app-name "/.recycle")
            file-name (-> (string/replace path repo-dir "")
                          (string/replace "/" "_")
                          (string/replace "\\" "_"))
            new-path (str recycle-dir "/" file-name)]
      (protocol/mkdir! this recycle-dir)
      (protocol/rename! this repo path new-path)))
  (rmdir! [_this _dir]
    ;; Too dangerious!!! We'll never implement this.
    nil)
  (read-file [_this dir path _options]
    (let [path (get-file-path dir path)]
      (->
       (p/let [content (read-file-utf8 path)
               content (-> (js->clj content :keywordize-keys true)
                           :data
                           clj->js)]
         content)
       (p/catch (fn [error]
                  (log/error :read-file-failed error))))))
  (write-file! [this repo dir path content opts]
    (let [path (get-file-path dir path)]
      (p/let [stat (p/catch
                    (.stat Filesystem (clj->js {:path path}))
                    (fn [_e] :not-found))]
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
  (stat [_this dir path]
    (let [path (get-file-path dir path)]
      (p/let [result (.stat Filesystem (clj->js
                                        {:path path
                                         ;; :directory (.-ExternalStorage Directory)
                                         }))]
        result)))
  (open-dir [_this _ok-handler]
    (p/let [_    (when (= (mobile-util/platform) "android") (check-permission-android))
            {:keys [path localDocumentsPath]} (-> (.pickFolder mobile-util/folder-picker)
                                                  (p/then #(js->clj % :keywordize-keys true))
                                                  (p/catch (fn [e]
                                                             (js/alert (str e))
                                                             nil))) ;; NOTE: Can not pick folder, let it crash
            _ (when (and (mobile-util/native-ios?)
                         (not (or (local-container-path? path localDocumentsPath)
                                  (mobile-util/iCloud-container-path? path))))
                (state/pub-event! [:modal/show-instruction]))
            files (readdir path)
            files (js->clj files :keywordize-keys true)]
      (into [] (concat [{:path path}] files))))
  (get-files [_this path-or-handle _ok-handler]
    (readdir path-or-handle))
  (watch-dir! [_this dir]
    (p/do!
     (.unwatch mobile-util/fs-watcher)
     (.watch mobile-util/fs-watcher #js {:path dir})))
  (unwatch-dir! [_this _dir]
    (.unwatch mobile-util/fs-watcher)))
