import Foundation
import SwiftData
import SwiftUI

@Model
final class TodoTask {
    var id: UUID
    var taskDescription: String
    var urgency: Double
    var importance: Double
    var isCompleted: Bool
    var createdAt: Date
    var updatedAt: Date

    init(
        taskDescription: String,
        urgency: Double = 50,
        importance: Double = 50
    ) {
        self.id = UUID()
        self.taskDescription = taskDescription
        self.urgency = urgency
        self.importance = importance
        self.isCompleted = false
        self.createdAt = Date()
        self.updatedAt = Date()
    }

    /// Returns which quadrant this task belongs to
    var quadrant: Quadrant {
        let isUrgent = urgency >= 50
        let isImportant = importance >= 50

        switch (isUrgent, isImportant) {
        case (true, true):
            return .urgentImportant
        case (true, false):
            return .urgentNotImportant
        case (false, true):
            return .notUrgentImportant
        case (false, false):
            return .notUrgentNotImportant
        }
    }

    /// Priority score for sorting (higher = more priority)
    var priorityScore: Double {
        importance * 0.6 + urgency * 0.4
    }
}

enum Quadrant: String, CaseIterable {
    case urgentImportant = "Do First"
    case notUrgentImportant = "Schedule"
    case urgentNotImportant = "Delegate"
    case notUrgentNotImportant = "Eliminate"

    var label: String {
        return self.rawValue
    }

    var color: Color {
        switch self {
        case .urgentImportant:
            return Color(red: 0.937, green: 0.267, blue: 0.267) // #EF4444
        case .notUrgentImportant:
            return Color(red: 0.231, green: 0.510, blue: 0.965) // #3B82F6
        case .urgentNotImportant:
            return Color(red: 0.976, green: 0.451, blue: 0.086) // #F97316
        case .notUrgentNotImportant:
            return Color(red: 0.420, green: 0.447, blue: 0.498) // #6B7280
        }
    }

    var description: String {
        switch self {
        case .urgentImportant:
            return "Urgent & Important"
        case .notUrgentImportant:
            return "Not Urgent & Important"
        case .urgentNotImportant:
            return "Urgent & Not Important"
        case .notUrgentNotImportant:
            return "Not Urgent & Not Important"
        }
    }
}
