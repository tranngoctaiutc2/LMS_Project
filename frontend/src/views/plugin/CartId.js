import { userId } from "../../utils/constants";

function CartId() {
  const id = userId();
  
  if (id) {
    return `cart_${id}`;
  }
  
  const existingRandomString = localStorage.getItem("guestCartId");
  
  if (existingRandomString) {
    return existingRandomString.startsWith('cart_') 
      ? existingRandomString 
      : `cart_${existingRandomString}`;
  }
  
  const generateGuestCartId = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `guest_${timestamp}${random}`;
  };
  
  const newCartId = `cart_${generateGuestCartId()}`;
  localStorage.setItem("guestCartId", newCartId);
  return newCartId;
}

export default CartId;