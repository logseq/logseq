import SwiftUI
import UIKit

private struct SearchFocusBridge: UIViewRepresentable {
    let isActive: Bool

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIView(context: Context) -> UIView {
        UIView(frame: .zero)
    }

    func updateUIView(_ view: UIView, context: Context) {
        context.coordinator.update(isActive: isActive, anchor: view)
    }

    final class Coordinator {
        private var requestId = 0
        private var lastIsActive = false

        func update(isActive: Bool, anchor: UIView) {
            guard isActive != lastIsActive else { return }

            lastIsActive = isActive
            requestId += 1

            guard isActive else { return }

            let currentRequest = requestId

            [0.0, 0.02, 0.05, 0.1, 0.2, 0.35].forEach { delay in
                DispatchQueue.main.asyncAfter(deadline: .now() + delay) { [weak anchor] in
                    guard self.requestId == currentRequest,
                          let anchor else {
                        return
                    }

                    _ = Self.focusSearchField(from: anchor)
                }
            }
        }

        private static func focusSearchField(from anchor: UIView) -> Bool {
            guard let root = anchor.window ?? UIApplication.shared.activeKeyWindow else {
                return false
            }

            guard let textField = findSearchTextField(in: root) else {
                return false
            }

            if !textField.isFirstResponder {
                textField.becomeFirstResponder()
            }

            return true
        }

        private static func findSearchTextField(in view: UIView) -> UISearchTextField? {
            if let textField = view as? UISearchTextField {
                return textField
            }

            for subview in view.subviews {
                if let textField = findSearchTextField(in: subview) {
                    return textField
                }
            }

            return nil
        }
    }
}

private extension UIApplication {
    var activeKeyWindow: UIWindow? {
        connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .filter { $0.activationState == .foregroundActive }
            .flatMap(\.windows)
            .first { $0.isKeyWindow }
    }
}

private struct TabReselectObserver: UIViewControllerRepresentable {
    let selectedId: () -> String?

    func makeCoordinator() -> Coordinator {
        Coordinator(selectedId: selectedId)
    }

    func makeUIViewController(context: Context) -> UIViewController {
        UIViewController()
    }

    func updateUIViewController(_ viewController: UIViewController, context: Context) {
        context.coordinator.selectedId = selectedId

        DispatchQueue.main.async {
            context.coordinator.attach(from: viewController)
        }
    }

    final class Coordinator: NSObject, UITabBarControllerDelegate {
        var selectedId: () -> String?

        private weak var tabBarController: UITabBarController?
        private weak var previousDelegate: UITabBarControllerDelegate?
        private var lastSelectedIndex: Int?

        init(selectedId: @escaping () -> String?) {
            self.selectedId = selectedId
        }

        deinit {
            if let tabBarController,
               tabBarController.delegate === self {
                tabBarController.delegate = previousDelegate
            }
        }

        func attach(from viewController: UIViewController) {
            guard let tabBarController = findTabBarController(from: viewController) else {
                return
            }

            if self.tabBarController === tabBarController,
               tabBarController.delegate === self {
                return
            }

            previousDelegate = tabBarController.delegate
            self.tabBarController = tabBarController
            lastSelectedIndex = tabBarController.selectedIndex
            tabBarController.delegate = self
        }

        func tabBarController(
            _ tabBarController: UITabBarController,
            didSelect viewController: UIViewController
        ) {
            let selectedIndex = tabBarController.selectedIndex

            if selectedIndex == lastSelectedIndex,
               let id = selectedId() {
                LiquidTabsPlugin.shared?.notifyTabSelected(id: id, reselected: true)
            }

            lastSelectedIndex = selectedIndex
            previousDelegate?.tabBarController?(tabBarController, didSelect: viewController)
        }

        private func findTabBarController(from viewController: UIViewController) -> UITabBarController? {
            var current: UIViewController? = viewController

            while let viewController = current {
                if let tabBarController = viewController as? UITabBarController {
                    return tabBarController
                }

                current = viewController.parent
            }

            if let tabBarController = viewController.tabBarController {
                return tabBarController
            }

            return nil
        }
    }
}

