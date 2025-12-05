(ns mobile.navigation
  "Native navigation bridge for mobile (iOS)."
  (:require [clojure.string :as string]
            [frontend.handler.route :as route-handler]
            [frontend.mobile.util :as mobile-util]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]
            [reitit.frontend.easy :as rfe]))

(defonce navigation-source (atom nil))
(defonce ^:private initialised? (atom false))
(def ^:private primary-stack "main")
(defonce ^:private pending-navigation (atom nil))
(defonce ^:private hooks-installed? (atom false))
(defonce ^:private orig-push-state (atom nil))
(defonce ^:private orig-replace-state (atom nil))

;; Track whether the latest change came from a native back gesture / popstate.
(.addEventListener js/window "popstate" (fn [_] (reset! navigation-source :pop)))

(defn- coerce-stack
  "We only support a single navigation stack today. Warn and coerce any other stack ids."
  [stack]
  (when (and stack (not= stack primary-stack))
    (log/warn :mobile-native-navigation/multi-stack-unsupported
              {:requested stack
               :using primary-stack}))
  primary-stack)

(defn- strip-fragment [href]
  (when (string? href)
    (-> href
        (string/replace-first #"^#/" "/")
        (string/replace-first #"^#" ""))))

(defn- record-navigation-intent!
  [{:keys [type stack]}]
  (reset! pending-navigation {:type type
                              :stack (coerce-stack stack)}))

(defn install-navigation-hooks!
  "Wrap reitit navigation helpers so we know whether a change was push or replace.
   This keeps the native stack in sync without supporting multiple stacks yet."
  []
  (when (compare-and-set! hooks-installed? false true)
    (reset! orig-push-state rfe/push-state)
    (reset! orig-replace-state rfe/replace-state)
    (set! rfe/push-state
          (fn [& args]
            (record-navigation-intent! {:type :push})
            (apply @orig-push-state args)))
    (set! rfe/replace-state
          (fn [& args]
            (record-navigation-intent! {:type :replace})
            (apply @orig-replace-state args)))))

(defn- consume-navigation-intent!
  []
  (let [intent @pending-navigation]
    (reset! pending-navigation nil)
    intent))

(defn- next-navigation!
  [{:keys [push stack]}]
  (let [src @navigation-source
        intent (consume-navigation-intent!)
        stack (coerce-stack (or stack (:stack intent) primary-stack))
        nav-type (cond
                   (= src :pop) "pop"
                   (false? push) "replace"
                   (= (:type intent) :replace) "replace"
                   (= (:type intent) :push) "push"
                   (true? push) "push"
                   (compare-and-set! initialised? false true) ;; first load
                   "replace"
                   :else "push")]
    (reset! navigation-source nil)
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
    path  string      ;; optional, e.g. \"/page/Today\"
    push  boolean?    ;; optional, explicit push vs replace hint}"
  [{:keys [route path push stack]}]
  (when (and (mobile-util/native-ios?)
             mobile-util/ui-local)
    (let [{:keys [navigation-type push? stack]} (next-navigation! {:push push
                                                                   :stack stack})
          payload (cond-> {:navigationType navigation-type
                           :push push?
                           :stack stack}
                    route (assoc :route route)
                    (or path (.-hash js/location))
                    (assoc :path (strip-fragment (or path (.-hash js/location)))))]
      (notify-route-payload! payload))))

(defn reset-route!
  []
  (route-handler/redirect-to-home! false)
  (notify-route-payload!
   {:navigationType "reset"
    :push false
    :stack primary-stack}))
