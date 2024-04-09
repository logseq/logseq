(ns logseq.sdk.experiments
  (:require [frontend.state :as state]
            [frontend.components.page :as page]
            [frontend.util :as util]
            [camel-snake-kebab.core :as csk]
            [goog.object :as gobj]
            [frontend.handler.plugin :as plugin-handler]))

(defn- jsx->clj
  [^js obj]
  (if (js/goog.isObject obj)
    (-> (fn [result k]
          (let [v (gobj/get obj k)
                k (keyword (csk/->kebab-case k))]
            (if (= "function" (goog/typeOf v))
              (assoc result k v)
              (assoc result k (jsx->clj v)))))
      (reduce {} (gobj/getKeys obj)))
    obj))

(defn ^:export cp_page_editor
  [^js props]
  (let [props1 (jsx->clj props)
        name (some-> props1 :page)
        config (some-> props1 (dissoc :page))]
    (when-let [entity (page/get-page-entity name)]
      (page/page-blocks-cp (state/get-current-repo) entity config))))

(defn ^:export register_fenced_code_renderer
  [pid type ^js opts]
  (when-let [^js _pl (plugin-handler/get-plugin-inst pid)]
    (plugin-handler/register-fenced-code-renderer
      (keyword pid) type (reduce #(assoc %1 %2 (aget opts (name %2))) {}
                           [:edit :before :subs :render]))))

(defn ^:export register_route_renderer
  [pid key ^js opts]
  (when-let [^js _pl (plugin-handler/get-plugin-inst pid)]
    (let [key (util/safe-keyword key)]
      (plugin-handler/register-route-renderer
        (keyword pid) key
        (reduce (fn [r k]
                  (assoc r k (cond-> (aget opts (name k))
                               (= :name k)
                               (#(if % (util/safe-keyword %) key)))))
          {} [:v :name :path :subs :render])))))

(defn ^:export register_daemon_renderer
  [pid key ^js opts]
  (when-let [^js _pl (plugin-handler/get-plugin-inst pid)]
    (plugin-handler/register-daemon-renderer
      (keyword pid) key (reduce #(assoc %1 %2 (aget opts (name %2))) {}
                          [:before :subs :render]))))

(defn ^:export register_extensions_enhancer
  [pid type enhancer]
  (when-let [^js _pl (and (fn? enhancer) (plugin-handler/get-plugin-inst pid))]
    (plugin-handler/register-extensions-enhancer
      (keyword pid) type {:enhancer enhancer})))
