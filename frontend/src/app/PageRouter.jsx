import { ResourcePage } from "../components/resource/ResourcePage.jsx";
import { moduleRegistry } from "../modules/registry.js";

// Renders the module registered for `page`; unknown keys fall back to a generic resource page.
// navigate(pageKey) / canOpen(pageKey) let a page link to other pages (e.g. dashboard cards).
export function PageRouter({ page, user, navigate, canOpen }) {
  const module = moduleRegistry[page];
  if (module?.Page) return <module.Page key={page} user={user} navigate={navigate} canOpen={canOpen} />;
  return <ResourcePage key={page} config={module?.config || { resource: page }} user={user} />;
}
