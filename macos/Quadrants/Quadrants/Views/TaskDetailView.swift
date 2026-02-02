import SwiftUI

struct TaskDetailView: View {
    @Bindable var task: TodoTask
    let onUpdate: () -> Void
    let onDelete: () -> Void
    let onComplete: () -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var showDeleteConfirm = false

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Text("Task Details")
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
            ScrollView {
                VStack(spacing: 24) {
                    // Description
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Description")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(.secondary)

                        TextField("Task description", text: $task.taskDescription, axis: .vertical)
                            .textFieldStyle(.plain)
                            .font(.system(size: 15))
                            .padding(12)
                            .background(Color(hex: "F3F4F6"))
                            .cornerRadius(10)
                            .lineLimit(3...6)
                    }

                    // Urgency Slider
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text("Urgency")
                                .font(.system(size: 13, weight: .medium))
                                .foregroundColor(.secondary)
                            Spacer()
                            Text("\(Int(task.urgency))%")
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundColor(urgencyColor)
                        }

                        Slider(value: $task.urgency, in: 0...100, step: 1)
                            .tint(urgencyColor)
                    }

                    // Importance Slider
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text("Importance")
                                .font(.system(size: 13, weight: .medium))
                                .foregroundColor(.secondary)
                            Spacer()
                            Text("\(Int(task.importance))%")
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundColor(importanceColor)
                        }

                        Slider(value: $task.importance, in: 0...100, step: 1)
                            .tint(importanceColor)
                    }

                    // Quadrant Info
                    HStack {
                        RoundedRectangle(cornerRadius: 6)
                            .fill(quadrantColor)
                            .frame(width: 12, height: 12)

                        Text(task.quadrant.description)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(.secondary)

                        Spacer()
                    }
                    .padding(12)
                    .background(quadrantColor.opacity(0.1))
                    .cornerRadius(8)

                    // Created/Updated info
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Created: \(task.createdAt.formatted())")
                            .font(.system(size: 11))
                            .foregroundColor(.secondary)
                        Text("Updated: \(task.updatedAt.formatted())")
                            .font(.system(size: 11))
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                .padding(20)
            }

            Divider()

            // Actions
            HStack(spacing: 12) {
                Button(action: { showDeleteConfirm = true }) {
                    HStack {
                        Image(systemName: "trash")
                        Text("Delete")
                    }
                    .foregroundColor(Color(hex: "EF4444"))
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .background(Color(hex: "FEE2E2"))
                    .cornerRadius(8)
                }
                .buttonStyle(.plain)

                Spacer()

                Button(action: {
                    onComplete()
                    dismiss()
                }) {
                    HStack {
                        Image(systemName: "checkmark")
                        Text("Complete")
                    }
                    .foregroundColor(.white)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .background(Color(hex: "22C55E"))
                    .cornerRadius(8)
                }
                .buttonStyle(.plain)
            }
            .padding(20)
        }
        .frame(width: 400, height: 520)
        .background(Color.white)
        .alert("Delete Task", isPresented: $showDeleteConfirm) {
            Button("Cancel", role: .cancel) { }
            Button("Delete", role: .destructive) {
                onDelete()
                dismiss()
            }
        } message: {
            Text("Are you sure you want to delete this task?")
        }
    }

    private var urgencyColor: Color {
        if task.urgency >= 70 { return Color(hex: "EF4444") }
        if task.urgency >= 40 { return Color(hex: "F97316") }
        return Color(hex: "22C55E")
    }

    private var importanceColor: Color {
        if task.importance >= 70 { return Color(hex: "3B82F6") }
        if task.importance >= 40 { return Color(hex: "8B5CF6") }
        return Color(hex: "6B7280")
    }

    private var quadrantColor: Color {
        switch task.quadrant {
        case .urgentImportant: return Color(hex: "EF4444")
        case .urgentNotImportant: return Color(hex: "F97316")
        case .notUrgentImportant: return Color(hex: "3B82F6")
        case .notUrgentNotImportant: return Color(hex: "6B7280")
        }
    }
}
