export const useGraphicContext = (target: {
  push: () => void;
  pop: () => void;
}) => {
  target.push();
  return {
    [Symbol.dispose]() {
      target.pop();
    },
  };
};
