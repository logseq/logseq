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
            [clojure.string :as string]))

(defn check-permission-android []
  (p/let [permission (.checkPermissions Filesystem)
          permission (-> permission
                         bean/->clj
                         :publicStorage)]
    (when-not (= permission "granted")
      (p/do!
       (.requestPermissions Filesystem)))))

(defn readdir
  "readdir recursively"
  [path]
  (p/loop [result []
           dirs [path]]
    (if (empty? dirs)
      result
      (p/let [d (first dirs)
              files (.readdir Filesystem (clj->js {:path d}))
              files (-> files
                        js->clj
                        (get "files" []))
              files (->> files
                         (remove (fn [file] (string/starts-with? file "."))))
              files (->> files
                         (map (fn [file] (futil/node-path.join d file))))
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
                                (= type "directory")))
                             (mapv :uri))

              files-result
              (p/all
               (->> files-with-stats
                    (filter
                     (fn [{:keys [type]}]
                       (= type "file")))
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
                 (concat (rest dirs) files-dir))))))

(defrecord Capacitorfs []
  protocol/Fs
  (mkdir! [this dir]
    (prn "mkdir: " dir)
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
    (let [path (str dir path)]
      (p/let [content (.readFile Filesystem
                              (clj->js
                               {:path path
                                :directory (.-ExternalStorage Directory)
                                :encoding (.-UTF8 Encoding)}))]
        content)))
  (write-file! [this repo dir path content {:keys [ok-handler error-handler] :as opts}]
    (let [path (if (string/starts-with? path (config/get-repo-dir repo))
                 path
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
    (case (util/platform)
      "android"
      (p/let [_    (check-permission-android)
              path (p/chain
                    (.pickFolder util/folder-picker)
                    #(js->clj % :keywordize-keys true)
                    :path)
              files (readdir path)]
        (js/console.log path)
        (js/console.log files)
        (into [] (concat [{:path path}] files)))))
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