// MARK: - Root Tabs View (dispatch to 26+ vs 16–25)

struct LiquidTabsRootView: View {
    let navController: UINavigationController

    var body: some View {
        if #available(iOS 26.0, *) {
            LiquidTabs26View(navController: navController)
        } else {
            LiquidTabs16View(navController: navController)
        }
    }
}

// MARK: - Shared selection helpers

enum LiquidTabsTabSelection: Hashable {
    case content(Int)
    case search
}

private extension LiquidTabsStore {
    var firstTab: LiquidTab? { tabs.first }

    func tabId(for selection: LiquidTabsTabSelection) -> String? {
        switch selection {
        case .content(let index):
            guard index >= 0 && index < tabs.count else { return nil }
            return tabs[index].id
        case .search:
            return "search"
        }
    }

    func selection(forId id: String) -> LiquidTabsTabSelection? {
        if id == "search" { return .search }
        if let idx = tabs.firstIndex(where: { $0.id == id }) {
            return .content(idx)
        }
        return nil
    }
}

// MARK: - iOS 26+ implementation using Tab(...) API + search role

@available(iOS 26.0, *)
private struct LiquidTabs26View: View {
    @StateObject private var store = LiquidTabsStore.shared
    let navController: UINavigationController

    @FocusState private var isSearchFocused: Bool

    @State private var selectedTab: LiquidTabsTabSelection = .content(0)
    @State private var searchPath = NavigationPath()
    @State private var deferredWebSelection: LiquidTabsTabSelection?
    @State private var notifiedSelectionId: String?
    @State private var suppressedSelectionId: String?

    private let maxMainTabs = 6

    private var tabSelectionProxy: Binding<LiquidTabsTabSelection> {
        Binding(
            get: { selectedTab },
            set: { newValue in
                if newValue != selectedTab {
                    selectTab(newValue)
                }
            }
        )
    }

    private var searchTextBinding: Binding<String> {
        Binding(
            get: { store.searchText },
            set: { store.searchText = $0 }
        )
    }

    private func resetSearchState() {
        searchPath = NavigationPath()
        store.searchText = ""
        store.searchResults = []
    }

    private func initialSelection() -> LiquidTabsTabSelection {
        if let id = store.selectedId,
           let sel = store.selection(forId: id) {
            return sel
        }

        if !store.tabs.isEmpty {
            return .content(0)
        }

        return .search
    }

    private func focusSearchField() {
        isSearchFocused = true
    }

    private func webBackedTabId(for selection: LiquidTabsTabSelection) -> String? {
        guard let id = store.tabId(for: selection),
              id != "graphs",
              id != "search" else {
            return nil
        }

        return id
    }

    private func waitForWebBackedTab(_ selection: LiquidTabsTabSelection) {
        if let id = webBackedTabId(for: selection) {
            store.beginWebTabTransitionIfNeeded(id)
        }
    }

    private func selectTab(_ selection: LiquidTabsTabSelection, notify: Bool = true) {
        prepareForSelectionChange(to: selection)

        if let id = webBackedTabId(for: selection) {
            deferredWebSelection = selection
            if notify {
                notifiedSelectionId = id
                LiquidTabsPlugin.shared?.notifyTabSelected(id: id)
            } else {
                suppressedSelectionId = id
            }
            return
        }

        deferredWebSelection = nil
        if let id = store.tabId(for: selection), !notify {
            suppressedSelectionId = id
        }
        selectedTab = selection
    }

    private func applyDeferredWebSelectionIfReady() {
        guard store.pendingWebTabId == nil,
              let selection = deferredWebSelection else {
            return
        }

        deferredWebSelection = nil
        selectedTab = selection
    }

