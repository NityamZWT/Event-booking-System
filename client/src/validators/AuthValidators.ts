import { UserRole } from "@/types";
import * as Yup from "yup";

export const registerSchema = Yup.object({
  first_name: Yup
    .string()
    .trim()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters')
    .matches(/^[a-zA-Z\s]+$/, 'First name must only contain letters')
    .required('First name is required'),
  last_name:  Yup
    .string()
    .trim()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name cannot exceed 50 characters')
    .matches(/^[a-zA-Z\s]+$/, 'Last name must only contain letters')
    .required('Last name is required'),
  email: Yup
    .string()
    .trim()
    .email('Invalid email format')
    .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid email format')
    .lowercase()
    .required('Email is required'),
  password: Yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(50, 'Password cannot exceed 50 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    )
    .required('Password is required'),
  role: Yup.mixed()
    .oneOf(Object.values(UserRole), 'Role must be ADMIN, EVENT_MANAGER, or CUSTOMER')
    .default(UserRole.CUSTOMER),
});

export const loginSchema = Yup.object({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string().required("Password is required"),
  role: Yup.string()
    .oneOf(Object.values(UserRole))
    .default(UserRole.CUSTOMER),
});
