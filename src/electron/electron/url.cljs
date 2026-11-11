(ns electron.url
  (:require [clojure.string :as string]
            [electron.deeplink :as deeplink]
            [electron.handler :as handler]
            [electron.utils :refer [send-to-renderer] :as utils]
            [electron.window :as win]))

(defn get-URL-decoded-params
  "Get decoded URL parameters from parsed js/URL.
   `nil` for non-existing keys.
   URL.searchParams are already decoded:
   https://developer.mozilla.org/en-US/docs/Web/API/URL/searchParams"
  [^js/URL parsed-url keys]
  (let [params (.-searchParams parsed-url)]
    (map (fn [key]
           (when-let [value (.get params key)]
             value))
         keys)))

(defn resolve-url
  "Resolve a protocol URL to a known graph, action, or translated link error."
  [url]
  (let [{:keys [parsed-url graph-identifier i18n-key] :as target} (deeplink/parse-url url)]
    (cond
      i18n-key target
      graph-identifier
      (if-let [graph-name (handler/get-graph-name graph-identifier)]
        (assoc target :graph-name graph-name)
        {:i18n-key :electron/link-open-failed-no-graph :i18n-args [graph-identifier]})
      (contains? #{"x-callback-url" "handbook"} (.-host parsed-url)) target
      :else {:i18n-key :electron/link-open-failed-no-target :i18n-args [(.-host parsed-url)]})))

(defn- send-when-loaded!
  [^js window channel payload]
  (let [web-contents (.-webContents window)
        send! #(when-not (.isDestroyed window)
                 (send-to-renderer window channel payload))]
    (if (.isLoadingMainFrame web-contents)
      (.once web-contents "did-finish-load" send!)
      (send!))))

(defn open-graph!
  "Deliver a resolved graph destination or link error after renderer listeners load."
  [window target]
  (send-when-loaded! window "openGraph"
                     (select-keys target [:graph-name :page-name :block-id :i18n-key :i18n-args])))

(defn- local-url-handler
  [window target force-new-window?]
  (let [graph-name (:graph-name target)
        target-window (if force-new-window?
                        (handler/open-new-window! graph-name)
                        (or (first (win/get-graph-all-windows (utils/get-graph-dir graph-name)))
                            window))]
    (win/switch-to-window! target-window)
    (open-graph! target-window target)))

(defn- x-callback-url-handler
  "win - a window used for fallback (main window is preferred)"
  [^js win ^js/URL parsed-url]
  (let [action (.-pathname parsed-url)
        window (or (utils/get-focused-window) win)]
    (cond
      ;; url:     (string) Page url
      ;; title:   (string) Page title
      ;; content: (string) Highlighted text
      ;; page:    (string) Page name to insert to, use "TODAY" to insert to today page
      ;; append:  (bool)   Append to the end of the page, default to false(current editing position)
      (= action "/quickCapture")
      (let [[url title content page append] (get-URL-decoded-params parsed-url ["url" "title" "content" "page" "append"])]
        (send-when-loaded! window "quickCapture" {:url url
                                                  :title title
                                                  :content content
                                                  :page page
                                                  :append (if (nil? append)
                                                            append
                                                            (= append "true"))}))

      (= action "/invokeCommand")
      (let [[action payload] (get-URL-decoded-params parsed-url ["action" "payload"])]
        (send-when-loaded! window "invokeCommand" {:action action
                                                   :payload payload}))

      :else
      (send-when-loaded! window "notification" {:type "error"
                                                :payload (str "Unimplemented x-callback-url action: `"
                                                              action
                                                              "`.")
                                                :i18n-key :electron/unimplemented-callback
                                                :i18n-args [action]}))))

(defn logseq-url-handler
  "Open a resolved protocol destination in the appropriate window."
  [window {:keys [parsed-url i18n-key] :as target}]
  (if i18n-key
    (open-graph! window target)
    (case (.-host parsed-url)
      "graph" (local-url-handler window target false)
      "new-window" (local-url-handler window target true)
      "x-callback-url" (x-callback-url-handler window parsed-url)
      "handbook" (send-when-loaded! window :handbook
                                      {:key (some-> (.-pathname parsed-url) (string/replace-first #"^[\/]+" ""))
                                       :args (some-> (.-searchParams parsed-url) (js/Object.fromEntries))}))))