    private func notifySelectedTabIfNeeded(_ id: String) {
        store.selectedId = id

        if notifiedSelectionId == id {
            notifiedSelectionId = nil
        } else if suppressedSelectionId == id {
            suppressedSelectionId = nil
        } else {
            LiquidTabsPlugin.shared?.notifyTabSelected(id: id)
        }
    }

    private func prepareForSelectionChange(to selection: LiquidTabsTabSelection) {
        waitForWebBackedTab(selection)

        switch selection {
        case .search:
            store.suppressSearchNotifications = true
            isSearchFocused = true
        case .content:
            if selectedTab == .search {
                store.suppressSearchNotifications = true
                isSearchFocused = false
            }
        }
    }

    @ViewBuilder
    private func mainTabContent(index: Int, tab: LiquidTab) -> some View {
        if tab.id == "graphs" {
            NativeGraphsTabHost(navController: navController, store: store)
        } else {
            // Normal content tab → shared webview
            NativeNavHost(navController: navController)
              .ignoresSafeArea()
              .background(Color.logseqBackground)
        }
    }

    @ViewBuilder
    private func mainTabLabel(index: Int, tab: LiquidTab) -> some View {
        let isSelected = (selectedTab == .content(index))
        Label(tab.title, systemImage: tab.systemImage)
            .environment(\.symbolVariants, isSelected ? .fill : .none)
    }

    var body: some View {
        if store.tabs.isEmpty {
            // bootstrap webview so JS can configure tabs
            NativeNavHost(navController: navController)
                .ignoresSafeArea()
                .background(Color.logseqBackground)
        } else {
            ZStack {
                Color.logseqBackground.ignoresSafeArea()

                TabView(selection: tabSelectionProxy) {
                    // Dynamic main tabs
                    ForEach(
                        Array(store.tabs.prefix(maxMainTabs).enumerated()),
                        id: \.element.id
                    ) { index, tab in
                        Tab(
                            value: LiquidTabsTabSelection.content(index)
                        ) {
                            mainTabContent(index: index, tab: tab)
                        } label: {
                            mainTabLabel(index: index, tab: tab)
                        }
                    }

                    // Search Tab (system search role)
                    Tab(
                        "Search",
                        systemImage: "magnifyingglass",
                        value: .search,
                        role: .search
                    ) {
                        SearchTabHost26(
                            navController: navController,
                            selectedTab: $selectedTab,
                            firstTabId: store.tabs.first?.id,
                            searchPath: $searchPath,
                            store: store
                        )
                        .ignoresSafeArea()
                    }
                }
                .searchable(text: searchTextBinding)
                .searchFocused($isSearchFocused)
                .searchToolbarBehavior(.minimize)
                .onChange(of: store.searchText) { query in
                    if query.isEmpty {
                        store.searchResults = []
                        guard selectedTab == .search,
                              !store.suppressSearchNotifications else { return }
                        LiquidTabsPlugin.shared?.notifySearchChanged(query: query)
                    } else {
                        guard selectedTab == .search,
                              !store.suppressSearchNotifications else { return }
                        LiquidTabsPlugin.shared?.notifySearchChanged(query: query)
                    }
                }
                .background(Color.logseqBackground)
                .overlay {
                    SearchFocusBridge(isActive: selectedTab == .search)
                        .frame(width: 0, height: 0)
                }
                .background {
                    TabReselectObserver(selectedId: {
                        store.tabId(for: selectedTab)
                    })
                    .frame(width: 0, height: 0)
                }

                if store.pendingWebTabId != nil {
                    Color.logseqBackground
                        .ignoresSafeArea()
                        .zIndex(1)
                }
            }
            .onAppear {
                let initial = initialSelection()
                if initial != selectedTab {
                    prepareForSelectionChange(to: initial)
                    selectedTab = initial
                }

                let appearance = UITabBarAppearance()
                appearance.configureWithTransparentBackground()

                // Selected text color
                appearance.stackedLayoutAppearance.selected.titleTextAttributes = [
                    .foregroundColor: UIColor.label
                ]

                // Unselected text color (70%)
                let dimmed = UIColor.label.withAlphaComponent(0.7)
                appearance.stackedLayoutAppearance.normal.titleTextAttributes = [
                    .foregroundColor: dimmed
                ]

                let tabBar = UITabBar.appearance()
                tabBar.tintColor = .label
                tabBar.unselectedItemTintColor = dimmed
                tabBar.standardAppearance = appearance
                tabBar.scrollEdgeAppearance = appearance
            }
            .onChange(of: selectedTab) { newValue in
                if let id = store.tabId(for: newValue) {
                    notifySelectedTabIfNeeded(id)
                }

                switch newValue {
                case .search:
                    store.suppressSearchNotifications = false
                    focusSearchField()

                case .content:
                    store.suppressSearchNotifications = true
                    isSearchFocused = false
                }
            }
            .onChange(of: store.selectedId) { newId in
                guard let id = newId,
                      let newSelection = store.selection(forId: id) else {
                    return
                }

                if newSelection != selectedTab {
                    let isExternalSelectionChange = store.tabId(for: selectedTab) != id
                    if isExternalSelectionChange {
                        selectTab(newSelection, notify: false)
                    } else {
                        selectedTab = newSelection
                    }
                }
            }
            .onChange(of: store.pendingWebTabId) { _ in
                applyDeferredWebSelectionIfReady()
            }
            .animation(nil, value: selectedTab)
        }
    }
}

