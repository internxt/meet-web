import { WarningCircleIcon } from "@phosphor-icons/react";
import React from "react";

interface KickoutDuplicateProps {
    title: string
    message: string;
}

export const KickoutDuplicate: React.FC<KickoutDuplicateProps> = ({ message, title }) => (
  <div className="flex flex-col gap-1 pt-1">
    <div className="flex flex-row items-center">
      <WarningCircleIcon weight="fill" className="mr-1 h-4 text-red" />
      <span className="font-semibold text-sm text-red">{title}</span>
    </div>
    <span className="font-base w-full text-sm text-red">{message}</span>
  </div>
);
