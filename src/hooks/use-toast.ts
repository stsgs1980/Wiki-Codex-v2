"use client"

// Inspired by react-hot toast library
import * as React from "react"

import type { State } from "./use-toast-types"
import {
  dispatch,
  getMemoryState,
  subscribe,
  toast,
} from "./use-toast-store"

function useToast() {
  const [state, setState] = React.useState<State>(getMemoryState())

  React.useEffect(() => {
    return subscribe(setState)
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
export { reducer } from "./use-toast-store"
