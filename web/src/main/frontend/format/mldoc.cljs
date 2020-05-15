(ns frontend.format.mldoc
  (:require [frontend.format.protocol :as protocol]
            [frontend.util :as util]
            [frontend.config :as config]
            [clojure.string :as string]
            [frontend.loader :as loader]
            [cljs-bean.core :as bean]))

(defn default-config
  [format]
  (let [format (string/capitalize (name format))]
    (js/JSON.stringify
     (bean/->js
      (assoc {:toc false
              :heading_number false
              :keep_line_break true}
             :format format)))))

(defn loaded? []
  js/window.Mldoc)

(defn parse-json
  [content config]
  (when (loaded?)
    (.parseJson js/window.Mldoc content (or config default-config))))

(defn ->edn
  [content config]
  (if (string/blank? content)
    {}
    (-> content
        (parse-json config)
        (util/json->clj))))

(defrecord MldocMode []
  protocol/Format
  (toEdn [this content config]
    (->edn content config))
  (toHtml [this content config]
    (.parseHtml js/window.Mldoc content config))
  (loaded? [this]
    (some? (loaded?)))
  (lazyLoad [this ok-handler]
    true))
