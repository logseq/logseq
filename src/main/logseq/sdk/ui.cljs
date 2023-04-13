(ns logseq.sdk.ui
  (:require [frontend.handler.notification :as notification]
            [cljs-bean.core :as bean]
            [sci.core :as sci]
            [clojure.string :as string]))

(defn- parse-hiccup-ui
  [input]
  (when (string? input)
    (try
      (sci/eval-string input {:preset :termination-safe})
      (catch :default e
        (js/console.error "[parse hiccup error]" e) input))))

(defn -show_msg
  ([content] (-show_msg content :success nil))
  ([content status] (-show_msg content status nil))
  ([content status ^js opts]
   (let [{:keys [key timeout]} (bean/->clj opts)
         hiccup? (and (string? content) (string/starts-with? (string/triml content) "[:"))
         content (if hiccup? (parse-hiccup-ui content) content)
         uid     (when (string? key) (keyword key))
         clear?  (not= timeout 0)
         key'    (notification/show! content (keyword status) clear? uid timeout nil)]
     (name key'))))

(defn ^:export show_msg
  [& args]
  (apply -show_msg args))

(defn ^:export close_msg
  [key]
  (when (string? key)
    (notification/clear! (keyword key)) nil))