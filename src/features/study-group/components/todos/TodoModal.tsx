// app/(studyGroup)/study/todo/components/TodoModal.tsx

'use client';

import { useAppDispatch, useAppSelector } from '@/core/store/store.hooks';
import { addTodo, toggleTodo, deleteTodo } from '@/hooks/studyGroup/features/todo/todoSlice';
import { useState, useEffect } from 'react';
import { Calendar, Award, X, Plus, Check, Trash2 } from 'lucide-react';
import { createTaskThunk } from '@/hooks/studyGroup/features/todo/todo.thunks';

interface TodoModalProps {
  selectedDate: Date | null;
  showTodoModal: boolean;
  setShowTodoModal: (show: boolean) => void;
  formatDate: (date: Date) => string;
  groupId?: string | null; // ✅ ADD — group context ke liye (optional)
}

export default function TodoModal({
  selectedDate,
  showTodoModal,
  setShowTodoModal,
  formatDate,
  groupId, // ✅ ADD
}: TodoModalProps) {
  const dispatch = useAppDispatch();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [deadline, setDeadline] = useState('');
  const [tags, setTags] = useState('');
  const [reminderAt, setReminderAt] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (!showTodoModal) return;
    if (!selectedDate) return;

    const defaultDeadline = new Date(selectedDate);
    defaultDeadline.setHours(23, 59, 0, 0);

    const defaultReminder = new Date(selectedDate);
    defaultReminder.setHours(10, 0, 0, 0);

    setDeadline(defaultDeadline.toISOString().slice(0, 16));
    setReminderAt(defaultReminder.toISOString().slice(0, 16));
  }, [selectedDate, showTodoModal]);

  // ✅ ALL hooks must be at top - BEFORE any early returns!
  const dateStr = selectedDate ? formatDate(selectedDate) : '';
  const dateTodos = useAppSelector(state =>
    dateStr ? state.todos.items[dateStr] || [] : []
  );
  const isComplete = dateTodos.length > 0 && dateTodos.every(t => t.completed);

  // ✅ Early return AFTER hooks


  const handleAdd = async () => {
    if (!title.trim() || isAdding) return;

    setIsAdding(true);
    try {
      const parsedTags = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean)
        .slice(0, 10);

      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        tags: parsedTags.length ? parsedTags : [],
        reminderAt: reminderAt ? new Date(reminderAt).toISOString() : undefined,
        groupId: groupId ?? null,
      };

      await dispatch(createTaskThunk(payload)).unwrap();

      // Local Redux item update for calendar month view (legacy local state)
      dispatch(addTodo({
        dateStr,
        text: payload.title,
        description: payload.description,
        priority: payload.priority,
        deadline: payload.deadline,
        tags: payload.tags,
        reminderAt: payload.reminderAt,
      }));

      setTitle('');
      setDescription('');
      setPriority('medium');
      setDeadline('');
      setTags('');
      setReminderAt('');
    } catch (err: any) {
      console.error('Task create failed:', err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  if (!showTodoModal || !selectedDate) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center mt-5 z-50 p-3 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] sm:max-h-[90vh] overflow-visible">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-3 sm:p-4 flex justify-between items-start sm:items-center rounded-t-xl sm:rounded-t-2xl">
          <div className="flex items-start sm:items-center gap-2 flex-1 pr-2">
            <Calendar className="text-[#8b7355] flex-shrink-0 mt-0.5 sm:mt-0" size={18} />
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-[#4a3728] leading-tight">
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h2>
              {isComplete && (
                <div className="flex items-center gap-1 text-xs sm:text-sm text-yellow-600 mt-1">
                  <Award className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" />
                  <span className="font-semibold">All tasks completed!</span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowTodoModal(false)}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0 p-1"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          <div className="mb-2">
            <h3 className="text-base font-bold text-[#4a3728]">Add New Task</h3>
            <p className="text-xs text-[#6b5847]">Enter title, description, priority, deadline, tags, and reminder time.</p>
          </div>

          {/* Add Todo Inputs */}
          <div className="grid grid-cols-1 gap-2">
            <label className="text-xs text-[#4a3728] font-medium" htmlFor="todo-title">Title <span className="text-red-500">*</span></label>
            <input
              id="todo-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Title (required)"
              className="w-full px-3 py-2 border-2 border-[#e0d8cf] rounded-lg focus:border-[#8b7355] focus:ring-2 focus:ring-[#8b7355]/30 outline-none text-sm text-black"
            />
            <label className="text-xs text-[#4a3728] font-medium" htmlFor="todo-description">Description</label>
            <textarea
              id="todo-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full px-3 py-2 border-2 border-[#e0d8cf] rounded-lg focus:border-[#8b7355] focus:ring-2 focus:ring-[#8b7355]/30 outline-none text-sm resize-none text-black"
              rows={3}
            />
            <div className="grid grid-cols-2 gap-2">
              <div className="grid grid-cols-1 gap-1">
                <label className="text-xs text-[#4a3728] font-medium" htmlFor="todo-priority">Priority</label>
                <select
                  id="todo-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high' | 'urgent')}
                  className="w-full px-3 py-2 border-2 border-[#e0d8cf] rounded-lg focus:border-[#8b7355] focus:ring-2 focus:ring-[#8b7355]/30 outline-none text-sm text-black"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="grid grid-cols-1 gap-1">
                <label className="text-xs text-[#4a3728] font-medium" htmlFor="todo-deadline">Deadline</label>
                <input
                  id="todo-deadline"
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-[#e0d8cf] rounded-lg focus:border-[#8b7355] focus:ring-2 focus:ring-[#8b7355]/30 outline-none text-sm text-black"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid grid-cols-1 gap-1">
                <label className="text-xs text-[#4a3728] font-medium" htmlFor="todo-tags">Tags</label>
                <input
                  id="todo-tags"
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. dsa, assignment, coding"
                  className="w-full px-3 py-2 border-2 border-[#e0d8cf] rounded-lg focus:border-[#8b7355] focus:ring-2 focus:ring-[#8b7355]/30 outline-none text-sm text-black"
                />
              </div>
              <div className="grid grid-cols-1 gap-1">
                <label className="text-xs text-[#4a3728] font-medium" htmlFor="todo-reminder">Reminder at</label>
                <input
                  id="todo-reminder"
                  type="datetime-local"
                  value={reminderAt}
                  onChange={(e) => setReminderAt(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-[#e0d8cf] rounded-lg focus:border-[#8b7355] focus:ring-2 focus:ring-[#8b7355]/30 outline-none text-sm text-black"
                />
              </div>
            </div>
            <button
              onClick={handleAdd}
              disabled={isAdding || !title.trim()}
              className="w-full px-3 sm:px-4 py-2 bg-gradient-to-r from-[#8b7355] to-[#6b5847] hover:from-[#6b5847] hover:to-[#4a3728] text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
              {isAdding ? 'Adding...' : 'Add Task'}
            </button>
          </div>

          {/* Todo List */}
          <div className="mb-2">
            <h4 className="text-sm font-semibold text-[#4a3728]">Tasks for {dateStr}</h4>
            <p className="text-xs text-[#6b5847]">Here are the todos added for the selected date (title, priority, deadline, tags, reminder).</p>
          </div>
          <div className="space-y-2">
            {dateTodos.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-[#6b5847]">
                <Calendar className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No tasks for this day</p>
              </div>
            ) : (
              dateTodos.map(todo => (
                <div
                  key={todo.id}
                  className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border-2 transition-all ${todo.completed
                    ? 'bg-[#f6ede8] border-[#8b7355]'
                    : 'bg-white border-[#e0d8cf] hover:border-[#8b7355]'
                    }`}
                >
                  <button
                    onClick={async () => {
                      dispatch(toggleTodo({ dateStr, todoId: todo.id }));
                    }}
                    className={`flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all ${todo.completed
                      ? 'bg-[#8b7355] border-[#8b7355]'
                      : 'border-[#8b7355] hover:bg-[#8b7355]/10'
                      }`}
                  >
                    {todo.completed && <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />}
                  </button>
                  <div className="flex-1">
                    <span
                      className={`block text-xs sm:text-sm break-words ${todo.completed
                        ? 'line-through text-[#6b5847]'
                        : 'text-[#4a3728] font-medium'
                        }`}
                    >
                      {todo.text}
                    </span>
                    {todo.description && (
                      <p className="text-[10px] text-[#6b5847] mt-0.5">{todo.description}</p>
                    )}
                    <div className="flex gap-1 flex-wrap mt-1">
                      {todo.priority && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#e5d6ca] text-[#4a3728]">{todo.priority}</span>}
                      {todo.deadline && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#e5d6ca] text-[#4a3728]">DL: {new Date(todo.deadline).toLocaleString()}</span>}
                      {todo.tags?.length && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#e5d6ca] text-[#4a3728]">Tags: {todo.tags.join(', ')}</span>}
                      {todo.reminderAt && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#e5d6ca] text-[#4a3728]">Rem: {new Date(todo.reminderAt).toLocaleTimeString()}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => dispatch(deleteTodo({ dateStr, todoId: todo.id }))}
                    className="flex-shrink-0 text-red-500 hover:text-red-700 transition-colors p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Progress Bar */}
          {dateTodos.length > 0 && (
            <div className="bg-[#f6ede8] rounded-lg p-3 text-sm text-[#4a3728]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-xs sm:text-sm">Progress</span>
                <span className="font-bold text-xs sm:text-sm">
                  {dateTodos.filter(t => t.completed).length}/{dateTodos.length}
                </span>
              </div>
              <div className="w-full bg-[#e0d8cf] rounded-full h-2">
                <div
                  className="bg-[#8b7355] h-2 rounded-full transition-all"
                  style={{
                    width: `${(dateTodos.filter(t => t.completed).length / dateTodos.length) * 100}%`
                  }}
                ></div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
