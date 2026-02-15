import SwiftUI

struct TaskDetailView: View {
    @Bindable var task: TodoTask
    let onUpdate: () -> Void
    let onDelete: () -> Void
    let onComplete: () -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var showDeleteConfirm = false

    private var currentQuadrant: Quadrant {
        task.quadrant
    }

    var body: some View {
        VStack(spacing: 0) {
            // Header with quadrant color accent
            HStack {
                HStack(spacing: 8) {
                    // Quadrant dot
                    Circle()
                        .fill(CuteBoldStyle.accentColor(for: currentQuadrant))
                        .frame(width: 10, height: 10)
                        .overlay(Circle().stroke(.black, lineWidth: 1.5))
                    Text("Task Details")
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

            // Colored accent bar matching quadrant
            Rectangle()
                .fill(CuteBoldStyle.accentColor(for: currentQuadrant))
                .frame(height: 3)

            // Content
            ScrollView {
                VStack(spacing: 18) {
                    // Description
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Description")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(.secondary)

                        TextField("Task description", text: $task.taskDescription, axis: .vertical)
                            .textFieldStyle(.plain)
                            .font(.system(size: 15))
                            .padding(12)
                            .background(Color.white)
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(.black, lineWidth: 2)
                            )
                            .lineLimit(2...5)
                    }

                    // Sliders side by side
                    HStack(spacing: 16) {
                        VStack(alignment: .leading, spacing: 6) {
                            HStack {
                                Text("Urgency")
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundColor(.black)
                                Spacer()
                                Text("\(Int(task.urgency))")
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

                            Slider(value: $task.urgency, in: 0...100, step: 1)
                                .tint(urgencyColor)
                        }

                        VStack(alignment: .leading, spacing: 6) {
                            HStack {
                                Text("Importance")
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundColor(.black)
                                Spacer()
                                Text("\(Int(task.importance))")
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

                            Slider(value: $task.importance, in: 0...100, step: 1)
                                .tint(importanceColor)
                        }
                    }

                    // Quadrant Info with mini indicator
                    HStack(spacing: 12) {
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

                    // Metadata
                    HStack(spacing: 16) {
                        HStack(spacing: 4) {
                            Image(systemName: "clock")
                                .font(.system(size: 10))
                            Text("Created \(task.createdAt.formatted(date: .abbreviated, time: .shortened))")
                                .font(.system(size: 11, weight: .medium))
                        }
                        .foregroundColor(.secondary)

                        HStack(spacing: 4) {
                            Image(systemName: "pencil")
                                .font(.system(size: 10))
                            Text("Updated \(task.updatedAt.formatted(date: .abbreviated, time: .shortened))")
                                .font(.system(size: 11, weight: .medium))
                        }
                        .foregroundColor(.secondary)

                        Spacer()
                    }
                }
                .padding(20)
            }

            Rectangle()
                .frame(height: CuteBoldStyle.borderWidth)
                .foregroundColor(.black)

            // Actions
            HStack(spacing: 12) {
                Button(action: { showDeleteConfirm = true }) {
                    HStack(spacing: 4) {
                        Image(systemName: "trash")
                            .font(.system(size: 12, weight: .bold))
                        Text("Delete")
                            .font(.system(size: 13, weight: .bold))
                    }
                    .foregroundColor(Color(hex: "991B1B"))
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .background(Color(hex: "FEF2F2"))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color(hex: "EF4444"), lineWidth: 2)
                    )
                }
                .buttonStyle(CuteBoldButtonStyle())

                Spacer()

                Button(action: {
                    onUpdate()
                    dismiss()
                }) {
                    HStack(spacing: 4) {
                        Image(systemName: "checkmark.square")
                            .font(.system(size: 12, weight: .bold))
                        Text("Save")
                            .font(.system(size: 13, weight: .bold))
                    }
                    .foregroundColor(.black)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .background(Color(hex: "F3F4F6"))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(.black, lineWidth: 2)
                    )
                }
                .buttonStyle(CuteBoldButtonStyle())
                .keyboardShortcut(.return, modifiers: .command)

                Button(action: {
                    onComplete()
                    dismiss()
                }) {
                    HStack(spacing: 4) {
                        Image(systemName: "checkmark")
                            .font(.system(size: 12, weight: .bold))
                        Text("Complete")
                            .font(.system(size: 13, weight: .bold))
                    }
                    .foregroundColor(.white)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .background(Color(hex: "22C55E"))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(.black, lineWidth: 2)
                    )
                    .shadow(color: .black, radius: 0, x: 3, y: 3)
                }
                .buttonStyle(CuteBoldButtonStyle())
            }
            .padding(20)
        }
        .frame(width: 460, height: 520)
        .background(Color(hex: "F9FAFB"))
        .clipShape(RoundedRectangle(cornerRadius: CuteBoldStyle.cornerRadius))
        .overlay(
            RoundedRectangle(cornerRadius: CuteBoldStyle.cornerRadius)
                .stroke(.black, lineWidth: CuteBoldStyle.borderWidth)
        )
        .alert("Delete Task", isPresented: $showDeleteConfirm) {
            Button("Cancel", role: .cancel) { }
            Button("Delete", role: .destructive) {
                onDelete()
                dismiss()
            }
        } message: {
            Text("Are you sure you want to delete this task? This cannot be undone.")
        }
    }

    private var urgencyColor: Color {
        if task.urgency >= 70 { return Color(hex: "EF4444") }
        if task.urgency >= 40 { return Color(hex: "F59E0B") }
        return Color(hex: "22C55E")
    }

    private var importanceColor: Color {
        if task.importance >= 70 { return Color(hex: "3B82F6") }
        if task.importance >= 40 { return Color(hex: "8B5CF6") }
        return Color(hex: "6B7280")
    }
}
