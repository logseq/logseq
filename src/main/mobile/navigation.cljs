(ns mobile.navigation
  "Native navigation bridge for mobile (iOS)."
  (:require [clojure.string :as string]
            [frontend.mobile.util :as mobile-util]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]))

(defonce navigation-source (atom nil))
(defonce ^:private initialised? (atom false))

;; Track whether the latest change came from a native back gesture / popstate.
(.addEventListener js/window "popstate" (fn [_] (reset! navigation-source :pop)))

(defn- strip-fragment [href]
  (when (string? href)
    (-> href
        (string/replace-first #"^#/" "/")
        (string/replace-first #"^#" ""))))

(defn- navigation-type [push?]
  (let [src @navigation-source]
    (reset! navigation-source nil)
    (cond
      (= src :pop) "pop"
      (false? push?) "replace"
      (compare-and-set! initialised? false true) "replace" ;; first load
      :else "push")))

(defn notify-route-change!
  "Inform native iOS layer of a route change to keep native stack in sync.
   {route {to keyword, path-params map, query-params map}
    path  string      ;; optional, e.g. \"/page/Today\"
    push  boolean?    ;; optional, explicit push vs replace hint}"
  [{:keys [route path push]}]
  (when (and (mobile-util/native-ios?)
             mobile-util/ui-local)
    (let [nav-type (navigation-type push)
          payload (clj->js (cond-> {:navigationType nav-type
                                    :push (not= nav-type "replace")}
                             route (assoc :route route)
                             (or path (.-hash js/location))
                             (assoc :path (strip-fragment (or path (.-hash js/location))))))]
      (-> (.routeDidChange mobile-util/ui-local payload)
          (p/catch (fn [err]
                     (log/warn :mobile-native-navigation/route-report-failed
                               {:error err
                                :payload payload})))))))
