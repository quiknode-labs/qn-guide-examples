import Image from "next/image";

export interface ChipProps {
  icon?: string;
  text: string;
}

export function Chip({ icon, text }: ChipProps) {
  return (
    <div className="inline-flex items-center text-[14px] text-[#7FFBAB] border border-green-800 rounded-[10px] px-2 py-1 mt-4 mb-2 bg-opacity-10 bg-green-500">
      {icon && (
        <div className="relative mr-2 w-5 h-5">
          <Image src={`/${icon}.svg`} alt={`${icon} icon`} fill />
        </div>
      )}
      <p>{text}</p>
    </div>
  );
}