private struct NativeGraphsTabHost: View {
    let navController: UINavigationController
    @ObservedObject var store: LiquidTabsStore

    var body: some View {
        ZStack {
            NativeNavHost(navController: navController)
                .ignoresSafeArea()
                .background(Color.logseqBackground)

            if store.nativeGraphsVisible {
                VStack(spacing: 0) {
                    Color.clear
                        .frame(height: 44)
                        .allowsHitTesting(false)

                    NativeGraphsContent(store: store)
                        .background(Color.logseqBackground)
                }
            }
        }
    }
}

private struct NativeGraphsContent: View {
    @ObservedObject var store: LiquidTabsStore
    @State private var pendingAction: PendingNativeGraphAction?

    private var actionDialogPresented: Binding<Bool> {
        Binding(
            get: { pendingAction != nil },
            set: { presented in
                if !presented {
                    pendingAction = nil
                }
            }
        )
    }

    private func open(_ graph: NativeGraphItem) {
        guard graph.tappable else { return }

        if graph.local {
            LiquidTabsPlugin.shared?.openGraph(graph)
        } else {
            LiquidTabsPlugin.shared?.downloadGraph(graph)
        }
    }

    private func refreshGraphs() async {
        LiquidTabsPlugin.shared?.refreshGraphs()

        while store.graphsRefreshing {
            try? await Task.sleep(nanoseconds: 100_000_000)
        }
    }

    var body: some View {
        List {
            ForEach(store.graphSections) { section in
                Section {
                    ForEach(section.graphs) { graph in
                        NativeGraphListRow(
                            graph: graph,
                            labels: store.graphLabels,
                            pendingAction: $pendingAction,
                            open: open
                        )
                        .listRowBackground(Color.clear)
                    }
                } header: {
                    NativeGraphSectionHeader(section: section)
                }
            }
        }
        .listStyle(.plain)
        .scrollContentBackground(.hidden)
        .refreshable {
            await refreshGraphs()
        }
        .background(Color.logseqBackground.ignoresSafeArea())
        .confirmationDialog(
            pendingAction?.action.confirmTitle ?? "",
            isPresented: actionDialogPresented,
            titleVisibility: .visible
        ) {
            if let pending = pendingAction {
                if pending.action.destructive {
                    Button(pending.action.confirmButton, role: .destructive) {
                        LiquidTabsPlugin.shared?.performGraphAction(
                            pending.action,
                            graph: pending.graph
                        )
                        pendingAction = nil
                    }
                } else {
                    Button(pending.action.confirmButton) {
                        LiquidTabsPlugin.shared?.performGraphAction(
                            pending.action,
                            graph: pending.graph
                        )
                        pendingAction = nil
                    }
                }

                Button(pending.action.cancelButton, role: .cancel) {
                    pendingAction = nil
                }
            }
        } message: {
            if let pending = pendingAction {
                Text(pending.action.confirmMessage)
            }
        }
    }
}

