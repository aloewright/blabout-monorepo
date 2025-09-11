import { configureStore } from '@reduxjs/toolkit';
import workspaceReducer from './workspaceSlice';

export const store = configureStore({
  reducer: {
    workspace: workspaceReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
