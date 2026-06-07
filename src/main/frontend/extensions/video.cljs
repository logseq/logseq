(ns frontend.extensions.video
  (:require [clojure.string :as string]))

(def provider-capabilities
  {:youtube  {:timestamp? true
              :current-time? true
              :seek? true
              :default-aspect-ratio [16 9]}
   :bilibili {:timestamp? false
              :default-aspect-ratio [16 9]}
   :vimeo    {:timestamp? false
              :default-aspect-ratio [16 9]}
   :loom     {:timestamp? false
              :default-aspect-ratio [16 9]}})

(defn matched-video-provider
  [match]
  (let [domain (nth match 3 nil)]
    (cond
      (contains? #{"youtube.com" "youtu.be" "y2u.be" "youtube-nocookie.com"} domain)
      :youtube

      (= "bilibili.com" domain)
      :bilibili

      (and (string? domain) (string/ends-with? domain "vimeo.com"))
      :vimeo

      (= "loom.com" domain)
      :loom

      :else
      nil)))

(defn provider-supports?
  [provider capability]
  (true? (get-in provider-capabilities [provider capability])))

(defn matched-video-aspect-ratio
  [match]
  (let [provider (matched-video-provider match)]
    (or
     (get-in provider-capabilities [provider :default-aspect-ratio])
     [16 9])))
