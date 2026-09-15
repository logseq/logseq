(ns frontend.components.page-model
  "Pure page-route render decisions. Kept out of the React page container so
   zoom-back first-paint rules can be unit-tested without a DOM renderer.")

(defn attach-inline-breadcrumb
  "Attach already-resolved breadcrumb ancestors when they are ready.
   A missing payload must not block the page body."
  [page breadcrumb-ancestors]
  (if breadcrumb-ancestors
    (assoc page :block.temp/breadcrumb breadcrumb-ancestors)
    page))

(defn page-body-ready?
  "The page tree can paint as soon as the page block itself is ready."
  [page]
  (some? page))

(defn main-page-option?
  "Sidebar, embed, and preview containers must not steal the main-route
   last-ready page used to avoid blank zoom-back frames."
  [option]
  (not (or (:sidebar? option)
           (:embed? option)
           (:preview? option)
           (:tag-dialog? option))))

(defn remember-ready-page-view
  [cached repo option view]
  (if (and (main-page-option? option) repo view)
    (assoc view :repo repo)
    cached))

(defn remembered-page-view
  [cached repo option]
  (when (and (main-page-option? option)
             cached
             (= repo (:repo cached)))
    (dissoc cached :repo)))

(defn resolve-page-view
  "Choose which page to paint for a page-identity / route-block snapshot.

   :loading keeps the last ready main-route page so remount does not render
   nil while the next identity is fetched."
  [status value option last-ready]
  (case status
    :ready (when value {:option option :page-uuid value})
    :loading last-ready
    nil))

(defn cached-route-page-uuid
  "Use a warm-cached page UUID directly when the route already has one.
   Page-block heading routes still go through :route-block."
  [page-lookup block-route-name snapshot-status]
  (when (and (uuid? page-lookup)
             (nil? block-route-name)
             (= :ready snapshot-status))
    page-lookup))
