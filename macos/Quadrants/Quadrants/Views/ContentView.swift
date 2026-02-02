import SwiftUI
import SwiftData

struct ContentView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(filter: #Predicate<TodoTask> { !$0.isCompleted }, sort: \TodoTask.createdAt, order: .reverse)
    private var activeTasks: [TodoTask]

    @Query(filter: #Predicate<TodoTask> { $0.isCompleted }, sort: \TodoTask.updatedAt, order: .reverse)
    private var archivedTasks: [TodoTask]

    @State private var isAddingTask = false
    @State private var selectedTask: TodoTask?
    @State private var showingTaskDetail = false
    @State private var showingArchive = false
    @State private var currentView: ViewMode = .map
    @State private var isFullscreen = false

    // Focus mode
    @State private var isFocusMode = false
    @State private var focusIndex = 0

    // Toolbar state - position as percentage of screen
    @State private var isToolbarExpanded = true
    @State private var toolbarOffset: CGSize = .zero
    @State private var toolbarEdge: Edge = .top

    enum ViewMode {
        case map, list
    }

    enum Edge {
        case top, bottom, left, right
    }

    // Top 3 priority tasks for Focus mode
    private var topPriorityTasks: [TodoTask] {
        activeTasks
            .sorted { task1, task2 in
                let priority1 = task1.importance * 0.6 + task1.urgency * 0.4
                let priority2 = task2.importance * 0.6 + task2.urgency * 0.4
                return priority1 > priority2
            }
            .prefix(3)
            .map { $0 }
    }

    private var focusedTask: TodoTask? {
        guard isFocusMode, focusIndex < topPriorityTasks.count else { return nil }
        return topPriorityTasks[focusIndex]
    }

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                // Background
                Color(hex: "FAFAFA")
                    .ignoresSafeArea()

                VStack(spacing: 0) {
                    if !isFullscreen {
                        // Header
                        HeaderView(taskCount: activeTasks.count)
                    }

                    // Main Content
                    if currentView == .map {
                        ZStack {
                            QuadrantMatrixView(
                                tasks: activeTasks,
                                onTaskTap: { task in
                                    if isFocusMode {
                                        advanceFocusMode()
                                    } else {
                                        selectedTask = task
                                        showingTaskDetail = true
                                    }
                                },
                                onTaskMove: { task, newUrgency, newImportance in
                                    updateTaskPosition(task, urgency: newUrgency, importance: newImportance)
                                },
                                onTaskComplete: { task in
                                    completeTask(task)
                                }
                            )

                            // Focus mode overlay
                            if isFocusMode {
                                FocusModeOverlay(
                                    focusedTask: focusedTask,
                                    focusIndex: focusIndex,
                                    totalTasks: topPriorityTasks.count,
                                    onTap: advanceFocusMode
                                )
                            }
                        }
                    } else {
                        TaskListView(
                            tasks: activeTasks,
                            onTaskTap: { task in
                                selectedTask = task
                                showingTaskDetail = true
                            },
                            onTaskComplete: completeTask
                        )
                    }
                }

                // Floating Toolbar
                FloatingToolbar(
                    isExpanded: $isToolbarExpanded,
                    currentView: $currentView,
                    isFocusMode: $isFocusMode,
                    focusIndex: $focusIndex,
                    isFullscreen: $isFullscreen,
                    toolbarOffset: $toolbarOffset,
                    toolbarEdge: $toolbarEdge,
                    onAddTask: { isAddingTask = true },
                    onShowArchive: { showingArchive = true },
                    taskCount: activeTasks.count,
                    screenSize: geometry.size
                )
            }
        }
        .sheet(isPresented: $isAddingTask) {
            AddTaskView(onAdd: addTask)
        }
        .sheet(isPresented: $showingTaskDetail) {
            if let task = selectedTask {
                TaskDetailView(
                    task: task,
                    onUpdate: { updateTask(task) },
                    onDelete: { deleteTask(task) },
                    onComplete: { completeTask(task) }
                )
            }
        }
        .sheet(isPresented: $showingArchive) {
            ArchivedTasksView(
                tasks: archivedTasks,
                onRestore: restoreTask,
                onDelete: deleteTask
            )
        }
        .onReceive(NotificationCenter.default.publisher(for: .addNewTask)) { _ in
            isAddingTask = true
        }
    }

    private func advanceFocusMode() {
        if focusIndex < topPriorityTasks.count - 1 {
            withAnimation(.spring(response: 0.3)) {
                focusIndex += 1
            }
        } else {
            withAnimation(.spring(response: 0.3)) {
                isFocusMode = false
                focusIndex = 0
            }
        }
    }

    private func addTask(_ description: String, urgency: Double, importance: Double) {
        withAnimation(.spring(response: 0.3)) {
            let newTask = TodoTask(taskDescription: description, urgency: urgency, importance: importance)
            modelContext.insert(newTask)
        }
    }

    private func updateTaskPosition(_ task: TodoTask, urgency: Double, importance: Double) {
        withAnimation(.spring(response: 0.2)) {
            task.urgency = urgency
            task.importance = importance
            task.updatedAt = Date()
        }
    }

    private func updateTask(_ task: TodoTask) {
        task.updatedAt = Date()
        showingTaskDetail = false
    }

    private func completeTask(_ task: TodoTask) {
        withAnimation(.spring(response: 0.3)) {
            task.isCompleted = true
            task.updatedAt = Date()
        }
        showingTaskDetail = false
    }

    private func deleteTask(_ task: TodoTask) {
        withAnimation(.spring(response: 0.3)) {
            modelContext.delete(task)
        }
        showingTaskDetail = false
    }

    private func restoreTask(_ task: TodoTask) {
        withAnimation(.spring(response: 0.3)) {
            task.isCompleted = false
            task.updatedAt = Date()
        }
    }
}

