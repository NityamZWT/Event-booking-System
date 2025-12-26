const yup = require("yup");

const registrationSchema = yup.object({
  first_name: yup
    .string()
    .trim()
    .min(2, "First name must be at least 2 characters long")
    .max(50, "First name cannot exceed 50 characters")
    .matches(/^[a-zA-Z]+$/, "Name must only contain alphabets")
    .typeError("must be string")
    .required("First name is required"),

  last_name: yup
    .string("Last name must be string")
    .trim()
    .min(2, "Last name must be at least 2 characters long")
    .max(50, "Last name cannot exceed 50 characters")
    .matches(/^[a-zA-Z]+$/, "Name must only contain alphabets")
    .typeError("must be string")
    .required("Last name is required"),

  email: yup
    .string()
    .trim()
    .email("Invalid email format")
    .required("Email is required"),

  password: yup
    .string()
    .trim()
    .min(4, "Password must be at least 4 characters long")
    .max(50, "Password cannot exceed 50 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, one special character and min 8 character long"
    )
    .required("Password is required"),

  role: yup
    .string()
    .oneOf(
      ["admin", "event_manager", "customer"],
      "Role must be either admin, event manager or customer"
    )
    .default("customer")
    .transform((value) => (value ? value.toLowerCase() : value))
    .required("Role is required"),
});

const loginSchema = yup.object({
  email: yup
    .string()
    .trim()
    .email("Invalid email format")
    .required("Email is required"),

  password: yup
    .string()
    .trim()
    .min(4, "Password must be at least 4 characters long")
    .max(50, "Password cannot exceed 50 characters")
    .required("Password is required"),

  role: yup
    .string()
    .oneOf(
      ["admin", "event_manager", "customer"],
      "Role must be either admin, event manager or customer"
    )
    .default("customer")
    .transform((value) => (value ? value.toLowerCase() : value))
    .required("Role is required"),
});

module.exports = { registrationSchema, loginSchema };
