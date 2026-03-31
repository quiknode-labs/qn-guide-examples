export function substituteParams(
  sql: string,
  params: Record<string, string>
): string {
  return sql.replace(/\{\{(\w+)\}\}/g, (_, name: string) => {
    const value = params[name];
    if (value === undefined) return `{{${name}}}`;
    return value;
  });
}
