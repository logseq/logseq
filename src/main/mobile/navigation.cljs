(ns mobile.navigation
  "Native navigation bridge for mobile."
  (:require [clojure.string :as string]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.route :as route-handler]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [lambdaisland.glogi :as log]
            [logseq.shui.dialog.core :as shui-dialog]
            [promesa.core :as p]
            [reitit.frontend.easy :as rfe]))

;; Each tab owns a navigation stack
(defonce navigation-source (atom nil))
(defonce ^:private initialised-stacks (atom {}))
(def ^:private primary-stack "home")
(defonce ^:private active-stack (atom primary-stack))
(defonce ^:private stack-history (atom {}))
(defonce ^:private pending-navigation (atom nil))
(defonce ^:private hooks-installed? (atom false))

;; Track whether the latest change came from a native back gesture / popstate.
(.addEventListener js/window "popstate" (fn [_]
                                          (reset! navigation-source :pop)))

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
          ;; Normalize & sanitize
          raw-path (or path (current-path))
          path (if (string/blank? raw-path) "/" raw-path)
          route-match (or route-match (:route-match (stack-defaults stack)))
          route (or route (:route (stack-defaults stack)))
          entry {:path path :route route :route-match route-match}

          update-history
          (fn [history]
            (let [history (vec history)
                  last-path (:path (last history))]
              (case nav-type
                "replace" (if (seq history)
                            (conj (vec (butlast history)) entry)
                            [entry])

                "push" (if (= last-path path)
                         (conj (vec (butlast history)) entry)
                         (conj history entry))

                history)))]
      (swap! stack-history update stack
             (fn [{:keys [history]}]
               {:history (update-history history)}))

      (swap! initialised-stacks assoc stack true))))

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
  "Inform native iOS layer of a route change to keep native stack in sync."
  [{:keys [route route-match path push stack]}]
  (let [{:keys [navigation-type push? stack]} (next-navigation! {:push push
                                                                 :nav-type (:navigation-type route-match)
                                                                 :stack (or stack (current-stack))})
        stack (or stack (current-stack))
        path (-> (or path (current-path))
                 (strip-fragment))
        path (if (string/blank? path) "/" path)]
    (set-current-stack! stack)
    (remember-route! stack navigation-type route path route-match)
    (when (and (mobile-util/native-platform?)
               mobile-util/ui-local)
      (let [payload (cond-> {:navigationType navigation-type
                             :push push?
                             :stack stack}
                      route (assoc :route route)
                      path (assoc :path (strip-fragment path)))]
        (notify-route-payload! payload)))))

(comment
  (defn reset-route!
    []
    (route-handler/redirect-to-home! false)
    (let [stack (current-stack)]
      (reset-stack-history! stack)
      (notify-route-payload!
       {:navigationType "reset"
        :push false
        :stack stack}))))

(defn switch-stack!
  "Activate a stack and restore its last known route."
  [stack]
  (when stack
    (let [stack (ensure-stack stack)
          current @active-stack]
      (set-current-stack! stack)
      (when-let [{:keys [path route route-match]} (stack-top stack)]
        (let [route-match (or route-match (:route-match (stack-defaults stack)))
              path        (or path (current-path))]
          (route-handler/set-route-match! route-match)
          (when (= current "search")
            ;; reset to :home
            (orig-replace-state :home nil nil))
          (notify-route-change!
           {:route {:to          (or (get-in route [:data :name])
                                     (get-in route-match [:data :name]))
                    :path-params (or (:path-params route)
                                     (get-in route-match [:parameters :path]))
                    :query-params (or (:query-params route)
                                      (get-in route-match [:parameters :query]))}
            :path  path
            :stack stack
            :push  false}))))))

(defn pop-modal!
  []
  (cond
    ;; lightbox
    (js/document.querySelector ".pswp")
    (some-> js/window.photoLightbox (.destroy))

    (shui-dialog/has-modal?)
    (shui-dialog/close!)

    (not-empty (state/get-selection-blocks))
    (editor-handler/clear-selection!)

    (state/editing?)
    (editor-handler/escape-editing)

    :else false))

(defn pop-stack!
  "Pop one route from the current stack, update router via replace-state.
   Called when native UINavigationController pops (back gesture / back button)."
  []
  (let [stack (current-stack)
        {:keys [history]} (get @stack-history stack)
        history (vec history)]
    ;; back to search root
    (when (and
           (mobile-util/native-android?)
           (= stack "search")
           (= (count history) 2))
      (.showSearchUiNative ^js (.. js/Capacitor -Plugins -LiquidTabsPlugin)))
    (when (>= (count history) 1)
      (let [root-history? (= (count history) 1)
            new-history (if root-history?
                          history
                          (subvec history 0 (dec (count history))))
            {:keys [route-match]} (peek new-history)
            route-match   (or route-match (:route-match (stack-defaults stack)))
            route-name    (get-in route-match [:data :name])
            path-params   (get-in route-match [:parameters :path])
            query-params  (get-in route-match [:parameters :query])]

        (swap! stack-history assoc stack {:history new-history})

        ;; Pretend this came from a pop for next-navigation!
        (reset! navigation-source :pop)

        ;; Use *original* replace-state to avoid recording a :replace intent.
        (orig-replace-state route-name path-params query-params)

        (route-handler/set-route-match! route-match)))))

(defn pop-to-root!
  "Pop current or given stack back to its root entry and notify navigation."
  ([] (pop-to-root! (current-stack)))
  ([stack]
   (when stack
     (let [{:keys [history]} (get @stack-history stack)
           root (or (first history) (stack-defaults stack))
           {:keys [route route-match path]} root
           route-match (or route-match (:route-match (stack-defaults stack)))
           path (or path (current-path))
           route (or route {:to (get-in route-match [:data :name])
                            :path-params (get-in route-match [:parameters :path])
                            :query-params (get-in route-match [:parameters :query])})]
       (swap! stack-history assoc stack {:history [root]})
       (set-current-stack! stack)
       ;; Use original replace-state to avoid recording a push intent.
       (orig-replace-state (get-in route-match [:data :name])
                           (get-in route-match [:parameters :path])
                           (get-in route-match [:parameters :query]))
       (route-handler/set-route-match! route-match)
       (notify-route-change!
        {:route route
         :route-match route-match
         :path path
         :stack stack
         :push false})))))

(defn ^:export install-native-bridge!
  []
  (set! (.-LogseqNative js/window)
        (clj->js
         {:onNativePop (fn []
                         (when (false? (pop-modal!))
                           (pop-stack!)))})))
