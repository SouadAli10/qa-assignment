# Todo Master Frontend

A beautiful, modern Todo application built with React 19, TypeScript, and Tailwind CSS. Features dual API support for both Golang and Node.js backends.

## Features

### Core Functionality
- ✅ **Full CRUD Operations**: Create, read, update, and delete todos
- 🔄 **Real-time Updates**: Automatic refresh when data changes
- 🎯 **Smart Filtering**: Filter todos by All, Active, or Completed status
- ✏️ **Inline Editing**: Edit todo titles directly in the list
- 🗑️ **Easy Delete**: Remove todos with a single click

### API Integration
- 🔀 **Dual API Support**: Switch between Golang and Node.js backends
- 🟢 **Health Monitoring**: Real-time API connection status
- 🔄 **Automatic Retry**: Smart error handling and recovery
- 💾 **Persistent Selection**: Remembers your API choice

### Beautiful UI
- 🎨 **Modern Design**: Clean, professional interface with shadcn/ui
- 🌗 **Theme Support**: Light and dark mode ready
- 📱 **Responsive**: Works perfectly on desktop and mobile
- ✨ **Smooth Animations**: Delightful transitions and interactions
- 🎯 **Accessibility**: Keyboard navigation and screen reader friendly

## Tech Stack

- **React 19** - Latest React with improved performance
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **Tailwind CSS v4** - Modern utility-first CSS
- **shadcn/ui** - Beautiful, accessible components
- **Tanstack Query** - Powerful data synchronization
- **Axios** - Reliable HTTP client
- **Lucide Icons** - Beautiful icon library

## Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- One or both backend APIs running

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The app will be available at `http://localhost:5173`

### Available Scripts

```bash
pnpm dev      # Start development server
pnpm build    # Build for production
pnpm preview  # Preview production build
pnpm lint     # Run ESLint
```

## API Configuration

The app can connect to two different backends:

### Golang API
- Default port: `3001`
- Endpoint: `http://localhost:3001/api`
- Start with: `cd ../golang-api && go run cmd/api/main.go`

### Node.js API  
- Default port: `3000`
- Endpoint: `http://localhost:3000/api`
- Start with: `cd ../nodejs-api && npm start`

## Testing Scenarios

Perfect for QA testing with these features:

1. **CRUD Operations**
   - Create todos with various titles
   - Update todo titles and completion status
   - Delete individual todos
   - Handle empty states

2. **API Switching**
   - Switch between backends while app is running
   - Verify data persistence per backend
   - Test connection failures and recovery

3. **Edge Cases**
   - Long todo titles
   - Special characters in titles
   - Rapid create/update/delete operations
   - Multiple browser tabs

4. **Error Handling**
   - Backend offline scenarios
   - Network timeout handling
   - Invalid data responses
   - API switching during operations

## Project Structure

```
src/
├── components/
│   ├── todos/         # Todo-specific components
│   │   ├── TodoList.tsx
│   │   ├── TodoItem.tsx
│   │   ├── TodoForm.tsx
│   │   └── TodoFilters.tsx
│   ├── ui/            # Reusable UI components
│   └── ApiSwitcher.tsx
├── services/          # API integration
│   └── todo-api.ts
├── hooks/             # Custom React hooks
│   └── use-todos.ts
├── lib/               # Utilities and config
├── types/             # TypeScript types
└── App.tsx           # Main application
```

## Key Components

### TodoList
Main container that orchestrates all todo operations and displays the list.

### TodoItem
Individual todo with checkbox, inline editing, and delete functionality.

### TodoForm
Input form for creating new todos with validation.

### TodoFilters
Filter buttons to show All, Active, or Completed todos.

### ApiSwitcher
Backend selector with health status indicator.

## State Management

Uses Tanstack Query for server state management:
- Automatic caching and background refetching
- Optimistic updates for better UX
- Smart error handling and retries
- Request deduplication

## Styling

Built with Tailwind CSS v4 and custom theming:
- CSS variables for easy customization
- Consistent design tokens
- Smooth animations and transitions
- Responsive breakpoints

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Contributing

This is a test assignment project. Feel free to explore and test all features!