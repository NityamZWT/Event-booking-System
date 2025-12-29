import { Link, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { ErrorMessage } from '../components/common/ErrorMessage';

const loginSchema = Yup.object({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().required('Password is required'),
});

export const LoginPage = () => {
  const { isAuthenticated } = useSelector((state: any) => state.auth);
  const { login, isLoginLoading, loginError } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/events" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <CardContent>
          <Formik
            initialValues={{ email: '', password: '' }}
            validationSchema={loginSchema}
            onSubmit={(values: any) => login(values)}
          >
            {({ errors, touched }) => (
              <Form className="space-y-4">
                {loginError && <ErrorMessage error={loginError} />}
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Field name="email" type="email" as={Input} />
                  {errors.email && touched.email && (
                    <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Field name="password" type="password" as={Input} />
                  {errors.password && touched.password && (
                    <p className="text-sm text-red-500 mt-1">{errors.password}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoginLoading}>
                  {isLoginLoading ? 'Logging in...' : 'Login'}
                </Button>

                <p className="text-sm text-center text-slate-600">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-slate-900 hover:underline">
                    Register
                  </Link>
                </p>
              </Form>
            )}
          </Formik>
        </CardContent>
      </Card>
    </div>
  );
};
