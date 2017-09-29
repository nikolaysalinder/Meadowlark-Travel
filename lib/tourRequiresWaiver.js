module.exports = function(req, res, next){
	var cart = req.session.cart;
	if(!cart) return next();
	if(cart.items.some(function(item){ return item.product.requiresWaiver;})){
		cart.warnings.push('Один или более выбранных вами туров требуют' + 
     'документа про отказ от ответственности');
	}
  next();
}