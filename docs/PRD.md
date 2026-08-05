# FocusFlow Product Requirements Document (PRD)

## 1. Overview
FocusFlow is a lightweight, all-in-one personal productivity application designed for daily local use. It runs in a single Docker container and integrates personal notes, a to-do list, a calendar, and a task manager, all accessible via a centralized dashboard.

## 2. Features
- **Dashboard**: A unified view summarizing tasks, pinned notes, and upcoming meetings.
- **Personal Notes**: 
  - Displayed continuously like a chat feed for easy reading without clicking.
  - Search functionality to find specific notes.
  - Ability to pin notes.
- **To-Do List & Task Manager**: 
  - Manage tasks with statuses (Done, Pending, In Progress).
- **Calendar & Notifications**: 
  - Manage meetings and schedules.
  - Alerts for meetings scheduled for today or tomorrow.

## 3. Technology Stack (Lightweight)
- **Frontend**: React (via Vite) + TypeScript + Vanilla CSS for a custom, eye-catching UI.
- **Backend**: Node.js + Express.js.
- **Database**: SQLite (local, single file, zero configuration).
- **Infrastructure**: Docker & Docker Compose (single container running the Express server which serves the React static build and handles API requests).

## 4. UI/UX Requirements
- Professional and modern design.
- Eye-catching with smooth micro-animations.
- High usability and fast interactions (SPA architecture).
- Responsive but optimized for desktop local usage.
- Integration of the UI design from Google Stitch via MCP.

## 5. Non-Functional Requirements
- **Performance**: Instant load times since it's locally hosted.
- **Deployment**: `docker-compose up` should start the entire stack.
- **Data Privacy**: All data remains local in the SQLite file.

## 6. Future Roadmap (v2.0 Updates)
The following features are planned for future updates to enhance the "deep work" capabilities of FocusFlow:

### 1. The "Focus" Features
- **Integrated Pomodoro Timer**: A built-in 25/5 timer integrated directly with Tasks. Tracks Pomodoro sessions per task.
- **Focus / Zen Mode**: A distraction-free UI toggle that hides everything except the currently active task and timer.

### 2. Task & Workflow Enhancements
- **Drag-and-Drop Kanban Board**: Visual workflow columns (e.g., To-Do, In Progress, Review, Done).
- **Tags & Context Filtering**: Ability to add `#tags` (e.g., `#work`, `#personal`) to tasks and notes for contextual filtering.
- **Sub-tasks**: Break down large tasks into smaller, checkable sub-steps.

### 3. Note-Taking Upgrades
- **Rich Text / Markdown Editor**: Upgrade to a Notion-style block editor for formatting, lists, and images.
- **Cross-linking**: Attach notes directly to meetings (e.g., meeting minutes) or tasks.

### 4. Utility & Quality of Life
- **User Authentication**: Add a login system (email/password or OAuth) to support privacy and multi-tenancy.
- **Calendar View**: A visual monthly/weekly calendar populating meetings and task due dates.
- **Push Notifications**: Browser reminders for upcoming meetings and overdue tasks.
