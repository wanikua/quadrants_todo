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

    // Focus mode
    @State private var isFocusMode = false
    @State private var focusIndex = 0

    enum ViewMode: Equatable {
        case map, list
    }

    // Top 3 priority tasks for Focus mode
    private var topPriorityTasks: [TodoTask] {
        activeTasks
            .sorted { $0.priorityScore > $1.priorityScore }
            .prefix(3)
            .map { $0 }
    }

    private var focusedTask: TodoTask? {
        guard isFocusMode, focusIndex < topPriorityTasks.count else { return nil }
        return topPriorityTasks[focusIndex]
    }

    var body: some View {
        ZStack {
            // Background
            Color(hex: "F9FAFB")
                .ignoresSafeArea()

            VStack(spacing: 0) {
                // Header
                HeaderView(
                    taskCount: activeTasks.count,
                    archivedCount: archivedTasks.count,
                    currentView: $currentView,
                    isFocusMode: $isFocusMode,
                    focusIndex: $focusIndex,
                    onAddTask: { isAddingTask = true },
                    onShowArchive: { showingArchive = true }
                )

                // Main Content
                ZStack {
                    if activeTasks.isEmpty && !isFocusMode {
                        EmptyStateView(onAddTask: { isAddingTask = true })
                            .transition(.opacity)
                    } else if currentView == .map {
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
                        .transition(.opacity)
                    } else {
                        TaskListView(
                            tasks: activeTasks,
                            onTaskTap: { task in
                                selectedTask = task
                                showingTaskDetail = true
                            },
                            onTaskComplete: completeTask
                        )
                        .transition(.opacity)
                    }

                    // Focus mode overlay
                    if isFocusMode {
                        FocusModeOverlay(
                            focusedTask: focusedTask,
                            focusIndex: focusIndex,
                            totalTasks: topPriorityTasks.count,
                            onTap: advanceFocusMode,
                            onExit: {
                                withAnimation(.spring(response: 0.3)) {
                                    isFocusMode = false
                                    focusIndex = 0
                                }
                            }
                        )
                    }
                }
                .animation(.easeInOut(duration: 0.2), value: currentView)
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

// MARK: - Empty State View
struct EmptyStateView: View {
    let onAddTask: () -> Void

    var body: some View {
        VStack(spacing: 16) {
            // Illustration: mini 2x2 grid
            VStack(spacing: 4) {
                HStack(spacing: 4) {
                    RoundedRectangle(cornerRadius: 6)
                        .fill(Color(hex: "FEF2F2"))
                        .frame(width: 36, height: 36)
                        .overlay(
                            Image(systemName: "flame.fill")
                                .font(.system(size: 14))
                                .foregroundColor(Color(hex: "EF4444").opacity(0.4))
                        )
                        .overlay(RoundedRectangle(cornerRadius: 6).stroke(.black.opacity(0.15), lineWidth: 1.5))
                    RoundedRectangle(cornerRadius: 6)
                        .fill(Color(hex: "EFF6FF"))
                        .frame(width: 36, height: 36)
                        .overlay(
                            Image(systemName: "calendar")
                                .font(.system(size: 14))
                                .foregroundColor(Color(hex: "3B82F6").opacity(0.4))
                        )
                        .overlay(RoundedRectangle(cornerRadius: 6).stroke(.black.opacity(0.15), lineWidth: 1.5))
                }
                HStack(spacing: 4) {
                    RoundedRectangle(cornerRadius: 6)
                        .fill(Color(hex: "FFFBEB"))
                        .frame(width: 36, height: 36)
                        .overlay(
                            Image(systemName: "person.2")
                                .font(.system(size: 14))
                                .foregroundColor(Color(hex: "F59E0B").opacity(0.4))
                        )
                        .overlay(RoundedRectangle(cornerRadius: 6).stroke(.black.opacity(0.15), lineWidth: 1.5))
                    RoundedRectangle(cornerRadius: 6)
                        .fill(Color(hex: "F9FAFB"))
                        .frame(width: 36, height: 36)
                        .overlay(
                            Image(systemName: "xmark.circle")
                                .font(.system(size: 14))
                                .foregroundColor(Color(hex: "6B7280").opacity(0.4))
                        )
                        .overlay(RoundedRectangle(cornerRadius: 6).stroke(.black.opacity(0.15), lineWidth: 1.5))
                }
            }
            .shadow(color: .black.opacity(0.08), radius: 0, x: 2, y: 2)

            VStack(spacing: 6) {
                Text("No tasks yet")
                    .font(.system(size: 17, weight: .bold))
                    .foregroundColor(.black)

                Text("Prioritize your tasks with the Eisenhower Matrix")
                    .font(.system(size: 13))
                    .foregroundColor(.secondary)
            }

            Button(action: onAddTask) {
                HStack(spacing: 6) {
                    Image(systemName: "plus")
                        .font(.system(size: 12, weight: .bold))
                    Text("Add your first task")
                        .font(.system(size: 13, weight: .bold))
                }
                .foregroundColor(.white)
                .padding(.horizontal, 20)
                .padding(.vertical, 10)
                .background(Color.black)
                .clipShape(RoundedRectangle(cornerRadius: 8))
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(.black, lineWidth: 2)
                )
                .shadow(color: .black, radius: 0, x: 3, y: 3)
            }
            .buttonStyle(.plain)

            Text("⌘N")
                .font(.system(size: 10, weight: .medium, design: .monospaced))
                .foregroundColor(.gray.opacity(0.5))
                .padding(.horizontal, 8)
                .padding(.vertical, 3)
                .background(Color.gray.opacity(0.08))
                .clipShape(RoundedRectangle(cornerRadius: 4))
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Header View
struct HeaderView: View {
    let taskCount: Int
    let archivedCount: Int
    @Binding var currentView: ContentView.ViewMode
    @Binding var isFocusMode: Bool
    @Binding var focusIndex: Int
    let onAddTask: () -> Void
    let onShowArchive: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            // App Icon
            RoundedRectangle(cornerRadius: 8)
                .fill(Color.black)
                .frame(width: 34, height: 34)
                .overlay(
                    Image(systemName: "square.grid.2x2")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.white)
                )
                .shadow(color: .black, radius: 0, x: 2, y: 2)

            VStack(alignment: .leading, spacing: 1) {
                Text("Quadrants")
                    .font(.system(size: 17, weight: .bold))
                    .foregroundColor(.black)

                Text("\(taskCount) active · \(archivedCount) done")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(.secondary)
            }

            Spacer()

            // View Toggle (Grid / List)
            HStack(spacing: 2) {
                HeaderToggleButton(
                    icon: "square.grid.2x2",
                    label: "Grid",
                    isSelected: currentView == .map,
                    action: { currentView = .map }
                )
                HeaderToggleButton(
                    icon: "list.bullet",
                    label: "List",
                    isSelected: currentView == .list,
                    action: { currentView = .list }
                )
            }
            .padding(3)
            .background(Color(hex: "F3F4F6"))
            .clipShape(RoundedRectangle(cornerRadius: 8))
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(.black, lineWidth: 2)
            )

            // Focus Button
            CuteBoldButton(
                label: "Focus",
                icon: "eye",
                bgColor: Color(hex: "FBBF24"),
                fgColor: .black,
                action: {
                    withAnimation(.spring(response: 0.3)) {
                        isFocusMode = true
                        focusIndex = 0
                    }
                }
            )
            .disabled(taskCount == 0)
            .opacity(taskCount == 0 ? 0.4 : 1)

            // Add Task Button
            CuteBoldButton(
                label: "Add Task",
                icon: "plus",
                bgColor: .black,
                fgColor: .white,
                action: onAddTask
            )

            // Archive Button
            Button(action: onShowArchive) {
                ZStack {
                    Image(systemName: "archivebox")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(.black)
                }
                .frame(width: 34, height: 34)
                .background(Color.white)
                .clipShape(RoundedRectangle(cornerRadius: 8))
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(.black, lineWidth: 2)
                )
            }
            .buttonStyle(CuteBoldButtonStyle())
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 10)
        .background(Color.white)
        .overlay(
            Rectangle()
                .frame(height: CuteBoldStyle.borderWidth)
                .foregroundColor(.black),
            alignment: .bottom
        )
    }
}

