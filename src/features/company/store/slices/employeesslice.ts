import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type EmployeeRole = 'owner' | 'admin' | 'editor' | 'analyst' | 'member';

export interface Employee {
  id: string; // UUID v4 employeeId
  _id?: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  dept: string;
  role: EmployeeRole;
  avatar: string;
  profileImage?: string;
  phone?: string;
  bio?: string;
  skills?: string[];
  advocacy: boolean;
  isAdvocate: boolean;
  advocacyScore?: number;
  active: boolean;
  joined: string;
  joinDateRaw?: string;
}

interface EmployeesState {
  items: Employee[];
  loading: boolean;
  error: string | null;
}

const initialState: EmployeesState = {
  items: [],
  loading: false,
  error: null,
};

const employeesSlice = createSlice({
  name: 'employees',
  initialState,
  reducers: {
    addEmployee(state, action: PayloadAction<Employee>) {
      state.items.unshift(action.payload);
    },
    removeEmployee(state, action: PayloadAction<string>) {
      state.items = state.items.filter(e => e.id !== action.payload && e._id !== action.payload);
    },
    toggleAdvocacy(state, action: PayloadAction<string>) {
      const emp = state.items.find(e => e.id === action.payload || e._id === action.payload);
      if (emp) {
        emp.isAdvocate = !emp.isAdvocate;
        emp.advocacy = emp.isAdvocate;
      }
    },
    updateRole(state, action: PayloadAction<{ id: string; role: EmployeeRole }>) {
      const emp = state.items.find(e => e.id === action.payload.id || e._id === action.payload.id);
      if (emp) emp.role = action.payload.role;
    },
    setEmployees(state, action: PayloadAction<Employee[]>) {
      state.items = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.loading = false;
    },
    updateEmployee(state, action: PayloadAction<{ id: string; changes: Partial<Employee> }>) {
      const emp = state.items.find(e => e.id === action.payload.id || e._id === action.payload.id);
      if (emp) Object.assign(emp, action.payload.changes);
    },
    toggleActive(state, action: PayloadAction<string>) {
      const emp = state.items.find(e => e.id === action.payload || e._id === action.payload);
      if (emp) emp.active = !emp.active;
    },
  },
});

export const {
  addEmployee, removeEmployee, toggleAdvocacy, updateRole,
  setEmployees, setLoading, setError, updateEmployee, toggleActive,
} = employeesSlice.actions;

console.log('✅ employeesSlice loaded, initialState items:', initialState.items.length);
export default employeesSlice.reducer;