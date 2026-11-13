import { createContext, useContext } from "react";

// ReaderLayout ki top search bar ki (debounced) value yahan se har page ko milti hai.
export const SearchContext = createContext<string>("");

// Kisi bhi page ma: const search = useLayoutSearch();
export const useLayoutSearch = (): string => useContext(SearchContext);