// MARK: - Reusable Cute Bold Button
struct CuteBoldButton: View {
    let label: String
    let icon: String
    let bgColor: Color
    let fgColor: Color
    let action: () -> Void

    @State private var isHovered = false

    var body: some View {
        Button(action: action) {
            HStack(spacing: 5) {
                Image(systemName: icon)
                    .font(.system(size: 11, weight: .bold))
                Text(label)
                    .font(.system(size: 12, weight: .bold))
            }
            .foregroundColor(fgColor)
            .padding(.horizontal, 12)
            .padding(.vertical, 7)
            .background(bgColor)
            .clipShape(RoundedRectangle(cornerRadius: 8))
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(.black, lineWidth: 2)
            )
            .shadow(
                color: .black,
                radius: 0,
                x: isHovered ? 3 : 2,
                y: isHovered ? 3 : 2
            )
            .offset(x: isHovered ? -0.5 : 0, y: isHovered ? -0.5 : 0)
        }
        .buttonStyle(.plain)
        .onHover { h in
            withAnimation(.easeInOut(duration: 0.1)) { isHovered = h }
        }
    }
}

// MARK: - Button style with subtle press effect
struct CuteBoldButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.96 : 1)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}

// MARK: - Header Toggle Button
struct HeaderToggleButton: View {
    let icon: String
    let label: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.system(size: 11, weight: .semibold))
                Text(label)
                    .font(.system(size: 11, weight: .semibold))
            }
            .foregroundColor(isSelected ? .white : .black)
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(isSelected ? Color.black : Color.clear)
            .clipShape(RoundedRectangle(cornerRadius: 6))
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
    let onExit: () -> Void

    var body: some View {
        ZStack {
            // Dark overlay
            Color.black.opacity(0.55)
                .ignoresSafeArea()
                .onTapGesture(perform: onTap)

            // Top-right exit button
            VStack {
                HStack {
                    Spacer()
                    Button(action: onExit) {
                        HStack(spacing: 4) {
                            Image(systemName: "xmark")
                                .font(.system(size: 10, weight: .bold))
                            Text("Exit Focus")
                                .font(.system(size: 11, weight: .bold))
                        }
                        .foregroundColor(.white)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color.white.opacity(0.2))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(.white.opacity(0.3), lineWidth: 1.5)
                        )
                    }
                    .buttonStyle(.plain)
                    .padding(20)
                }
                Spacer()
            }

            // Focus card centered
            if let task = focusedTask {
                VStack(spacing: 16) {
                    // Progress dots
                    HStack(spacing: 6) {
                        ForEach(0..<totalTasks, id: \.self) { i in
                            Circle()
                                .fill(i == focusIndex ? Color.white : Color.white.opacity(0.3))
                                .frame(width: i == focusIndex ? 10 : 7, height: i == focusIndex ? 10 : 7)
                                .overlay(
                                    i == focusIndex ?
                                    Circle().stroke(.white, lineWidth: 1.5) : nil
                                )
                                .animation(.spring(response: 0.25), value: focusIndex)
                        }
                    }

                    VStack(spacing: 10) {
                        // Priority badge
                        Text("PRIORITY #\(focusIndex + 1)")
                            .font(.system(size: 11, weight: .black, design: .monospaced))
                            .tracking(2)
                            .foregroundColor(CuteBoldStyle.textColor(for: task.quadrant))
                            .padding(.horizontal, 12)
                            .padding(.vertical, 4)
                            .background(CuteBoldStyle.bgColor(for: task.quadrant))
                            .clipShape(RoundedRectangle(cornerRadius: 6))
                            .overlay(
                                RoundedRectangle(cornerRadius: 6)
                                    .stroke(.black, lineWidth: 2)
                            )

                        Text(task.taskDescription)
                            .font(.system(size: 22, weight: .bold))
                            .foregroundColor(.black)
                            .multilineTextAlignment(.center)
                            .lineLimit(4)

                        // Quadrant badge
                        HStack(spacing: 4) {
                            Image(systemName: CuteBoldStyle.icon(for: task.quadrant))
                                .font(.system(size: 10, weight: .bold))
                            Text(task.quadrant.label)
                                .font(.system(size: 11, weight: .bold))
                        }
                        .foregroundColor(CuteBoldStyle.textColor(for: task.quadrant))
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(CuteBoldStyle.accentColor(for: task.quadrant).opacity(0.12))
                        .clipShape(Capsule())

                        Spacer().frame(height: 4)

                        // Navigation hint
                        Text(focusIndex < totalTasks - 1 ? "Click anywhere to continue →" : "Click anywhere to finish")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(.secondary)
                    }
                    .padding(.horizontal, 32)
                    .padding(.vertical, 24)
                    .frame(maxWidth: 400)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: CuteBoldStyle.cornerRadius))
                    .overlay(
                        RoundedRectangle(cornerRadius: CuteBoldStyle.cornerRadius)
                            .stroke(.black, lineWidth: CuteBoldStyle.borderWidth)
                    )
                    .shadow(color: .black, radius: 0, x: CuteBoldStyle.shadowOffset + 2, y: CuteBoldStyle.shadowOffset + 2)
                }
                .transition(.scale(scale: 0.92).combined(with: .opacity))
            }
        }
        .animation(.spring(response: 0.35, dampingFraction: 0.8), value: focusIndex)
    }
}

