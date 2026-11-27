import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";

type PasswordInputProps = Omit<ComponentProps<"input">, "type">;

export function PasswordInput({ className = "", ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <span className="relative block">
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={`${className} pr-12`.trim()}
      />
      <button
        type="button"
        className="absolute top-0 right-0 flex min-h-11 min-w-11 items-center justify-center text-muted"
        aria-label={visible ? "Hide password" : "Show password"}
        onClick={() => setVisible((open) => !open)}
      >
        {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </span>
  );
}
