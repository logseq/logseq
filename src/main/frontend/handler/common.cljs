(ns frontend.handler.common
  "Common fns for handlers"
  (:require [cljs-bean.core :as bean]
            [cljs.reader :as reader]
            [clojure.string :as string]
            [frontend.date :as date]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.property :as property]
            [goog.object :as gobj]
            ["ignore" :as Ignore]
            [lambdaisland.glogi :as log]))

(defn copy-to-clipboard-without-id-property!
  [format raw-text html]
  (util/copy-to-clipboard! (property/remove-id-property format raw-text) html))

(defn config-with-document-mode
  [config]
  (assoc config
         :document/mode? (state/sub [:document/mode?])))

(defn ignore-files
  [pattern paths]
  (-> (Ignore)
      (.add pattern)
      (.filter (bean/->js paths))
      (bean/->clj)))

(defn- hidden?
  [path patterns]
  (let [path (if (and (string? path)
                      (= \/ (first path)))
               (subs path 1)
               path)]
    (some (fn [pattern]
            (let [pattern (if (and (string? pattern)
                                   (not= \/ (first pattern)))
                            (str "/" pattern)
                            pattern)]
              (string/starts-with? (str "/" path) pattern))) patterns)))

(defn remove-hidden-files
  [files config get-path-fn]
  (if-let [patterns (seq (:hidden config))]
    (remove (fn [file]
              (let [path (get-path-fn file)]
                (hidden? path patterns))) files)
    files))

(defn safe-read-string
  [content error-message-or-handler]
  (try
    (reader/read-string content)
    (catch :default e
      (js/console.error e)
      (if (fn? error-message-or-handler)
        (error-message-or-handler e)
        (println error-message-or-handler))
      {})))

(defn read-metadata!
  [content]
  (try
    (reader/read-string content)
    (catch :default e
      (log/error :parse/metadata-failed e)
      {})))

(defn get-page-default-properties
  [page-name]
  {:title page-name
   ;; :date (date/get-date-time-string)
   })

(defn fix-pages-timestamps
  [pages]
  (map (fn [{:block/keys [created-at updated-at journal-day] :as p}]
         (cond->
           p

           (nil? created-at)
           (assoc :block/created-at
                  (if journal-day
                    (date/journal-day->ts journal-day)
                    (util/time-ms)))

           (nil? updated-at)
           (assoc :block/updated-at
                  ;; Not exact true
                  (if journal-day
                    (date/journal-day->ts journal-day)
                    (util/time-ms)))))
    pages))

(defn show-custom-context-menu! [e context-menu-content]
  (util/stop e)
  (let [position [(gobj/get e "clientX") (gobj/get e "clientY")]]
    (state/show-custom-context-menu! context-menu-content position)))

(defn listen-to-scroll!
  [element]
  (let [*scroll-timer (atom nil)]
    (.addEventListener element "scroll"
                       (fn []
                         (when @*scroll-timer
                           (js/clearTimeout @*scroll-timer))
                         (state/set-state! :ui/scrolling? true)
                         (state/save-scroll-position! (util/scroll-top))
                         (reset! *scroll-timer (js/setTimeout
                                                (fn [] (state/set-state! :ui/scrolling? false)) 500)))
                       false)))
