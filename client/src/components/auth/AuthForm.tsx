import React from "react";
import { Formik, Form, Field } from "formik";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
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
      {({ errors, touched }) => (
        <Form className="space-y-4">
          {mode === "register" && (
            <>
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Field name="first_name" as={Input} />
                {errors.first_name && touched.first_name && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.first_name}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Field name="last_name" as={Input} />
                {errors.last_name && touched.last_name && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.last_name}
                  </p>
                )}
              </div>
            </>
          )}

          <div>
            <Label htmlFor="email">Email</Label>
            <Field name="email" type="email" as={Input} />
            {errors.email && touched.email && (
              <p className="text-sm text-destructive mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Field name="password" type="password" as={Input} />
            {errors.password && touched.password && (
              <p className="text-sm text-destructive mt-1">{errors.password}</p>
            )}
          </div>

          {!hideRole && (
            <div>
              <Label htmlFor="role">Role</Label>
              <Field name="role" as={Select}>
                <option value={UserRole.CUSTOMER}>Customer</option>
                <option value={UserRole.EVENT_MANAGER}>Event Manager</option>
                <option value={UserRole.ADMIN}>Admin</option>
              </Field>
              {errors.role && touched.role && (
                <p className="text-sm text-destructive mt-1">{errors.role}</p>
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
