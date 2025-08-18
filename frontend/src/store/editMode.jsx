// frontend/src/store/editMode.js
import React, { createContext, useContext, useState } from "react";

const Ctx = createContext(null);

export function EditModeProvider({ children }) {
  const [editMode, setEditMode] = useState(false);
  return (
    <Ctx.Provider value={{ editMode, setEditMode }}>
      {children}
    </Ctx.Provider>
  );
}

export function useEditMode() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useEditMode must be used inside EditModeProvider");
  return ctx;
}
