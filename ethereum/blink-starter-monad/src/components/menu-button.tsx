import Image from "next/image";
import Link from "next/link";

interface MenuButtonProps {
  logoName: string;
  text: string;
  href: string;
}

export function MenuButton({ logoName, text, href }: MenuButtonProps) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center justify-center pr-2 py-2 rounded-md shadow-md hover:text-[#999999] transition-colors duration-200"
    >
      <Image
        src={`/${logoName}.svg`}
        alt={logoName}
        width={20}
        height={20}
        className="mr-2 transition-filter duration-200 group-hover:brightness-50"
      />
      <span>{text}</span>
    </Link>
  );
}
