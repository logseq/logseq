(ns frontend.page
  (:require [rum.core :as rum]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.components.sidebar :as sidebar]
            [frontend.handler.plugin :refer [lsp-enabled?] :as plugin-handler]
            [frontend.context.i18n :as i18n]))

(rum/defc route-view
  [view route-match]
  (view route-match))

(rum/defc current-page < rum/reactive
  {:did-mount    (fn [state]
                   (state/set-root-component! (:rum/react-component state))
                   (state/setup-electron-updater!)
                   (ui/inject-document-devices-envs!)
                   (ui/inject-dynamic-style-node!)
                   (plugin-handler/host-mounted!)
                   (let [td-fns [(ui/setup-active-keystroke!)
                                 (ui/setup-active-keystroke!)]
                         teardown-fn #(mapv (fn [f] (f)) td-fns)]
                     (assoc state ::teardown teardown-fn)))
   :will-unmount (fn [state]
                   (let [teardown (::teardown state)]
                     (when-not (nil? teardown)
                       (teardown))))}
  []
  (when-let [route-match (state/sub :route-match)]
    (i18n/tongue-provider
     (let [route-name (get-in route-match [:data :name])]
       (if-let [view (:view (:data route-match))]
         (if (= :draw route-name)
           (view route-match)
           (sidebar/sidebar
            route-match
            (view route-match))))))))

        ;; FIXME: disable for now
        ;; (let [route-name (get-in route-match [:data :name])
        ;;       no-animate? (contains? #{:repos :repo-add :file}
        ;;                              route-name)]
        ;;   (when-let [view (:view (:data route-match))]
        ;;     (sidebar/sidebar
        ;;      route-match
        ;;      (if no-animate?
        ;;        (route-view view route-match)
        ;;        (ui/transition-group
        ;;         {:class-name "router-wrapper"}
        ;;         (ui/css-transition
        ;;          {:class-names "pageChange"
        ;;           :key route-name
        ;;           :timeout {:enter 300
        ;;                     :exit 200}}
        ;;          (route-view view route-match)))))))

