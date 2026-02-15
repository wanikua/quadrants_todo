import SwiftUI
import UniformTypeIdentifiers

// MARK: - Cute Bold Style Constants
enum CuteBoldStyle {
    static let borderWidth: CGFloat = 3
    static let shadowOffset: CGFloat = 4
    static let cornerRadius: CGFloat = 16
    static let smallCornerRadius: CGFloat = 10

    // Quadrant background colors (pastel)
    static func bgColor(for quadrant: Quadrant) -> Color {
        switch quadrant {
        case .urgentImportant: return Color(hex: "FEF2F2")
        case .notUrgentImportant: return Color(hex: "EFF6FF")
        case .urgentNotImportant: return Color(hex: "FFFBEB")
        case .notUrgentNotImportant: return Color(hex: "F9FAFB")
        }
    }

    // Quadrant accent colors
    static func accentColor(for quadrant: Quadrant) -> Color {
        switch quadrant {
        case .urgentImportant: return Color(hex: "EF4444")
        case .notUrgentImportant: return Color(hex: "3B82F6")
        case .urgentNotImportant: return Color(hex: "F59E0B")
        case .notUrgentNotImportant: return Color(hex: "6B7280")
        }
    }

    // Quadrant dark text colors
    static func textColor(for quadrant: Quadrant) -> Color {
        switch quadrant {
        case .urgentImportant: return Color(hex: "991B1B")
        case .notUrgentImportant: return Color(hex: "1E3A8A")
        case .urgentNotImportant: return Color(hex: "92400E")
        case .notUrgentNotImportant: return Color(hex: "374151")
        }
    }

    // Quadrant icons
    static func icon(for quadrant: Quadrant) -> String {
        switch quadrant {
        case .urgentImportant: return "flame.fill"
        case .notUrgentImportant: return "calendar"
        case .urgentNotImportant: return "person.2"
        case .notUrgentNotImportant: return "xmark.circle"
        }
    }

    // Quadrant subtitles
    static func subtitle(for quadrant: Quadrant) -> String {
        switch quadrant {
        case .urgentImportant: return "Urgent & Important"
        case .notUrgentImportant: return "Important, not urgent"
        case .urgentNotImportant: return "Urgent, not important"
        case .notUrgentNotImportant: return "Neither urgent nor important"
        }
    }
}

// MARK: - Quadrant default position values
extension Quadrant {
    var defaultValues: (urgency: Double, importance: Double) {
        switch self {
        case .urgentImportant: return (75, 75)
        case .notUrgentImportant: return (25, 75)
        case .urgentNotImportant: return (75, 25)
        case .notUrgentNotImportant: return (25, 25)
        }
    }
}

// MARK: - Quadrant Card Grid
struct QuadrantMatrixView: View {
    let tasks: [TodoTask]
    let onTaskTap: (TodoTask) -> Void
    let onTaskMove: (TodoTask, Double, Double) -> Void
    let onTaskComplete: (TodoTask) -> Void

    private func tasksFor(_ quadrant: Quadrant) -> [TodoTask] {
        tasks.filter { $0.quadrant == quadrant }
            .sorted { $0.priorityScore > $1.priorityScore }
    }