// MARK: - Header View
struct HeaderView: View {
    let taskCount: Int

    var body: some View {
        HStack {
            HStack(spacing: 12) {
                // App Icon
                RoundedRectangle(cornerRadius: 10)
                    .fill(LinearGradient(
                        colors: [Color(hex: "667EEA"), Color(hex: "764BA2")],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ))
                    .frame(width: 36, height: 36)
                    .overlay(
                        Image(systemName: "square.grid.2x2")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundColor(.white)
                    )

                VStack(alignment: .leading, spacing: 2) {
                    Text("My Tasks")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundColor(.primary)

                    Text("\(taskCount) tasks")
                        .font(.system(size: 12))
                        .foregroundColor(.secondary)
                }
            }

            Spacer()

            // Local Mode Badge
            Text("Local Mode")
                .font(.system(size: 11, weight: .medium))
                .foregroundColor(Color(hex: "059669"))
                .padding(.horizontal, 10)
                .padding(.vertical, 4)
                .background(Color(hex: "D1FAE5"))
                .cornerRadius(12)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 12)
        .background(Color.white.opacity(0.95))
        .background(.ultraThinMaterial)
    }
}

// MARK: - Floating Toolbar
struct FloatingToolbar: View {
    @Binding var isExpanded: Bool
    @Binding var currentView: ContentView.ViewMode
    @Binding var isFocusMode: Bool
    @Binding var focusIndex: Int
    @Binding var isFullscreen: Bool
    @Binding var toolbarOffset: CGSize
    @Binding var toolbarEdge: ContentView.Edge

    let onAddTask: () -> Void
    let onShowArchive: () -> Void
    let taskCount: Int
    let screenSize: CGSize

    @State private var dragOffset: CGSize = .zero
    @State private var isDragging = false

    private var toolbarWidth: CGFloat { isExpanded ? 380 : 160 }
    private var toolbarHeight: CGFloat { 48 }

