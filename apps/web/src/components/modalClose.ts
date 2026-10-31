import { createContext, useContext } from 'react';

/** Closes the modal it sits in, with its closing animation. */
export const CloseContext = createContext<() => void>(() => undefined);

/** Closes the modal it is called in, with its closing animation. */
export function useModalClose() {
  return useContext(CloseContext);
}