private struct PendingNativeGraphAction: Identifiable {
    let id = UUID()
    let graph: NativeGraphItem
    let action: NativeGraphAction
}

private struct NativeGraphListRow: View {
    let graph: NativeGraphItem
    let labels: NativeGraphLabels
    @Binding var pendingAction: PendingNativeGraphAction?
    let open: (NativeGraphItem) -> Void

    var body: some View {
        HStack(spacing: 8) {
            Button {
                open(graph)
            } label: {
                NativeGraphRow(graph: graph, labels: labels)
            }
            .buttonStyle(.plain)
            .disabled(!graph.tappable)

            if !graph.actions.isEmpty {
                NativeGraphActionsMenu(
                    graph: graph,
                    pendingAction: $pendingAction
                )
            }
        }
        .swipeActions(edge: .trailing, allowsFullSwipe: false) {
            ForEach(graph.actions) { action in
                NativeGraphActionButton(
                    graph: graph,
                    action: action,
                    pendingAction: $pendingAction
                )
            }
        }
    }
}

private struct NativeGraphActionsMenu: View {
    let graph: NativeGraphItem
    @Binding var pendingAction: PendingNativeGraphAction?

    var body: some View {
        Menu {
            ForEach(graph.actions) { action in
                NativeGraphActionButton(
                    graph: graph,
                    action: action,
                    pendingAction: $pendingAction
                )
            }
        } label: {
            Image(systemName: "ellipsis")
                .font(.body.weight(.semibold))
                .foregroundColor(.secondary)
                .frame(width: 32, height: 32)
        }
    }
}

private struct NativeGraphActionButton: View {
    let graph: NativeGraphItem
    let action: NativeGraphAction
    @Binding var pendingAction: PendingNativeGraphAction?

    var body: some View {
        if action.destructive {
            Button(role: .destructive) {
                pendingAction = PendingNativeGraphAction(graph: graph, action: action)
            } label: {
                Text(action.title)
            }
        } else {
            Button {
                pendingAction = PendingNativeGraphAction(graph: graph, action: action)
            } label: {
                Text(action.title)
            }
        }
    }
}

private struct NativeGraphSectionHeader: View {
    let section: NativeGraphSection

    var body: some View {
        HStack {
            Text(section.title)
                .font(.headline)
                .foregroundColor(.primary)
                .textCase(nil)
        }
        .padding(.top, 8)
    }
}

private struct NativeGraphRow: View {
    let graph: NativeGraphItem
    let labels: NativeGraphLabels

    private var syncImage: String? {
        guard graph.remote else { return nil }
        return graph.e2ee ? "lock" : "icloud"
    }

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: syncImage ?? "cylinder.split.1x2")
                .font(.system(size: 18, weight: .medium))
                .foregroundColor(.primary.opacity(0.75))
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 6) {
                    Text(graph.displayName)
                        .font(.body)
                        .foregroundColor(.primary)
                        .lineLimit(1)

                    if graph.downloading {
                        NativeGraphBadge(text: labels.downloading)
                    } else if !graph.readyForUse {
                        NativeGraphBadge(text: labels.preparing)
                    }
                }

                if let subtitle = graph.subtitle, !subtitle.isEmpty {
                    Text(subtitle)
                        .font(.footnote)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }
            }

            Spacer(minLength: 8)
        }
        .padding(.vertical, 8)
        .contentShape(Rectangle())
    }
}

private struct NativeGraphBadge: View {
    let text: String

    var body: some View {
        if !text.isEmpty {
            Text(text)
                .font(.caption2.weight(.medium))
                .foregroundColor(.secondary)
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(
                    Capsule()
                        .fill(Color.secondary.opacity(0.12))
                )
                .lineLimit(1)
        }
    }
}


