//
//  NativePageViewController.swift
//  Logseq
//
//  A lightweight UIViewController that hosts the shared WebView and
//  asks JS to render the desired path when shown.
//

import UIKit

class NativePageViewController: UIViewController, UIGestureRecognizerDelegate {
    let targetPath: String
    let push: Bool

    init(path: String, push: Bool = true, title: String? = nil) {
        self.targetPath = path
        self.push = push
        super.init(nibName: nil, bundle: nil)
        self.navigationItem.title = title
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .logseqBackground
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        navigationController?.interactivePopGestureRecognizer?.isEnabled = true
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)

        guard let nav = navigationController,
              let popGesture = nav.interactivePopGestureRecognizer else { return }

        popGesture.delegate = self
        popGesture.isEnabled = nav.viewControllers.count > 1
    }

    func gestureRecognizerShouldBegin(_ gestureRecognizer: UIGestureRecognizer) -> Bool {
        guard
            let nav = navigationController,
            gestureRecognizer === nav.interactivePopGestureRecognizer
        else { return true }

        return nav.viewControllers.count > 1
    }

    func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer,
                           shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer) -> Bool {
        guard let nav = navigationController else { return false }
        return gestureRecognizer === nav.interactivePopGestureRecognizer
    }
}
