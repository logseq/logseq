import SwiftUI

struct NativeNavHost: UIViewControllerRepresentable {
    let navController: UINavigationController

    func makeUIViewController(context: Context) -> UINavigationController {
        navController
    }

    func updateUIViewController(_ uiViewController: UINavigationController, context: Context) {
        // JS routing still drives pushes/pops; nothing to do here.
    }
}