    private var position: CGPoint {
        let margin: CGFloat = 16
        let baseOffset = toolbarOffset.width + dragOffset.width

        switch toolbarEdge {
        case .top:
            let x = max(toolbarWidth/2 + margin, min(screenSize.width - toolbarWidth/2 - margin, screenSize.width/2 + baseOffset))
            return CGPoint(x: x, y: margin + toolbarHeight/2 + 60) // Account for header
        case .bottom:
            let x = max(toolbarWidth/2 + margin, min(screenSize.width - toolbarWidth/2 - margin, screenSize.width/2 + baseOffset))
            return CGPoint(x: x, y: screenSize.height - margin - toolbarHeight/2)
        case .left:
            let y = max(toolbarHeight/2 + margin + 60, min(screenSize.height - toolbarHeight/2 - margin, screenSize.height/2 + toolbarOffset.height + dragOffset.height))
            return CGPoint(x: margin + toolbarWidth/2, y: y)
        case .right:
            let y = max(toolbarHeight/2 + margin + 60, min(screenSize.height - toolbarHeight/2 - margin, screenSize.height/2 + toolbarOffset.height + dragOffset.height))
            return CGPoint(x: screenSize.width - margin - toolbarWidth/2, y: y)
        }
    }

    var body: some View {
        HStack(spacing: 6) {
            // Drag Handle
            Image(systemName: "line.3.horizontal")
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(.gray.opacity(0.4))
                .frame(width: 28, height: 28)
                .contentShape(Rectangle())

            // Expand/Collapse
            Button(action: {
                withAnimation(.spring(response: 0.2)) {
                    isExpanded.toggle()
                }
            }) {
                Image(systemName: isExpanded ? "chevron.left" : "chevron.right")
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundColor(.gray)
                    .frame(width: 24, height: 24)
            }
            .buttonStyle(.plain)

            Divider()
                .frame(height: 24)

            // Map/List Toggle
            HStack(spacing: 2) {
                ToolbarViewButton(
                    icon: "map",
                    isSelected: currentView == .map,
                    action: { currentView = .map }
                )
                ToolbarViewButton(
                    icon: "list.bullet",
                    isSelected: currentView == .list,
                    action: { currentView = .list }
                )
            }
            .padding(3)
            .background(Color.gray.opacity(0.1))
            .cornerRadius(20)

            if isExpanded {
                Divider()
                    .frame(height: 24)

                // Focus Button (Yellow)
                ToolbarButton(
                    icon: "eye",
                    color: Color(hex: "FBBF24"),
                    foregroundColor: .black,
                    hasBorder: true,
                    action: {
                        withAnimation(.spring(response: 0.3)) {
                            isFocusMode = true
                            focusIndex = 0
                        }
                    }
                )
                .disabled(taskCount == 0)
                .opacity(taskCount == 0 ? 0.5 : 1)

                // Bulk Add Button - Disabled
                ToolbarButton(
                    icon: "sparkles",
                    color: Color.gray.opacity(0.1),
                    foregroundColor: .gray.opacity(0.4),
                    action: {}
                )
                .disabled(true)
                .help("AI Bulk Add requires online")

                // Add Task Button
                ToolbarButton(
                    icon: "plus",
                    color: Color.gray.opacity(0.1),
                    foregroundColor: .gray,
                    action: onAddTask
                )

                Divider()
                    .frame(height: 24)

                // AI Organize - Disabled
                ToolbarButton(
                    icon: "wand.and.stars",
                    color: Color.gray.opacity(0.1),
                    foregroundColor: .gray.opacity(0.4),
                    action: {}
                )
                .disabled(true)
                .help("AI Organize requires online")

                // Archive Button
                ToolbarButton(
                    icon: "archivebox",
                    color: Color.gray.opacity(0.1),
                    foregroundColor: .gray,
                    action: onShowArchive
                )

                // Fullscreen Button
                ToolbarButton(
                    icon: isFullscreen ? "arrow.down.right.and.arrow.up.left" : "arrow.up.left.and.arrow.down.right",
                    color: Color(hex: "1F2937"),
                    foregroundColor: .white,
                    action: {
                        withAnimation(.spring(response: 0.3)) {
                            isFullscreen.toggle()
                        }
                    }
                )
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(Color.white.opacity(0.95))
        .background(.ultraThinMaterial)
        .clipShape(Capsule())
        .shadow(color: .black.opacity(0.15), radius: 12, x: 0, y: 4)
        .overlay(
            Capsule()
                .stroke(Color.gray.opacity(0.1), lineWidth: 1)
        )
        .position(position)
        .gesture(
            DragGesture()
                .onChanged { value in
                    isDragging = true
                    dragOffset = value.translation
                }
                .onEnded { value in
                    isDragging = false

                    // Determine which edge to snap to
                    let endX = position.x
                    let endY = position.y

                    let distToTop = endY
                    let distToBottom = screenSize.height - endY
                    let distToLeft = endX
                    let distToRight = screenSize.width - endX

                    let minDist = min(distToTop, distToBottom, distToLeft, distToRight)

                    withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                        if minDist == distToTop {
                            toolbarEdge = .top
                            toolbarOffset = CGSize(width: endX - screenSize.width/2, height: 0)
                        } else if minDist == distToBottom {
                            toolbarEdge = .bottom
                            toolbarOffset = CGSize(width: endX - screenSize.width/2, height: 0)
                        } else if minDist == distToLeft {
                            toolbarEdge = .left
                            toolbarOffset = CGSize(width: 0, height: endY - screenSize.height/2)
                        } else {
                            toolbarEdge = .right
                            toolbarOffset = CGSize(width: 0, height: endY - screenSize.height/2)
                        }
                        dragOffset = .zero
                    }
                }
        )
        .animation(.spring(response: 0.3), value: isExpanded)
    }
}

// MARK: - Toolbar Button
struct ToolbarButton: View {
    let icon: String
    let color: Color
    var foregroundColor: Color = .white
    var hasBorder: Bool = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: icon)
                .font(.system(size: 13, weight: .medium))
                .foregroundColor(foregroundColor)
                .frame(width: 32, height: 32)
                .background(color)
                .clipShape(Circle())
                .overlay(
                    hasBorder ? Circle().stroke(Color.black, lineWidth: 2) : nil
                )
        }
        .buttonStyle(.plain)
    }
}