// MARK: - Task List View (grouped by quadrant)
struct TaskListView: View {
    let tasks: [TodoTask]
    let onTaskTap: (TodoTask) -> Void
    let onTaskComplete: (TodoTask) -> Void

    private let quadrantOrder: [Quadrant] = [
        .urgentImportant,
        .notUrgentImportant,
        .urgentNotImportant,
        .notUrgentNotImportant
    ]

    private func tasksFor(_ quadrant: Quadrant) -> [TodoTask] {
        tasks.filter { $0.quadrant == quadrant }
            .sorted { $0.priorityScore > $1.priorityScore }
    }

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 20) {
                ForEach(quadrantOrder, id: \.self) { quadrant in
                    let quadrantTasks = tasksFor(quadrant)
                    if !quadrantTasks.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            // Quadrant header badge
                            HStack(spacing: 6) {
                                Image(systemName: CuteBoldStyle.icon(for: quadrant))
                                    .font(.system(size: 12, weight: .bold))
                                Text(quadrant.label)
                                    .font(.system(size: 13, weight: .bold))

                                Spacer()

                                Text("\(quadrantTasks.count)")
                                    .font(.system(size: 10, weight: .black))
                                    .foregroundColor(.white)
                                    .frame(width: 20, height: 20)
                                    .background(
                                        Circle()
                                            .fill(CuteBoldStyle.accentColor(for: quadrant))
                                    )
                                    .overlay(
                                        Circle()
                                            .stroke(.black, lineWidth: 1.5)
                                    )
                            }
                            .foregroundColor(CuteBoldStyle.textColor(for: quadrant))
                            .padding(.horizontal, 14)
                            .padding(.vertical, 8)
                            .background(CuteBoldStyle.bgColor(for: quadrant))
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                            .overlay(
                                RoundedRectangle(cornerRadius: 10)
                                    .stroke(.black, lineWidth: 2)
                            )
                            .shadow(color: .black, radius: 0, x: 2, y: 2)

                            // Tasks
                            ForEach(quadrantTasks) { task in
                                TaskListItem(
                                    task: task,
                                    quadrant: quadrant,
                                    onTap: { onTaskTap(task) },
                                    onComplete: { onTaskComplete(task) }
                                )
                            }
                        }
                    }
                }
            }
            .padding(20)
        }
        .background(Color(hex: "F9FAFB"))
    }
}

