import UIKit
import Capacitor
import Intents
import SwiftUI

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, UINavigationControllerDelegate {

    var window: UIWindow?
    var navController: UINavigationController?

    // ---------------------------------------------------------
    // MARK: Multi-stack routing state
    // ---------------------------------------------------------

    /// Currently active logical stack id (must match CLJS :stack, e.g. "home", "capture", "goto").
    private var activeStackId: String = "home"

    /// Per-stack path stacks, including the active one.
    /// Example: ["home": ["/", "/page/A"], "capture": ["/__stack__/capture"]]
    private var stackPathStacks: [String: [String]] = [
        "home": ["/"]
    ]

    /// Mirror of the active stack's paths.
    private var pathStack: [String] = ["/"]

    /// Used to ignore JS-driven pops when we're popping in response to a native gesture.
    private var ignoreRoutePopCount: Int = 0

    /// Temporary snapshot image for smooth pop transitions.
    private var popSnapshotView: UIView?

    // Each stack has its own native VC stack, just like paths.
    private var stackViewControllerStacks: [String: [UIViewController]] = [:]

    // ---------------------------------------------------------
    // MARK: Helpers
    // ---------------------------------------------------------

    private func normalizedPath(_ raw: String?) -> String {
        guard let raw = raw, !raw.isEmpty else { return "/" }
        return raw
    }

    /// Returns the current native path stack for a given logical stack id,
    /// or initialises a sensible default if none exists yet.
    private func paths(for stackId: String) -> [String] {
        if let existing = stackPathStacks[stackId], !existing.isEmpty {
            return existing
        }

        if stackId == "home" {
            return ["/"]
        } else {
            // Virtual stacks (e.g. capture, search, goto) default to a stack-root path.
            return ["/__stack__/\(stackId)"]
        }
    }

    /// Updates the stored paths for a given stack id and keeps `pathStack`
    /// consistent if this is the active stack.
    private func setPaths(_ paths: [String], for stackId: String) {
        stackPathStacks[stackId] = paths
        if stackId == activeStackId {
            pathStack = paths
        }
    }

    private func setViewControllers(_ vcs: [UIViewController], for stackId: String) {
        stackViewControllerStacks[stackId] = vcs
    }

    private func viewControllers(for stackId: String) -> [UIViewController] {
        stackViewControllerStacks[stackId] ?? []
    }

    // ---------------------------------------------------------
    // MARK: UIApplication lifecycle
    // ---------------------------------------------------------

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        if let shortcutItem = launchOptions?[.shortcutItem] as? UIApplicationShortcutItem {
            DispatchQueue.main.async {
                _ = self.handleShortcutItem(shortcutItem)
            }
        }

        return true
    }

    func application(_ application: UIApplication,
                     performActionFor shortcutItem: UIApplicationShortcutItem,
                     completionHandler: @escaping (Bool) -> Void) {
        let handled = handleShortcutItem(shortcutItem)
        completionHandler(handled)
    }

    func application(
        _ application: UIApplication,
        configurationForConnecting connectingSceneSession: UISceneSession,
        options: UIScene.ConnectionOptions
    ) -> UISceneConfiguration {
        let config = UISceneConfiguration(
            name: "Default Configuration",
            sessionRole: connectingSceneSession.role
        )
        config.delegateClass = SceneDelegate.self
        return config
    }

    func application(_ application: UIApplication,
                     didDiscardSceneSessions sceneSessions: Set<UISceneSession>) {}

    // ---------------------------------------------------------
    // MARK: Shortcuts
    // ---------------------------------------------------------

    @discardableResult
    func handleShortcutItem(_ shortcutItem: UIApplicationShortcutItem) -> Bool {
        switch shortcutItem.type {
        case "logseq.quickadd":
            donateQuickAddShortcut()
            openURL("logseq://mobile/go/quick-add")
            return true

        case "logseq.voice":
            donateAudioShortcut()
            openURL("logseq://mobile/go/audio")
            return true

        default:
            return false
        }
    }

    func application(_ application: UIApplication,
                     continue userActivity: NSUserActivity,
                     restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {

        if userActivity.activityType == "com.logseq.quickadd" {
            openURL("logseq://mobile/go/quick-add")
            return true
        }

        if userActivity.activityType == "com.logseq.audio" {
            openURL("logseq://mobile/go/audio")
            return true
        }

        if userActivity.activityType == NSUserActivityTypeBrowsingWeb,
           let url = userActivity.webpageURL {
            print("🌐 Universal link:", url)
        }

        return ApplicationDelegateProxy.shared.application(
            application,
            continue: userActivity,
            restorationHandler: restorationHandler
        )
    }

    func application(_ application: UIApplication,
                     open url: URL,
                     options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        print("🔥 opened with URL:", url)

        return ApplicationDelegateProxy.shared.application(
            application,
            open: url,
            options: options
        )
    }

    private func openURL(_ urlString: String) {
        if let url = URL(string: urlString) {
            UIApplication.shared.open(url, options: [:], completionHandler: nil)
        }
    }

    // ---------------------------------------------------------
    // MARK: Navigation operations (within active stack)
    // ---------------------------------------------------------

    private func emptyNavStack(path: String) {
        let path = normalizedPath(path)
        guard let nav = navController else { return }

        ignoreRoutePopCount = 0
        popSnapshotView?.removeFromSuperview()
        popSnapshotView = nil

        let vc = NativePageViewController(path: path, push: false)
        pathStack = [path]
        setPaths(pathStack, for: activeStackId)

        nav.setViewControllers([vc], animated: false)
        SharedWebViewController.instance.clearPlaceholder()
        SharedWebViewController.instance.attach(to: vc)

    }

    private func pushIfNeeded(path: String, animated: Bool) {
        let path = normalizedPath(path)
        guard let nav = navController else { return }
        if pathStack.last == path { return }

        if let fromVC = nav.topViewController as? NativePageViewController {
            SharedWebViewController.instance.storeSnapshot(for: fromVC)
        }

        let vc = NativePageViewController(path: path, push: true)
        pathStack.append(path)
        setPaths(pathStack, for: activeStackId)

        nav.pushViewController(vc, animated: animated)

    }

    private func replaceTop(path: String) {
        let path = normalizedPath(path)
        guard let nav = navController else { return }

        _ = pathStack.popLast()
        pathStack.append(path)
        setPaths(pathStack, for: activeStackId)

        let vc = NativePageViewController(path: path, push: false)
        var stack = nav.viewControllers
        if stack.isEmpty {
            stack = [vc]
        } else {
            stack[stack.count - 1] = vc
        }
        nav.setViewControllers(stack, animated: false)

    }

    private func popIfNeeded(animated: Bool) {
        guard let nav = navController else { return }

        if nav.viewControllers.count > 1 {
            _ = pathStack.popLast()
            setPaths(pathStack, for: activeStackId)
            nav.popViewController(animated: animated)
        }
    }

    // ---------------------------------------------------------
    // MARK: Navigation Delegate
    // ---------------------------------------------------------

    func navigationController(
      _ navigationController: UINavigationController,
      willShow viewController: UIViewController,
      animated: Bool
    ) {
        guard let toVC = viewController as? NativePageViewController else { return }
        guard let coordinator = navigationController.transitionCoordinator else { return }

        let vcs = navigationController.viewControllers
        let toIndex = vcs.firstIndex(of: toVC)
        let fromVC = coordinator.viewController(forKey: .from) as? NativePageViewController
        let fromIndex = fromVC.flatMap { vcs.firstIndex(of: $0) }

        let isPop = if let to = toIndex, let from = fromIndex {
            to < from
        } else {
            vcs.count < pathStack.count
        }

        if isPop {
            // -----------------------------
            // POP — update per-stack pathStack, then notify JS.
            // -----------------------------
            let previousStack = pathStack

            if pathStack.count > 1 {
                _ = pathStack.popLast()
            }
            if let last = pathStack.last, last != toVC.targetPath {
                pathStack[pathStack.count - 1] = toVC.targetPath
            }
            setPaths(pathStack, for: activeStackId)

            popSnapshotView?.removeFromSuperview()
            popSnapshotView = nil

            if let snapshot = SharedWebViewController.instance.snapshot(for: toVC) {
                let iv = UIImageView(image: snapshot)
                iv.frame = toVC.view.bounds
                iv.autoresizingMask = [.flexibleWidth, .flexibleHeight]
                toVC.view.addSubview(iv)
                popSnapshotView = iv
            }

            coordinator.animate(alongsideTransition: nil) { [weak self] ctx in
                guard let self else { return }

                guard !ctx.isCancelled else {
                    self.pathStack = previousStack
                    self.setPaths(previousStack, for: self.activeStackId)

                    if let fromVC {
                        SharedWebViewController.instance.attach(to: fromVC)
                    }
                    SharedWebViewController.instance.clearPlaceholder()
                    return
                }

                // 🔑 DO NOT call webView.goBack().
                // Tell JS explicitly that native popped.
                self.ignoreRoutePopCount += 1

                if let bridge = SharedWebViewController.instance.bridgeController.bridge {
                    let js = "window.LogseqNative && window.LogseqNative.onNativePop && window.LogseqNative.onNativePop();"
                    bridge.webView?.evaluateJavaScript(js, completionHandler: nil)
                }

                SharedWebViewController.instance.attach(
                  to: toVC,
                  leavePlaceholderInPreviousParent: fromVC != nil
                )

                if let snapshot = self.popSnapshotView {
                    toVC.view.bringSubviewToFront(snapshot)
                }

                DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                    SharedWebViewController.instance.clearPlaceholder()
                    self.popSnapshotView?.removeFromSuperview()
                    self.popSnapshotView = nil
                }
            }
        } else {
            // -----------------------------
            // PUSH / RESET
            // -----------------------------
            SharedWebViewController.instance.attach(
              to: toVC,
              leavePlaceholderInPreviousParent: fromVC != nil
            )

            coordinator.animate(alongsideTransition: nil) { ctx in
                if ctx.isCancelled, let fromVC {
                    SharedWebViewController.instance.attach(to: fromVC)
                } else {
                    SharedWebViewController.instance.clearPlaceholder()
                }
            }
        }
    }

    func navigationController(
        _ navigationController: UINavigationController,
        didShow viewController: UIViewController,
        animated: Bool
    ) {
        guard let current = viewController as? NativePageViewController else { return }

        if !NativeBottomSheetPlugin.isPresentingSheet {
            SharedWebViewController.instance.clearPlaceholder()
            SharedWebViewController.instance.attach(to: current)
        }
    }

    func navigationController(
        _ navigationController: UINavigationController,
        animationControllerFor operation: UINavigationController.Operation,
        from fromVC: UIViewController,
        to toVC: UIViewController
    ) -> UIViewControllerAnimatedTransitioning? {
        // Sidebar animator removed → always return nil
        return nil
    }

    // ---------------------------------------------------------
    // MARK: Route Observation (JS -> Native)
    // ---------------------------------------------------------

    private func observeRouteChanges() {
        NotificationCenter.default.addObserver(
          forName: UILocalPlugin.routeChangeNotification,
          object: nil,
          queue: .main
        ) { [weak self] notification in
            guard let self else { return }
            guard let nav = self.navController else { return }

            let rawPath = notification.userInfo?["path"] as? String
            let path = self.normalizedPath(rawPath)
            let navigationType = (notification.userInfo?["navigationType"] as? String) ?? "push"
            let stackId = (notification.userInfo?["stack"] as? String) ?? "home"
            let previousStackId = self.activeStackId

            // 🚫 Fast-path: ignore duplicate replace for same stack/path
            if stackId == self.activeStackId,
               navigationType == "replace",
               path == self.pathStack.last {
                return
            }

            // ⚡️ Fast-path: cancel search → home root.
            // We do NOT rebuild nav stack and we do NOT reattach the WebView.
            // JS will just navigate the existing shared WKWebView to "/".
            if previousStackId == "search",
               stackId == "home"{

                // Just update bookkeeping so future home pushes/pop work correctly.
                self.setPaths(["/__stack__/search"], for: "search")
                self.activeStackId = "home"
                self.setPaths(["/"], for: "home")

                let vc = NativePageViewController(path: "/")
                nav.setViewControllers([vc], animated: false)
                self.setViewControllers([vc], for: "home")

                // 👈 Do NOTHING to nav.viewControllers or SharedWebViewController here.
                return
            }

            // ============================================
            // 1️⃣ Stack switch: home ↔ search ↔ capture...
            // ============================================
            if stackId != self.activeStackId {
                self.setPaths(self.pathStack, for: previousStackId)

                // Load saved paths for target stack
                var newPaths = self.paths(for: stackId)

                // 🔑 Special rules for shaping the new stack
                if stackId == "home", path == "/" {
                    // 👉 ALWAYS reset home to a single root VC.
                    newPaths = ["/"]
                } else if newPaths.isEmpty {
                    // First time visiting this stack
                    newPaths = [path]
                } else if let last = newPaths.last, last != path {
                    // Same history, but different top path → align the top.
                    newPaths[newPaths.count - 1] = path
                }

                self.activeStackId = stackId
                self.pathStack = newPaths
                self.setPaths(newPaths, for: stackId)

                // Rebuild native stack for these paths
                var vcs: [UIViewController] = []
                for (idx, p) in newPaths.enumerated() {
                    let vc = NativePageViewController(path: p, push: idx > 0)
                    vcs.append(vc)
                }

                nav.setViewControllers(vcs, animated: false)
                self.setViewControllers(vcs, for: stackId)

                if let lastVC = vcs.last as? NativePageViewController {
                    // Defer & avoid redundant attach.
                    DispatchQueue.main.async {
                        if let bridge = SharedWebViewController.instance.bridgeController.bridge,
                           let webView = bridge.webView,
                           webView.isDescendant(of: lastVC.view) {
                        } else {
                            SharedWebViewController.instance.attach(to: lastVC)
                        }
                        SharedWebViewController.instance.clearPlaceholder()
                    }
                }

                return
            }

            // ============================================
            // 2️⃣ Navigation *within* active stack
            // ============================================
            switch navigationType {
            case "reset":
                self.emptyNavStack(path: path)

            case "replace":
                self.replaceTop(path: path)

            case "pop":
                if self.ignoreRoutePopCount > 0 {
                    self.ignoreRoutePopCount -= 1
                    return
                }
                if self.pathStack.count > 1 {
                    self.popIfNeeded(animated: true)
                }

            default:
                self.pushIfNeeded(path: path, animated: true)
            }
        }
    }

}

