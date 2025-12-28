const { User } = require("../models");
const bcrypt = require('bcrypt')
const {
  CreateResponse,
  ResponseHandler,
  UnAuthorizedResponse,
  SuccessResponse,
} = require("../utils/responseHandler");
const { generateToken } = require("../utils/tokenGenerator");
const { registrationSchema, loginSchema } = require("../validators/authSchema");

const userRegister = async (req, res, next) => {
  try {
    await registrationSchema.validate(req.body, { abortEarly: false });
    const { email } = req.body;
    const emailCheck = await User.findOne({ where: { email } });

    //check if email alrady exist or not in database
    if (emailCheck)
      return new ResponseHandler(
        400,
        "User with this email already exists!",
        false
      ).send(res);

    const response = await User.create(req.body);
    new CreateResponse("User registered Successfully!", response).send(res);
  } catch (error) {
    console.log("error occur in register user");
    next(error);
  }
};

const userLogin = async (req, res, next) => {
  try {
    await loginSchema.validate(req.body, { abortEarly: false });

    const { email, password, role } = req.body;

    const userLogin = await User.findOne({ where: { email }});

    if (!userLogin) {
      return new UnAuthorizedResponse(
        "Your email not found. Please register first"
      ).send(res);
    }

    // Verify password first
    const isPasswordValid = bcrypt.compareSync(password, userLogin.password);

    if (!isPasswordValid) {
      return new UnAuthorizedResponse(
        "Password is incorrect! Please provide correct password to login"
      ).send(res);
    }

    // Update role if different
    if (role && role !== userLogin.role) {
      userLogin.role = role;
      await userLogin.save(); // persist change
    }

    const token = generateToken(
      userLogin.id,
      userLogin.role, // use updated role
      userLogin.first_name
    );

    return new SuccessResponse(
      `${userLogin.first_name} is successfully login as ${userLogin.role}`,
      { userLogin, token }
    ).send(res);

  } catch (error) {
    next(error);
  }
};


module.exports = {
  userRegister,
  userLogin,
};
