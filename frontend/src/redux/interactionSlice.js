import { createSlice } from "@reduxjs/toolkit";

const interactionSlice = createSlice({
  name: "interaction",

  initialState: {
    aiResponse: null,
  },

  reducers: {
    setAIResponse: (state, action) => {
      state.aiResponse = action.payload;
    },
  },
});

export const { setAIResponse } = interactionSlice.actions;

export default interactionSlice.reducer;