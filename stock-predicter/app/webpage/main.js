var subTotalElement = document.getElementById('subtotal');
var vatElement = document.getElementById('vat');
var totalElement = document.getElementById('total');

var appData = {};

appData.selectedItems = [
	{product: 'Cotton T-Shirt, Medium', price: 1.99, quantity: 1, cost: 1.99},
	{product: 'Baseball Cap, One Size', price: 2.99, quantity: 2, cost: 5.98},
	{product: 'Swim Shorts, Medium', price: 3.99, quantity: 1, cost: 3.99}
];

// update cart amount
function updateCartAmount() {
	var subtotal = 0;
	var vat = 0;
	var total = 0;
	for(var index=0; index<appData.selectedItems.length; index++) {
		subtotal = subtotal + appData.selectedItems[index].cost;
	}
	vat = subtotal * 0.2;
	total = subtotal + vat;
	subTotalElement.innerHTML = subtotal.toFixed(2);
	vatElement.innerHTML = vat.toFixed(2);
	totalElement.innerHTML = total.toFixed(2);
}

// change quantity by button (+,-)
function changeQuantityByButton(index, mode) {
	return function() {
		console.log(mode);
		var updatedQuantity = mode==='increment' ? appData.selectedItems[index].quantity + 1 : appData.selectedItems[index].quantity -1;
		if(updatedQuantity<1 || updatedQuantity>10) {
			return;
		} else {
			appData.selectedItems[index].quantity = Number(updatedQuantity);
			appData.selectedItems[index].cost = Number((updatedQuantity * appData.selectedItems[index].price).toFixed(2));
			document.getElementsByClassName('input-quantity')[index].value=updatedQuantity;
			document.getElementsByClassName('cost')[index].innerHTML = appData.selectedItems[index].cost;
			updateCartAmount();
		}
	}
}

// change quantity by typing
function changeQuantityByTyping(evt, input, index) {
    if(isNaN(input.value)) {
		var splitArray = input.value.split('');
		splitArray.pop();
		input.value = splitArray.join('');
	} else {
		if (input.value < 1) input.value = 1;
		if (input.value > 10) input.value = 10;
		appData.selectedItems[index].quantity = Number(input.value);
		appData.selectedItems[index].cost = Number((appData.selectedItems[index].quantity * appData.selectedItems[index].price).toFixed(2));
		updateCartAmount();
	}
}

// add a product row to the cart
function addProductToCart(index) {
	var row = document.createElement('tr');

	for(var item in appData.selectedItems[index]) {
		var column = document.createElement('td');
		column.setAttribute('class', item);
		
		var columnText;
		if(item !== 'quantity') {
			columnText = document.createTextNode(appData.selectedItems[index][item]);
		} else {
			var columnText = document.createElement('div');
			columnText.innerHTML = '<input onkeyup="changeQuantityByTyping(event, this, '+index+')" class="input-quantity" type="text" name="quantity" value="'+appData.selectedItems[index][item]+'">'+
				'<span class="operator"><span class="incrementer">+</span>'+
				'<span class="decrementer">-</span></span';
		}
		row.appendChild(column).appendChild(columnText);
	}
	var column = document.createElement('td');
	var image = document.createElement('img');
	image.setAttribute('src', 'bin.png');
	image.setAttribute('class', 'remove-btn');
	row.appendChild(column).appendChild(image);
	document.getElementById('selectedItems').appendChild(row);
}

// add all products to cart and attach events
function updateTable() {
	document.getElementById('selectedItems').innerHTML = '';
	for(var index=0; index<appData.selectedItems.length; index++ ) {
		addProductToCart(index);
	}

	var incrementer = document.getElementsByClassName('incrementer');
	for(var index=0; index<incrementer.length; index++) {
		incrementer[index].addEventListener('click', changeQuantityByButton(index, 'increment'));
	}

	var decrementer = document.getElementsByClassName('decrementer');
	for(var index=0; index<decrementer.length; index++) {
		decrementer[index].addEventListener('click', changeQuantityByButton(index, 'decrement'));
	}

	var removeButtons = document.getElementsByClassName('remove-btn');
	for(var index=0; index<removeButtons.length; index++) {
		removeButtons[index].addEventListener('click', removeRow(index));
	}
}

// remove a product from cart
function removeRow(index) {
	return function() {
		appData.selectedItems.splice(index, 1);
		if(appData.selectedItems.length === 0) {
			document.getElementById('btn-buy-now').setAttribute('disabled', 'disabled')
		}
		// render the cart again
		updateTable();
		updateCartAmount();
	}
}

document.getElementById('btn-buy-now').addEventListener('click', function() {
	alert(JSON.stringify(appData.selectedItems)+' total: '+totalElement.innerHTML);
	var jsonData = {
		cartItems: appData.selectedItems,
		total: totalElement.innerHTML
	}
	var xhttp = new XMLHttpRequest();
	xhttp.open('POST', 'http://sample.json');
	xhttp.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
	xhttp.send(JSON.stringify(jsonData));
});

// render cart
updateTable();
updateCartAmount();