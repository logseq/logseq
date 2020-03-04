(ns frontend.components.sidebar)

(defn sidebar []
  [:div.h-screen.flex.overflow-hidden.bg-gray-100
   {:keydown.window.escape "sidebarOpen = false",
    :x-data "{ sidebarOpen: false }"}
   [:div.md:hidden
    [:div.fixed.inset-0.z-30.bg-gray-600.opacity-0.pointer-events-none.transition-opacity.ease-linear.duration-300
     {:_:class
      "{'opacity-75 pointer-events-auto': sidebarOpen, 'opacity-0 pointer-events-none': !sidebarOpen}",
      :click "sidebarOpen = false"}]
    [:div.fixed.inset-y-0.left-0.flex.flex-col.z-40.max-w-xs.w-full.bg-gray-800.transform.ease-in-out.duration-300.-translate-x-full
     {:_:class
      "{'translate-x-0': sidebarOpen, '-translate-x-full': !sidebarOpen}"}
     [:div.absolute.top-0.right-0.-mr-14.p-1
      [:button.flex.items-center.justify-center.h-12.w-12.rounded-full.focus:outline-none.focus:bg-gray-600
       {:click "sidebarOpen = false", :x-show "sidebarOpen"}
       [:svg.h-6.w-6.text-white
        {:viewbox "0 0 24 24", :fill "none", :stroke "currentColor"}
        [:path
         {:d "M6 18L18 6M6 6l12 12",
          :stroke-width "2",
          :stroke-linejoin "round",
          :stroke-linecap "round"}]]]]
     [:div.flex-shrink-0.flex.items-center.h-16.px-4.bg-gray-900
      [:img.h-8.w-auto
       {:alt "Workflow",
        :src "/img/logos/workflow-logo-on-dark.svg"}]]
     [:div.flex-1.h-0.overflow-y-auto
      [:nav.px-2.py-4
       [:a.group.flex.items-center.px-2.py-2.text-base.leading-6.font-medium.rounded-md.text-white.bg-gray-900.focus:outline-none.focus:bg-gray-700.transition.ease-in-out.duration-150
        {:href "#"}
        [:svg.mr-4.h-6.w-6.text-gray-300.group-hover:text-gray-300.group-focus:text-gray-300.transition.ease-in-out.duration-150
         {:viewbox "0 0 24 24", :fill "none", :stroke "currentColor"}
         [:path
          {:d
           "M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10M9 21h6",
           :stroke-width "2",
           :stroke-linejoin "round",
           :stroke-linecap "round"}]]
        "\n            Dashboard\n          "]
       [:a.mt-1.group.flex.items-center.px-2.py-2.text-base.leading-6.font-medium.rounded-md.text-gray-300.hover:text-white.hover:bg-gray-700.focus:outline-none.focus:text-white.focus:bg-gray-700.transition.ease-in-out.duration-150
        {:href "#"}
        [:svg.mr-4.h-6.w-6.text-gray-400.group-hover:text-gray-300.group-focus:text-gray-300.transition.ease-in-out.duration-150
         {:viewbox "0 0 24 24", :fill "none", :stroke "currentColor"}
         [:path
          {:d
           "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
           :stroke-width "2",
           :stroke-linejoin "round",
           :stroke-linecap "round"}]]
        "\n            Team\n          "]
       [:a.mt-1.group.flex.items-center.px-2.py-2.text-base.leading-6.font-medium.rounded-md.text-gray-300.hover:text-white.hover:bg-gray-700.focus:outline-none.focus:text-white.focus:bg-gray-700.transition.ease-in-out.duration-150
        {:href "#"}
        [:svg.mr-4.h-6.w-6.text-gray-400.group-hover:text-gray-300.group-focus:text-gray-300.transition.ease-in-out.duration-150
         {:viewbox "0 0 24 24", :fill "none", :stroke "currentColor"}
         [:path
          {:d
           "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z",
           :stroke-width "2",
           :stroke-linejoin "round",
           :stroke-linecap "round"}]]
        "\n            Projects\n          "]
       [:a.mt-1.group.flex.items-center.px-2.py-2.text-base.leading-6.font-medium.rounded-md.text-gray-300.hover:text-white.hover:bg-gray-700.focus:outline-none.focus:text-white.focus:bg-gray-700.transition.ease-in-out.duration-150
        {:href "#"}
        [:svg.mr-4.h-6.w-6.text-gray-400.group-hover:text-gray-300.group-focus:text-gray-300.transition.ease-in-out.duration-150
         {:viewbox "0 0 24 24", :fill "none", :stroke "currentColor"}
         [:path
          {:d
           "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
           :stroke-width "2",
           :stroke-linejoin "round",
           :stroke-linecap "round"}]]
        "\n            Calendar\n          "]
       [:a.mt-1.group.flex.items-center.px-2.py-2.text-base.leading-6.font-medium.rounded-md.text-gray-300.hover:text-white.hover:bg-gray-700.focus:outline-none.focus:text-white.focus:bg-gray-700.transition.ease-in-out.duration-150
        {:href "#"}
        [:svg.mr-4.h-6.w-6.text-gray-400.group-hover:text-gray-300.group-focus:text-gray-300.transition.ease-in-out.duration-150
         {:viewbox "0 0 24 24", :fill "none", :stroke "currentColor"}
         [:path
          {:d
           "M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4",
           :stroke-width "2",
           :stroke-linejoin "round",
           :stroke-linecap "round"}]]
        "\n            Documents\n          "]
       [:a.mt-1.group.flex.items-center.px-2.py-2.text-base.leading-6.font-medium.rounded-md.text-gray-300.hover:text-white.hover:bg-gray-700.focus:outline-none.focus:text-white.focus:bg-gray-700.transition.ease-in-out.duration-150
        {:href "#"}
        [:svg.mr-4.h-6.w-6.text-gray-400.group-hover:text-gray-300.group-focus:text-gray-300.transition.ease-in-out.duration-150
         {:viewbox "0 0 24 24", :fill "none", :stroke "currentColor"}
         [:path
          {:d
           "M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
           :stroke-width "2",
           :stroke-linejoin "round",
           :stroke-linecap "round"}]]
        "\n            Reports\n          "]]]]]
   [:div.hidden.md:flex.md:flex-shrink-0
    [:div.flex.flex-col.w-64
     [:div.flex.items-center.h-16.flex-shrink-0.px-4.bg-gray-900
      [:img.h-8.w-auto
       {:alt "Workflow",
        :src "/img/logos/workflow-logo-on-dark.svg"}]]
     [:div.h-0.flex-1.flex.flex-col.overflow-y-auto
      [:nav.flex-1.px-2.py-4.bg-gray-800
       [:a.group.flex.items-center.px-2.py-2.text-sm.leading-5.font-medium.text-white.rounded-md.bg-gray-900.focus:outline-none.focus:bg-gray-700.transition.ease-in-out.duration-150
        {:href "#"}
        [:svg.mr-3.h-6.w-6.text-gray-300.group-hover:text-gray-300.group-focus:text-gray-300.transition.ease-in-out.duration-150
         {:viewbox "0 0 24 24", :fill "none", :stroke "currentColor"}
         [:path
          {:d
           "M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10M9 21h6",
           :stroke-width "2",
           :stroke-linejoin "round",
           :stroke-linecap "round"}]]
        "\n            Dashboard\n          "]
       [:a.mt-1.group.flex.items-center.px-2.py-2.text-sm.leading-5.font-medium.text-gray-300.rounded-md.hover:text-white.hover:bg-gray-700.focus:outline-none.focus:text-white.focus:bg-gray-700.transition.ease-in-out.duration-150
        {:href "#"}
        [:svg.mr-3.h-6.w-6.text-gray-400.group-hover:text-gray-300.group-focus:text-gray-300.transition.ease-in-out.duration-150
         {:viewbox "0 0 24 24", :fill "none", :stroke "currentColor"}
         [:path
          {:d
           "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
           :stroke-width "2",
           :stroke-linejoin "round",
           :stroke-linecap "round"}]]
        "\n            Team\n          "]
       [:a.mt-1.group.flex.items-center.px-2.py-2.text-sm.leading-5.font-medium.text-gray-300.rounded-md.hover:text-white.hover:bg-gray-700.focus:outline-none.focus:text-white.focus:bg-gray-700.transition.ease-in-out.duration-150
        {:href "#"}
        [:svg.mr-3.h-6.w-6.text-gray-400.group-hover:text-gray-300.group-focus:text-gray-300.transition.ease-in-out.duration-150
         {:viewbox "0 0 24 24", :fill "none", :stroke "currentColor"}
         [:path
          {:d
           "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z",
           :stroke-width "2",
           :stroke-linejoin "round",
           :stroke-linecap "round"}]]
        "\n            Projects\n          "]
       [:a.mt-1.group.flex.items-center.px-2.py-2.text-sm.leading-5.font-medium.text-gray-300.rounded-md.hover:text-white.hover:bg-gray-700.focus:outline-none.focus:text-white.focus:bg-gray-700.transition.ease-in-out.duration-150
        {:href "#"}
        [:svg.mr-3.h-6.w-6.text-gray-400.group-hover:text-gray-300.group-focus:text-gray-300.transition.ease-in-out.duration-150
         {:viewbox "0 0 24 24", :fill "none", :stroke "currentColor"}
         [:path
          {:d
           "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
           :stroke-width "2",
           :stroke-linejoin "round",
           :stroke-linecap "round"}]]
        "\n            Calendar\n          "]
       [:a.mt-1.group.flex.items-center.px-2.py-2.text-sm.leading-5.font-medium.text-gray-300.rounded-md.hover:text-white.hover:bg-gray-700.focus:outline-none.focus:text-white.focus:bg-gray-700.transition.ease-in-out.duration-150
        {:href "#"}
        [:svg.mr-3.h-6.w-6.text-gray-400.group-hover:text-gray-300.group-focus:text-gray-300.transition.ease-in-out.duration-150
         {:viewbox "0 0 24 24", :fill "none", :stroke "currentColor"}
         [:path
          {:d
           "M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4",
           :stroke-width "2",
           :stroke-linejoin "round",
           :stroke-linecap "round"}]]
        "\n            Documents\n          "]
       [:a.mt-1.group.flex.items-center.px-2.py-2.text-sm.leading-5.font-medium.text-gray-300.rounded-md.hover:text-white.hover:bg-gray-700.focus:outline-none.focus:text-white.focus:bg-gray-700.transition.ease-in-out.duration-150
        {:href "#"}
        [:svg.mr-3.h-6.w-6.text-gray-400.group-hover:text-gray-300.group-focus:text-gray-300.transition.ease-in-out.duration-150
         {:viewbox "0 0 24 24", :fill "none", :stroke "currentColor"}
         [:path
          {:d
           "M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
           :stroke-width "2",
           :stroke-linejoin "round",
           :stroke-linecap "round"}]]
        "\n            Reports\n          "]]]]]
   [:div.flex.flex-col.w-0.flex-1.overflow-hidden
    [:div.relative.z-10.flex-shrink-0.flex.h-16.bg-white.shadow
     [:button.px-4.border-r.border-gray-200.text-gray-500.focus:outline-none.focus:bg-gray-100.focus:text-gray-600.md:hidden
      {:click.stop "sidebarOpen = true"}
      [:svg.h-6.w-6
       {:viewbox "0 0 24 24", :fill "none", :stroke "currentColor"}
       [:path
        {:d "M4 6h16M4 12h16M4 18h7",
         :stroke-width "2",
         :stroke-linejoin "round",
         :stroke-linecap "round"}]]]
     [:div.flex-1.px-4.flex.justify-between
      [:div.flex-1.flex
       [:div.w-full.flex.md:ml-0
        [:label.sr-only {:for "search_field"} "Search"]
        [:div.relative.w-full.text-gray-400.focus-within:text-gray-600
         [:div.absolute.inset-y-0.left-0.flex.items-center.pointer-events-none
          [:svg.h-5.w-5
           {:viewbox "0 0 20 20", :fill "currentColor"}
           [:path
            {:d
             "M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z",
             :clip-rule "evenodd",
             :fill-rule "evenodd"}]]]
         [:input#search_field.block.w-full.h-full.pl-8.pr-3.py-2.rounded-md.text-gray-900.placeholder-gray-500.focus:outline-none.focus:placeholder-gray-400.sm:text-sm
          {:placeholder "Search"}]]]]
      [:div.ml-4.flex.items-center.md:ml-6
       [:button.p-1.text-gray-400.rounded-full.hover:bg-gray-100.hover:text-gray-500.focus:outline-none.focus:shadow-outline.focus:text-gray-500
        [:svg.h-6.w-6
         {:viewbox "0 0 24 24", :fill "none", :stroke "currentColor"}
         [:path
          {:d
           "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
           :stroke-width "2",
           :stroke-linejoin "round",
           :stroke-linecap "round"}]]]
       [:div.ml-3.relative
        {:x-data "{ open: false }", :click.away "open = false"}
        [:div
         [:button.max-w-xs.flex.items-center.text-sm.rounded-full.focus:outline-none.focus:shadow-outline
          {:click "open = !open"}
          [:img.h-8.w-8.rounded-full
           {:alt "",
            :src
            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"}]]]
        [:div.origin-top-right.absolute.right-0.mt-2.w-48.rounded-md.shadow-lg
         {:x-transition:leave-end "transform opacity-0 scale-95",
          :x-transition:leave-start "transform opacity-100 scale-100",
          :x-transition:leave "transition ease-in duration-75",
          :x-transition:enter-end "transform opacity-100 scale-100",
          :x-transition:enter-start "transform opacity-0 scale-95",
          :x-transition:enter "transition ease-out duration-100",
          :x-show "open"}
         [:div.py-1.rounded-md.bg-white.shadow-xs
          [:a.block.px-4.py-2.text-sm.text-gray-700.hover:bg-gray-100.transition.ease-in-out.duration-150
           {:href "#"}
           "Your Profile"]
          [:a.block.px-4.py-2.text-sm.text-gray-700.hover:bg-gray-100.transition.ease-in-out.duration-150
           {:href "#"}
           "Settings"]
          [:a.block.px-4.py-2.text-sm.text-gray-700.hover:bg-gray-100.transition.ease-in-out.duration-150
           {:href "#"}
           "Sign out"]]]]]]]
    [:main.flex-1.relative.z-0.overflow-y-auto.py-6.focus:outline-none
     {:x-init "$el.focus()", :x-data "x-data", :tabindex "0"}
     [:div.max-w-7xl.mx-auto.px-4.sm:px-6.md:px-8
      [:h1.text-2xl.font-semibold.text-gray-900 "Dashboard"]]
     [:div.max-w-7xl.mx-auto.px-4.sm:px-6.md:px-8
      [:div.py-4
       [:div.border-4.border-dashed.border-gray-200.rounded-lg.h-96]]
      ]]]]

  )
