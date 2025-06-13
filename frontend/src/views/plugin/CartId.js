import { userId } from "../../utils/constants";

function CartId() {
  const id = userId();
  
  if (id) {
    return `cart_${id}`;
  }
  return null;
}

export default CartId;