struct ToolbarViewButton: View {
    let icon: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: icon)
                .font(.system(size: 11, weight: .medium))
                .foregroundColor(isSelected ? .black : .gray)
                .frame(width: 28, height: 28)
                .background(isSelected ? Color.white : Color.clear)
                .clipShape(Circle())
                .shadow(color: isSelected ? .black.opacity(0.1) : .clear, radius: 2)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Focus Mode Overlay
struct FocusModeOverlay: View {
    let focusedTask: TodoTask?
    let focusIndex: Int
    let totalTasks: Int
    let onTap: () -> Void

    var body: some View {
        ZStack {
            // Dark overlay
            Color.black.opacity(0.5)
                .ignoresSafeArea()
                .onTapGesture(perform: onTap)

            // Focus card at bottom
            if let task = focusedTask {
                VStack {
                    Spacer()

                    VStack(spacing: 8) {
                        Text("Priority \(focusIndex + 1) of \(totalTasks)")
                            .font(.system(size: 13))
                            .foregroundColor(.gray)

                        Text(task.taskDescription)
                            .font(.system(size: 20, weight: .semibold))
                            .foregroundColor(.black)
                            .multilineTextAlignment(.center)

                        Text(focusIndex < totalTasks - 1 ? "Click to continue" : "Click to finish")
                            .font(.system(size: 13))
                            .foregroundColor(.gray)
                    }
                    .padding(.horizontal, 24)
                    .padding(.vertical, 16)
                    .background(Color.white.opacity(0.95))
                    .cornerRadius(12)
                    .shadow(color: .black.opacity(0.1), radius: 8)
                    .padding(.bottom, 40)
                }
                .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .animation(.spring(response: 0.3), value: focusIndex)
    }
}

// MARK: - Task List View
struct TaskListView: View {
    let tasks: [TodoTask]
    let onTaskTap: (TodoTask) -> Void
    let onTaskComplete: (TodoTask) -> Void

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                ForEach(tasks) { task in
                    TaskListItem(
                        task: task,
                        onTap: { onTaskTap(task) },
                        onComplete: { onTaskComplete(task) }
                    )
                }
            }
            .padding(20)
        }
        .background(Color(hex: "FAFAFA"))
    }
}

