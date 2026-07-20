(ns frontend.components.query
  (:require [clojure.string :as string]
            [frontend.components.query.result :as query-result]
            [frontend.components.query.view :as query-view]
            [frontend.context.i18n :refer [t]]
            [frontend.date :as date]
            [frontend.extensions.sci :as sci]
            [frontend.rfx :as rfx]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [lambdaisland.glogi :as log]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [io.factorhouse.hsx.core :as hsx]))

(defn- built-in-custom-query?
  [repo-config {:keys [title-key]}]
  (let [queries (get-in repo-config [:default-queries :journals])]
    (when (seq queries)
      (boolean
       (some (fn [built-in-query]
               (and title-key
                    (= (:title-key built-in-query) title-key)))
             queries)))))

(defn- resolve-built-in-query?
  [repo-config built-in-query? q]
  (boolean
   (or built-in-query?
       (built-in-custom-query? repo-config q))))

(hsx/defc custom-query-inner
  [{:keys [dsl-query?] :as config} {:keys [query breadcrumb-show?]}
   {:keys [current-block
           view-f
           result
           group-by-page?]}]
  (let [{:keys [->hiccup]} config
        only-blocks? (and (seq result) (every? uuid? result))]
    [:div.custom-query-results
     (cond
         (and (seq result) view-f)
         (let [result (try
                        (sci/call-fn view-f result)
                        (catch :default error
                          (log/error :custom-view-failed {:error error
                                                          :result result})
                          [:div (t :query/custom-view-error (str error))]))]
           (util/hiccup-keywordize result))

        (and (not (:built-in-query? config)) only-blocks?)
        (when-not (string/blank? query)
          (query-view/query-result (assoc config
                                          :id (str (:block/uuid current-block))
                                          :query query)
                                   current-block result))

         ;; Normally displays built-in-query results
         only-blocks?
         (->hiccup result
                   (assoc config
                          :custom-query? true
                          :current-block (:block/uuid current-block)
                          :dsl-query? dsl-query?
                          :query query
                          :breadcrumb-show? (if (some? breadcrumb-show?)
                                              breadcrumb-show?
                                              true)
                          :group-by-page? group-by-page?
                          :ref? true)
                   {:style {:margin-top "0.25rem"
                            :margin-left "0.25rem"}})

         (seq result)
         (let [result (->>
                       (for [record result]
                         (if (map? record)
                           (str (util/pp-str record) "\n")
                           record))
                       (remove nil?))]
           (when (seq result)
             [:ul
              (for [item result]
                [:li (str item)])]))

         (or (string/blank? query)
             (= query "(and)"))
         nil

       :else
       [:div.text-sm.mt-2.opacity-90 (t :search/no-result)])]))

(hsx/defc query-title
  [config {:keys [title title-key title-icon]} {:keys [result-count]}]
  (let [inline-text (:inline-text config)]
    [:div.custom-query-title.flex.justify-between.w-full
     [:span.title-text
      (cond
        title-key
        [:span
         (when title-icon
           (shui/tabler-icon title-icon {:class "align-middle pr-1"}))
         [:span.align-middle (t title-key)]]

        (vector? title)
        title

        (string? title)
        (inline-text config
                     (get-in config [:block :block/format] :markdown)
                     title)

        :else
        title)]
     (when result-count
       [:span.opacity-60.text-sm.ml-2.results-count
        (t :search/result-count result-count)])]))

(defn- calculate-collapsed?
  [current-block {:keys [collapsed? temp-collapsed?]}]
  (let [collapsed?' (if (some? temp-collapsed?)
                      temp-collapsed?
                      (or collapsed?
                          (:block/collapsed? current-block)))]
    collapsed?'))

(hsx/defc custom-query*
  [{:keys [dsl-query? built-in-query? table? current-block] :as config}
   {:keys [builder query view _collapsed?] :as q}]
  (let [repo-config (state/config-for-repo (rfx/use-sub [:config])
                                           (state/get-current-repo))
        result-transform (:result-transform q)
        q (if (keyword? result-transform)
            (if-let [transform (get-in repo-config
                                       [:query/result-transforms result-transform])]
              (assoc q :result-transform transform)
              (throw (ex-info "Missing query result transform"
                              {:result-transform result-transform})))
            q)
        config (if (some #{:today} (:inputs q))
                 (assoc config :today-day (date/today-journal-day))
                 config)
        *collapsed? (hooks/use-memo #(atom (or (:collapsed? q) (:collapsed? config))) [])
        [collapsed?] (hooks/use-atom *collapsed?)
        result (query-result/use-query-result config q)
        ;; Args for displaying query header and results
        view-fn (if (keyword? view) (get-in repo-config [:query/views view]) view)
        view-f (and view-fn (sci/eval-string (pr-str view-fn)))
        opts {:current-block current-block
              :table? table?
              :view-f view-f
              :result result
              :group-by-page? false}]
       (if (:custom-query? config)
         ;; Don't display recursive results when query blocks are a query result
         [:code (if dsl-query?
                  (t :query/results-for (pr-str query))
                  (t :query/advanced-results))]
         (when-not (and built-in-query? (empty? result))
           [:div.custom-query (get config :attr {})
            (when (and dsl-query? builder) builder)

            (if built-in-query?
              [:div {:style {:margin-left 2}}
               (ui/foldable
                (query-title config q {:result-count (count result)})
                (fn []
                  (custom-query-inner config q opts))
                {:default-collapsed? collapsed?
                 :title-trigger? true
                 :on-pointer-down #(reset! *collapsed? %)})]
              [:div.bd
               (when-not collapsed?
                 (custom-query-inner config q opts))])]))))

(hsx/defc custom-query
  [{:keys [built-in-query?] :as config}
   {:keys [collapsed?] :as q}]
  (ui/catch-error
   (ui/block-error (t :query/error) {:content (:query q)})
   (let [repo-config (state/config-for-repo (rfx/use-sub [:config])
                                            (state/get-current-repo))
         current-block-uuid (or (:block/uuid (:block config))
                                (:block/uuid config))
         current-block (:block config)
         temp-collapsed? (rfx/use-sub [:ui/collapsed-blocks
                                       (state/get-current-repo)
                                       (state/resolve-container-id (:container-id config))
                                       current-block-uuid])
         ;; Get query result
         collapsed?' (calculate-collapsed? current-block
                                           {:collapsed? false
                                            :temp-collapsed? temp-collapsed?})
         built-in-collapsed? (and collapsed? built-in-query?)
         config' (assoc config
                        :current-block current-block
                        :current-block-uuid current-block-uuid
                        :collapsed? collapsed?'
                        :built-in-query? (resolve-built-in-query? repo-config built-in-query? q))]
     (when (or built-in-collapsed? (not collapsed?'))
       (custom-query* config' q)))))
