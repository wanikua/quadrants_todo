import SwiftUI

struct AddTaskView: View {
    let onAdd: (String, Double, Double) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var taskDescription = ""
    @State private var urgency: Double = 50
    @State private var importance: Double = 50
    @FocusState private var isDescriptionFocused: Bool

    private var canSubmit: Bool {
        !taskDescription.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                HStack(spacing: 8) {
                    Image(systemName: "plus.circle.fill")
                        .font(.system(size: 18))
                        .foregroundColor(CuteBoldStyle.accentColor(for: currentQuadrant))
                    Text("New Task")
                        .font(.system(size: 18, weight: .bold))
                }

                Spacer()

                Button(action: { dismiss() }) {
                    Image(systemName: "xmark")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(.black)
                        .frame(width: 26, height: 26)
                        .background(Color(hex: "F3F4F6"))
                        .clipShape(RoundedRectangle(cornerRadius: 6))
                        .overlay(
                            RoundedRectangle(cornerRadius: 6)
                                .stroke(.black, lineWidth: 2)
                        )
                }
                .buttonStyle(CuteBoldButtonStyle())
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 14)

            Rectangle()
                .frame(height: CuteBoldStyle.borderWidth)
                .foregroundColor(.black)

            // Content
            VStack(spacing: 18) {
                // Description
                VStack(alignment: .leading, spacing: 6) {
                    Text("What needs to be done?")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.secondary)

                    TextField("Describe your task...", text: $taskDescription, axis: .vertical)
                        .textFieldStyle(.plain)
                        .font(.system(size: 15))
                        .padding(12)
                        .background(Color.white)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(isDescriptionFocused ? Color.black : Color.black.opacity(0.3), lineWidth: isDescriptionFocused ? 2.5 : 2)
                        )
                        .lineLimit(2...5)
                        .focused($isDescriptionFocused)
                }

                // Sliders side by side
                HStack(spacing: 16) {
                    // Urgency
                    VStack(alignment: .leading, spacing: 6) {
                        HStack {
                            Text("Urgency")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundColor(.black)
                            Spacer()
                            Text("\(Int(urgency))")
                                .font(.system(size: 12, weight: .black, design: .monospaced))
                                .foregroundColor(.white)
                                .frame(width: 32, height: 22)
                                .background(urgencyColor)
                                .clipShape(RoundedRectangle(cornerRadius: 5))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 5)
                                        .stroke(.black, lineWidth: 1.5)
                                )
                        }

                        Slider(value: $urgency, in: 0...100, step: 1)
                            .tint(urgencyColor)
                    }

                    // Importance
                    VStack(alignment: .leading, spacing: 6) {
                        HStack {
                            Text("Importance")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundColor(.black)
                            Spacer()
                            Text("\(Int(importance))")
                                .font(.system(size: 12, weight: .black, design: .monospaced))
                                .foregroundColor(.white)
                                .frame(width: 32, height: 22)
                                .background(importanceColor)
                                .clipShape(RoundedRectangle(cornerRadius: 5))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 5)
                                        .stroke(.black, lineWidth: 1.5)
                                )
                        }

                        Slider(value: $importance, in: 0...100, step: 1)
                            .tint(importanceColor)
                    }
                }

                // Quadrant Preview — mini visual
                HStack(spacing: 12) {
                    // Mini 2x2 grid indicator
                    MiniQuadrantIndicator(quadrant: currentQuadrant)

                    VStack(alignment: .leading, spacing: 2) {
                        HStack(spacing: 5) {
                            Image(systemName: CuteBoldStyle.icon(for: currentQuadrant))
                                .font(.system(size: 11, weight: .bold))
                            Text(currentQuadrant.label)
                                .font(.system(size: 13, weight: .bold))
                        }
                        .foregroundColor(CuteBoldStyle.textColor(for: currentQuadrant))

                        Text(CuteBoldStyle.subtitle(for: currentQuadrant))
                            .font(.system(size: 11))
                            .foregroundColor(CuteBoldStyle.textColor(for: currentQuadrant).opacity(0.6))
                    }

                    Spacer()
                }
                .padding(12)
                .background(CuteBoldStyle.bgColor(for: currentQuadrant))
                .clipShape(RoundedRectangle(cornerRadius: 10))
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(.black, lineWidth: 2)
                )
                .animation(.easeInOut(duration: 0.2), value: currentQuadrant)
            }
            .padding(20)

            Spacer()

            Rectangle()
                .frame(height: CuteBoldStyle.borderWidth)
                .foregroundColor(.black)

            // Actions
            HStack(spacing: 12) {
                Button(action: { dismiss() }) {
                    Text("Cancel")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(.black)
                        .padding(.horizontal, 20)
                        .padding(.vertical, 10)
                        .background(Color(hex: "F3F4F6"))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(.black, lineWidth: 2)
                        )
                }
                .buttonStyle(CuteBoldButtonStyle())
                .keyboardShortcut(.escape, modifiers: [])

                Spacer()

                // Shortcut hint
                if canSubmit {
                    Text("⌘↩")
                        .font(.system(size: 10, weight: .medium, design: .monospaced))
                        .foregroundColor(.gray.opacity(0.5))
                        .padding(.horizontal, 6)
                        .padding(.vertical, 3)
                        .background(Color.gray.opacity(0.08))
                        .clipShape(RoundedRectangle(cornerRadius: 4))
                }

                Button(action: addTask) {
                    HStack(spacing: 6) {
                        Image(systemName: "plus")
                            .font(.system(size: 12, weight: .bold))
                        Text("Add Task")
                            .font(.system(size: 13, weight: .bold))
                    }
                    .foregroundColor(.white)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 10)
                    .background(canSubmit ? Color.black : Color.gray)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(canSubmit ? .black : .gray, lineWidth: 2)
                    )
                    .shadow(color: canSubmit ? .black : .clear, radius: 0, x: 3, y: 3)
                }
                .buttonStyle(CuteBoldButtonStyle())
                .disabled(!canSubmit)
                .keyboardShortcut(.return, modifiers: .command)
            }
            .padding(20)
        }
        .frame(width: 440, height: 480)
        .background(Color(hex: "F9FAFB"))
        .clipShape(RoundedRectangle(cornerRadius: CuteBoldStyle.cornerRadius))
        .overlay(
            RoundedRectangle(cornerRadius: CuteBoldStyle.cornerRadius)
                .stroke(.black, lineWidth: CuteBoldStyle.borderWidth)
        )
        .onAppear {
            isDescriptionFocused = true
        }
    }

    private var currentQuadrant: Quadrant {
        let isUrgent = urgency >= 50
        let isImportant = importance >= 50
        switch (isUrgent, isImportant) {
        case (true, true): return .urgentImportant
        case (true, false): return .urgentNotImportant
        case (false, true): return .notUrgentImportant
        case (false, false): return .notUrgentNotImportant
        }
    }

    private var urgencyColor: Color {
        if urgency >= 70 { return Color(hex: "EF4444") }
        if urgency >= 40 { return Color(hex: "F59E0B") }
        return Color(hex: "22C55E")
    }

    private var importanceColor: Color {
        if importance >= 70 { return Color(hex: "3B82F6") }
        if importance >= 40 { return Color(hex: "8B5CF6") }
        return Color(hex: "6B7280")
    }

    private func addTask() {
        let description = taskDescription.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !description.isEmpty else { return }
        onAdd(description, urgency, importance)
        dismiss()
    }
}