// MARK: - Task List Item (Cute Bold style)
struct TaskListItem: View {
    let task: TodoTask
    let quadrant: Quadrant
    let onTap: () -> Void
    let onComplete: () -> Void

    @State private var isHovered = false
    @State private var checkHovered = false
    @State private var justCompleted = false

    var body: some View {
        HStack(spacing: 12) {
            // Color bar
            RoundedRectangle(cornerRadius: 2)
                .fill(CuteBoldStyle.accentColor(for: quadrant))
                .frame(width: 4)

            // Checkbox
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
                        .frame(width: 22, height: 22)

                    if justCompleted {
                        Circle()
                            .fill(CuteBoldStyle.accentColor(for: quadrant))
                            .frame(width: 22, height: 22)
                        Image(systemName: "checkmark")
                            .font(.system(size: 11, weight: .black))
                            .foregroundColor(.white)
                    } else if checkHovered {
                        Image(systemName: "checkmark")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(CuteBoldStyle.accentColor(for: quadrant).opacity(0.5))
                    }
                }
            }
            .buttonStyle(.plain)
            .onHover { h in
                withAnimation(.easeInOut(duration: 0.1)) { checkHovered = h }
            }

            // Task content
            VStack(alignment: .leading, spacing: 3) {
                Text(task.taskDescription)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(justCompleted ? .gray : .black)
                    .strikethrough(justCompleted, color: .gray)

                Text(CuteBoldStyle.subtitle(for: quadrant))
                    .font(.system(size: 10, weight: .medium))
                    .foregroundColor(CuteBoldStyle.textColor(for: quadrant).opacity(0.6))
            }

            Spacer()

