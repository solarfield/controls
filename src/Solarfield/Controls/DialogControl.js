define(
	[
		'solarfield/ok-kit-js/src/Solarfield/Ok/ObjectUtils',
		'solarfield/controls/src/Solarfield/Controls/Control',
		'solarfield/ok-kit-js/src/Solarfield/Ok/CssLoader',
		'solarfield/ok-kit-js/src/Solarfield/Ok/AnimUtils',
		'solarfield/ok-kit-js/src/Solarfield/Ok/DomUtils',
		'solarfield/ok-kit-js/src/Solarfield/Ok/StructUtils',
	],
	function (ObjectUtils, Control, CssLoader, AnimUtils, DomUtils, StructUtils) {
		"use strict";

		/**
		 * @class DialogControl
		 * @extends Control
		 */
		var DialogControl = ObjectUtils.extend(Control, {
			_scdc_handleDocumentClick: function (aEvt) {
				var ancestorSelectControl = DomUtils.getAncestorByClassName(aEvt.target, 'dialogControl');

				//if the click happened outside the current dialogControl
				if (!ancestorSelectControl || ancestorSelectControl !== this.element) {
					this.close();
				}
			},

			_scdc_handleDocumentKeypress: function (aEvt) {
				if ((aEvt.keyCode || aEvt.which) === 27) {
					this.close();
				}
			},

			/**
			 * @returns {Promise}
			 * @protected
			 */
			_scdc_animateOpen: function () {
				var popup = this.element;

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
			_scdc_animateClose: function () {
				var popup = this.element;

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

			/**
			 * @param aEvt
			 * @protected
			 */
			handleCloseButtonClick: function (aEvt) {
				this.close();
			},

			open: function (aOptions) {
				if (this.isOpen) return; // if already open

				var doc = this.element.ownerDocument;

				this.element.setAttribute('aria-hidden', 'false');

				if (this.autoClose) {
					doc.addEventListener('mousedown', this._scdc_handleDocumentClick);
					doc.addEventListener('keydown', this._scdc_handleDocumentKeypress);
				}

				this.getEventTarget().dispatchEvent(this, {
					type: 'open',
					target: this,
				});

				this._scdc_animateOpen();
			},

			close: function (aOptions) {
				if (!this.isOpen) return; // if already closed

				var doc = this.element.ownerDocument;

				this.element.setAttribute('aria-hidden', 'true');

				if (this.autoClose) {
					doc.removeEventListener('mousedown', this._scdc_handleDocumentClick);
					doc.removeEventListener('keydown', this._scdc_handleDocumentKeypress);
				}

				this.getEventTarget().dispatchEvent(this, {
					type: 'close',
					target: this,
				});

				this._scdc_animateClose();
			},

			toggle: function (aOptions) {
				if (this.isOpen) {
					this.close();
				}	else {
					this.open();
				}

				this.getEventTarget().dispatchEvent(this, {
					type: 'change',
					target: this,
				});
			},

			get isOpen() {
				return this.element.getAttribute('aria-hidden') === 'false';
			},

			hookup: function (aOptions) {
				var options = StructUtils.assign({
					autoClose : true,
				}, aOptions);

				Object.defineProperties(this, {
					autoClose: {
						value: true==options.autoClose, // cast to bool
					},
				});

				return DialogControl.super.prototype.hookup.apply(this, arguments)
				.then(function () {
					return CssLoader.import('solarfield/controls/src/Solarfield/Controls/style/dialog-control');
				}.bind(this))
				.then(function () {
					this.element.classList.add('dialogControl');

					Array.from(this.element.querySelectorAll('.dialogControlCloseButton'), function (buttonEl) {
						buttonEl.addEventListener('click', this.handleCloseButtonClick);
					}.bind(this));
				}.bind(this))
			},

			constructor: function (aOptions) {
				DialogControl.super.call(this, aOptions);

				this._scdc_handleDocumentClick = this._scdc_handleDocumentClick.bind(this);
				this._scdc_handleDocumentKeypress = this._scdc_handleDocumentKeypress.bind(this);
				this.handleCloseButtonClick = this.handleCloseButtonClick.bind(this);

				this.close();
			}
		});

		DialogControl._scdc_instances = new WeakMap();

		DialogControl.summon = function (aElement) {
			return this._scdc_instances.get(aElement);
		};

		DialogControl.create = function (aOptions) {
			return DialogControl.super.create.call(this, aOptions)
				.then(function (control) {
					this._scdc_instances.set(control.element, control);
					return control
				}.bind(this));
		};

		return DialogControl;
	}
);
