//
//  UILocal.swift
//  App
//
//  Created by Charlie on 2025/5/29.
//

import Capacitor
import Foundation

func isDarkMode() -> Bool {
    if #available(iOS 12.0, *) {
        return UITraitCollection.current.userInterfaceStyle == .dark
    } else {
        return false
    }
}

class DatePickerDialogViewController: UIViewController {
  private let datePicker = UIDatePicker()
  private let dialogView = UIView()

  var onDateSelected: ((Date?) -> Void)?

  override func viewDidLoad() {
    super.viewDidLoad()
    setupImplView()
  }

  @objc private func confirmDate() {
    onDateSelected?(datePicker.date)
    dismiss(animated: true, completion: nil)
  }

  @objc private func dismissDialog() {
    onDateSelected?(nil)
    dismiss(animated: true, completion: nil)
  }
  
  override func traitCollectionDidChange(_ previousTraitCollection: UITraitCollection?) {
          super.traitCollectionDidChange(previousTraitCollection)
          
          if #available(iOS 12.0, *) {
              if traitCollection.userInterfaceStyle != previousTraitCollection?.userInterfaceStyle {
                  if traitCollection.userInterfaceStyle == .dark {
                      print("switch to dark mode")
                    dialogView.backgroundColor = .black
                  } else {
                      print("switch to light mode")
                    dialogView.backgroundColor = .white
                  }
              }
          }
      }
  
  func setupImplView() {
    datePicker.datePickerMode = .date
    datePicker.preferredDatePickerStyle = .inline
    datePicker.addTarget(
      self, action: #selector(confirmDate), for: .valueChanged)

    // Create hosting view controller
    let view = self.view!

    view.backgroundColor = .black.withAlphaComponent(0.4)

    if isDarkMode() {
      dialogView.backgroundColor = .black
    } else {
      dialogView.backgroundColor = .white
    }
    
    dialogView.layer.cornerRadius = 10
    dialogView.clipsToBounds = true
    view.addSubview(dialogView)

    dialogView.translatesAutoresizingMaskIntoConstraints = false
    NSLayoutConstraint.activate([
      dialogView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
      dialogView.centerYAnchor.constraint(equalTo: view.centerYAnchor),
    ])

    // Add sub views
    dialogView.addSubview(datePicker)

    // Add date selector and toolbar to the view
    datePicker.translatesAutoresizingMaskIntoConstraints = false

    NSLayoutConstraint.activate([
      datePicker.topAnchor.constraint(equalTo: dialogView.topAnchor),
      datePicker.bottomAnchor.constraint(equalTo: dialogView.bottomAnchor, constant: -8),
      datePicker.leadingAnchor.constraint(equalTo: dialogView.leadingAnchor, constant: 16),
      datePicker.trailingAnchor.constraint(equalTo: dialogView.trailingAnchor, constant: -16),
    ])

    datePicker.setContentHuggingPriority(.required, for: .horizontal)
    datePicker.setContentHuggingPriority(.required, for: .vertical)
    datePicker.setContentCompressionResistancePriority(
      .required, for: .horizontal)
    datePicker.setContentCompressionResistancePriority(
      .required, for: .vertical)
  }

  override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
    if let touch = touches.first {
      let location = touch.location(in: view)
      if !dialogView.frame.contains(location) {
        dismiss(animated: true, completion: nil)
      }
    }

    super.touchesBegan(touches, with: event)
  }
}

@objc(UILocalPlugin)
public class UILocalPlugin: CAPPlugin, CAPBridgedPlugin {

  public let identifier = "UILocalPlugin"
  public let jsName = "UILocal"

  private var call: CAPPluginCall?
  private var selectedDate: Date?
  private var datepickerViewController: UIViewController?
  private var datepickerDialogView: UIView?

  public let pluginMethods: [CAPPluginMethod] = [
    CAPPluginMethod(name: "showDatePicker", returnType: CAPPluginReturnPromise)
  ]

  @objc func showDatePicker(_ call: CAPPluginCall) {
    self.call = call

    DispatchQueue.main.async { [weak self] in
      let viewController = DatePickerDialogViewController()

      // Set view controller presentation
      viewController.modalPresentationStyle = .overFullScreen
      viewController.modalTransitionStyle = .crossDissolve
      viewController.isModalInPresentation = true  // 禁止非按钮交互关闭

      viewController.onDateSelected = self?.dateChanged

      // Present View Controller
      guard let presentingViewController = self?.bridge?.viewController else {
        call.reject("Unable to present date picker")
        return
      }

      presentingViewController.present(
        viewController, animated: true, completion: nil)
    }
  }

  private func dateChanged(_ date: Date?) {
    self.selectedDate = date
    self.call?.keepAlive = true  // Keep calling until confirmed or canceled
    onDateSelected()
  }

  private func onDateSelected() {
    if let date = self.selectedDate {
      let formatter = DateFormatter()
      formatter.dateFormat = "yyyy-MM-dd"
      let dateString = formatter.string(from: date)
      let result: PluginCallResultData = ["value": dateString]
      self.call?.resolve(result)
    } else {
      let formatter = DateFormatter()
      formatter.dateFormat = "yyyy-MM-dd"
      let dateString = formatter.string(from: Date())
      let result: PluginCallResultData = ["value": dateString]
      self.call?.resolve(result)
    }

    self.bridge?.viewController?.dismiss(animated: true, completion: nil)
  }

  override public func load() {
    print("🔅 UILocalPlugin loaded")
  }
}