// Search host for 26+
// Only responsible for cancel behaviour and tab switching.
// It does NOT own the focus anymore.
private enum SearchRoute: Hashable {
    case result(String)
}

@available(iOS 26.0, *)
private struct SearchTabHost26: View {
    let navController: UINavigationController
    var selectedTab: Binding<LiquidTabsTabSelection>
    let firstTabId: String?
    @Binding var searchPath: NavigationPath
    @ObservedObject var store: LiquidTabsStore

    @Environment(\.isSearching) private var isSearching
    @State private var wasSearching: Bool = false
    @State private var suppressSearchDismissalForAppLifecycle = false
    @State private var searchDismissalRequestId = 0

    private func cancelPendingSearchDismissal() {
        searchDismissalRequestId += 1
    }

    private func scheduleSearchDismissal() {
        guard wasSearching else { return }

        searchDismissalRequestId += 1
        let currentRequestId = searchDismissalRequestId

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
            guard searchDismissalRequestId == currentRequestId,
                  wasSearching,
                  !suppressSearchDismissalForAppLifecycle,
                  case .search = selectedTab.wrappedValue,
                  let firstId = firstTabId else {
                return
            }

            wasSearching = false
            searchPath = NavigationPath()
            selectedTab.wrappedValue = .content(0)
            store.selectedId = firstId
        }
    }

    var body: some View {
        NavigationStack(path: $searchPath) {
            ZStack {
                Color.logseqBackground
                  .ignoresSafeArea()

                SearchResultsContent(
                    searchPath: $searchPath,
                    store: store
                )
            }
            .navigationDestination(for: SearchRoute.self) { _ in
                NativeNavHost(navController: navController)
                    .ignoresSafeArea()
            }
        }
          .onChange(of: isSearching) { searching in
              if searching {
                  wasSearching = true
                  cancelPendingSearchDismissal()
              } else {
                  scheduleSearchDismissal()
              }
          }
          .onReceive(NotificationCenter.default.publisher(
              for: UIApplication.willResignActiveNotification
          )) { _ in
              suppressSearchDismissalForAppLifecycle = true
              wasSearching = false
              cancelPendingSearchDismissal()
          }
          .onReceive(NotificationCenter.default.publisher(
              for: UIApplication.didEnterBackgroundNotification
          )) { _ in
              suppressSearchDismissalForAppLifecycle = true
              wasSearching = false
              cancelPendingSearchDismissal()
          }
          .onReceive(NotificationCenter.default.publisher(
              for: UIApplication.didBecomeActiveNotification
          )) { _ in
              suppressSearchDismissalForAppLifecycle = false
              wasSearching = isSearching
          }
    }

}

// MARK: - iOS 16–25 implementation
// Classic TabView + .tabItem; Search tab shows a custom search bar pinned at top.

private struct LiquidTabs16View: View {
    @StateObject private var store = LiquidTabsStore.shared
    let navController: UINavigationController

    @State private var searchPath = NavigationPath()
    @State private var deferredWebTabId: String?
    @State private var notifiedSelectionId: String?
    @State private var suppressedSelectionId: String?

    private var searchTextBinding: Binding<String> {
        Binding(
            get: { store.searchText },
            set: { store.searchText = $0 }
        )
    }

    private func webBackedTabId(_ id: String) -> String? {
        guard id != "graphs",
              id != "search" else {
            return nil
        }

        return id
    }

    private func resetSearchState() {
        searchPath = NavigationPath()
        store.searchText = ""
        store.searchResults = []
    }

    private func prepareForSelectionChange(to id: String) {
        store.beginWebTabTransitionIfNeeded(id)

        if id == "search" {
            store.suppressSearchNotifications = true
        }

        if store.selectedId == "search" {
            store.suppressSearchNotifications = true
        }
    }

