import { cn } from "@/lib/utils";

const control =
  "w-full rounded-sm border border-foreground/20 bg-card px-3 py-2 text-sm placeholder:text-muted-foreground/70 transition-colors hover:border-foreground/40 focus:border-foreground disabled:opacity-50 aria-[invalid=true]:border-destructive file:mr-3 file:h-full file:cursor-pointer file:border-0 file:border-r file:border-foreground/20 file:bg-muted file:px-3 file:text-[13px] file:font-medium";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, "h-10 [&[type=file]]:p-0 [&[type=file]]:leading-[2.4]", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, "min-h-24 leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(control, "h-10", className)} {...props}>
      {children}
    </select>
  );
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block text-[13px] font-medium", className)} {...props} />;
}

/** Label + control + error message, wired for accessibility. */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      {error ? (
        <p role="alert" className="mt-1 text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
