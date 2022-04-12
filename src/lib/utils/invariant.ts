export function invariant(value: any, message: any) {
  if (!value) {
    throw new Error(message);
  }

  return value;
}
