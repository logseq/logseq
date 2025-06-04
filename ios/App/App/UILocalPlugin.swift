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

func isOnlyDayDifferentOrSame(date1: Foundation.Date, date2: Date) -> Bool {
  let calendar = Calendar.current
  let components1 = calendar.dateComponents([.year, .month, .day], from: date1)
  let components2 = calendar.dateComponents([.year, .month, .day], from: date2)

  return components1.year == components2.year && components1.month == components2.month && (components1.day != components2.day || components1.day == components2.day)
}

class DatePickerView: UIView {
  override init(frame: CGRect) {
    super.init(frame: frame)
    isUserInteractionEnabled = true
  }

  required init?(coder: NSCoder) {
    super.init(coder: coder)
    isUserInteractionEnabled = true
  }

  override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
    super.touchesBegan(touches, with: event)
  }
}

class DatePickerDialogViewController: UIViewController {
  private let datePicker = UIDatePicker()
  private let dialogView = DatePickerView()

  private var lastDate: Date?
  private var initialMonthLabel: UILabel?
  private var currentMonthText: String?

  var onDateSelected: ((Date?) -> Void)?

  override func viewDidLoad() {
    super.viewDidLoad()
    lastDate = datePicker.date
    setupImplView()

    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
      self?.settleMonthLabel()
    }
  }

  private func settleMonthLabel() {
    initialMonthLabel = findMonthLabel(in: datePicker)
    if let label = initialMonthLabel {
      currentMonthText = label.text
      print("Initial month label: \(currentMonthText ?? "Unknown")")
    } else {
      print("Month label not found")
    }
  }

  private func findMonthLabel(in view: UIView) -> UILabel? {
    for subview in view.subviews {
      if let label = subview as? UILabel, (label.text?.contains(" ")) == true {
        print(label.text as Any)
        return label
      }
      if let foundLabel = findMonthLabel(in: subview) {
        return foundLabel
      }
    }
    return nil
  }

  private func inCalendarWheelPickerMode(in view: UIView) -> Bool? {
    for subview in view.subviews {
      if let label = subview as? UILabel, label.text?.contains("July") == true {
        print(label.text as Any)
        return true
      }

      let found: Bool? = inCalendarWheelPickerMode(in: subview)

      if found == true {
        return true
      }
    }

    return false
  }


  @objc private func confirmDate() {
    let label = findMonthLabel(in: datePicker)
    if isOnlyDayDifferentOrSame(date1: lastDate!, date2: datePicker.date) || (label != nil && label?.text != currentMonthText && (inCalendarWheelPickerMode(in: datePicker) != true)) {
      onDateSelected?(datePicker.date)
      dismiss(animated: false, completion: nil)
    }
  }

  @objc private func dismissDialog() {
    onDateSelected?(nil)
    dismiss(animated: false, completion: nil)
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
    view.isUserInteractionEnabled = true

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
    super.touchesBegan(touches, with: event)

    if let touch = touches.first {
      let location = touch.location(in: view)
      if !dialogView.frame.contains(location) {
        dismiss(animated: true, completion: nil)
      }
    }
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
        viewController, animated: false, completion: nil)
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
