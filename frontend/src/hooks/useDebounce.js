// Returns a debounced copy of `value` that only updates after `delay` ms of no
// changes. Used so typing in the search box fires ONE API request when the user
// pauses, instead of one request per keystroke.
import { useEffect, useState } from "react";

export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    // Clear the pending timer if `value` changes again before it fires.
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
