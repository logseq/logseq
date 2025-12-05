(ns mobile.navigation
  "Native navigation bridge for mobile (iOS)."
  (:require [clojure.string :as string]
            [frontend.handler.route :as route-handler]
            [frontend.mobile.util :as mobile-util]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]
            [reitit.frontend.easy :as rfe]))

(defonce navigation-source (atom nil))
(defonce ^:private initialised-stacks (atom {}))
(def ^:private primary-stack "home")
(defonce ^:private active-stack (atom primary-stack))
(defonce ^:private stack-history (atom {}))
(defonce ^:private pending-navigation (atom nil))
(defonce ^:private hooks-installed? (atom false))

;; Track whether the latest change came from a native back gesture / popstate.
(.addEventListener js/window "popstate" (fn [_] (reset! navigation-source :pop)))

(defn current-stack
  []
  @active-stack)

(defn set-current-stack!
  [stack]
  (when (some? stack)
    (reset! active-stack stack)))

(defn- strip-fragment [href]
  (when (string? href)
    (-> href
        (string/replace-first #"^#/" "/")
        (string/replace-first #"^#" ""))))

(defn- current-path
  []
  (let [p (strip-fragment (.-hash js/location))]
    (if (string/blank? p) "/" p)))

(defn- virtual-path?
  [path]
  (and (string? path) (string/starts-with? path "/__stack__/")))

(defn- stack-defaults
  [stack]
  (let [name (keyword stack)
        path (if (= stack primary-stack) "/" (str "/__stack__/" stack))]
    {:path path
     :route (when (= stack primary-stack)
              {:to :home
               :path-params {}
               :query-params {}})
     :route-match {:data {:name (if (= stack primary-stack) :home name)}
                   :parameters {:path {} :query {}}}}))

(defn- record-navigation-intent!
  [{:keys [type stack]}]
  (let [stack (or stack @active-stack primary-stack)]
    (reset! pending-navigation {:type type
                                :stack stack})))

(defonce orig-push-state rfe/push-state)
(defn push-state
  "Sets the new route, leaving previous route in history."
  ([k]
   (push-state k nil nil))
  ([k params]
   (push-state k params nil))
  ([k params query]
   (record-navigation-intent! {:type :push
                               :stack @active-stack})
   (orig-push-state k params query)))

(defonce orig-replace-state rfe/replace-state)
(defn- replace-state
  ([k]
   (replace-state k nil nil))
  ([k params]
   (replace-state k params nil))
  ([k params query]
   (record-navigation-intent! {:type :replace
                               :stack @active-stack})
   (orig-replace-state k params query)))

(defn install-navigation-hooks!
  "Wrap reitit navigation helpers so we know whether a change was push or replace.
   Also tags navigation with the active stack so native can keep per-stack history."
  []
  (when (compare-and-set! hooks-installed? false true)
    (set! rfe/push-state push-state)
    (set! rfe/replace-state replace-state)))

(defn- consume-navigation-intent!
  []
  (let [intent @pending-navigation]
    (reset! pending-navigation nil)
    intent))

(defn- ensure-stack
  [stack]
  (swap! stack-history #(if (contains? % stack)
                          %
                          (assoc % stack {:history [(stack-defaults stack)]})))
  stack)

(defn- stack-top
  [stack]
  (-> @stack-history (get stack) :history last))

(defn- remember-route!
  [stack nav-type route path route-match]
  (when stack
    (let [stack (ensure-stack stack)
          path (or path (current-path))
          entry (when path {:path path :route route :route-match route-match})
          update-history
          (fn [history]
            (let [history (vec history)
                  last-path (:path (last history))]
              (case nav-type
                "pop" (if (> (count history) 1) (vec (butlast history)) history)
                "replace" (if (seq history)
                            (conj (vec (butlast history)) entry)
                            [entry])
                "push" (if (= last-path (:path entry))
                         (conj (vec (butlast history)) entry)
                         (conj history entry))
                history)))]
      (when entry
        (swap! stack-history update stack (fn [{:keys [history] :as st}]
                                            {:history (update-history history)}))
        (swap! initialised-stacks assoc stack true)))))

(defn reset-stack-history!
  [stack]
  (when stack
    (swap! stack-history assoc stack {:history [(stack-defaults stack)]})
    (swap! initialised-stacks dissoc stack)))

(defn- next-navigation!
  [{:keys [push stack nav-type]}]
  (let [src @navigation-source
        intent (consume-navigation-intent!)
        stack (or stack (:stack intent) @active-stack primary-stack)
        first? (not (get @initialised-stacks stack))
        nav-type (or nav-type
                     (cond
                       (= src :pop) "pop"
                       (false? push) "replace"
                       (= (:type intent) :replace) "replace"
                       first? "replace"
                       (= (:type intent) :push) "push"
                       (true? push) "push"
                       :else "push"))]
    (reset! navigation-source nil)
    (when first?
      (swap! initialised-stacks assoc stack true))
    {:navigation-type nav-type
     :push? (= nav-type "push")
     :stack stack}))

(defn- notify-route-payload!
  [payload]
  (-> (.routeDidChange mobile-util/ui-local (clj->js payload))
      (p/catch (fn [err]
                 (log/warn :mobile-native-navigation/route-report-failed
                           {:error err
                            :payload payload})))))

(defn notify-route-change!
  "Inform native iOS layer of a route change to keep native stack in sync.
   {route {to keyword, path-params map, query-params map}
    route-match map   ;; optional full route match for fast restoration
    path  string      ;; optional, e.g. \"/page/Today\"
    push  boolean?    ;; optional, explicit push vs replace hint}"
  [{:keys [route route-match path push stack]}]
  (let [{:keys [navigation-type push? stack]} (next-navigation! {:push push
                                                                 :nav-type (:navigation-type route-match)
                                                                 :stack (or stack (current-stack))})
        stack (or stack (current-stack))
        path (or path (current-path))]
    (set-current-stack! stack)
    (remember-route! stack navigation-type route path route-match)
    (when (and (mobile-util/native-ios?)
               mobile-util/ui-local)
      (let [payload (cond-> {:navigationType navigation-type
                             :push push?
                             :stack stack}
                      route (assoc :route route)
                      path (assoc :path (strip-fragment path)))]
        (notify-route-payload! payload)))))

(defn reset-route!
  []
  (route-handler/redirect-to-home! false)
  (let [stack (current-stack)]
    (reset-stack-history! stack)
    (notify-route-payload!
     {:navigationType "reset"
      :push false
      :stack stack})))

(defn switch-stack!
  "Activate a stack and restore its last known route if different from current location."
  [stack]
  (when stack
    (let [stack (ensure-stack stack)]
      (set-current-stack! stack)
      (when-let [{:keys [path route route-match]} (stack-top stack)]
        (let [route-match (or route-match (:route-match (stack-defaults stack)))
              path (or path (current-path))]
          ;; Update local route state immediately for UI (header, page context) without full router churn.
          (route-handler/set-route-match! route-match)
          ;; Avoid triggering native navigation on stack switches; we rely on per-stack
          ;; history and UI updates handled in JS for snappy tab changes.
          )))))