// ---------------------------------------------------------
// MARK: NSUserActivity utilities
// ---------------------------------------------------------

extension NSUserActivity {
    static var quickAdd: NSUserActivity {
        let a = NSUserActivity(activityType: "com.logseq.quickadd")
        a.title = "Quick Add"
        a.isEligibleForSearch = true
        a.isEligibleForPrediction = true
        a.persistentIdentifier = NSUserActivityPersistentIdentifier("com.logseq.quickadd")
        a.suggestedInvocationPhrase = "Quick Add in Logseq"
        return a
    }

    static var recordAudio: NSUserActivity {
        let a = NSUserActivity(activityType: "com.logseq.audio")
        a.title = "Record Audio"
        a.isEligibleForSearch = true
        a.isEligibleForPrediction = true
        a.persistentIdentifier = NSUserActivityPersistentIdentifier("com.logseq.audio")
        a.suggestedInvocationPhrase = "Record in Logseq"
        return a
    }
}

// ---------------------------------------------------------
// MARK: Convenience
// ---------------------------------------------------------

extension AppDelegate {
    func donateQuickAddShortcut() {
        let a = NSUserActivity.quickAdd
        window?.rootViewController?.userActivity = a
        a.becomeCurrent()
    }

    func donateAudioShortcut() {
        let a = NSUserActivity.recordAudio
        window?.rootViewController?.userActivity = a
        a.becomeCurrent()
    }

    func startRouteObservation() {
        observeRouteChanges()
    }
}
