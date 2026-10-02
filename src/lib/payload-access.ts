interface PayloadRoleUser {
  role?: unknown;
  isActive?: unknown;
}

function isPayloadRoleUser(user: unknown): user is PayloadRoleUser {
  return typeof user === "object" && user !== null;
}

export function isActivePayloadAdmin(user: unknown): boolean {
  return isPayloadRoleUser(user) && user.isActive === true && user.role === "admin";
}

export function isActiveCourseEditor(user: unknown): boolean {
  return (
    isPayloadRoleUser(user) &&
    user.isActive === true &&
    (user.role === "admin" || user.role === "instructor")
  );
}