    private func selectTab(_ id: String, notify: Bool = true) {
        guard id != store.selectedId || deferredWebTabId != nil else { return }

        let deferred = webBackedTabId(id) != nil

        prepareForSelectionChange(to: id)

        if deferred {
            deferredWebTabId = id
            if notify {
                notifiedSelectionId = id
                LiquidTabsPlugin.shared?.notifyTabSelected(id: id)
            } else {
                suppressedSelectionId = id
            }
        } else {
            deferredWebTabId = nil
            if !notify {
                suppressedSelectionId = id
            }
            store.selectedId = id
        }
    }

    private func applyDeferredWebSelectionIfReady() {
        guard store.pendingWebTabId == nil,
              let id = deferredWebTabId else {
            return
        }

        deferredWebTabId = nil
        store.selectedId = id
    }

    private func notifySelectedTabIfNeeded(_ id: String) {
        if notifiedSelectionId == id {
            notifiedSelectionId = nil
        } else if suppressedSelectionId == id {
            suppressedSelectionId = nil
        } else {
            LiquidTabsPlugin.shared?.notifyTabSelected(id: id)
        }
    }

    var body: some View {
        ZStack {
            Color.logseqBackground.ignoresSafeArea()

            if store.tabs.isEmpty {
                // bootstrapping: attach shared webview until JS configures tabs
                NativeNavHost(navController: navController)
                    .ignoresSafeArea()
                    .background(Color.logseqBackground)
            } else {
                ZStack {
                    Color.logseqBackground.ignoresSafeArea()

                    TabView(selection: Binding<String?>(
                        get: {
                            store.selectedId ?? store.firstTab?.id
                        },
                        set: { newValue in
                            guard let id = newValue else { return }

                            if id != store.selectedId {
                                selectTab(id)
                            }
                        }
                    )) {
                        // --- Normal dynamic tabs ---
                        ForEach(store.tabs) { tab in
                            Group {
                                if tab.id == "graphs" {
                                    NativeGraphsTabHost(navController: navController, store: store)
                                } else {
                                    NativeNavHost(navController: navController)
                                        .ignoresSafeArea()
                                        .background(Color.logseqBackground)
                                }
                            }
                                .tabItem {
                                    Label(tab.title, systemImage: tab.systemImage)
                                }
                                .tag(tab.id as String?)
                        }

                        // --- 🔍 SEARCH TAB (iOS 16–25) ---
                        SearchTab16Host(
                            navController: navController,
                            searchText: searchTextBinding,
                            isActive: store.selectedId == "search",
                            searchPath: $searchPath,
                            store: store
                        )
                        .ignoresSafeArea()
                        .tabItem {
                            Label("Search", systemImage: "magnifyingglass")
                        }
                        .tag("search" as String?)
                    }
                    .onChange(of: store.selectedId) { newId in
                        if newId == "search" {
                            if !store.suppressSearchNotifications {
                                store.suppressSearchNotifications = true
                                resetSearchState()
                            }
                            DispatchQueue.main.async {
                                guard store.selectedId == "search" else { return }
                                store.suppressSearchNotifications = false
                            }
                        } else {
                            store.suppressSearchNotifications = true
                        }

                        if let id = newId {
                            notifySelectedTabIfNeeded(id)
                        }
                    }
                    .onChange(of: store.pendingWebTabId) { _ in
                        applyDeferredWebSelectionIfReady()
                    }
                    .background {
                        TabReselectObserver(selectedId: {
                            store.selectedId ?? store.firstTab?.id
                        })
                        .frame(width: 0, height: 0)
                    }

                    if store.pendingWebTabId != nil {
                        Color.logseqBackground
                            .ignoresSafeArea()
                            .zIndex(1)
                    }
                }
                .onAppear {
                    if store.selectedId == nil {
                        store.selectedId = store.tabs.first?.id
                    }

                    let appearance = UITabBarAppearance()
                    appearance.configureWithTransparentBackground()

                    appearance.stackedLayoutAppearance.selected.titleTextAttributes = [
                        .foregroundColor: UIColor.label
                    ]

                    let dimmed = UIColor.label.withAlphaComponent(0.7)
                    appearance.stackedLayoutAppearance.normal.titleTextAttributes = [
                        .foregroundColor: dimmed
                    ]
                    appearance.stackedLayoutAppearance.normal.iconColor =
                        UIColor.label.withAlphaComponent(0.9)

                    let tabBar = UITabBar.appearance()
                    tabBar.tintColor = .label
                    tabBar.standardAppearance = appearance
                    tabBar.scrollEdgeAppearance = appearance
                }
            }
        }
    }
}

