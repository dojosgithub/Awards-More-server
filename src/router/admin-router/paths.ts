import { profile } from "console";

const Paths = {
  Auth: {
    Signup: "/sign-up",
    login: "/log-in",
    forgotPassword: "/forgot-password",
    verify: "/verify-otp",
    auth:{
      login:"/quickbooks/login",
      callback : "/quickbooks/callback",
    }
  },
  employee: {
    addEmployee: "/add-employee",
    list : '/employees',
    employeeById : '/employee/:id',
    edit : '/employee/:id',
    delete : '/employee/:id',
    profile: "/profile",
  },
};

export default Paths;
