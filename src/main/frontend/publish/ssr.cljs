(ns frontend.publish.ssr
  "SSR entry for published pages."
  (:require ["react" :as react]
            ["react-dom/server" :as react-dom-server]
            [datascript.core :as d]
            [frontend.components.page :as page]
            [frontend.db.conn-state :as conn-state]
            [frontend.state :as state]
            [logseq.db :as ldb]
            [logseq.db.frontend.schema :as db-schema]
            [rum.core :as rum]))

(def ^:private minimal-css
  (str
   "html,body{margin:0;padding:0;background:#fff;color:#111;}",
   "body{font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;}",
   ".cp__page-inner-wrap{max-width:900px;margin:0 auto;padding:32px 24px;}",
   ".page-inner{gap:24px;}",
   ".page-title{font-size:28px;font-weight:600;margin:0;}",
   ".ls-page-blocks{margin-top:16px;}",
   ".ls-block{margin:6px 0;}",
   ".block-content{line-height:1.6;}",
   "a{color:#2563eb;text-decoration:none;}",
   "a:hover{text-decoration:underline;}"))

(defn- ensure-global-stubs!
  []
  (let [g js/globalThis]
    (when-not (.-React g)
      (set! (.-React g) react))
    (when-not (.-ReactDOMServer g)
      (set! (.-ReactDOMServer g) react-dom-server))
    (when-not (.-window g)
      (set! (.-window g) g))
    (when-not (.-document g)
      (set! (.-document g)
            #js {:getElementById (fn [_] nil)
                 :getElementsByClassName (fn [_] #js [])
                 :querySelector (fn [_] nil)}))
    (when-not (.-navigator g)
      (set! (.-navigator g) #js {:userAgent ""}))))

(defn- prepare-state!
  [repo conn]
  (swap! conn-state/conns assoc repo conn)
  (state/set-current-repo! repo)
  (swap! state/state merge
         {:git/current-repo repo
          :route-match {:data {:name :page}}
          :config {repo {}}}))

(defn- render-page-html
  [db page-uuid]
  (let [entity (d/entity db [:block/uuid page-uuid])
        title (or (:block/title entity) "Logseq Publish")
        body (rum/render-static-markup
              [:div#root
               (page/page-inner {:page entity :repo (state/get-current-repo)})])]
    (str "<!doctype html>"
         "<html><head><meta charset=\"utf-8\"/>"
         "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"/>"
         "<title>" title "</title>"
         "<style>" minimal-css "</style>"
         "</head><body>"
         body
         "</body></html>")))

(defn ^:export render-page
  "Render a published page HTML string from transit payload and page uuid string."
  [transit-str page-uuid-str]
  (ensure-global-stubs!)
  (let [payload (ldb/read-transit-str transit-str)
        datoms (:datoms payload)
        repo (:publish/graph payload)
        conn (d/conn-from-datoms datoms db-schema/schema)
        page-uuid (uuid page-uuid-str)]
    (prepare-state! repo conn)
    (render-page-html @conn page-uuid)))

(set! (.-logseqPublishRender js/globalThis) render-page)
