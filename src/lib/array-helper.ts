function arrayEqual<T>(a: readonly T[], b: readonly T[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  for (const [i, element] of a.entries()) {
    if (element !== b[i]) {
      return false;
    }
  }

  return true;
}

function arrayDeepEqual<T>(a: readonly T[], b: readonly T[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  for (const [i, element] of a.entries()) {
    if (!deepEqual(element, b[i])) {
      return false;
    }
  }

  return true;
}

function deepEqual<T>(a: T, b: T): boolean {
  if (a === b) {
    return true;
  }
  if (a == null || b == null) {
    return false;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    return arrayDeepEqual(a, b);
  }

  if (typeof a === 'object' && typeof b === 'object') {
    return objectDeepEqual(a as Record<string, unknown>, b as Record<string, unknown>);
  }

  return false;
}

function objectDeepEqual(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) {
    return false;
  }

  for (const key of keysA) {
    const hasKeyInB = Object.prototype.hasOwnProperty.call(b, key);
    if (!hasKeyInB) {
      return false;
    }

    const valueA = Object.prototype.hasOwnProperty.call(a, key) ? a[key] : undefined;
    const valueB = Object.prototype.hasOwnProperty.call(b, key) ? b[key] : undefined;

    if (!deepEqual(valueA, valueB)) {
      return false;
    }
  }

  return true;
}

export { arrayDeepEqual, arrayEqual, deepEqual };
