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

(defn- is-tweet-link
  [url]
  (when (not-empty url)
    (re-matches #"^https://twitter\.com/.*?/status/.*?$" url)))

(defn quick-capture [args]
  (let [{:keys [url title content page append]} (bean/->clj args)
        title (or title "")
        url (or url "")
        insert-today? (get-in (state/get-config)
                              [:quick-capture-options :insert-today?]
                              false)
        redirect-page? (get-in (state/get-config)
                               [:quick-capture-options :redirect-page?]
                               false)
        today-page (string/lower-case (date/today))
        current-page (state/get-current-page) ;; empty when in journals page
        default-page (get-in (state/get-config)
                             [:quick-capture-options :default-page])
        page (cond
               (and (state/enable-journals?)
                    (or (= page "TODAY")
                        (and (string/blank? page) insert-today?)))
               today-page

               (not-empty page)
               page

               (not-empty default-page)
               default-page

               (not-empty current-page)
               current-page

               :else
               (if (state/enable-journals?) ;; default to "quick capture" page if journals are not enabled
                 today-page
                 "quick capture"))
        format (db/get-page-format page)
        time (date/get-current-time)
        text (or (and content (not-empty (string/trim content))) "")
        link (cond
               (string/blank? url)
               title

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
        date-ref-name (date/today)
        content (-> template
                    (string/replace "{time}" time)
                    (string/replace "{date}" date-ref-name)
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
