define(
	[
		'solarfield/ok-kit-js/src/Solarfield/Ok/ObjectUtils',
		'solarfield/controls/src/Solarfield/Controls/Control',
		'solarfield/ok-kit-js/src/Solarfield/Ok/CssLoader',
		'solarfield/ok-kit-js/src/Solarfield/Ok/AnimUtils',
	],
	function (ObjectUtils, Control, CssLoader, AnimUtils) {
		"use strict";
	
		var DialogControl = ObjectUtils.extend(Control, {
			/**
			 * @returns {Promise}
			 * @protected
			 */
			animateOpen: function () {
				var popup = this.getElement();

				var promise = AnimUtils.onAnimationEnd(popup, 'dialogControlOpen')
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
						name: 'dialogControlOpen',
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
				var popup = this.getElement();

				var promise = AnimUtils.onAnimationEnd(popup, 'dialogControlClose')
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
					name: 'dialogControlClose',
					duration: getComputedStyle(popup).animationDuration,
					fillMode: 'forwards'
				});

				return promise;
			},
			
			open: function (aOptions) {
				this.getElement().setAttribute('aria-hidden', 'false');
				this.animateOpen();
			},
			
			close: function (aOptions) {
				this.getElement().setAttribute('aria-hidden', 'true');
				this.animateClose();
			},
			
			toggle: function (aOptions) {
				var hidden = this.getElement().getAttribute('aria-hidden') === 'true';
				
				if (hidden) {
					this.getElement().setAttribute('aria-hidden', 'false');
					this.animateOpen();
				}	else {
					this.getElement().setAttribute('aria-hidden', 'true');
					this.animateClose();
				}
			},
			
			hookup: function (aOptions) {
				return DialogControl.super.prototype.hookup.apply(this, arguments)
				.then(function () {
					return CssLoader.import('solarfield/controls/src/Solarfield/Controls/style/dialog-control');
				}.bind(this))
			},
			
			constructor: function (aOptions) {
				DialogControl.super.call(this, aOptions);
				this.close();
			}
		});
		
		return DialogControl;
	}
);