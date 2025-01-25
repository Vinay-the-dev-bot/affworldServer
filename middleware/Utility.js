const nodemailer = require("nodemailer");

const currentTime = () => {
  const time = new Date();
  const date = time.getDate();
  const monthName = time.toLocaleString("default", { month: "short" });
  const year = time.getFullYear();
  let hours = time.getHours();
  const minutes = time.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  return `${date} ${monthName} ${year}, ${hours}:${formattedMinutes} ${ampm}`;
};
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const sendOTP = async (email, otp) => {
  console.log(process.env.myEmail, process.env.myPassword);
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.myEmail,
        pass: process.env.myPassword
      }
    });

    const mailOptions = {
      from: "your_email@gmail.com",
      to: email,
      subject: "Password Reset OTP",
      text: `Your OTP for resetting the password is ${otp}. It will expire in 5 minutes.`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("OTP email sent: " + info.response);
    return true;
  } catch (error) {
    console.error("Error sending OTP:", error);
    return false;
  }
};

module.exports = { currentTime, sendOTP, generateOTP };