    private func handleDrop(taskIdString: String, to quadrant: Quadrant) {
        guard let uuid = UUID(uuidString: taskIdString),
              let task = tasks.first(where: { $0.id == uuid }) else { return }
        guard task.quadrant != quadrant else { return }
        let (urgency, importance) = quadrant.defaultValues
        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
            onTaskMove(task, urgency, importance)
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            // Axis label: IMPORTANT
            HStack(spacing: 4) {
                Image(systemName: "arrow.up")
                    .font(.system(size: 8, weight: .bold))
                Text("IMPORTANT")
                    .font(.system(size: 9, weight: .bold))
                    .tracking(1.5)
            }
            .foregroundColor(Color(hex: "9CA3AF"))
            .padding(.bottom, 4)

            HStack(spacing: 0) {
                // Left axis label: NOT URGENT
                Text("NOT URGENT")
                    .font(.system(size: 9, weight: .bold))
                    .tracking(1.5)
                    .foregroundColor(Color(hex: "9CA3AF"))
                    .rotationEffect(.degrees(-90))
                    .fixedSize()
                    .frame(width: 16)
                    .padding(.trailing, 2)

                // Main 2x2 grid
                VStack(spacing: 10) {
                    HStack(spacing: 10) {
                        QuadrantCard(
                            quadrant: .urgentImportant,
                            tasks: tasksFor(.urgentImportant),
                            onTaskTap: onTaskTap,
                            onTaskComplete: onTaskComplete,
                            onTaskDrop: { handleDrop(taskIdString: $0, to: .urgentImportant) }
                        )
                        QuadrantCard(
                            quadrant: .notUrgentImportant,
                            tasks: tasksFor(.notUrgentImportant),
                            onTaskTap: onTaskTap,
                            onTaskComplete: onTaskComplete,
                            onTaskDrop: { handleDrop(taskIdString: $0, to: .notUrgentImportant) }
                        )
                    }
                    HStack(spacing: 10) {
                        QuadrantCard(
                            quadrant: .urgentNotImportant,
                            tasks: tasksFor(.urgentNotImportant),
                            onTaskTap: onTaskTap,
                            onTaskComplete: onTaskComplete,
                            onTaskDrop: { handleDrop(taskIdString: $0, to: .urgentNotImportant) }
                        )
                        QuadrantCard(
                            quadrant: .notUrgentNotImportant,
                            tasks: tasksFor(.notUrgentNotImportant),
                            onTaskTap: onTaskTap,
                            onTaskComplete: onTaskComplete,
                            onTaskDrop: { handleDrop(taskIdString: $0, to: .notUrgentNotImportant) }
                        )
                    }
                }

                // Right axis label: URGENT
                Text("URGENT")
                    .font(.system(size: 9, weight: .bold))
                    .tracking(1.5)
                    .foregroundColor(Color(hex: "9CA3AF"))
                    .rotationEffect(.degrees(90))
                    .fixedSize()
                    .frame(width: 16)
                    .padding(.leading, 2)
            }

            // Bottom axis label
            HStack(spacing: 4) {
                Text("NOT IMPORTANT")
                    .font(.system(size: 9, weight: .bold))
                    .tracking(1.5)
                Image(systemName: "arrow.down")
                    .font(.system(size: 8, weight: .bold))
            }
            .foregroundColor(Color(hex: "9CA3AF"))
            .padding(.top, 4)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(Color(hex: "F9FAFB"))
    }
}

// MARK: - Single Quadrant Card
struct QuadrantCard: View {
    let quadrant: Quadrant
    let tasks: [TodoTask]
    let onTaskTap: (TodoTask) -> Void
    let onTaskComplete: (TodoTask) -> Void
    let onTaskDrop: (String) -> Void

    @State private var isDropTargeted = false
    @State private var isHovered = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Card Header
            HStack(spacing: 8) {
                // Badge
                HStack(spacing: 5) {
                    Image(systemName: CuteBoldStyle.icon(for: quadrant))
                        .font(.system(size: 11, weight: .bold))
                    Text(quadrant.label)
                        .font(.system(size: 12, weight: .bold))
                }
                .foregroundColor(CuteBoldStyle.textColor(for: quadrant))
                .padding(.horizontal, 10)
                .padding(.vertical, 5)
                .background(
                    Capsule()
                        .fill(CuteBoldStyle.accentColor(for: quadrant).opacity(0.15))
                )
                .overlay(
                    Capsule()
                        .stroke(CuteBoldStyle.accentColor(for: quadrant).opacity(0.4), lineWidth: 1.5)
                )

                Spacer()

                // Count badge
                if !tasks.isEmpty {
                    Text("\(tasks.count)")
                        .font(.system(size: 10, weight: .black))
                        .foregroundColor(.white)
                        .frame(width: 22, height: 22)
                        .background(
                            Circle()
                                .fill(CuteBoldStyle.accentColor(for: quadrant))
                        )
                        .overlay(
                            Circle()
                                .stroke(.black, lineWidth: 1.5)
                        )
                }
            }
            .padding(.horizontal, 14)
            .padding(.top, 12)
            .padding(.bottom, 4)

            // Subtitle
            Text(CuteBoldStyle.subtitle(for: quadrant))
                .font(.system(size: 10))
                .foregroundColor(CuteBoldStyle.textColor(for: quadrant).opacity(0.45))
                .padding(.horizontal, 14)
                .padding(.bottom, 8)

            // Divider with accent color
            Rectangle()
                .fill(CuteBoldStyle.accentColor(for: quadrant).opacity(0.2))
                .frame(height: 1.5)

