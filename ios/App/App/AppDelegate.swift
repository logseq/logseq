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

    // ---------------------------------------------------------
    // MARK: Helpers
    // ---------------------------------------------------------

    private func normalizedPath(_ raw: String?) -> String {
        guard let raw = raw, !raw.isEmpty else { return "/" }
        return raw
    }

    private func debugLogStacks(_ label: String) {
        #if DEBUG
        print("🧭 [\(label)] activeStackId=\(activeStackId)")
        print("   pathStack=\(pathStack)")
        print("   stackPathStacks=\(stackPathStacks)")
        #endif
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

        debugLogStacks("emptyNavStack")
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

        debugLogStacks("pushIfNeeded")
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

        debugLogStacks("replaceTop")
    }

    private func popIfNeeded(animated: Bool) {
        guard let nav = navController else { return }

        if nav.viewControllers.count > 1 {
            _ = pathStack.popLast()
            setPaths(pathStack, for: activeStackId)
            nav.popViewController(animated: animated)

            debugLogStacks("popIfNeeded")
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

        #if DEBUG
        print("🧭 willShow — isPop=\(isPop)")
        print("   toVC=\(toVC.targetPath) fromVC=\(String(describing: fromVC?.targetPath))")
        debugLogStacks("willShow")
        #endif

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
                #if DEBUG
                print("⬅️ Native POP completed, notifying JS via onNativePop(), ignoreRoutePopCount=\(self.ignoreRoutePopCount)")
                debugLogStacks("after native-pop pathStack update")
                #endif

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

            #if DEBUG
            print("📡 routeDidChange from JS → native")
            print("   stackId=\(stackId) navigationType=\(navigationType) path=\(path)")
            debugLogStacks("before observeRouteChanges")
            #endif

            // ============================================
            // 1️⃣ Stack switch: home ↔ capture ↔ goto ...
            // ============================================
            if stackId != self.activeStackId {
                // Save current native stack paths; drop stale search stack when leaving it.
                if previousStackId == "search", stackId != "search" {
                    self.setPaths(["/__stack__/search"], for: "search")
                } else {
                    self.setPaths(self.pathStack, for: previousStackId)
                }

                // Load (or create) new stack's paths
                var newPaths = self.paths(for: stackId)

                // Ensure the top of the stack matches the path sent by JS
                if let last = newPaths.last, last != path {
                    if newPaths.isEmpty {
                        newPaths = [path]
                    } else {
                        newPaths[newPaths.count - 1] = path
                    }
                }

                self.activeStackId = stackId
                self.pathStack = newPaths
                self.setPaths(newPaths, for: stackId)

                // Rebuild the UINavigationController's stack from these paths
                var vcs: [UIViewController] = []
                for (idx, p) in newPaths.enumerated() {
                    let vc = NativePageViewController(path: p, push: idx > 0)
                    vcs.append(vc)
                }

                nav.setViewControllers(vcs, animated: false)

                if let lastVC = vcs.last as? NativePageViewController {
                    SharedWebViewController.instance.attach(to: lastVC)
                    SharedWebViewController.instance.clearPlaceholder()
                }

                #if DEBUG
                print("🔀 STACK SWITCH to \(stackId)")
                debugLogStacks("after stack switch")
                #endif

                // For stacks like "capture", default paths are ["__/stack__/capture"],
                // so they get a single VC and no back button.
                return
            }

            // ============================================
            // 2️⃣ Navigation *within* the active stack
            // ============================================
            switch navigationType {
            case "reset":
                self.emptyNavStack(path: path)

            case "replace":
                self.replaceTop(path: path)

            case "pop":
                if self.ignoreRoutePopCount > 0 {
                    self.ignoreRoutePopCount -= 1
                    #if DEBUG
                    print("🙈 ignoring JS pop (ignoreRoutePopCount→\(self.ignoreRoutePopCount))")
                    debugLogStacks("after ignore JS pop")
                    #endif
                    return
                }
                if self.pathStack.count > 1 {
                    self.popIfNeeded(animated: true)
                }

            default:
                self.pushIfNeeded(path: path, animated: true)
            }

            #if DEBUG
            debugLogStacks("after observeRouteChanges switch")
            #endif
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
