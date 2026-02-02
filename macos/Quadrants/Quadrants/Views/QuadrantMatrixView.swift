import SwiftUI

struct QuadrantMatrixView: View {
    let tasks: [TodoTask]
    let onTaskTap: (TodoTask) -> Void
    let onTaskMove: (TodoTask, Double, Double) -> Void
    let onTaskComplete: (TodoTask) -> Void

    @State private var matrixSize: CGSize = .zero

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                // Grid Background
                QuadrantGrid()

                // Quadrant Labels
                QuadrantLabels()

                // Tasks
                ForEach(tasks) { task in
                    TaskDot(
                        task: task,
                        matrixSize: geometry.size,
                        onTap: { onTaskTap(task) },
                        onMove: { newUrgency, newImportance in
                            onTaskMove(task, newUrgency, newImportance)
                        },
                        onComplete: { onTaskComplete(task) }
                    )
                }
            }
            .padding(40)
            .onAppear {
                matrixSize = geometry.size
            }
        }
    }
}

// MARK: - Quadrant Grid
struct QuadrantGrid: View {
    var body: some View {
        GeometryReader { geometry in
            let width = geometry.size.width
            let height = geometry.size.height
            let centerX = width / 2
            let centerY = height / 2

            ZStack {
                // Background quadrants
                HStack(spacing: 0) {
                    VStack(spacing: 0) {
                        // Not Urgent & Important (top-left)
                        Rectangle()
                            .fill(Color(hex: "EFF6FF").opacity(0.5))
                        // Not Urgent & Not Important (bottom-left)
                        Rectangle()
                            .fill(Color(hex: "F3F4F6").opacity(0.5))
                    }
                    VStack(spacing: 0) {
                        // Urgent & Important (top-right)
                        Rectangle()
                            .fill(Color(hex: "FEF2F2").opacity(0.5))
                        // Urgent & Not Important (bottom-right)
                        Rectangle()
                            .fill(Color(hex: "FFF7ED").opacity(0.5))
                    }
                }

                // Grid lines
                Path { path in
                    // Vertical center line
                    path.move(to: CGPoint(x: centerX, y: 0))
                    path.addLine(to: CGPoint(x: centerX, y: height))

                    // Horizontal center line
                    path.move(to: CGPoint(x: 0, y: centerY))
                    path.addLine(to: CGPoint(x: width, y: centerY))
                }
                .stroke(Color.gray.opacity(0.3), style: StrokeStyle(lineWidth: 2, dash: [8, 4]))

                // Axis labels
                VStack {
                    Text("IMPORTANT")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.gray.opacity(0.6))
                        .tracking(2)
                    Spacer()
                    Text("NOT IMPORTANT")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.gray.opacity(0.6))
                        .tracking(2)
                }
                .padding(.vertical, 8)

                HStack {
                    Text("NOT URGENT")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.gray.opacity(0.6))
                        .tracking(2)
                        .rotationEffect(.degrees(-90))
                        .fixedSize()
                    Spacer()
                    Text("URGENT")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.gray.opacity(0.6))
                        .tracking(2)
                        .rotationEffect(.degrees(90))
                        .fixedSize()
                }
                .padding(.horizontal, 8)
            }
        }
    }
}

// MARK: - Quadrant Labels
struct QuadrantLabels: View {
    var body: some View {
        GeometryReader { geometry in
            let width = geometry.size.width
            let height = geometry.size.height

            ZStack {
                // Top-left: Not Urgent & Important (Schedule)
                VStack {
                    HStack {
                        QuadrantLabel(
                            title: "Schedule",
                            subtitle: "Important but not urgent",
                            color: Color(hex: "3B82F6")
                        )
                        Spacer()
                    }
                    Spacer()
                }
                .padding(20)

                // Top-right: Urgent & Important (Do First)
                VStack {
                    HStack {
                        Spacer()
                        QuadrantLabel(
                            title: "Do First",
                            subtitle: "Urgent & important",
                            color: Color(hex: "EF4444")
                        )
                    }
                    Spacer()
                }
                .padding(20)

                // Bottom-left: Not Urgent & Not Important (Eliminate)
                VStack {
                    Spacer()
                    HStack {
                        QuadrantLabel(
                            title: "Eliminate",
                            subtitle: "Neither urgent nor important",
                            color: Color(hex: "6B7280")
                        )
                        Spacer()
                    }
                }
                .padding(20)

                // Bottom-right: Urgent & Not Important (Delegate)
                VStack {
                    Spacer()
                    HStack {
                        Spacer()
                        QuadrantLabel(
                            title: "Delegate",
                            subtitle: "Urgent but not important",
                            color: Color(hex: "F97316")
                        )
                    }
                }
                .padding(20)
            }
        }
    }
}

