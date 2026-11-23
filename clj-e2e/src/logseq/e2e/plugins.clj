(ns logseq.e2e.plugins
  "Plugins dialog and marketplace helpers"
  (:require [logseq.e2e.assert :as assert]
            [logseq.e2e.keyboard :as k]
            [logseq.e2e.util :as util]
            [wally.main :as w]))

(def journals-calendar-card-selector
  ".cp__plugins-item-card:has(h3:has-text('Journals calendar'))")

(defn open-plugins-dialog
  "Opens the plugins dialog via the More menu"
  []
  (util/double-esc)
  (w/click ".toolbar-dots-btn")
  (w/click ".ui__dropdown-menu-item:has-text('Plugins')")
  (w/wait-for ".cp__plugins-page"))

(defn switch-to-marketplace
  "Switches to the Marketplace tab in the plugins dialog"
  []
  (w/click "button:has-text('Marketplace')")
  ;; Wait for plugins to load from marketplace
  (w/wait-for ".cp__plugins-marketplace-cnt" {:timeout 15000}))

(defn switch-to-installed
  "Switches to the Installed tab in the plugins dialog"
  []
  (w/click "button:has-text('Installed')")
  (w/wait-for ".cp__plugins-installed"))

(defn search-plugin
  "Search for a plugin by name"
  [search-term]
  (w/fill ".cp__plugins-page input[placeholder*='Search']" search-term))

(defn click-install-button
  "Clicks the installation button for the first visible plugin card"
  []
  (w/click (.first (w/-query ".cp__plugins-item-card .ctl a.btn:text-is('Install')"))))

(defn wait-for-plugin-installed
  "Waits for the plugin to show as installed"
  []
  (w/wait-for ".cp__plugins-item-card .ctl a.btn:text-is('Installed')" {:timeout 30000}))

(defn close-plugins-dialog
  "Closes the plugins dialog. Esc clears a non-empty plugin search before it
  closes the dialog."
  []
  (k/esc)
  (when (w/visible? ".cp__plugins-page")
    (k/esc))
  (assert/assert-is-hidden ".cp__plugins-page"))

(defn ensure-journals-calendar-installed!
  "Installs Journals calendar from the marketplace unless it is installed, and
  leaves the dialog on the Installed tab filtered to it"
  []
  (open-plugins-dialog)
  (switch-to-marketplace)
  (search-plugin "Journals calendar")
  (w/wait-for journals-calendar-card-selector {:timeout 10000})
  (when (w/visible? ".cp__plugins-item-card .ctl a.btn:text-is('Install')")
    (click-install-button)
    (wait-for-plugin-installed))
  (switch-to-installed)
  (search-plugin "Journals calendar")
  (w/wait-for journals-calendar-card-selector))

(defn set-journals-calendar-enabled!
  [enabled?]
  (let [card (.first (w/-query journals-calendar-card-selector))
        toggle (.locator card "[role='switch']")]
    (when (not= enabled? (= "true" (.getAttribute toggle "aria-checked")))
      (w/click toggle))
    (assert/assert-is-visible card)))
