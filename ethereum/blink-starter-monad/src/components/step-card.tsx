import { Chip } from "@/components/chip";
import { ChipProps } from "@/components/chip";

interface StepCardProps {
  chip: ChipProps;
  headline: string;
  text: string;
}

export function StepCard({ chip, headline, text }: StepCardProps) {
  return (
    <div className="py-4">
      <Chip icon={chip.icon} text={chip.text} />
      <h2 className="text-[16px] font-bold text-white">{headline}</h2>
      <p className="text-[#999999] whitespace-pre-wrap">
        {text.split(/(`[^`]+`)/g).map((part, index) =>
          part.startsWith("`") ? (
            <code
              key={index}
              className="bg-[#FFFFFF1A] text-[#919695] px-1 py-0.5 rounded text-[14px]"
            >
              {part.slice(1, -1)}
            </code>
          ) : (
            part
          )
        )}
      </p>
    </div>
  );
}
