import { cn, getInitials } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const avatarVariants = cva(
  "relative inline-flex items-center justify-center rounded-full font-medium text-white overflow-hidden",
  {
    variants: {
      size: {
        xs: "h-6 w-6 text-[10px]",
        sm: "h-8 w-8 text-xs",
        md: "h-10 w-10 text-sm",
        lg: "h-14 w-14 text-base",
        xl: "h-20 w-20 text-xl",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

const AVATAR_COLORS = [
  "bg-primary-500",
  "bg-secondary-500",
  "bg-accent-500",
  "bg-indigo-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-violet-500",
  "bg-orange-500",
];

function getColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

type AvatarProps = VariantProps<typeof avatarVariants> & {
  src?: string | null;
  firstName: string;
  lastName: string;
  className?: string;
};

export function Avatar({ src, firstName, lastName, size, className }: AvatarProps) {
  const initials = getInitials(firstName, lastName);
  const bgColor = getColorFromName(`${firstName}${lastName}`);

  if (src) {
    return (
      <div className={cn(avatarVariants({ size }), className)}>
        <img
          src={src}
          alt={`${firstName} ${lastName}`}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className={cn(avatarVariants({ size }), bgColor, className)}>
      {initials}
    </div>
  );
}
