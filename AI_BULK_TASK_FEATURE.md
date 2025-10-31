# 🤖 AI-Powered Bulk Task Creation Feature

## Overview

This feature allows users to quickly create multiple tasks at once by pasting them into a text box. AI automatically analyzes each task and predicts its urgency and importance levels. The system learns from user adjustments to provide increasingly accurate predictions over time.

## Features

### ✨ Key Capabilities

1. **Bulk Input**: Paste multiple tasks (one per line) into a single text box
2. **AI Predictions**: Automatically predicts urgency (0-100) and importance (0-100) for each task
3. **Player Assignment**: Mention players with `@playerName` syntax to auto-assign tasks
4. **Interactive Adjustment**: Review and adjust AI predictions before creating tasks
5. **Smart Learning**: System learns from your adjustments to improve future predictions
6. **Fallback Mode**: Works with keyword heuristics if AI API is unavailable

### 📝 How to Use

1. **Open the Feature**
   - Click the menu button (three dots) in the project header
   - Select "Bulk Add with AI" ✨

2. **Enter Your Tasks**
   ```
   Fix login bug @alice
   Review pull request @bob
   Update documentation
   Deploy to production @alice @bob
   ```

3. **AI Analysis**
   - Click "Analyze Tasks with AI"
   - AI will predict urgency and importance for each task
   - See predicted quadrants and assignments

4. **Review & Adjust**
   - Each task shows its predicted priority
   - Drag sliders to adjust urgency/importance
   - Remove tasks you don't want to create
   - Assignments are automatically detected from @mentions

5. **Create Tasks**
   - Click "Create X Tasks" to add them to your project
   - Tasks appear on the quadrant matrix at their predicted positions
   - AI learns from any adjustments you made

## How the AI Works

### Prediction Logic

The AI uses **Qwen (阿里云通义千问)** as the primary model, with Claude (Anthropic) as fallback to analyze task descriptions and predict:
- **Urgency**: Time sensitivity, deadlines, immediate action needed
- **Importance**: Long-term impact, criticality to goals

**Why Qwen?**
- ✅ More cost-effective (5-10x cheaper than Claude)
- ✅ Better Chinese language understanding
- ✅ Faster response times within China
- ✅ No VPN/proxy required for Chinese users

### Learning System

1. **First Use**: AI makes predictions based on general task analysis
2. **Learning**: System records your adjustments (e.g., "user increased urgency by 20")
3. **Personalization**: Future predictions incorporate your historical patterns
4. **Continuous Improvement**: The more you use it, the better it gets

### Fallback Mode

If `ANTHROPIC_API_KEY` is not configured, the system uses keyword-based heuristics:

**Urgency Keywords**:
- High: urgent, asap, immediately, critical, deadline, bug, fix, broken
- Low: someday, eventually, consider, maybe

**Importance Keywords**:
- High: important, essential, must, required, vital, deploy, release
- Medium: review, update, improve, optimize
- Low: minor, trivial, cosmetic, cleanup

## Technical Architecture

### Database Schema

```sql
-- Stores AI predictions and user adjustments for learning
CREATE TABLE task_predictions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  task_description TEXT NOT NULL,
  predicted_urgency INTEGER NOT NULL,
  predicted_importance INTEGER NOT NULL,
  final_urgency INTEGER NOT NULL,
  final_importance INTEGER NOT NULL,
  adjustment_delta JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Stores user preferences for personalization
CREATE TABLE user_task_preferences (
  user_id TEXT PRIMARY KEY,
  avg_urgency_bias REAL DEFAULT 0,
  avg_importance_bias REAL DEFAULT 0,
  keyword_patterns JSONB,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### API Endpoints

1. **`POST /api/ai/predict-tasks`**
   - Input: Array of task descriptions
   - Output: Predicted urgency/importance for each task
   - Uses Claude API or fallback heuristics

2. **`POST /api/tasks/bulk-create`**
   - Input: Array of tasks with predictions and final values
   - Output: Created task count
   - Records predictions for learning
   - Updates user preferences

### Components

- **`BulkTaskInput.tsx`**: Main UI component with text input, preview, and adjustment controls
- **`/api/ai/predict-tasks/route.ts`**: AI prediction endpoint
- **`/api/tasks/bulk-create/route.ts`**: Bulk task creation with learning

## Setup

### Required Environment Variables

```bash
# Primary: Qwen API (阿里云通义千问) - Recommended
QWEN_API_KEY=your_qwen_api_key

