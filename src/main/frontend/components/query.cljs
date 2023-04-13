(ns frontend.components.query
  (:require [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.state :as state]
            [frontend.search :as search]
            [frontend.db :as db]
            [frontend.db-mixins :as db-mixins]
            [clojure.string :as string]
            [frontend.db.query-dsl :as query-dsl]
            [frontend.components.query-table :as query-table]
            [frontend.db.utils :as db-utils]
            [lambdaisland.glogi :as log]
            [frontend.extensions.sci :as sci]
            [frontend.handler.editor :as editor-handler]
            [logseq.graph-parser.util :as gp-util]
            [promesa.core :as p]))

(defn built-in-custom-query?
  [title]
  (let [queries (get-in (state/sub-config) [:default-queries :journals])]
    (when (seq queries)
      (boolean (some #(= % title) (map :title queries))))))

(defn- trigger-custom-query!
  [state *query-error *query-triggered?]
  (let [[config query] (:rum/args state)
        repo (state/get-current-repo)
        result-atom (atom nil)
        current-block-uuid (or (:block/uuid (:block config))
                               (:block/uuid config))
        _ (reset! *query-error nil)
        query-atom (try
                     (cond
                       (:dsl-query? config)
                       (let [q (:query query)
                             form (gp-util/safe-read-string q)]
                         (cond
                           ;; Searches like 'foo' or 'foo bar' come back as symbols
                           ;; and are meant to go directly to full text search
                           (and (util/electron?) (symbol? form)) ; full-text search
                           (p/let [blocks (search/block-search repo (string/trim (str form)) {:limit 30})]
                             (when (seq blocks)
                               (let [result (db/pull-many (state/get-current-repo) '[*] (map (fn [b] [:block/uuid (uuid (:block/uuid b))]) blocks))]
                                 (reset! result-atom result))))

                           (symbol? form)
                           (atom nil)

                           :else
                           (query-dsl/query (state/get-current-repo) q)))

                       :else
                       (db/custom-query query {:current-block-uuid current-block-uuid}))
                     (catch :default e
                       (reset! *query-error e)
                       (atom nil)))]
    (when *query-triggered?
      (reset! *query-triggered? true))
    (if (instance? Atom query-atom)
      query-atom
      result-atom)))

(rum/defc query-refresh-button
  [query-time {:keys [on-mouse-down full-text-search?]}]
  (ui/tippy
   {:html  [:div
            [:p
             (if full-text-search?
               [:span "Full-text search results will not be refreshed automatically."]
               [:span (str "This query takes " (int query-time) "ms to finish, it's a bit slow so that auto refresh is disabled.")])]
            [:p
             "Click the refresh button instead if you want to see the latest result."]]
    :interactive     true
    :popperOptions   {:modifiers {:preventOverflow
                                  {:enabled           true
                                   :boundariesElement "viewport"}}}
    :arrow true}
   [:a.fade-link.flex
    {:on-mouse-down on-mouse-down}
    (ui/icon "refresh" {:style {:font-size 20}})]))

(defn- get-query-result
  [state config *query-error *query-triggered? current-block-uuid q not-grouped-by-page? ]
  (or (when-let [*result (:query-result config)] @*result)
      (let [query-atom (trigger-custom-query! state *query-error *query-triggered?)
            query-result (and query-atom (rum/react query-atom))
            ;; exclude the current one, otherwise it'll loop forever
            remove-blocks (if current-block-uuid [current-block-uuid] nil)
            transformed-query-result (when query-result
                                       (db/custom-query-result-transform query-result remove-blocks q))
            result (if (and (:block/uuid (first transformed-query-result)) (not not-grouped-by-page?))
                     (let [result (db-utils/group-by-page transformed-query-result)]
                       (if (map? result)
                         (dissoc result nil)
                         result))
                     transformed-query-result)]
        (when query-atom
          (util/safe-with-meta result (meta @query-atom))))))

(rum/defcs custom-query-inner < rum/reactive
  [state config {:keys [query children? breadcrumb-show?]}
   {:keys [query-error-atom
           current-block
           table?
           dsl-query?
           page-list?
           view-f
           result]}]
  (let [{:keys [->hiccup ->elem inline-text page-cp map-inline]} config
        *query-error query-error-atom
        not-grouped-by-page? (or table?
                                 (and (string? query) (string/includes? query "(by-page false)")))
        only-blocks? (:block/uuid (first result))
        blocks-grouped-by-page? (and (seq result)
                                     (not not-grouped-by-page?)
                                     (coll? (first result))
                                     (:block/name (ffirst result))
                                     (:block/uuid (first (second (first result))))
                                     true)]
    (if @*query-error
      (do
        (log/error :exception @*query-error)
        [:div.warning.my-1 "Query failed: "
         [:p (.-message @*query-error)]])
      [:div.custom-query-results
       (cond
         (and (seq result) view-f)
         (let [result (try
                        (sci/call-fn view-f result)
                        (catch :default error
                          (log/error :custom-view-failed {:error error
                                                          :result result})
                          [:div "Custom view failed: "
                           (str error)]))]
           (util/hiccup-keywordize result))

         page-list?
         (query-table/result-table config current-block result {:page? true} map-inline page-cp ->elem inline-text)

         table?
         (query-table/result-table config current-block result {:page? false} map-inline page-cp ->elem inline-text)

         (and (seq result) (or only-blocks? blocks-grouped-by-page?))
         (->hiccup result
                   (cond-> (assoc config
                                  :custom-query? true
                                  :dsl-query? dsl-query?
                                  :query query
                                  :breadcrumb-show? (if (some? breadcrumb-show?)
                                                      breadcrumb-show?
                                                      true)
                                  :group-by-page? blocks-grouped-by-page?
                                  :ref? true)
                     children?
                     (assoc :ref? true))
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
         [:div.text-sm.mt-2.opacity-90 "No matched result"])])))

(rum/defc query-title
  [config title {:keys [result-count]}]
  (let [inline-text (:inline-text config)]
    [:div.custom-query-title.flex.justify-between.w-full
     [:span.title-text (cond
                         (vector? title) title
                         (string? title) (inline-text config
                                                      (get-in config [:block :block/format] :markdown)
                                                      title)
                         :else title)]
     (when result-count
       [:span.opacity-60.text-sm.ml-2.results-count
        (str result-count (if (> result-count 1) " results" " result"))])]))

(rum/defcs ^:large-vars/cleanup-todo custom-query* < rum/reactive rum/static db-mixins/query
  (rum/local nil ::query-result)
  {:init (fn [state] (assoc state :query-error (atom nil)))}
  [state config {:keys [title builder query view collapsed? table-view?] :as q} *query-triggered?]
  (let [*query-error (:query-error state)
        built-in? (built-in-custom-query? title)
        dsl-query? (:dsl-query? config)
        current-block-uuid (or (:block/uuid (:block config))
                               (:block/uuid config))
        current-block (db/entity [:block/uuid current-block-uuid])
        temp-collapsed? (state/sub-collapsed current-block-uuid)
        collapsed?' (if (some? temp-collapsed?)
                      temp-collapsed?
                      (or
                       collapsed?
                       (:block/collapsed? current-block)))
        table? (or table-view?
                   (get-in current-block [:block/properties :query-table])
                   (and (string? query) (string/ends-with? (string/trim query) "table")))
        view-fn (if (keyword? view) (get-in (state/sub-config) [:query/views view]) view)
        view-f (and view-fn (sci/eval-string (pr-str view-fn)))
        dsl-page-query? (and dsl-query?
                             (false? (:blocks? (query-dsl/parse-query query))))
        full-text-search? (and dsl-query?
                               (util/electron?)
                               (symbol? (gp-util/safe-read-string query)))
        not-grouped-by-page? (or table?
                                 (and (string? query) (string/includes? query "(by-page false)")))
        result (when-not collapsed?'
                 (get-query-result state config *query-error *query-triggered? current-block-uuid q not-grouped-by-page?))
        query-time (:query-time (meta result))
        page-list? (and (seq result)
                        (some? (:block/name (first result))))
        opts {:query-error-atom *query-error
              :current-block current-block
              :dsl-query? dsl-query?
              :table? table?
              :view-f view-f
              :page-list? page-list?
              :result result}]
    (if (:custom-query? config)
      [:code (if dsl-query?
               (util/format "{{query %s}}" query)
               "{{query hidden}}")]
      (when-not (and built-in? (empty? result))
        [:div.custom-query (get config :attr {})
         (when-not built-in?
           [:div.th
            (if dsl-query?
              [:div.flex.flex-1.flex-row
               (ui/icon "search" {:size 14})
               [:div.ml-1 (str "Live query" (when dsl-page-query? " for pages"))]]
              [:div {:style {:font-size "initial"}} title])

            (when (or (not dsl-query?) (not collapsed?'))
              [:div.flex.flex-row.items-center.fade-in
               (when (> (count result) 0)
                 [:span.results-count
                  (let [result-count (if (and (not table?) (map? result))
                                       (apply + (map (comp count val) result))
                                       (count result))]
                    (str result-count (if (> result-count 1) " results" " result")))])

               (when (and current-block (not view-f) (nil? table-view?) (not page-list?))
                 (if table?
                   [:a.flex.ml-1.fade-link {:title "Switch to list view"
                                            :on-click (fn [] (editor-handler/set-block-property! current-block-uuid
                                                                                                 "query-table"
                                                                                                 false))}
                    (ui/icon "list" {:style {:font-size 20}})]
                   [:a.flex.ml-1.fade-link {:title "Switch to table view"
                                            :on-click (fn [] (editor-handler/set-block-property! current-block-uuid
                                                                                                 "query-table"
                                                                                                 true))}
                    (ui/icon "table" {:style {:font-size 20}})]))

               [:a.flex.ml-1.fade-link
                {:title "Setting properties"
                 :on-click (fn []
                             (let [all-keys (query-table/get-keys result page-list?)]
                               (state/pub-event! [:modal/set-query-properties current-block all-keys])))}
                (ui/icon "settings" {:style {:font-size 20}})]

               [:div.ml-1
                (when (or full-text-search?
                          (and query-time (> query-time 50)))
                  (query-refresh-button query-time {:full-text-search? full-text-search?
                                                    :on-mouse-down (fn [e]
                                                                     (util/stop e)
                                                                     (trigger-custom-query! state *query-error *query-triggered?))}))]])])

         (when dsl-query? builder)

         (if built-in?
           [:div {:style {:margin-left 2}}
            (ui/foldable
             (query-title config title {:result-count (count result)})
             (fn []
               (custom-query-inner config q opts))
             {:default-collapsed? collapsed?
              :title-trigger? true})]
           [:div.bd
            (when-not collapsed?'
              (custom-query-inner config q opts))])]))))

(rum/defcs custom-query < rum/static
  (rum/local false ::query-triggered?)
  [state config q]
  (ui/catch-error
   (ui/block-error "Query Error:" {:content (:query q)})
   (ui/lazy-visible
    (fn []
      (custom-query* config q (::query-triggered? state)))
    {:debug-id q
     :trigger-once? false})))
