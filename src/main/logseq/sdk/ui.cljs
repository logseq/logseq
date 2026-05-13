(ns logseq.sdk.ui
  (:require [cljs-bean.core :as bean]
            [cljs.reader :as reader]
            [clojure.string :as string]
            [frontend.handler.notification :as notification]
            [frontend.util :as util]
            [goog.dom :as gdom]
            [lambdaisland.glogi :as log]))

(defn- parse-hiccup-ui
  [input]
  (when (string? input)
    (try
      (reader/read-string input)
      (catch :default e
        (log/error :parse-hiccup-error e) input))))

(defn -show_msg
  ([content] (-show_msg content :success nil))
  ([content status] (-show_msg content status nil))
  ([content status ^js opts]
   (let [{:keys [key timeout]} (bean/->clj opts)
         hiccup? (and (string? content) (string/starts-with? (string/triml content) "[:"))
         content (if hiccup? (parse-hiccup-ui content) content)
         uid (when (string? key) (keyword key))
         clear? (not= timeout 0)
         key' (notification/show! content (keyword status) clear? uid timeout nil)]
     (name key'))))

(defn ^:export show_msg
  [& args]
  (apply -show_msg args))

(defn ^:export close_msg
  [key]
  (when (string? key)
    (notification/clear! (keyword key)) nil))

(defn ^:export query_element_rect
  [selector]
  (when-let [^js el (js/document.querySelector selector)]
    (bean/->js (.toJSON (.getBoundingClientRect el)))))

(defn ^:export query_element_by_id
  [id]
  (when-let [^js el (gdom/getElement id)]
    (if el (str (.-tagName el) "#" id) false)))

(defn ^:export check_slot_valid
  [slot]
  (when (string? slot)
    (boolean (query_element_by_id slot))))

(defn ^:export resolve_theme_css_props_vals
  [props]
  (when-let [props (if (string? props) [props] (bean/->clj props))]
    (let [^js s (js/window.getComputedStyle js/document.body)]
      (some->> (for [prop props]
                 (when (string? prop)
                   [prop (util/trim-safe (.getPropertyValue s prop))]))
               (remove empty?)
               (into {})
               (bean/->js)))))