# Fallback: Claude API (Anthropic) - Optional
ANTHROPIC_API_KEY=your_anthropic_api_key

# The system will try Qwen first, then Claude, then keyword heuristics
# At least one API key is recommended for best results
```

### Get a Qwen API Key (Recommended)

1. Go to [阿里云DashScope控制台](https://dashscope.console.aliyun.com/)
2. Sign up or log in with your Aliyun account
3. Navigate to API-KEY management
4. Create a new API key
5. Add to `.env.local`:
   ```bash
   QWEN_API_KEY=sk-your-key-here
   ```

### Get an Anthropic API Key (Optional Fallback)

1. Go to [https://console.anthropic.com/](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to API Keys
4. Create a new API key
5. Add to `.env.local`:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   ```

### Cost Considerations

**Qwen API Pricing (Primary):**
- qwen-turbo: ¥0.0008/1000 tokens (~$0.0001)
- qwen-plus: ¥0.004/1000 tokens (~$0.0006)
- qwen-max: ¥0.012/1000 tokens (~$0.0017)

**Claude API Pricing (Fallback):**
- Claude Sonnet: ~$0.003/1000 tokens

**Example Usage:**
- 10 tasks with Qwen-plus: ~1000 tokens ≈ ¥0.004 (~$0.0006)
- Monthly (1000 bulk operations): ~¥4 (~$0.60)

**Qwen is 5-10x cheaper than Claude!**

## Examples

### Example Input

```
Fix critical login bug - users can't access dashboard @alice
Review and merge payment integration PR @bob
Update API documentation for v2 endpoints
Plan Q2 roadmap meeting
Deploy staging environment @alice @bob
Refactor authentication middleware
```

### AI Predictions

| Task | Predicted Urgency | Predicted Importance | Quadrant |
|------|------------------|---------------------|----------|
| Fix critical login bug | 95 | 90 | Urgent & Important |
| Review payment PR | 75 | 85 | Urgent & Important |
| Update API docs | 45 | 70 | Important, Not Urgent |
| Plan Q2 roadmap | 50 | 80 | Important, Not Urgent |
| Deploy staging | 80 | 60 | Urgent, Not Important |
| Refactor auth | 35 | 75 | Important, Not Urgent |

## Limitations

- Maximum recommended: 20 tasks per bulk operation (for UX and cost)
- Requires internet connection for AI predictions
- AI predictions are suggestions, not guarantees
- Works best with clear, descriptive task titles

## Future Enhancements

- [ ] Support for task templates
- [ ] Bulk edit existing tasks
- [ ] Import from CSV/Excel
- [ ] More granular learning (project-specific patterns)
- [ ] Confidence scores for predictions
- [ ] Multi-language support

## Troubleshooting

### AI Predictions Not Working

1. Check that at least one API key is set in `.env.local`:
   - `QWEN_API_KEY` (recommended) or
   - `ANTHROPIC_API_KEY` (fallback)
2. Restart Next.js development server after adding keys
3. Check server logs for API errors
4. Verify API key is valid:
   - For Qwen: Test at https://dashscope.console.aliyun.com/
   - For Claude: Test at https://console.anthropic.com/
5. Check network connectivity to API endpoints

### Tasks Created with Wrong Priority

- System is learning your preferences
- Use the adjustment sliders before creating tasks
- The more you adjust, the better future predictions will be

### @Mentions Not Working

- Ensure player names match exactly (case-insensitive)
- Player must exist in the project
- Use format: `@playername` (no spaces)

## Support

For issues or questions:
- Check this documentation
- Review the code in `/components/BulkTaskInput.tsx`
- Contact support at contact@quadrants.ch