// MARK: - Mini Quadrant Indicator
struct MiniQuadrantIndicator: View {
    let quadrant: Quadrant

    private let allQuadrants: [(Quadrant, Int)] = [
        (.urgentImportant, 0),
        (.notUrgentImportant, 1),
        (.urgentNotImportant, 2),
        (.notUrgentNotImportant, 3)
    ]

    var body: some View {
        VStack(spacing: 2) {
            HStack(spacing: 2) {
                miniCell(.urgentImportant)
                miniCell(.notUrgentImportant)
            }
            HStack(spacing: 2) {
                miniCell(.urgentNotImportant)
                miniCell(.notUrgentNotImportant)
            }
        }
    }

    @ViewBuilder
    private func miniCell(_ q: Quadrant) -> some View {
        RoundedRectangle(cornerRadius: 3)
            .fill(CuteBoldStyle.bgColor(for: q))
            .frame(width: 18, height: 18)
            .overlay(
                RoundedRectangle(cornerRadius: 3)
                    .stroke(q == quadrant ? .black : .black.opacity(0.15), lineWidth: q == quadrant ? 2 : 1)
            )
            .overlay(
                q == quadrant ?
                Circle()
                    .fill(CuteBoldStyle.accentColor(for: q))
                    .frame(width: 8, height: 8)
                : nil
            )
            .scaleEffect(q == quadrant ? 1.1 : 1.0)
            .animation(.spring(response: 0.25, dampingFraction: 0.7), value: quadrant)
    }
}

#Preview {
    AddTaskView { _, _, _ in }
}
