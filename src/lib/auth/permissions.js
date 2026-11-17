export function canAccess(user, menuSlug, action = "view") {
  if (!user) return false;

  // Super Admin
  if (user.role === "admin") {
    return true;
  }

  const permissions = user.accessRole?.permissions || [];

  return permissions.some((permission) => {
    const menuSlugFromPermission =
      typeof permission.menu === "object" ? permission.menu.slug : null;

    return (
      menuSlugFromPermission === menuSlug && permission.actions.includes(action)
    );
  });
}
