(ns frontend.handler.search
  "Provides util handler fns for search"
  (:require [clojure.string :as string]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.handler.notification :as notification]
            [frontend.search :as search]
            [frontend.state :as state]
            [frontend.util :as util]
            [promesa.core :as p]
            [logseq.graph-parser.text :as text]
            [electron.ipc :as ipc]
            [dommy.core :as dom]))

(defn sanity-search-content
  "Convert a block to the display contents for searching"
  [format content]
  (text/remove-level-spaces content format (config/get-block-pattern format)))

(defn search
  "The aggretation of search results"
  ([q]
   (search (state/get-current-repo) q))
  ([repo q]
   (search repo q {:limit 10}))
  ([repo q {:keys [page-db-id limit more?]
            :or {page-db-id nil
                 limit 10}
            :as opts}]
   (when-not (string/blank? q)
     (let [page-db-id (if (string? page-db-id)
                        (:db/id (db/entity repo [:block/name (util/page-name-sanity-lc page-db-id)]))
                        page-db-id)
           opts (if page-db-id (assoc opts :page (str page-db-id)) opts)]
       (p/let [blocks (search/block-search repo q opts)
               pages-content (search/page-content-search repo q opts)]
         (let [result (merge
                       {:blocks blocks
                        :has-more? (= limit (count blocks))}
                       (when-not page-db-id
                         {:pages-content pages-content
                          :pages (search/page-search q)
                          :files (search/file-search q)}))
               search-key (if more? :search/more-result :search/result)]
           (swap! state/state assoc search-key result)
           result))))))

(defn open-find-in-page!
  []
  (when (util/electron?)
    (let [{:keys [active?]} (:ui/find-in-page @state/state)]
      (when-not active? (state/set-state! [:ui/find-in-page :active?] true)))))

(defn electron-find-in-page!
  []
  (when (util/electron?)
    (let [{:keys [active? backward? match-case? q]} (:ui/find-in-page @state/state)
          option (cond->
                  {}

                   (not active?)
                   (assoc :findNext true)

                   backward?
                   (assoc :forward false)

                   match-case?
                   (assoc :matchCase true))]
      (open-find-in-page!)
      (when-not (string/blank? q)
        (dom/set-style! (dom/by-id "search-in-page-input")
                        :visibility "hidden")
        (when (> (count q) 1)
          (dom/set-html! (dom/by-id "search-in-page-placeholder")
                         (util/format
                          "<span><span>%s</span><span style=\"margin-left: -4px;\">%s</span></span>"
                          (first q)
                          (str " " (subs q 1)))))
        (ipc/ipc "find-in-page" q option)))))

(let [cancelable-debounce-search (util/cancelable-debounce electron-find-in-page! 500)]
  (defonce debounced-search (first cancelable-debounce-search))
  (defonce stop-debounced-search! (second cancelable-debounce-search)))

(defn loop-find-in-page!
  [backward?]
  (when (and (get-in @state/state [:ui/find-in-page :active?])
             (not (state/editing?)))
    (state/set-state! [:ui/find-in-page :backward?] backward?)
    (debounced-search)))

(defn electron-exit-find-in-page!
  [& {:keys [clear-state?]
      :or {clear-state? true}}]
  (when (util/electron?)
    (ipc/ipc "clear-find-in-page")
    (when clear-state?
      (state/set-state! :ui/find-in-page nil))))

(defn clear-search!
  ([]
   (clear-search! true))
  ([clear-search-mode?]
   (let [m {:search/result nil
            :search/q ""}]
     (swap! state/state merge m)
     (when config/lsp-enabled? (state/reset-plugin-search-engines)))
   (when (and clear-search-mode? (not= (state/get-search-mode) :graph))
     (state/set-search-mode! :global))))

(defn rebuild-indices!
  ([]
   (rebuild-indices! false))
  ([notice?]
   (println "Starting to rebuild search indices!")
   (p/let [_ (search/rebuild-indices!)]
     (when notice?
       (notification/show!
        "Search indices rebuilt successfully!"
        :success)))))

(defn highlight-exact-query
  [content q]
  (if (or (string/blank? content) (string/blank? q))
    content
    (when (and content q)
      (let [q-words (string/split q #" ")
            lc-content (util/search-normalize content (state/enable-search-remove-accents?))
            lc-q (util/search-normalize q (state/enable-search-remove-accents?))]
        (if (and (string/includes? lc-content lc-q)
                 (not (util/safe-re-find #" " q)))
          (let [i (string/index-of lc-content lc-q)
                [before after] [(subs content 0 i) (subs content (+ i (count q)))]]
            [:div
             (when-not (string/blank? before)
               [:span before])
             [:mark.p-0.rounded-none (subs content i (+ i (count q)))]
             (when-not (string/blank? after)
               [:span after])])
          (let [elements (loop [words q-words
                                content content
                                result []]
                           (if (and (seq words) content)
                             (let [word (first words)
                                   lc-word (util/search-normalize word (state/enable-search-remove-accents?))
                                   lc-content (util/search-normalize content (state/enable-search-remove-accents?))]
                               (if-let [i (string/index-of lc-content lc-word)]
                                 (recur (rest words)
                                        (subs content (+ i (count word)))
                                        (vec
                                         (concat result
                                                 [[:span (subs content 0 i)]
                                                  [:mark.p-0.rounded-none (subs content i (+ i (count word)))]])))
                                 (recur nil
                                        content
                                        result)))
                             (conj result [:span content])))]
            [:p {:class "m-0"} elements]))))))
