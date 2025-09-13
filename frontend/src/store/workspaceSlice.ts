import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

export interface Workspace {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: WorkspaceState = {
  workspaces: [],
  currentWorkspace: null,
  isLoading: false,
  error: null,
};

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');

// Async thunks
export const fetchWorkspaces = createAsyncThunk(
  'workspace/fetchWorkspaces',
  async (_, { rejectWithValue }) => {
    try {
      const apiBase = API_BASE_URL;
      const googleToken = localStorage.getItem('auth_token') || '';

      if (!apiBase) {
        // Fallback to mock data if API base is not configured
        console.warn('REACT_APP_API_BASE_URL not set; returning mock workspace list');
        return [] as Workspace[];
      }

      const resp = await axios.get(`${apiBase}/api/workspaces`, {
        headers: {
          Authorization: `Bearer ${googleToken}`,
        },
      });

      const items = (resp.data?.data || []) as any[];
      const mapped: Workspace[] = items.map((w) => ({
        id: w.id,
        name: w.name,
        createdAt: w.created_at ? new Date(w.created_at) : new Date(),
        updatedAt: w.updated_at ? new Date(w.updated_at) : new Date(),
      }));

      return mapped;
    } catch (error: any) {
      console.error('Failed to fetch workspaces', error);
      return rejectWithValue('Failed to fetch workspaces');
    }
  }
);

export const createWorkspace = createAsyncThunk(
  'workspace/createWorkspace',
  async (name: string, { rejectWithValue }) => {
    try {
      const apiBase = API_BASE_URL;
      const googleToken = localStorage.getItem('auth_token') || '';

      if (!apiBase) {
        console.warn('REACT_APP_API_BASE_URL not set; creating mock workspace');
        return {
          id: `workspace-${Date.now()}`,
          name,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Workspace;
      }

      const resp = await axios.post(
        `${apiBase}/api/workspaces`,
        { name },
        {
          headers: {
            Authorization: `Bearer ${googleToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const w = resp.data?.data;
      const mapped: Workspace = {
        id: w.id,
        name: w.name,
        createdAt: w.created_at ? new Date(w.created_at) : new Date(),
        updatedAt: w.updated_at ? new Date(w.updated_at) : new Date(),
      };

      return mapped;
    } catch (error: any) {
      console.error('Failed to create workspace', error);
      return rejectWithValue('Failed to create workspace');
    }
  }
);

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    setCurrentWorkspace: (state, action: PayloadAction<Workspace>) => {
      state.currentWorkspace = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkspaces.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWorkspaces.fulfilled, (state, action) => {
        state.isLoading = false;
        state.workspaces = action.payload;
      })
      .addCase(fetchWorkspaces.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createWorkspace.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createWorkspace.fulfilled, (state, action) => {
        state.isLoading = false;
        state.workspaces.push(action.payload);
      })
      .addCase(createWorkspace.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentWorkspace, clearError } = workspaceSlice.actions;
export default workspaceSlice.reducer;
