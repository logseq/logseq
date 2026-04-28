(ns logseq.sdk.experiments
  (:require [frontend.components.page :as page]
            [frontend.handler.plugin :as plugin-handler]
            [lambdaisland.glogi :as log]
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

(defn- extract-js-renderer-opts
  "Extract keys from a JS opts object into a clj map.
   `transforms` is an optional map of {keyword transform-fn} for per-key processing.
   Keys whose JS value is nil/undefined are omitted."
  [^js opts ks transforms]
  (reduce (fn [r k]
            (let [v (aget opts (name k))]
              (if (some? v)
                (assoc r k (if-let [xf (get transforms k)]
                             (xf v)
                             v))
                r)))
    {} ks))

(defn ^:export register_hosted_renderer
  [pid key ^js opts]
  (when-let [^js _pl (plugin-handler/get-plugin-inst pid)]
    (plugin-handler/register-hosted-renderer
      (keyword pid) key
      (extract-js-renderer-opts opts [:title :type :mode :subs :render] nil))))

(defn ^:export register_block_properties_renderer
  [pid key ^js opts]
  (when-let [^js _pl (plugin-handler/get-plugin-inst pid)]
    (let [clj-opts (extract-js-renderer-opts
                     opts
                     [:when :mode :priority :subs :render]
                     {:when (fn [v]
                              (if (fn? v)
                                v
                                (js->clj v :keywordize-keys true)))})]
      (plugin-handler/register-hosted-renderer
        (keyword pid) key (assoc clj-opts :type "block-properties")))))

(defn ^:export register_block_renderer
  [pid key ^js opts]
  (when-let [^js _pl (plugin-handler/get-plugin-inst pid)]
    (let [when-predicate (aget opts "when")]
      (if (and (some? when-predicate) (not (fn? when-predicate)))
        (log/error :register-block-renderer-invalid-when
          {:pid pid
           :key key
           :message "`when` for registerBlockRenderer must be a synchronous predicate function."})
        (let [include-children (aget opts "includeChildren")
              clj-opts (extract-js-renderer-opts
                         opts
                         [:when :priority :subs :render]
                         nil)]
          (plugin-handler/register-hosted-renderer
            (keyword pid) key (cond-> (assoc clj-opts :type "block")
                                (some? include-children)
                                (assoc :include-children include-children))))))))

(defn ^:export register_extensions_enhancer
  [pid type enhancer]
  (when-let [^js _pl (and (fn? enhancer) (plugin-handler/get-plugin-inst pid))]
    (plugin-handler/register-extensions-enhancer
      (keyword pid) type {:enhancer enhancer})))
