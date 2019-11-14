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
				var ancestorDialog = DomUtils.getAncestorByClassName(aEvt.target, 'dialogControl');

				//if the click happened outside the current dialogControl
				if (!(ancestorDialog && (ancestorDialog === this.element || this.element.contains(ancestorDialog)))) {
					this.close();
				}
			},

			_scdc_handleDocumentKeypress: function (aEvt) {
				if ((aEvt.keyCode || aEvt.which) === 27) {
					this.close();
				}
			},
			
			_scdc_handleWindowScroll: function () {
				this._scdc_syncPopupLayout();
			},
			
			_scdc_handleHashchange: function (aEvt) {
				if (this._scdc_windowHash) {
					// TODO: support for nested hashes/dialogs
					if (window.location.hash.replace(/^#/, '') !== this._scdc_windowHash) {
						this.close();
					}
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
			
			_scdc_syncPopupLayout: function (aOptions) {
				if (!aOptions) aOptions = this._scdc_lastOptions;
				
				var popup = this.element;
				if (!popup) return;
				
				var options = {
					fullscreen: false,
					positioningElement: null,
					onBeforePosition: null,
				};
				if (aOptions) {
					options = StructUtils.assign(options, aOptions);
					
					if (options.onBeforePosition) {
						options = StructUtils.assign(options, options.onBeforePosition()||{});
					}
				}
				this._scdc_lastOptions = options;
				
				var positioningElement = options.positioningElement;
				var styles, popupPosition;
				
				if (options.fullscreen) {
					styles = [
						['top', 0],
						['left', 0],
						['minWidth', '100vw'],
						['maxWidth', '100vw'],
						['minHeight', '100vh'],
						['maxHeight', '100vh'],
					];
				}
				else if (positioningElement) {
					popupPosition = Control.calculateAnchoredPopupFixedPosition(popup, positioningElement);
					
					styles = [
						['top', popupPosition.top + 'px'],
						['left', popupPosition.left + 'px'],
						['minWidth', ''],
						['maxWidth', ''],
						['minHeight', ''],
						['maxHeight', ''],
					];
				}
				
				if (styles) {
					for (var i = 0; i < styles.length; i++) {
						if (popup.style[styles[i][0]] != styles[i][1]) {
							popup.style[styles[i][0]] = styles[i][1];
						}
					}
				}
			},
			
			syncToElement: function () {
				DialogControl.super.prototype.syncToElement.apply(this, arguments);
				this._scdc_syncPopupLayout();
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
				
				if (this._scdc_windowHash) {
					this._scdc_previousHash = window.location.hash.replace(/^#/, '');
					window.location.hash = this._scdc_windowHash;
					window.addEventListener('hashchange', this._scdc_handleHashchange);
				}
				
				var doc = this.element.ownerDocument;

				this.element.setAttribute('aria-hidden', 'false');

				if (this.autoClose) {
					doc.addEventListener('mousedown', this._scdc_handleDocumentClick);
					doc.addEventListener('keydown', this._scdc_handleDocumentKeypress);
					doc.addEventListener('scroll', this._scdc_handleWindowScroll, Control.supportsPassiveEventListeners ? {passive:true} : false);
				}

				this.getEventTarget().dispatchEvent(this, {
					type: 'open',
					target: this,
				});
				
				this._scdc_syncPopupLayout(aOptions);

				this._scdc_animateOpen();
			},

			close: function (aOptions) {
				if (!this.isOpen) return; // if already closed
				
				if (this._scdc_windowHash) {
					window.removeEventListener('hashchange', this._scdc_handleHashchange);
					if (window.location.hash.replace(/^#/, '') === '#' + this._scdc_windowHash) {
						window.location.hash = this._scdc_previousWindowHash;
						this._scdc_previousWindowHash = '';
					}
				}
				
				var doc = this.element.ownerDocument;

				this.element.setAttribute('aria-hidden', 'true');

				if (this.autoClose) {
					doc.removeEventListener('mousedown', this._scdc_handleDocumentClick);
					doc.removeEventListener('keydown', this._scdc_handleDocumentKeypress);
					doc.removeEventListener('scroll', this._scdc_handleWindowScroll, Control.supportsPassiveEventListeners ? {passive: true} : false);
				}

				this.getEventTarget().dispatchEvent(this, {
					type: 'close',
					target: this,
				});

				this._scdc_animateClose();
			},

			toggle: function (aOptions) {
				if (this.isOpen) {
					this.close(aOptions);
				}	else {
					this.open(aOptions);
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
				var options = StructUtils.assign({
					windowHash: '',
				}, aOptions||{});
				
				DialogControl.super.call(this, aOptions);

				this._scdc_handleDocumentClick = this._scdc_handleDocumentClick.bind(this);
				this._scdc_handleDocumentKeypress = this._scdc_handleDocumentKeypress.bind(this);
				this._scdc_handleWindowScroll = this._scdc_handleWindowScroll.bind(this);
				this._scdc_handleHashchange = this._scdc_handleHashchange.bind(this);
				this.handleCloseButtonClick = this.handleCloseButtonClick.bind(this);
				
				Object.defineProperties(this, {
					_scdc_windowHash: {
						value: options.windowHash,
					},
					
					_scdc_previousWindowHash: {
						value: '',
						writable: true,
					}
				});

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
