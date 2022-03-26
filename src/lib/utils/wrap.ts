export function wrap(min: number, max: number, target: number) {
  if (target > max) {
    return max;
  }
  if (target < min) {
    return min;
  }
  return target;
}