            // Hover actions
            if isHovered && !justCompleted {
                Button(action: onTap) {
                    Image(systemName: "pencil")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(.black)
                        .frame(width: 28, height: 28)
                        .background(Color(hex: "F3F4F6"))
                        .clipShape(RoundedRectangle(cornerRadius: 6))
                        .overlay(
                            RoundedRectangle(cornerRadius: 6)
                                .stroke(.black, lineWidth: 1.5)
                        )
                }
                .buttonStyle(.plain)
                .transition(.opacity.combined(with: .scale(scale: 0.8)))
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: CuteBoldStyle.smallCornerRadius))
        .overlay(
            RoundedRectangle(cornerRadius: CuteBoldStyle.smallCornerRadius)
                .stroke(.black, lineWidth: isHovered ? 2.5 : 2)
        )
        .shadow(color: .black, radius: 0, x: isHovered ? 4 : 3, y: isHovered ? 4 : 3)
        .offset(x: isHovered ? -0.5 : 0, y: isHovered ? -0.5 : 0)
        .opacity(justCompleted ? 0.5 : 1)
        .contentShape(Rectangle())
        .onHover { hovering in
            withAnimation(.easeInOut(duration: 0.12)) {
                isHovered = hovering
            }
        }
        .onTapGesture(perform: onTap)
        .animation(.easeInOut(duration: 0.12), value: isHovered)
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
                    .font(.system(size: 18, weight: .bold))

                Spacer()

                Text("\(tasks.count) completed")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(.secondary)

                Button(action: { dismiss() }) {
                    Text("Done")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(.black)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 6)
                        .background(Color(hex: "F3F4F6"))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(.black, lineWidth: 2)
                        )
                }
                .buttonStyle(CuteBoldButtonStyle())
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 16)

            Rectangle()
                .frame(height: CuteBoldStyle.borderWidth)
                .foregroundColor(.black)

            if tasks.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "checkmark.circle")
                        .font(.system(size: 36, weight: .medium))
                        .foregroundColor(Color(hex: "22C55E").opacity(0.3))

                    Text("No completed tasks yet")
                        .font(.system(size: 15, weight: .medium))
                        .foregroundColor(.secondary)

                    Text("Tasks you complete will appear here")
                        .font(.system(size: 12))
                        .foregroundColor(.gray.opacity(0.6))
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
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: CuteBoldStyle.cornerRadius))
        .overlay(
            RoundedRectangle(cornerRadius: CuteBoldStyle.cornerRadius)
                .stroke(.black, lineWidth: CuteBoldStyle.borderWidth)
        )
    }
}

struct ArchivedTaskItem: View {
    let task: TodoTask
    let onRestore: () -> Void
    let onDelete: () -> Void

    @State private var isHovered = false

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 20))
                .foregroundColor(Color(hex: "22C55E"))

            Text(task.taskDescription)
                .font(.system(size: 14))
                .foregroundColor(.gray)
                .strikethrough()
                .lineLimit(1)

            Spacer()

            if isHovered {
                HStack(spacing: 6) {
                    Button(action: onRestore) {
                        Image(systemName: "arrow.uturn.backward")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(Color(hex: "3B82F6"))
                            .frame(width: 26, height: 26)
                            .background(Color(hex: "EFF6FF"))
                            .clipShape(RoundedRectangle(cornerRadius: 6))
                            .overlay(
                                RoundedRectangle(cornerRadius: 6)
                                    .stroke(.black, lineWidth: 1.5)
                            )
                    }
                    .buttonStyle(.plain)
                    .help("Restore task")

                    Button(action: onDelete) {
                        Image(systemName: "trash")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(Color(hex: "EF4444"))
                            .frame(width: 26, height: 26)
                            .background(Color(hex: "FEF2F2"))
                            .clipShape(RoundedRectangle(cornerRadius: 6))
                            .overlay(
                                RoundedRectangle(cornerRadius: 6)
                                    .stroke(.black, lineWidth: 1.5)
                            )
                    }
                    .buttonStyle(.plain)
                    .help("Delete permanently")
                }
                .transition(.opacity.combined(with: .scale(scale: 0.85)))
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(isHovered ? Color(hex: "F3F4F6") : Color(hex: "F9FAFB"))
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(Color.black.opacity(isHovered ? 0.2 : 0.1), lineWidth: 1)
        )
        .onHover { h in
            withAnimation(.easeInOut(duration: 0.12)) { isHovered = h }
        }
    }
}

#Preview {
    ContentView()
        .modelContainer(for: TodoTask.self, inMemory: true)
}
