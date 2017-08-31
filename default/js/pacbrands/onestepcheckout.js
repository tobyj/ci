/**
 * Pacbrands One Step Checkout 
 * 
 * Override methods to change standard functionality so we
 * include all of this inline rather than through a popup
 * May have been easier to just reimplement in retrospect!
 * 
 */
OneStepCheckoutLoginPopup.addMethods({
    createPopup: function() { 
        // Disabled
    },

    bindEventHandlers: function() {

        /* First bind the link for opening the popup */
        //if(this.popup_link){
        //    this.popup_link.observe('click', function(e) {
        //        e.preventDefault();
        //        this.popup.open();
        //    }.bind(this));
        //}

        /* Link for closing the popup */
        //if(this.popup_container){
        //    this.popup_container.select('p.close a').invoke(
        //        'observe', 'click', function(e) {
        //        this.popup.close();
        //    }.bind(this));
        //}

        /* Link to switch between states */
        if(this.login_link){
            this.login_link.observe('click', function(e) {
                e.preventDefault();
                this.forgot_password_container.hide();
                this.login_container.show();
                this.mode = 'login';
            }.bind(this));
        }

        /* Link to switch between states */
        if(this.forgot_password_link){
            this.forgot_password_link.observe('click', function(e) {
                e.preventDefault();
                this.login_container.hide();
                this.forgot_password_container.show();
                this.mode = 'forgot';
            }.bind(this));
        }

        /* Now bind the submit button for logging in */
        //if(this.login_button){
        //    this.login_button.observe(
        //        'click', this.login_handler.bind(this));
        //}
        if (this.login_form) {
            this.login_form.stopObserving('submit');
            this.login_form.observe('submit', function(e) {
                e.preventDefault();
                var lform = new VarienForm('onestepcheckout-login-form');
                if(lform.validator.validate())  {
                    this.login_handler();
                }
            }.bind(this));
        }

        /* Now bind the submit button for forgotten password */
        //if(this.forgot_password_button){
        //    this.forgot_password_button.observe('click',
        //        this.forgot_password_handler.bind(this));
        //}
        if (this.options.forgot_password_form) {
            this.options.forgot_password_form.stopObserving('submit');
            this.options.forgot_password_form.observe('submit', function(e) {
                e.preventDefault();
                var pform = new VarienForm('onestepcheckout-forgot-form');
                if(pform.validator.validate())  {
                    this.forgot_password_handler();
                }
            }.bind(this));
        }
    }

});

