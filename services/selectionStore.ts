// Synchronous store for passing selections back from sub-screens
// before React state propagation completes
export const selectionStore: {
  pendingSoundId: number | null;
  pendingTheme: string | null;
} = {
  pendingSoundId: null,
  pendingTheme: null,
};
