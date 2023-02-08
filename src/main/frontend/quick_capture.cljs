(ns frontend.quick-capture
  "Quick-capture for both mobile and electron"
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [frontend.config :as config]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.page :as page-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.text :as text-util]))


(defn- extract-highlight
  "Extract highlighted text and url from mobile browser intent share"
  [url]
  (let [[_ highlight link] (re-matches #"(?s)\"(.*)\"\s+([a-z0-9]+://.*)$" url)]
    (if (not-empty highlight)
      [highlight link]
      [nil url])))

(defn- is-tweet-link
  [url]
  (re-matches #"^https://twitter\.com/.*?/status/.*?$" url))

(defn quick-capture [args]
  (let [{:keys [url title content page append]} (bean/->clj args)
        insert-today? (get-in (state/get-config)
                              [:quick-capture-options :insert-today?]
                              false)
        redirect-page? (get-in (state/get-config)
                               [:quick-capture-options :redirect-page?]
                               false)
        today-page (when (state/enable-journals?)
                     (string/lower-case (date/today)))
        page (if (or (= page "TODAY")
                     (and (string/blank? page) insert-today?))
               today-page
               (or (not-empty page)
                   (state/get-current-page)
                   today-page))
        [content url] (if (string/blank? content)
                        (extract-highlight url)
                        [content url])
        page (or page "quick capture") ;; default to "quick capture" page, if journals are not enabled
        format (db/get-page-format page)
        time (date/get-current-time)
        text (or (and content (not-empty (string/trim content))) "")
        link (cond
               (boolean (text-util/get-matched-video url))
               (str title " {{video " url "}}")

               (is-tweet-link url)
               (util/format "{{twitter %s}}" url)

               (= title url)
               (config/link-format format nil url)

               :else
               (config/link-format format title url))
        template (get-in (state/get-config)
                         [:quick-capture-templates :text]
                         "**{time}** [[quick capture]]: {text} {url}")
        content (-> template
                    (string/replace "{time}" time)
                    (string/replace "{url}" link)
                    (string/replace "{text}" text))
        edit-content (state/get-edit-content)
        edit-content-blank? (string/blank? edit-content)
        edit-content-include-capture? (and (not-empty edit-content)
                                           (string/includes? edit-content "[[quick capture]]"))]
    (if (and (state/editing?) (not append) (not edit-content-include-capture?))
      (if edit-content-blank?
        (editor-handler/insert content)
        (editor-handler/insert (str "\n" content)))

      (do
        (editor-handler/escape-editing)
        (when (not= page (state/get-current-page))
          (page-handler/create! page {:redirect? redirect-page?}))
                             ;; Or else this will clear the newly inserted content
        (js/setTimeout #(editor-handler/api-insert-new-block! content {:page page
                                                                       :edit-block? true
                                                                       :replace-empty-target? true})
                       100)))))