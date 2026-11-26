"use client";

import * as React from "react";
import { Field as BaseField } from "@base-ui/react/field";
import { cn } from "@/lib/utils";

export type FieldLayout = "stack" | "horizontal";

export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  id?: string;
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  success?: React.ReactNode;
  required?: boolean;
  optional?: boolean;
  layout?: FieldLayout;
  children: React.ReactNode;
  labelClassName?: string;
  descriptionClassName?: string;
  errorClassName?: string;
  successClassName?: string;
}

export interface FieldContextValue {
  controlId: string;
  descriptionId?: string;
  errorId?: string;
  successId?: string;
  describedBy?: string;
  invalid: boolean;
  valid: boolean;
  required?: boolean;
  optional?: boolean;
}

export interface FieldControlProps
  extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
}

export interface FieldLabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  optional?: boolean;
}

export type FieldDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

export type FieldErrorProps = React.HTMLAttributes<HTMLParagraphElement>;

export type FieldSuccessProps = React.HTMLAttributes<HTMLParagraphElement>;

const FieldContext = React.createContext<FieldContextValue | null>(null);

const layoutClasses: Record<FieldLayout, string> = {
  // 8px between label, control and message; fields themselves sit 16px apart.
  stack: "flex flex-col gap-2",
  horizontal:
    "grid items-start gap-x-5 gap-y-2 sm:grid-cols-[minmax(8rem,0.42fr)_minmax(0,1fr)]",
};

const labelTextClass =
  "block text-[13px] font-medium leading-[1.4] tracking-[-0.01em] text-[var(--foreground)]";

const helperTextClass =
  "text-[12px] leading-[1.45] text-[var(--primitive-text-secondary)]";

const errorTextClass =
  "text-[12px] leading-[1.45] font-medium text-[var(--primitive-destructive)] motion-safe:transition-[opacity,transform] motion-safe:duration-[var(--primitive-motion-moderate)] motion-safe:ease-[var(--primitive-ease)] motion-reduce:transition-none";

const successTextClass =
  "text-[12px] leading-[1.45] font-medium text-[var(--primitive-success)]";

function useFieldContext(component: string) {
  const context = React.useContext(FieldContext);
  if (!context) {
    throw new Error(`${component} must be used inside Field.`);
  }
  return context;
}

function FieldLabelMarker({
  required,
  optional,
}: {
  required?: boolean;
  optional?: boolean;
}) {
  if (required) {
    return (
      <span
        aria-hidden="true"
        className="ml-1 font-medium text-[var(--primitive-destructive)]"
      >
        *
      </span>
    );
  }

  if (optional) {
    return (
      <span
        role="note"
        className="ml-2 text-[length:var(--primitive-text-hint)] font-medium text-[var(--primitive-text-secondary)]"
      >
        Optional
      </span>
    );
  }

  return null;
}

export function Field({
  id,
  label,
  description,
  error,
  success,
  required,
  optional,
  layout = "stack",
  children,
  className,
  labelClassName,
  descriptionClassName,
  errorClassName,
  successClassName,
  ...props
}: FieldProps) {
  const reactId = React.useId();
  const controlId = id ?? `wensity-field-${reactId}`;
  const descriptionId = description ? `${controlId}-description` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const successId = success ? `${controlId}-success` : undefined;
  const describedBy =
    [errorId, successId, descriptionId].filter(Boolean).join(" ") || undefined;

  const context = React.useMemo<FieldContextValue>(
    () => ({
      controlId,
      descriptionId,
      errorId,
      successId,
      describedBy,
      invalid: Boolean(error),
      valid: Boolean(success) && !Boolean(error),
      required,
      optional,
    }),
    [
      controlId,
      describedBy,
      descriptionId,
      errorId,
      successId,
      error,
      success,
      required,
      optional,
    ],
  );

  const meta =
    label || description ? (
      <div className={cn("min-w-0", layout === "horizontal" && "pt-1")}>
        {label ? (
          <FieldLabel
            required={required}
            optional={optional}
            className={labelClassName}
          >
            {label}
          </FieldLabel>
        ) : null}
        {description ? (
          <FieldDescription className={cn("mt-0.5", descriptionClassName)}>
            {description}
          </FieldDescription>
        ) : null}
      </div>
    ) : null;

  const footer = error ? (
    <FieldError className={errorClassName}>{error}</FieldError>
  ) : success ? (
    <FieldSuccess className={successClassName}>{success}</FieldSuccess>
  ) : null;

  return (
    <FieldContext.Provider value={context}>
      <BaseField.Root data-wensity-primitive=""
        invalid={Boolean(error)}
        data-slot="field"
        data-layout={layout}
        data-invalid={error ? "" : undefined}
        data-valid={success && !error ? "" : undefined}
        className={cn(layoutClasses[layout], className)}
        {...props}
      >
        {meta}
        <div className="min-w-0">
          {children}
          {footer}
        </div>
      </BaseField.Root>
    </FieldContext.Provider>
  );
}

export function FieldLabel({
  required,
  optional,
  className,
  children,
  ...props
}: FieldLabelProps) {
  const context = useFieldContext("FieldLabel");

  return (
    <BaseField.Label
      className={cn(labelTextClass, className)}
      {...props}
    >
      {children}
      <FieldLabelMarker
        required={required ?? context.required}
        optional={optional ?? context.optional}
      />
    </BaseField.Label>
  );
}

export function FieldDescription({
  className,
  ...props
}: FieldDescriptionProps) {
  const context = useFieldContext("FieldDescription");

  return (
    <BaseField.Description
      id={context.descriptionId}
      className={cn(helperTextClass, className)}
      {...props}
    />
  );
}

export function FieldError({ className, ...props }: FieldErrorProps) {
  const context = useFieldContext("FieldError");

  return (
    <BaseField.Error
      id={context.errorId}
      match
      role="alert"
      className={cn(errorTextClass, className)}
      {...props}
    />
  );
}

export function FieldSuccess({ className, ...props }: FieldSuccessProps) {
  const context = useFieldContext("FieldSuccess");

  return (
    <p
      id={context.successId}
      role="status"
      className={cn(successTextClass, className)}
      {...props}
    />
  );
}

export function FieldControl({
  asChild = false,
  className,
  children,
  ...props
}: FieldControlProps) {
  const context = useFieldContext("FieldControl");

  const mergeDescribedBy = (base?: string | null) =>
    [base, context.successId].filter(Boolean).join(" ") || undefined;

  if (asChild && React.isValidElement(children)) {
    // Pass the child element as `render` so Base UI runs mergeProps(controlProps, child.props):
    // child props win and event handlers compose (Radix Slot semantics).
    return (
      <BaseField.Control
        id={context.controlId}
        className={className}
        aria-describedby={mergeDescribedBy(context.describedBy)}
        aria-invalid={context.invalid || undefined}
        aria-required={context.required || undefined}
        render={children}
        {...props}
      />
    );
  }

  return (
    <BaseField.Control
      id={context.controlId}
      render={(controlProps) => (
        <div
          {...controlProps}
          aria-describedby={mergeDescribedBy(
            (controlProps["aria-describedby"] as string | undefined) ??
              context.describedBy,
          )}
          aria-invalid={context.invalid || undefined}
          aria-required={context.required || undefined}
          className={cn(controlProps.className as string | undefined, className)}
          {...props}
        >
          {children}
        </div>
      )}
    />
  );
}