private struct SearchTab16Host: View {
    let navController: UINavigationController
    @Binding var searchText: String
    let isActive: Bool
    @Binding var searchPath: NavigationPath
    @ObservedObject var store: LiquidTabsStore
    @FocusState private var isSearchFocused: Bool

    private func focusSearchFieldIfActive() {
        DispatchQueue.main.async {
            guard store.selectedId == "search" else { return }
            isSearchFocused = true
        }
    }

    var body: some View {
        NavigationStack(path: $searchPath) {
            ZStack {
                Color.logseqBackground
                  .ignoresSafeArea()

                SearchResultsContent(
                    searchPath: $searchPath,
                    store: store
                )
                .navigationDestination(for: SearchRoute.self) { _ in
                    NativeNavHost(navController: navController)
                        .ignoresSafeArea()
                }

                // Bottom search bar
                VStack {
                    Spacer()

                    HStack(spacing: 8) {
                        Image(systemName: "magnifyingglass")
                            .font(.system(size: 16))

                        TextField("Search", text: $searchText)
                            .textInputAutocapitalization(.none)
                            .disableAutocorrection(true)
                            .focused($isSearchFocused)

                        if !searchText.isEmpty {
                            Button("Clear") {
                                searchText = ""
                            }
                            .font(.system(size: 14, weight: .medium))
                        }
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 10)
                    .background(
                        RoundedRectangle(cornerRadius: 14)
                            .fill(Color(.systemGray5))
                    )
                    .padding(.horizontal, 16)
                    .padding(.bottom, 12)
                }
            }
        }
        .onAppear {
            if isActive {
                focusSearchFieldIfActive()
            } else {
                isSearchFocused = false
            }
        }
        .onChange(of: isActive) { active in
            if active {
                focusSearchFieldIfActive()
            } else {
                isSearchFocused = false
            }
        }
        .onChange(of: searchText) { query in
            if query.isEmpty {
                store.searchResults = []
                guard store.selectedId == "search",
                      !store.suppressSearchNotifications else { return }
                LiquidTabsPlugin.shared?.notifySearchChanged(query: query)
            } else {
                guard isActive,
                      !store.suppressSearchNotifications else { return }
                LiquidTabsPlugin.shared?.notifySearchChanged(query: query)
            }
        }
    }
}

private struct SearchResultsContent: View {
    @Binding var searchPath: NavigationPath
    @ObservedObject var store: LiquidTabsStore

    var body: some View {
        List(store.searchResults) { result in
            Button {
                searchPath.append(SearchRoute.result(result.id))
                DispatchQueue.main.async {
                    LiquidTabsPlugin.shared?.openResult(id: result.id, nativePush: false)
                }
            } label: {
                VStack(alignment: .leading, spacing: 4) {
                    if let subtitle = result.subtitle,
                       !subtitle.isEmpty {
                        Text(subtitle)
                          .font(.subheadline)
                          .foregroundColor(.primary.opacity(0.7))
                          .lineLimit(1)
                    }

                    Text(result.title)
                      .foregroundColor(.primary.opacity(0.9))
                }
                .padding(.vertical, 4)
                .frame(maxWidth: .infinity, alignment: .leading)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .listRowBackground(Color.clear)
        }
        .scrollContentBackground(.hidden)
        .scrollDismissesKeyboard(.immediately)
        .navigationTitle("Search")
    }
}
