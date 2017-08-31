/* Based off ecommerce/magento/skin/frontend/pacbrands/bonds2/js/pacbrands/loyalty.js */

(function($){

    defaultLoyalty = {

        initialize: function () {

            //Gender buttons instead of select
            var $gender_buttons = $('.gender-buttons');
            if ($gender_buttons.length) {
                var $buttons = $gender_buttons.find('.btn'),
                    $select = $($gender_buttons.data('controls'));
                $buttons.on('click', function () {
                    var $this = $(this);
                    $buttons.not($this.addClass('selected')).removeClass('selected');
                    $select.val($this.data('value'));
                });
            }
        }
    }

    $(document).ready(function(){
        defaultLoyalty.initialize();
    });

}(jQuery));

Varien.DOB.addMethods({
    initialize: function(selector, required, format) {
        var el = $$(selector)[0];
        var container       = {};
        container.day       = Element.select(el, '.dob-day input')[0];
        container.month     = Element.select(el, '.dob-month select')[0];
        container.year      = Element.select(el, '.dob-year input')[0];
        container.full      = Element.select(el, '.dob-full input')[0];
        container.advice    = Element.select(el, '.validation-advice')[0];
        new Varien.DateElement('container', container, required, format);
    }
});

Varien.DateElement.addMethods({
    validate: function() {
        this.day.removeClassName('validation-failed');
        this.month.removeClassName('validation-failed');
        this.year.removeClassName('validation-failed');
        var error = false,
            day   = parseInt(this.day.value, 10)   || 0,
            month = parseInt(this.month.value, 10) || 0,
            year  = parseInt(this.year.value, 10)  || 0,
            today = new Date(),
            curyear = today.getFullYear();
        if (this.day.value.strip().empty()
            && this.month.value.strip().empty()
            && this.year.value.strip().empty()
        ) {
            if (this.required) {
                error = 'Date of birth is required.';
            } else {
                this.full.value = '';
            }
        } else if (!day || !month || !year) {
            error = 'Please enter a valid birth date.';
        } else if (year < 1900 || year > curyear) {
            // Show only 1900 to possible 18+ year
            error = 'Please enter a valid year (1900-' + (curyear - 18) + ').';
        } else {
            var date = new Date, countDaysInMonth = 0, errorType = null;
            date.setYear(year);date.setMonth(month-1);date.setDate(32);
            countDaysInMonth = 32 - date.getDate();
            if(!countDaysInMonth || countDaysInMonth>31) countDaysInMonth = 31;

            if (day<1 || day>countDaysInMonth) {
                errorType = 'day';
                error = 'Please enter a valid day (1-%d).';
            } else if (month<1 || month>12) {
                errorType = 'month';
                error = 'Please enter a valid month (1-12).';
            } else if(this.calculateAge(today, day, month, year) < 18) {
                errorType = 'year';
                error = 'You must be 18+.';
            } else {
                if(day % 10 == day) this.day.value = '0'+day;
                //if(month % 10 == month) this.month.value = '0'+month;
                this.full.value = this.format.replace(/%[mb]/i, this.month.value).replace(/%[de]/i, this.day.value).replace(/%y/i, this.year.value);
                var testFull = this.month.value + '/' + this.day.value + '/'+ this.year.value;
                var test = new Date(testFull);
                if (isNaN(test)) {
                    error = 'Please enter a valid date.';
                } else {
                    this.setFullDate(test);
                }
            }
            var valueError = false;
            if (!error && !this.validateData()){// {
                errorType = this.validateDataErrorType;//'year';
                valueError = this.validateDataErrorText; //'Please enter a valid year (1900-curyear).';
                error = valueError;
            }
        }

        if (error !== false) {
            try {
                error = Translator.translate(error);
            }
            catch (e) {}
            if (!valueError) {
                this.advice.innerHTML = error.replace('%d', countDaysInMonth);
            } else {
                this.advice.innerHTML = this.errorTextModifier(error);
            }
            this.advice.show();
            return false;
        }

        // fixing elements class
        this.day.removeClassName('validation-failed');
        this.month.removeClassName('validation-failed');
        this.year.removeClassName('validation-failed');

        this.advice.hide();
        return true;
    },
    calculateAge: function (currentDate, birthDay, birthMonth, birthYear) {
        var formattedBirthMonth = birthMonth - 1;
        var currentYear = currentDate.getFullYear();
        var currentMonth = currentDate.getMonth();
        var currentDay = currentDate.getDate();
        var age = currentYear - birthYear;

        if (currentMonth < formattedBirthMonth) {
            age--;
        }
        else if ((formattedBirthMonth == currentMonth) && currentDay < birthDay){
            age--;
        }

        return age;
    }
});
