import menu, { type MenuItem } from "./menu.ts";

const featuredMenu: MenuItem[] = menu.flatMap((category) =>
  category.items.filter((item) => item.featured),
);

export default featuredMenu;
