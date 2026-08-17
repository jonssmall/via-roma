export type NavItem = {
  label: string;
  url: string;
};

const navigation: NavItem[] = [
  { label: "Home", url: "/" },
  { label: "Menu", url: "/menu/" },
  { label: "About", url: "/about/" },
  { label: "Reservations", url: "/reservations/" },
  { label: "Order Online", url: "/order/" },
  { label: "Contact", url: "/contact/" },
];

export default navigation;
