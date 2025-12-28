const yup = require('yup');
const { UserRole } = require('../types/common.types');

const registerSchema = yup.object({
  first_name: yup
    .string()
    .trim()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters')
    .matches(/^[a-zA-Z\s]+$/, 'First name must only contain letters')
    .required('First name is required'),
  last_name: yup
    .string()
    .trim()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name cannot exceed 50 characters')
    .matches(/^[a-zA-Z\s]+$/, 'Last name must only contain letters')
    .required('Last name is required'),
  email: yup
    .string()
    .trim()
    .email('Invalid email format')
    .lowercase()
    .required('Email is required'),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(50, 'Password cannot exceed 50 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    )
    .required('Password is required'),
  role: yup
    .mixed()
    .oneOf(Object.values(UserRole), 'Role must be ADMIN, EVENT_MANAGER, or CUSTOMER')
    .default(UserRole.CUSTOMER)
});

const loginSchema = yup.object({
  email: yup
    .string()
    .trim()
    .email('Invalid email format')
    .lowercase()
    .required('Email is required'),
  password: yup.string().required('Password is required')
});

module.exports = {
  registerSchema,
  loginSchema
};