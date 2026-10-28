(ns frontend.extensions.settings
  (:require [frontend.components.lazy-settings :as lazy-settings]
            [frontend.components.settings :as settings]))

(lazy-settings/register!
 {:settings settings/settings
  :appearance settings/appearance
  :collaboration settings/settings-collaboration
  :sync-server settings/sync-server-url-settings-container
  :publish-server settings/publish-server-url-settings-container})
