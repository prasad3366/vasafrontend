import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { Controller, ControllerProps, FieldPath, FieldValues, FormProvider, useFormContext } from "react-hook-form";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

const Form = FormProvider;

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>({} as FormFieldContextValue);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  // Ensure Controller always has a stable defaultValue to avoid uncontrolled -> controlled
  // warnings when react-hook-form initializes fields asynchronously. We also wrap the
  // caller's `render` so we can guarantee the `field.value` passed to UI inputs is
  // always defined (falls back to defaultValue or empty string).
  const controllerProps: any = { ...props };
  // Prefer any default value provided by the form context for this field so we don't
  // overwrite array/object defaults (e.g. `size: []`). If none exists, fall back to
  // an empty string which is safe for most primitive inputs.
  let formDefaultValue: any = undefined;
  try {
    const ctx = useFormContext();
    formDefaultValue = ctx.getValues(props.name as any);
  } catch (e) {
    // if not inside a FormProvider yet, ignore
    formDefaultValue = undefined;
  }

  if (controllerProps.defaultValue === undefined) {
    if (formDefaultValue !== undefined) {
      controllerProps.defaultValue = formDefaultValue;
    } else {
      // Do not coerce to an empty string here. If no default value is provided
      // by the form context, allow Controller to rely on `useForm`'s
      // `defaultValues`. Forcing an empty string can convert expected array
      // defaults (e.g. `size: []`) into strings and break multi-value fields.
      // Leave `defaultValue` undefined.
    }
  }

  // If the caller provided a render function, wrap it to normalize field.value.
  if (typeof props.render === "function") {
    const userRender = props.render as any;
    controllerProps.render = (renderProps: any) => {
      const field = { ...renderProps.field };
      // Only normalize field.value when the controller has an explicit
      // defaultValue. This prevents coercing array/object defaults (like
      // `size: []`) into empty strings while still avoiding uncontrolled ->
      // controlled warnings for primitive inputs that expect string values.
      if (field.value === undefined && controllerProps.defaultValue !== undefined) {
        field.value = controllerProps.defaultValue;
      }
      return userRender({ ...renderProps, field });
    };
  }

  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...controllerProps} />
    </FormFieldContext.Provider>
  );
};

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue);

const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const id = React.useId();

    return (
      <FormItemContext.Provider value={{ id }}>
        <div ref={ref} className={cn("space-y-2", className)} {...props} />
      </FormItemContext.Provider>
    );
  },
);
FormItem.displayName = "FormItem";

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField();

  // Only set htmlFor when the element with id=formItemId is a real form control
  // (input/select/textarea). For composite controls (like a group of checkboxes)
  // the label shouldn't point to the container id.
  const [hasControl, setHasControl] = React.useState(false);
  React.useEffect(() => {
    try {
      const el = document.getElementById(String(formItemId));
      if (!el) return setHasControl(false);
      const tag = (el.tagName || "").toUpperCase();
      setHasControl(tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA");
    } catch (e) {
      setHasControl(false);
    }
  }, [formItemId]);

  return <Label ref={ref} className={cn(error && "text-destructive", className)} htmlFor={hasControl ? formItemId : undefined} {...props} />;
});
FormLabel.displayName = "FormLabel";

const FormControl = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(({ children, className, ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

  const ariaProps: any = {
    id: formItemId,
    'aria-describedby': !error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`,
    'aria-invalid': !!error,
  };

  // Render a plain wrapper element that applies accessibility attributes.
  // This is simpler and avoids Radix Slot cloning behavior which can throw
  // `React.Children.only` when children are fragments or arrays.
  return (
    <div ref={ref as any} className={className} {...ariaProps} {...props}>
      {children}
    </div>
  );
});
FormControl.displayName = "FormControl";

const FormDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    const { formDescriptionId } = useFormField();

    return <p ref={ref} id={formDescriptionId} className={cn("text-sm text-muted-foreground", className)} {...props} />;
  },
);
FormDescription.displayName = "FormDescription";

const FormMessage = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    const { error, formMessageId } = useFormField();
    const body = error ? String(error?.message) : children;

    if (!body) {
      return null;
    }

    return (
      <p ref={ref} id={formMessageId} className={cn("text-sm font-medium text-destructive", className)} {...props}>
        {body}
      </p>
    );
  },
);
FormMessage.displayName = "FormMessage";

export { useFormField, Form, FormItem, FormLabel, FormControl, FormDescription, FormMessage, FormField };
