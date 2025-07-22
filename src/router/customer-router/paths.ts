
const Paths = {
  Customer: {
    Signup: "/sign-up",
    list: '/customers',
    customerById: '/customer/:id',
    login: "/log-in",
    forgotPassword: "/forgot-password",
    verify: "/verify-otp",
    auth:{
      login:"/quickbooks/login",
      callback : "/quickbooks/callback",
    }
  },
 
};

export default Paths;
