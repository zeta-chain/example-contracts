import { useCallback, useState } from 'react';

export const useRerender = () => {
  const [, setState] = useState(0);

  return useCallback(() => setState((state) => state + 1), []);
};
