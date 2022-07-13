const httpStatus = require("http-status");
const { Cart, Product, User } = require("../models");
const ApiError = require("../utils/ApiError");
const config = require("../config/config");

// TODO: CRIO_TASK_MODULE_CART - Implement the Cart service methods

/**
 * Fetches cart for a user
 * - Fetch user's cart from Mongo
 * - If cart doesn't exist, throw ApiError
 * --- status code  - 404 NOT FOUND
 * --- message - "User does not have a cart"
 *
 * @param {User} user
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const getCartByUser = async (user) => {
  const cart = await Cart.findOne({ email: user.email });
  if (!cart) {
    throw new ApiError(httpStatus.NOT_FOUND, "User does not have a cart");
  }
  return cart;
};

/**
 * Adds a new product to cart
 * - Get user's cart object using "Cart" model's findOne() method
 * --- If it doesn't exist, create one
 * --- If cart creation fails, throw ApiError with "500 Internal Server Error" status code
 *
 * - If product to add already in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product already in cart. Use the cart sidebar to update or remove product from cart"
 *
 * - If product to add not in "products" collection in MongoDB, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product doesn't exist in database"
 *
 * - Otherwise, add product to user's cart
 *
 *
 *
 * @param {User} user
 * @param {string} productId
 * @param {number} quantity
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const addProductToCart = async (user, productId, quantity) => {
  //find the user's cart
  let cart = await Cart.findOne({ email: user.email });
  if (!cart) {
    try {
      //if cart is not present create new cart
      cart = await Cart.create({
        email: user.email,
        cartItems: [],
        paymentOption: config.default_payment_option,
      });
    } catch (error) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed");
    }
  }

  //Check cart is present 
  if (cart == null) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed");
  }

  //To check product is already present in cart or not
  if (cart.cartItems.some((item) => item.product._id == productId)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Product already in cart, use the sidebar to remove or add product"
    );
  }

  //To find the product from product model
  const product = await Product.findOne({ _id: productId });
  if (!product) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Product does not exist in database"
    );
  }

  cart.cartItems.push({ product, quantity });
  await cart.save();

  return cart;
};

/**
 * Updates the quantity of an already existing product in cart
 * - Get user's cart object using "Cart" model's findOne() method
 * - If cart doesn't exist, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "User does not have a cart. Use POST to create cart and add a product"
 *
 * - If product to add not in "products" collection in MongoDB, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product doesn't exist in database"
 *
 * - If product to update not in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product not in cart"
 *
 * - Otherwise, update the product's quantity in user's cart to the new quantity provided and return the cart object
 *
 *
 * @param {User} user
 * @param {string} productId
 * @param {number} quantity
 * @returns {Promise<Cart>
 * @throws {ApiError}
 */
const updateProductInCart = async (user, productId, quantity) => {
  const cart = await Cart.findOne({ email: user.email });
  if (!cart)
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "User does not have a cart. Use POST to create cart and add a product"
    );

  const product = await Product.findOne({ _id: productId });
  if (!product)
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Product doesn't exist in database"
    );

  const productIndex = cart.cartItems.findIndex(
    (item) => item.product._id == productId
  );

  if (productIndex === -1)
    throw new ApiError(httpStatus.BAD_REQUEST, "Product not in cart");

  cart.cartItems[productIndex].quantity = quantity;
  await cart.save();
  return cart;
};

/**
 * Deletes an already existing product in cart
 * - If cart doesn't exist for user, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "User does not have a cart"
 *
 * - If product to update not in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product not in cart"
 *
 * Otherwise, remove the product from user's cart
 *
 *
 * @param {User} user
 * @param {string} productId
 * @throws {ApiError}
 */
const deleteProductFromCart = async (user, productId) => {
  const cart = await Cart.findOne({ email: user.email });
  if (!cart) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User does not have a cart");
  }

  //to get the index of product from cart
  const productIndex = cart.cartItems.findIndex(item => item.product._id == productId);

  if (productIndex === -1) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Product not in cart");
  }

  //delete the item from cartItems
  cart.cartItems.splice(productIndex, 1);
  await cart.save();

};

module.exports = {
  getCartByUser,
  addProductToCart,
  updateProductInCart,
  deleteProductFromCart,
};