struct TaskListItem: View {
    let task: TodoTask
    let onTap: () -> Void
    let onComplete: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            // Checkbox
            Button(action: onComplete) {
                Circle()
                    .stroke(Color.black, lineWidth: 2)
                    .frame(width: 24, height: 24)
            }
            .buttonStyle(.plain)

            // Task content
            VStack(alignment: .leading, spacing: 4) {
                Text(task.taskDescription)
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(.black)

                HStack(spacing: 8) {
                    Text(task.quadrant.label)
                        .font(.system(size: 11))
                        .foregroundColor(task.quadrant.color)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background(task.quadrant.color.opacity(0.1))
                        .cornerRadius(4)
                }
            }

            Spacer()
        }
        .padding(16)
        .background(Color.white)
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.black, lineWidth: 2)
        )
        .contentShape(Rectangle())
        .onTapGesture(perform: onTap)
    }
}

// MARK: - Archived Tasks View
struct ArchivedTasksView: View {
    let tasks: [TodoTask]
    let onRestore: (TodoTask) -> Void
    let onDelete: (TodoTask) -> Void
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Text("Archived Tasks")
                    .font(.system(size: 18, weight: .semibold))

                Spacer()

                Text("\(tasks.count) completed")
                    .font(.system(size: 13))
                    .foregroundColor(.secondary)

                Button("Done") {
                    dismiss()
                }
                .buttonStyle(.plain)
            }
            .padding(20)

            Divider()

            if tasks.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "archivebox")
                        .font(.system(size: 40))
                        .foregroundColor(.gray.opacity(0.5))

                    Text("No archived tasks")
                        .font(.system(size: 15))
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ScrollView {
                    LazyVStack(spacing: 8) {
                        ForEach(tasks) { task in
                            ArchivedTaskItem(
                                task: task,
                                onRestore: { onRestore(task) },
                                onDelete: { onDelete(task) }
                            )
                        }
                    }
                    .padding(20)
                }
            }
        }
        .frame(width: 500, height: 450)
    }
}

struct ArchivedTaskItem: View {
    let task: TodoTask
    let onRestore: () -> Void
    let onDelete: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            // Completed checkmark
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 20))
                .foregroundColor(.green)

            // Task description
            Text(task.taskDescription)
                .font(.system(size: 14))
                .foregroundColor(.gray)
                .strikethrough()
                .lineLimit(1)

            Spacer()

            // Actions
            HStack(spacing: 8) {
                Button(action: onRestore) {
                    Image(systemName: "arrow.uturn.backward")
                        .font(.system(size: 12))
                        .foregroundColor(.blue)
                }
                .buttonStyle(.plain)
                .help("Restore task")

                Button(action: onDelete) {
                    Image(systemName: "trash")
                        .font(.system(size: 12))
                        .foregroundColor(.red)
                }
                .buttonStyle(.plain)
                .help("Delete permanently")
            }
        }
        .padding(12)
        .background(Color.gray.opacity(0.05))
        .cornerRadius(8)
    }
}

#Preview {
    ContentView()
        .modelContainer(for: TodoTask.self, inMemory: true)
}