            // Task List
            ScrollView {
                if tasks.isEmpty {
                    VStack(spacing: 8) {
                        Image(systemName: "tray")
                            .font(.system(size: 20))
                            .foregroundColor(CuteBoldStyle.accentColor(for: quadrant).opacity(0.25))
                        Text("No tasks")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(.gray.opacity(0.45))
                        Text("Drag here or add new")
                            .font(.system(size: 10))
                            .foregroundColor(.gray.opacity(0.3))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 20)
                } else {
                    LazyVStack(spacing: 5) {
                        ForEach(Array(tasks.enumerated()), id: \.element.id) { index, task in
                            TaskRow(
                                task: task,
                                quadrant: quadrant,
                                onTap: { onTaskTap(task) },
                                onComplete: { onTaskComplete(task) }
                            )
                            .transition(.asymmetric(
                                insertion: .opacity.combined(with: .move(edge: .top)),
                                removal: .opacity.combined(with: .scale(scale: 0.9))
                            ))
                        }
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 6)
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(
            RoundedRectangle(cornerRadius: CuteBoldStyle.cornerRadius)
                .fill(CuteBoldStyle.bgColor(for: quadrant))
        )
        .clipShape(RoundedRectangle(cornerRadius: CuteBoldStyle.cornerRadius))
        .overlay(
            RoundedRectangle(cornerRadius: CuteBoldStyle.cornerRadius)
                .stroke(
                    isDropTargeted ? CuteBoldStyle.accentColor(for: quadrant) : .black,
                    lineWidth: isDropTargeted ? 3.5 : CuteBoldStyle.borderWidth
                )
                .animation(.easeInOut(duration: 0.15), value: isDropTargeted)
        )
        .shadow(
            color: .black.opacity(isHovered ? 0.9 : 1),
            radius: 0,
            x: isHovered ? CuteBoldStyle.shadowOffset + 1 : CuteBoldStyle.shadowOffset,
            y: isHovered ? CuteBoldStyle.shadowOffset + 1 : CuteBoldStyle.shadowOffset
        )
        .scaleEffect(isDropTargeted ? 1.02 : 1.0)
        .animation(.spring(response: 0.25, dampingFraction: 0.7), value: isDropTargeted)
        .onHover { hovering in
            withAnimation(.easeInOut(duration: 0.15)) {
                isHovered = hovering
            }
        }
        .onDrop(of: [.text], isTargeted: $isDropTargeted) { providers in
            guard let provider = providers.first else { return false }
            _ = provider.loadObject(ofClass: String.self) { idString, _ in
                if let idString = idString {
                    DispatchQueue.main.async {
                        onTaskDrop(idString)
                    }
                }
            }
            return true
        }
    }
}

// MARK: - Task Row
struct TaskRow: View {
    let task: TodoTask
    let quadrant: Quadrant
    let onTap: () -> Void
    let onComplete: () -> Void

    @State private var isHovered = false
    @State private var checkHovered = false
    @State private var justCompleted = false

    var body: some View {
        HStack(spacing: 8) {
            // Checkbox with animation
            Button(action: {
                withAnimation(.spring(response: 0.25, dampingFraction: 0.6)) {
                    justCompleted = true
                }
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
                    onComplete()
                }
            }) {
                ZStack {
                    Circle()
                        .stroke(
                            checkHovered ? CuteBoldStyle.accentColor(for: quadrant) : CuteBoldStyle.accentColor(for: quadrant).opacity(0.5),
                            lineWidth: checkHovered ? 2.5 : 2
                        )
                        .frame(width: 20, height: 20)

                    if justCompleted {
                        Circle()
                            .fill(CuteBoldStyle.accentColor(for: quadrant))
                            .frame(width: 20, height: 20)
                        Image(systemName: "checkmark")
                            .font(.system(size: 10, weight: .black))
                            .foregroundColor(.white)
                    } else if checkHovered {
                        Image(systemName: "checkmark")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(CuteBoldStyle.accentColor(for: quadrant).opacity(0.6))
                    }
                }
            }
            .buttonStyle(.plain)
            .onHover { h in
                withAnimation(.easeInOut(duration: 0.1)) { checkHovered = h }
            }

            // Task description
            Text(task.taskDescription)
                .font(.system(size: 13, weight: .medium))
                .foregroundColor(justCompleted ? .gray : .black)
                .strikethrough(justCompleted, color: .gray)
                .lineLimit(2)

            Spacer(minLength: 4)

            // Hover action: expand/detail button
            if isHovered && !justCompleted {
                Button(action: onTap) {
                    Image(systemName: "chevron.right")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(.gray)
                        .frame(width: 20, height: 20)
                        .background(Color.black.opacity(0.05))
                        .clipShape(Circle())
                }
                .buttonStyle(.plain)
                .transition(.opacity.combined(with: .scale(scale: 0.8)))
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 7)
        .background(
            RoundedRectangle(cornerRadius: 8)
                .fill(isHovered ? Color.white : Color.white.opacity(0.5))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(
                    isHovered ? Color.black.opacity(0.2) : Color.black.opacity(0.06),
                    lineWidth: isHovered ? 1.5 : 1
                )
        )
        .contentShape(Rectangle())
        .onHover { hovering in
            withAnimation(.easeInOut(duration: 0.12)) {
                isHovered = hovering
            }
        }
        .onTapGesture(perform: onTap)
        .onDrag {
            NSItemProvider(object: task.id.uuidString as NSString)
        }
        .contextMenu {
            Button {
                onComplete()
            } label: {
                Label("Complete", systemImage: "checkmark.circle")
            }
            Button {
                onTap()
            } label: {
                Label("View Details", systemImage: "info.circle")
            }
        }
        .opacity(justCompleted ? 0.5 : 1)
        .animation(.easeInOut(duration: 0.12), value: isHovered)
    }
}
