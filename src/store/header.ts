import { create } from "zustand";

/**
 * Whether the site header is currently slid away (it hides while the visitor
 * reads downward and returns on any upward scroll — see Header.tsx). Shared so
 * anything sticky under it (the Boutique's filter bar) can take the header's
 * place instead of leaving a gap where the header used to be.
 */
export const useHeaderStore = create<{ hidden: boolean }>()(() => ({ hidden: false }));
