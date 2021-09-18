(ns frontend.fs.capacitor-fs
  (:require [frontend.fs.protocol :as protocol]
            [lambdaisland.glogi :as log]
            ["@capacitor/filesystem" :refer [Filesystem Directory Encoding]]
            [promesa.core :as p]))

(defrecord Capacitorfs []
  protocol/Fs
  (mkdir! [this dir]
    (p/let [result (.mkdir Filesystem
                      (clj->js
                       {:path dir
                        :directory (.-ExternalStorage Directory)}))]
      (js/console.log result)))
  (mkdir-recur! [this dir]
    (p/let [result (.mkdir Filesystem
                           (clj->js
                            {:path dir
                             :directory (.-ExternalStorage Directory)
                             :recursive true}))]
      (js/console.log result)))
  (readdir [this dir]                   ; recursive
    nil)
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
    (let [path (str dir path)]
      (p/catch
          (p/let [result (.writeFile Filesystem
                                     (clj->js
                                      {:path path
                                       :data content
                                       :directory (.-ExternalStorage Directory)
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
    nil)
  (open-dir [this ok-handler]
    nil)
  (get-files [this path-or-handle ok-handler]
    nil)
  (watch-dir! [this dir]
    nil))