struct QuadrantLabel: View {
    let title: String
    let subtitle: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title)
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(color)
            Text(subtitle)
                .font(.system(size: 10))
                .foregroundColor(.secondary)
        }
        .padding(8)
        .background(Color.white.opacity(0.8))
        .cornerRadius(8)
    }
}

// MARK: - Task Dot
struct TaskDot: View {
    let task: TodoTask
    let matrixSize: CGSize
    let onTap: () -> Void
    let onMove: (Double, Double) -> Void
    let onComplete: () -> Void

    @State private var isDragging = false
    @State private var dragOffset: CGSize = .zero

    private var position: CGPoint {
        // Convert urgency (0-100) to x position (0 = left, 100 = right)
        // Convert importance (0-100) to y position (100 = top, 0 = bottom)
        let x = (task.urgency / 100) * (matrixSize.width - 80) + 40
        let y = ((100 - task.importance) / 100) * (matrixSize.height - 80) + 40
        return CGPoint(x: x, y: y)
    }

    private var taskColor: Color {
        switch task.quadrant {
        case .urgentImportant:
            return Color(hex: "EF4444")
        case .notUrgentImportant:
            return Color(hex: "3B82F6")
        case .urgentNotImportant:
            return Color(hex: "F97316")
        case .notUrgentNotImportant:
            return Color(hex: "6B7280")
        }
    }

    var body: some View {
        ZStack {
            // Glow effect when dragging
            if isDragging {
                Circle()
                    .fill(taskColor.opacity(0.3))
                    .frame(width: 60, height: 60)
                    .blur(radius: 10)
            }

            // Task circle
            Circle()
                .fill(taskColor)
                .frame(width: isDragging ? 44 : 36, height: isDragging ? 44 : 36)
                .shadow(color: taskColor.opacity(0.4), radius: isDragging ? 8 : 4, x: 0, y: 2)
                .overlay(
                    Circle()
                        .stroke(Color.white, lineWidth: 2)
                )

            // Task preview on hover
            if isDragging {
                Text(task.taskDescription)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(.primary)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(Color.white)
                    .cornerRadius(6)
                    .shadow(radius: 4)
                    .offset(y: -50)
                    .lineLimit(2)
                    .frame(maxWidth: 150)
            }
        }
        .position(
            x: position.x + dragOffset.width,
            y: position.y + dragOffset.height
        )
        .gesture(
            DragGesture()
                .onChanged { value in
                    isDragging = true
                    dragOffset = value.translation
                }
                .onEnded { value in
                    isDragging = false

                    // Calculate new position
                    let newX = position.x + value.translation.width
                    let newY = position.y + value.translation.height

                    // Convert back to urgency/importance
                    var newUrgency = ((newX - 40) / (matrixSize.width - 80)) * 100
                    var newImportance = 100 - ((newY - 40) / (matrixSize.height - 80)) * 100

                    // Clamp values
                    newUrgency = max(0, min(100, newUrgency))
                    newImportance = max(0, min(100, newImportance))

                    withAnimation(.spring(response: 0.3)) {
                        dragOffset = .zero
                    }

                    onMove(newUrgency, newImportance)
                }
        )
        .onTapGesture {
            onTap()
        }
        .contextMenu {
            Button("Complete") {
                onComplete()
            }
            Button("View Details") {
                onTap()
            }
        }
        .animation(.spring(response: 0.3), value: isDragging)
    }
}

