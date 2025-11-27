(ns logseq.sdk.experiments
  (:require [frontend.components.page :as page]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.sdk.utils :as sdk-util]))

(defn ^:export cp_page_editor
  [^js props]
  (let [props1 (sdk-util/jsx->clj props)
        page-name (some-> props1 :page)]
    (when-let [entity (page/get-page-entity page-name)]
      (page/page-blocks-cp
       entity {:container-id (state/get-next-container-id)}))))

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
