define(
	[
		'solarfield/ok-kit-js/src/Solarfield/Ok/ObjectUtils',
		'solarfield/controls/src/Solarfield/Controls/Control',
		'solarfield/ok-kit-js/src/Solarfield/Ok/AnimUtils',
	],
	function (ObjectUtils, Control, AnimUtils) {
		"use strict";
	
		var DialogControl = ObjectUtils.extend(Control, {
			/**
			 * @returns {Promise}
			 * @protected
			 */
			animateOpen: function () {
				var popup = this.getElement();

				var promise = AnimUtils.onAnimationEnd(popup, 'dialogControlPopupOpen')
				.then(function () {
					AnimUtils.setAnimation(popup, null);
					popup.dataset.controlAnimation = '';
					
					//workaround for IE11 layout not updating
					if (self.navigator.userAgent.indexOf('Trident/7.0') > -1) {
						var x = document.body.style.fontSize;
						document.body.style.fontSize = '1px';
						document.body.style.fontSize = x;
					}
				});

				popup.dataset.controlAnimation = 'opening';

				AnimUtils.setAnimation(popup, {
					name: 'dialogControlPopupOpen',
					duration: getComputedStyle(popup).animationDuration,
					fillMode: 'forwards'
				});

				return promise;
			},

			/**
			 * @returns {Promise}
			 * @protected
			 */
			animateClose: function () {
				var popup = this.getElement().querySelector('.dialogControlPopup');

				var promise = AnimUtils.onAnimationEnd(popup, 'dialogControlPopupClose')
				.then(function () {
					AnimUtils.setAnimation(popup, null);
					popup.dataset.controlAnimation = '';
					
					//workaround for IE11 layout not updating
					if (self.navigator.userAgent.indexOf('Trident/7.0') > -1) {
						var x = document.body.style.fontSize;
						document.body.style.fontSize = '1px';
						document.body.style.fontSize = x;
					}
				});

				popup.dataset.controlAnimation = 'closing';

				AnimUtils.setAnimation(popup, {
					name: 'dialogControlPopupClose',
					duration: getComputedStyle(popup).animationDuration,
					fillMode: 'forwards'
				});

				return promise;
			},
			
			open: function (aOptions) {
				this.animateOpen();
			},
			
			close: function (aOptions) {
				this.animateClose();
			},
			
			constructor: function (aOptions) {
				DialogControl.super.call(this, aOptions);
				
				//TODO
			}
		});
		
		return DialogControl;
	}
);