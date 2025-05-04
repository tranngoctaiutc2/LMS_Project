import { userId } from "../../utils/constants";

function CartId() {
  const id = userId();

  if (id) {
    return `cart_${id}`;
  }

  const existingRandomString = localStorage.getItem("randomString");

  if (existingRandomString) {
    return existingRandomString;
  }

  const generateRandomString = () => {
    const length = 6;
    const characters = "1234567890";
    let randomString = "";

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      randomString += characters.charAt(randomIndex);
    }

    localStorage.setItem("randomString", randomString);
    return randomString;
  };

  return generateRandomString();
}

export default CartId;
