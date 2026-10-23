(ns frontend.components.developer-apps
  (:require [clojure.string :as string]
            [frontend.context.i18n :refer [interpolate-sentence t]]
            [frontend.handler.db-based.sync :as rtc-handler]
            [frontend.handler.notification :as notification]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [lambdaisland.glogi :as log]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]
            [io.factorhouse.hsx.core :as hsx]))

(defn- status-label
  [status]
  (case status
    "pending" (t :settings.developer/status-pending)
    "approved" (t :settings.developer/status-approved)
    "rejected" (t :settings.developer/status-rejected)
    status))

(defn- redirect-uri-list
  [text]
  (->> (string/split (or text "") #"\n")
       (map string/trim)
       (remove string/blank?)
       vec))

(hsx/defc create-form
  [pending? set-pending! on-created!]
  (let [[name set-name!] (hooks/use-state "")
        [description set-description!] (hooks/use-state "")
        [redirect-text set-redirect-text!] (hooks/use-state "")
        redirect-uris (redirect-uri-list redirect-text)
        form-valid? (and (not (string/blank? name))
                         (seq redirect-uris))
        create! (fn []
                  (when form-valid?
                    (set-pending! true)
                    (-> (rtc-handler/<create-oauth-app!
                         (cond-> {:name (string/trim name)
                                  :redirect-uris redirect-uris}
                           (not (string/blank? description))
                           (assoc :description (string/trim description))))
                        (p/then on-created!)
                        (p/catch (fn [error]
                                   (notification/show!
                                    (t :settings.developer/request-error)
                                    :error)
                                   (log/error :db-sync/oauth-app-create-failed {:error error})))
                        (p/finally #(set-pending! false)))))]
    [:section.flex.flex-col.gap-3
     [:h2.text-base.font-semibold (t :settings.developer/create-title)]
     [:div.flex.flex-col.gap-1
      [:label.text-sm.opacity-70 (t :settings.developer/name)]
      (shui/input
       {:value name
        :placeholder (t :settings.developer/name-placeholder)
        :on-change #(set-name! (util/evalue %))})]
     [:div.flex.flex-col.gap-1
      [:label.text-sm.opacity-70 (t :settings.developer/description-label)]
      (shui/textarea
       {:value description
        :placeholder (t :settings.developer/description-placeholder)
        :on-change #(set-description! (util/evalue %))})]
     [:div.flex.flex-col.gap-1
      [:label.text-sm.opacity-70 (t :settings.developer/redirect-uris)]
      (shui/textarea
       {:value redirect-text
        :placeholder (t :settings.developer/redirect-uris-placeholder)
        :on-change #(set-redirect-text! (util/evalue %))})
      [:p.text-xs.opacity-60 (t :settings.developer/redirect-uris-hint)]]
     (shui/button
      {:class "self-start"
       :disabled (or pending? (not form-valid?))
       :on-click create!}
      (ui/icon "code" {:size 16})
      (t :settings.developer/create))]))

(hsx/defc created-app
  [app]
  (when-let [client-id (:id app)]
    [:section.flex.flex-col.gap-2.border.p-3.rounded
     [:h2.text-base.font-semibold (t :settings.developer/created-title)]
     [:div.flex.items-center.gap-2
      [:span.text-sm.opacity-70 (t :settings.developer/client-id)]
      [:code.flex-1.break-all.select-all client-id]
      (shui/button
       {:variant "outline"
        :size :sm
        :title (t :ui/copy)
        :on-click (fn []
                    (util/copy-to-clipboard! client-id)
                    (notification/show!
                     (t :settings.developer/copied)
                     :success))}
       (ui/icon "copy" {:size 16}))]
     [:p.text-sm.opacity-70 (status-label (:status app))]]))

(hsx/defc app-list
  [apps load-error? pending? delete!]
  [:section.flex.flex-col.gap-2
   [:h2.text-base.font-semibold (t :settings.developer/existing-title)]
   (cond
     load-error?
     [:p.text-sm.text-red-500 (t :settings.developer/request-error)]

     (nil? apps)
     (ui/loading (t :ui/loading))

     (empty? apps)
     [:p.text-sm.opacity-70 (t :settings.developer/empty)]

     :else
     [:div.divide-y
      (for [{:keys [id name description status redirect-uris review-note]} apps]
        [:div.flex.items-start.justify-between.gap-4.py-3
         {:key id}
         [:div.min-w-0.flex.flex-col.gap-1
          [:div.flex.items-center.gap-2.flex-wrap
           [:span.text-sm.font-medium name]
           [:span.text-xs.opacity-60 (status-label status)]]
          (when (seq description)
            [:p.text-sm.opacity-70 description])
          [:code.break-all.text-xs id]
          [:ul.text-xs.opacity-70
           (for [uri redirect-uris]
             [:li {:key uri} uri])]
          (when (seq review-note)
            [:p.text-xs.opacity-70
             (t :settings.developer/review-note review-note)])]
         (shui/button
          {:variant "ghost"
           :size :sm
           :disabled pending?
           :on-click #(delete! id)}
          (ui/icon "trash" {:size 16})
          (t :settings.developer/delete))])])])

(hsx/defc panel
  []
  (let [[apps set-apps!] (hooks/use-state nil)
        [created set-created!] (hooks/use-state nil)
        [pending? set-pending!] (hooks/use-state false)
        [load-error? set-load-error!] (hooks/use-state false)
        base (rtc-handler/http-base)
        load-apps! (fn []
                     (set-load-error! false)
                     (-> (rtc-handler/<oauth-apps)
                         (p/then (fn [result]
                                   (set-apps! (:apps result))))
                         (p/catch (fn [error]
                                    (set-load-error! true)
                                    (log/error :db-sync/oauth-app-list-failed {:error error})))))
        on-created! (fn [result]
                      (set-created! result)
                      (load-apps!))
        delete! (fn [app-id]
                  (when (js/confirm (t :settings.developer/delete-confirm))
                    (set-pending! true)
                    (-> (rtc-handler/<delete-oauth-app! app-id)
                        (p/then (fn []
                                  (set-apps! (filterv #(not= app-id (:id %)) apps))
                                  (when (= app-id (:id created))
                                    (set-created! nil))))
                        (p/catch (fn [error]
                                   (notification/show!
                                    (t :settings.developer/request-error)
                                    :error)
                                   (log/error :db-sync/oauth-app-delete-failed {:error error})))
                        (p/finally #(set-pending! false)))))]
    (hooks/use-effect!
     (fn []
       (load-apps!)
       nil)
     [])
    [:div.panel-wrap.is-developer.mb-8.flex.flex-col.gap-6
     [:p.text-sm.opacity-70 (t :settings.developer/description)]
     (when base
       [:p.text-sm.opacity-70
        (interpolate-sentence
         (t :settings.developer/usage)
         :placeholders [(str base "/oauth/authorize")
                        (str base "/oauth/token")])])
     (create-form pending? set-pending! on-created!)
     (created-app created)
     (app-list apps load-error? pending? delete!)]))