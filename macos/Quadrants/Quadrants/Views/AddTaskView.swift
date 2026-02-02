import SwiftUI

struct AddTaskView: View {
    let onAdd: (String, Double, Double) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var taskDescription = ""
    @State private var urgency: Double = 50
    @State private var importance: Double = 50
    @FocusState private var isDescriptionFocused: Bool

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Text("New Task")
                    .font(.system(size: 18, weight: .semibold))
                Spacer()
                Button(action: { dismiss() }) {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 22))
                        .foregroundColor(.secondary)
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 16)

            Divider()

            // Content
            VStack(spacing: 24) {
                // Description
                VStack(alignment: .leading, spacing: 8) {
                    Text("What needs to be done?")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(.secondary)

                    TextField("Enter task description...", text: $taskDescription, axis: .vertical)
                        .textFieldStyle(.plain)
                        .font(.system(size: 15))
                        .padding(12)
                        .background(Color(hex: "F3F4F6"))
                        .cornerRadius(10)
                        .lineLimit(3...6)
                        .focused($isDescriptionFocused)
                }

                // Urgency Slider
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text("Urgency")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(.secondary)
                        Spacer()
                        Text("\(Int(urgency))%")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(urgencyColor)
                    }

                    Slider(value: $urgency, in: 0...100, step: 1)
                        .tint(urgencyColor)
                }

                // Importance Slider
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text("Importance")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(.secondary)
                        Spacer()
                        Text("\(Int(importance))%")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(importanceColor)
                    }

                    Slider(value: $importance, in: 0...100, step: 1)
                        .tint(importanceColor)
                }

                // Quadrant Preview
                HStack {
                    RoundedRectangle(cornerRadius: 6)
                        .fill(quadrantColor)
                        .frame(width: 12, height: 12)

                    Text(quadrantLabel)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.secondary)

                    Spacer()
                }
                .padding(12)
                .background(quadrantColor.opacity(0.1))
                .cornerRadius(8)
            }
            .padding(20)

            Spacer()

            Divider()

            // Actions
            HStack(spacing: 12) {
                Button("Cancel") {
                    dismiss()
                }
                .buttonStyle(.plain)
                .foregroundColor(.secondary)
                .padding(.horizontal, 20)
                .padding(.vertical, 10)
                .background(Color(hex: "F3F4F6"))
                .cornerRadius(8)

                Button(action: addTask) {
                    HStack {
                        Image(systemName: "plus")
                        Text("Add Task")
                    }
                    .foregroundColor(.white)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 10)
                    .background(
                        LinearGradient(
                            colors: [Color(hex: "667EEA"), Color(hex: "764BA2")],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .cornerRadius(8)
                }
                .buttonStyle(.plain)
                .disabled(taskDescription.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                .opacity(taskDescription.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? 0.5 : 1)
            }
            .padding(20)
        }
        .frame(width: 400, height: 500)
        .background(Color.white)
        .onAppear {
            isDescriptionFocused = true
        }
    }

    private var urgencyColor: Color {
        if urgency >= 70 { return Color(hex: "EF4444") }
        if urgency >= 40 { return Color(hex: "F97316") }
        return Color(hex: "22C55E")
    }

    private var importanceColor: Color {
        if importance >= 70 { return Color(hex: "3B82F6") }
        if importance >= 40 { return Color(hex: "8B5CF6") }
        return Color(hex: "6B7280")
    }

    private var quadrantColor: Color {
        let isUrgent = urgency >= 50
        let isImportant = importance >= 50

        switch (isUrgent, isImportant) {
        case (true, true): return Color(hex: "EF4444")
        case (true, false): return Color(hex: "F97316")
        case (false, true): return Color(hex: "3B82F6")
        case (false, false): return Color(hex: "6B7280")
        }
    }

    private var quadrantLabel: String {
        let isUrgent = urgency >= 50
        let isImportant = importance >= 50

        switch (isUrgent, isImportant) {
        case (true, true): return "Do First - Urgent & Important"
        case (true, false): return "Delegate - Urgent but not important"
        case (false, true): return "Schedule - Important but not urgent"
        case (false, false): return "Eliminate - Neither urgent nor important"
        }
    }

    private func addTask() {
        let description = taskDescription.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !description.isEmpty else { return }

        onAdd(description, urgency, importance)
        dismiss()
    }
}

#Preview {
    AddTaskView { _, _, _ in }
}
