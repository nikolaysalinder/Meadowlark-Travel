module.exports = {
  checkWaivers: function(req, res, next){
    var cart = req.session.cart;
    if(!cart) return next();
    if(cart.items.some(function(item){ return item.product.requiresWaiver; })){
      if(!cart.warnings) cart.warnings = [];
        cart.warnings.push('Один или более выбранных вами туров требуют отказа от отвественности.');
    }
    next();
  },

  checkGuestCounts: function(req, res, next){
    var cart = req.session.cart;
    if(!cart) return next();
    if(cart.items.some(function(item){ return item.guests > item.product.maximumGuests; })){
      if(!cart.errors) cart.errors = [];
      cart.errors.push('В одном или более из выбранных вами ' +
        'туров недостаточно мест для выбранного вами количества гостей');
    }
    next();
  }
};