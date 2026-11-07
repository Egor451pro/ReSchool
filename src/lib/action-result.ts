export type ActionOk<T extends Record<string, unknown> = Record<string, never>> = {
  ok: true;
} & T;

export type ActionFail = {
  ok: false;
  error: string;
  fieldErrors?: Record<string, string>;
};

export type ActionResult<T extends Record<string, unknown> = Record<string, never>> =
  | ActionOk<T>
  | ActionFail;

export function actionOk<T extends Record<string, unknown> = Record<string, never>>(
  extra?: T,
): ActionOk<T> {
  return { ok: true, ...(extra ?? ({} as T)) };
}

export function actionFail(
  error: string,
  fieldErrors?: Record<string, string>,
): ActionFail {
  return fieldErrors ? { ok: false, error, fieldErrors } : { ok: false, error };
}

export function zodFieldErrors(error: {
  issues: { path: PropertyKey[]; message: string }[];
}): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !fields[key]) fields[key] = issue.message;
  }
  return fields;
}
