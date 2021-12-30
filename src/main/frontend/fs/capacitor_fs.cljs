(ns frontend.fs.capacitor-fs
  (:require [frontend.fs.protocol :as protocol]
            [lambdaisland.glogi :as log]
            [cljs.core.async :as a]
            [cljs.core.async.interop :refer [<p!]]
            [frontend.util :as futil]
            [frontend.config :as config]
            [cljs-bean.core :as bean]
            ["@capacitor/filesystem" :refer [Filesystem Directory Encoding]]
            [frontend.mobile.util :as util]
            [promesa.core :as p]
            [clojure.string :as string]
            [frontend.mobile.util :as mobile-util]))

(when (util/native-ios?)
  (defn iOS-ensure-documents!
    []
    (.ensureDocuments util/ios-file-container)))

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
    (-> uri
        (string/replace "file://" "")
        (futil/url-decode))))

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
                                               (futil/node-path.join
                                                d
                                                (if (mobile-util/native-ios?)
                                                  (futil/url-encode file)
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
                                       (.readFile Filesystem
                                                  (clj->js
                                                   {:path uri
                                                    :encoding (.-UTF8 Encoding)}))
                                       #(js->clj % :keywordize-keys true)
                                       :data
                                       #(assoc file-result :content %))))))]
                       (p/recur (concat result files-result)
                                (concat (rest dirs) files-dir)))))
          result (js->clj result :keywordize-keys true)]
    (map (fn [result] (update result :uri clean-uri)) result)))

(defrecord Capacitorfs []
  protocol/Fs
  (mkdir! [this dir]
    (p/let [result (.mkdir Filesystem
                           (clj->js
                            {:path dir
                             ;; :directory (.-ExternalStorage Directory)
                             }))]
      (js/console.log result)
      result))
  (mkdir-recur! [this dir]
    (p/let [result (.mkdir Filesystem
                           (clj->js
                            {:path dir
                             ;; :directory (.-ExternalStorage Directory)
                             :recursive true}))]
      (js/console.log result)
      result))
  (readdir [this dir]                   ; recursive
    (readdir dir))
  (unlink! [this repo path _opts]
    nil)
  (rmdir! [this dir]
    ;; Too dangerious!!! We'll never implement this.
    nil)
  (read-file [this dir path _options]
    (let [path (str dir path)
          path (if (or (string/starts-with? path "file:")
                       (string/starts-with? path "content:"))
                 path
                 (str "file:///" (string/replace path #"^/+" "")))]
      (->
       (p/let [content (.readFile Filesystem
                                  (clj->js
                                   {:path path
                                    ;; :directory (.-ExternalStorage Directory)
                                    :encoding (.-UTF8 Encoding)}))]
         content)
       (p/catch (fn [error]
                  (js/alert error))))))
  (delete-file! [this repo dir path {:keys [ok-handler error-handler] :as opts}]
    (let [path (cond
                 (= (util/platform) "ios")
                 (js/encodeURI (js/decodeURI path))

                 (string/starts-with? path (config/get-repo-dir repo))
                 path

                 :else
                 (-> (str dir "/" path)
                     (string/replace "//" "/")))]
      (p/catch
       (p/let [result (.deleteFile Filesystem
                                   (clj->js
                                    {:path path}))]
         (when ok-handler
           (ok-handler repo path result)))
       (fn [error]
         (if error-handler
           (error-handler error)
           (log/error :delete-file-failed error))))))
  (write-file! [this repo dir path content {:keys [ok-handler error-handler] :as opts}]
    (let [path (cond
                 (= (util/platform) "ios")
                 (js/encodeURI (js/decodeURI path))

                 (string/starts-with? path (config/get-repo-dir repo))
                 path

                 :else
                 (-> (str dir "/" path)
                     (string/replace "//" "/")))]
      (p/catch
          (p/let [result (.writeFile Filesystem
                                     (clj->js
                                      {:path path
                                       :data content
                                       :encoding (.-UTF8 Encoding)
                                       :recursive true}))]
            (when ok-handler
              (ok-handler repo path result)))
          (fn [error]
            (if error-handler
              (error-handler error)
              (log/error :write-file-failed error))))))
  (rename! [this repo old-path new-path]
    nil)
  (stat [this dir path]
    (let [path (str dir path)]
      (p/let [result (.stat Filesystem (clj->js
                                        {:path path
                                         ;; :directory (.-ExternalStorage Directory)
                                         }))]
        result)))
  (open-dir [this ok-handler]
    (p/let [_    (when (= (util/platform) "android") (check-permission-android))
            path (p/chain
                  (.pickFolder util/folder-picker)
                  #(js->clj % :keywordize-keys true)
                  :path)
            _ (when (util/native-ios?) (.downloadFilesFromiCloud util/download-icloud-files))
            files (readdir path)
            files (js->clj files :keywordize-keys true)]
      (into [] (concat [{:path path}] files))))
  (get-files [this path-or-handle _ok-handler]
    (readdir path-or-handle))
  (watch-dir! [this dir]
    nil))


(comment
  ;;open-dir result
  #_
  ["/storage/emulated/0/untitled folder 21"
   {:type    "file",
    :size    2,
    :mtime   1630049904000,
    :uri     "file:///storage/emulated/0/untitled%20folder%2021/pages/contents.md",
    :ctime   1630049904000,
    :content "-\n"}
   {:type    "file",
    :size    0,
    :mtime   1630049904000,
    :uri     "file:///storage/emulated/0/untitled%20folder%2021/logseq/custom.css",
    :ctime   1630049904000,
    :content ""}
   {:type    "file",
    :size    2,
    :mtime   1630049904000,
    :uri     "file:///storage/emulated/0/untitled%20folder%2021/logseq/metadata.edn",
    :ctime   1630049904000,
    :content "{}"}
   {:type  "file",
    :size  181,
    :mtime 1630050535000,
    :uri
    "file:///storage/emulated/0/untitled%20folder%2021/journals/2021_08_27.md",
    :ctime 1630050535000,
    :content
    "- xx\n- xxx\n- xxx\n- xxxxxxxx\n- xxx\n- xzcxz\n- xzcxzc\n- asdsad\n- asdsadasda\n- asdsdaasdsad\n- asdasasdas\n- asdsad\n- sad\n- asd\n- asdsad\n- asdasd\n- sadsd\n-\n- asd\n- saddsa\n- asdsaasd\n- asd"}
   {:type  "file",
    :size  132,
    :mtime 1630311293000,
    :uri
    "file:///storage/emulated/0/untitled%20folder%2021/journals/2021_08_30.md",
    :ctime 1630311293000,
    :content
    "- ccc\n- sadsa\n- sadasd\n- asdasd\n- asdasd\n\t- asdasd\n\t\t- asdasdsasd\n\t\t\t- sdsad\n\t\t-\n- sadasd\n- asdas\n- sadasd\n-\n-\n\t- sadasdasd\n\t- asdsd"}])
