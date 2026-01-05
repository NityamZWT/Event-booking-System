import React from "react";
import { Formik, Form, Field, FieldProps } from "formik";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserRole } from "@/types";
import * as Yup from "yup";

interface AuthFormValues {
  first_name?: string;
  last_name?: string;
  email: string;
  password: string;
  role?: UserRole;
}

interface AuthFormProps {
  mode: "login" | "register";
  initialValues: AuthFormValues;
  validationSchema: Yup.AnyObjectSchema;
  onSubmit: (values: AuthFormValues) => void;
  submitLabel?: string;
  isLoading?: boolean;
  hideRole?: boolean;
}

// Custom Select Field component for Formik
const CustomSelectField = ({
  field,
  form,
  children,
  ...props
}: FieldProps & { children: React.ReactNode }) => {
  const handleChange = (value: string) => {
    form.setFieldValue(field.name, value);
  };

  return (
    <Select
      value={field.value || ""}
      onValueChange={handleChange}
      {...props}
    >
      {children}
    </Select>
  );
};

export const AuthForm: React.FC<AuthFormProps> = ({
  mode,
  initialValues,
  validationSchema,
  onSubmit,
  submitLabel,
  isLoading,
  hideRole = false,
}) => {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {({ errors, touched, values }) => (
        <Form className="space-y-4">
          {mode === "register" && (
            <>
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Field name="first_name" as={Input} />
                {errors.first_name && touched.first_name && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.first_name as string}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Field name="last_name" as={Input} />
                {errors.last_name && touched.last_name && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.last_name as string}
                  </p>
                )}
              </div>
            </>
          )}

          <div>
            <Label htmlFor="email">Email</Label>
            <Field name="email" type="email" as={Input} />
            {errors.email && touched.email && (
              <p className="text-sm text-destructive mt-1">{errors.email as string}</p>
            )}
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Field name="password" type="password" as={Input} />
            {errors.password && touched.password && (
              <p className="text-sm text-destructive mt-1">{errors.password as string}</p>
            )}
          </div>

          {mode === "register" && !hideRole && (
            <div>
              <Label htmlFor="role">Role</Label>
              <Field name="role" component={CustomSelectField}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRole.CUSTOMER}>Customer</SelectItem>
                  <SelectItem value={UserRole.EVENT_MANAGER}>Event Manager</SelectItem>
                  <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                </SelectContent>
              </Field>
              {errors.role && touched.role && (
                <p className="text-sm text-destructive mt-1">{errors.role as string}</p>
              )}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading
              ? submitLabel ||
                (mode === "login" ? "Logging in..." : "Submitting...")
              : submitLabel || (mode === "login" ? "Login" : "Register")}
          </Button>
        </Form>
      )}
    </Formik>
  );
};

export default AuthForm;