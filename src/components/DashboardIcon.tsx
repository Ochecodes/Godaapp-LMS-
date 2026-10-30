"use client";

import { addCollection, Icon, type IconProps } from "@iconify/react";
import lucideIcons from "@iconify-json/lucide/icons.json";
import simpleIcons from "@iconify-json/simple-icons/icons.json";

addCollection(lucideIcons);
addCollection(simpleIcons);

export function DashboardIcon(props: IconProps) {
  return <Icon {...props} />;
}
