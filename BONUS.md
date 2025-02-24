# Bonus features

## +5 marks - for allowing a user to remove items from their shopping cart and to change the quantity of items ordered when viewing their cart.

* Two new routes have been added: `removecart` and `updatecart` for removing and deleting respectively
* Removing items from cart 
	* Is implemented in `removecart.js`
	* Check if productId is valid and deletes the product from session variables
* Updating items from cart 
	* Is implemented in `updatecart.js`
	* Checks if productId and quantity are valid and modifies the session variables to update products quantities
	* If the new quantity is 0, the item is removed from the cart
* Showcart was refactored
	* Includes link to `removecart` for removing items
	* Includes form and JS code to update items

## +5 marks - for validating a customer's password when they try to place an order.

* New route was added: `customerauthentication`
* Checkout page was refactored
	* Calls `customerauthentication` now instead `order`
	* Sends POST request so password is not displayed in URL
	* Displays error message if password is invalid
* Password validation
	* Is implemented in `customerauthentication.js`
	* Checks if CustomerId in POST request is valid
	* Checks if password in POST request matches the password in the DB
	* Creates session variable and redirects to `order` if password is valid
	* Redirects to `checkout` with an error if password is invalid
* `order.js` now checks for session variable to see if authentication happend
* `order.js` now retrieves the customerId from session variable instead of value in GET request

## +2 marks - for a page header with links to product page, list order, and shopping cart

* Serve static CSS files in `server.js`
* Add `public/css/style.css` with styling for banner
* Add banner image
* Add function to render header in `shared_functions/header.js`

## +3 marks - for formatting product listing page to include better formatting as well as filter by category

* Add `dragon-table` theme for tables in CSS
* Add `Category` form to product page and change SQL query to filter by category
* Add SQL query to fetch categories from DB and render them in HTML form

## +3 marks - for improved formatting of cart page

* Use `dragon-table` theme in `showcart` page
