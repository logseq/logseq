(ns ^:no-doc frontend.handler.image
  (:require [clojure.string :as string]
            [frontend.config :as config]
            [frontend.fs :as fs]
            [frontend.image :as image]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [frontend.mobile.util :as mobile-util]))

(defn render-local-images!
  []
  (when-not (and (or (util/electron?)
                     (mobile-util/native-ios?))
                 (config/local-db? (state/get-current-repo)))
    (try
      (let [images (array-seq (gdom/getElementsByTagName "img"))
            get-src (fn [image] (.getAttribute image "src"))
            local-images (filter
                          (fn [image]
                            (let [src (get-src image)]
                              (and src
                                   (not (or (util/starts-with? src "http://")
                                            (util/starts-with? src "https://")
                                            (util/starts-with? src "blob:")
                                            (util/starts-with? src "data:"))))))
                          images)]
        (doseq [img local-images]
          (gobj/set img
                    "onerror"
                    (fn []
                      (gobj/set (gobj/get img "style")
                                "display" "none")))
          (let [path (get-src img)
                path (string/replace-first path "file:" "")
                path (if (= (first path) \.)
                       (subs path 1)
                       path)]
            (util/p-handle
             (fs/read-file (config/get-repo-dir (state/get-current-repo)) path {})
             (fn [blob]
               (let [blob (js/Blob. (array blob) (clj->js {:type "image"}))
                     img-url (image/create-object-url blob)]
                 (gobj/set img "src" img-url)
                 (gobj/set (gobj/get img "style")
                           "display" "initial")))
             (fn [error]
               (println "Can't read local image file: ")
               (js/console.dir error))))))
      (catch :default _e
        nil))))
