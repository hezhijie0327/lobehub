export function preserveSupportedParams<
  TParams extends Record<string, unknown>,
  TSchema extends Record<string, unknown>,
  TKey extends keyof TParams & string,
>(
  previousParameters: TParams,
  nextDefaultValues: TParams,
  nextSchema: TSchema,
  keys: readonly TKey[],
): TParams {
  const supportedPreservedEntries = keys.flatMap((key) => {
    if (!(key in nextSchema)) return [];

    const value = previousParameters[key];
    if (typeof value === 'undefined') return [];

    return [[key, value] as const];
  });

  return {
    ...nextDefaultValues,
    ...Object.fromEntries(supportedPreservedEntries),
  };
}
